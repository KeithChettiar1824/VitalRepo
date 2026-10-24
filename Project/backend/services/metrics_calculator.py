from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional, Tuple
import statistics

from backend.models import (
    RepoMetadata,
    ContributorStats,
    ContributorConcentrationMetric,
    IssueBacklogMetric,
    PRBottleneckMetric,
    HealthComponent,
    RepoHealthScore,
    SignalFinding,
    EvidenceItem,
    TimeSeriesPoint,
    ActivityTrendsData,
    PendingPRItem,
    FullRepoAnalysis
)

BOT_IDENTIFIERS = [
    "[bot]", "bot", "dependabot", "github-actions", "renovate", "codecov",
    "snyk-bot", "semantic-release-bot", "stale", "greenkeeper"
]

def is_bot_user(login: str) -> bool:
    if not login:
        return False
    lower = login.lower()
    return any(bot in lower for bot in BOT_IDENTIFIERS)

def parse_iso_datetime(dt_str: Optional[str]) -> Optional[datetime]:
    if not dt_str:
        return None
    try:
        # Normalize trailing Z to +00:00
        cleaned = dt_str.replace("Z", "+00:00")
        return datetime.fromisoformat(cleaned)
    except Exception:
        return None

def calculate_gini(values: List[float]) -> float:
    """Calculates Gini coefficient of inequality for activity values (0.0 = completely equal, 1.0 = total inequality)."""
    if not values or len(values) <= 1:
        return 0.0
    sorted_vals = sorted(values)
    n = len(sorted_vals)
    total = sum(sorted_vals)
    if total == 0:
        return 0.0
    index_sum = sum((i + 1) * val for i, val in enumerate(sorted_vals))
    return round((2 * index_sum) / (n * total) - (n + 1) / n, 2)

def calculate_maintainer_concentration(contributors_raw: List[Dict[str, Any]]) -> Tuple[ContributorConcentrationMetric, List[ContributorStats]]:
    if not contributors_raw:
        empty_metric = ContributorConcentrationMetric(
            top1_share=0.0,
            top3_share=0.0,
            top5_share=0.0,
            total_contributors_sampled=0,
            total_counted_activity=0,
            activity_type="Commits / Contributors API count",
            gini_coefficient=0.0,
            concentration_level="Insufficient Data",
            summary="No contributor records available for this repository."
        )
        return empty_metric, []

    total_activity = sum(c.get("contributions", 0) for c in contributors_raw)
    contributor_stats: List[ContributorStats] = []

    for idx, c in enumerate(contributors_raw):
        contribs = c.get("contributions", 0)
        share = round((contribs / total_activity * 100), 1) if total_activity > 0 else 0.0
        role = "Lead Contributor" if idx == 0 else ("Core Contributor" if idx < 3 else "Contributor")
        contributor_stats.append(ContributorStats(
            login=c.get("login", "unknown"),
            avatar_url=c.get("avatar_url", ""),
            html_url=c.get("html_url", ""),
            contributions=contribs,
            share_percentage=share,
            reviews_count=0,
            is_top_contributor=(idx == 0),
            role_description=role
        ))

    shares = [c.contributions for c in contributor_stats]
    top1 = round((shares[0] / total_activity * 100), 1) if shares and total_activity > 0 else 0.0
    top3 = round((sum(shares[:3]) / total_activity * 100), 1) if total_activity > 0 else 0.0
    top5 = round((sum(shares[:5]) / total_activity * 100), 1) if total_activity > 0 else 0.0
    gini = calculate_gini([float(s) for s in shares])

    if top1 > 60.0 or top3 > 85.0:
        level = "Critical Concentration"
        summary = f"Top contributor accounts for {top1}% of counted commits, indicating severe reliance on a single lead."
    elif top1 > 35.0 or top3 > 65.0:
        level = "Moderate Concentration"
        summary = f"Top 3 contributors account for {top3}% of counted commits, indicating moderate reliance on a small core group."
    else:
        level = "Balanced"
        summary = f"Healthy distribution with top contributor having {top1}% and top 3 having {top3}% of counted commits."

    metric = ContributorConcentrationMetric(
        top1_share=top1,
        top3_share=top3,
        top5_share=top5,
        total_contributors_sampled=len(contributors_raw),
        total_counted_activity=total_activity,
        activity_type="Commits / Contributors API count",
        gini_coefficient=gini,
        concentration_level=level,
        summary=summary
    )

    return metric, contributor_stats

def calculate_issue_backlog(
    metadata: Dict[str, Any],
    issues_raw: List[Dict[str, Any]],
    period_days: int
) -> IssueBacklogMetric:
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=period_days)

    total_open = metadata.get("open_issues_count", 0)

    opened_in_period = 0
    closed_in_period = 0

    for issue in issues_raw:
        # Note: issues_raw already filtered to true issues (not PRs)
        created_dt = parse_iso_datetime(issue.get("created_at"))
        closed_dt = parse_iso_datetime(issue.get("closed_at"))

        if created_dt and created_dt >= cutoff:
            opened_in_period += 1
        if closed_dt and closed_dt >= cutoff:
            closed_in_period += 1

    net_change = opened_in_period - closed_in_period
    resolution_rate = round((closed_in_period / opened_in_period * 100), 1) if opened_in_period > 0 else (100.0 if closed_in_period > 0 else 0.0)

    if net_change > 0:
        summary = f"Backlog expanded by {net_change} issues in the last {period_days} days ({resolution_rate}% resolution rate)."
    elif net_change < 0:
        summary = f"Backlog reduced by {abs(net_change)} issues in the last {period_days} days ({resolution_rate}% resolution rate)."
    else:
        summary = f"Backlog remained steady ({opened_in_period} opened vs {closed_in_period} closed in {period_days} days)."

    return IssueBacklogMetric(
        total_open_issues=total_open,
        opened_in_period=opened_in_period,
        closed_in_period=closed_in_period,
        net_change=net_change,
        resolution_rate_percent=resolution_rate,
        observation_period_days=period_days,
        summary=summary
    )

def calculate_pr_bottlenecks(
    pulls_raw: List[Dict[str, Any]],
    reviews_by_pr: Dict[int, List[Dict[str, Any]]],
    period_days: int
) -> Tuple[PRBottleneckMetric, List[PendingPRItem], Dict[str, int]]:
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=period_days)

    open_prs_count = 0
    merged_in_period = 0
    closed_unmerged_in_period = 0
    pending_items: List[PendingPRItem] = []
    pending_ages_days: List[float] = []
    first_review_delays_hours: List[float] = []
    contributor_reviews_count: Dict[str, int] = {}

    for pr in pulls_raw:
        state = pr.get("state", "open")
        created_dt = parse_iso_datetime(pr.get("created_at"))
        merged_dt = parse_iso_datetime(pr.get("merged_at"))
        closed_dt = parse_iso_datetime(pr.get("closed_at"))
        pr_number = pr.get("number", 0)

        # Count open PRs and pending age
        if state == "open":
            open_prs_count += 1
            if created_dt:
                age_days = max(0, (now - created_dt).total_seconds() / 86400.0)
                pending_ages_days.append(age_days)
                pending_items.append(PendingPRItem(
                    number=pr_number,
                    title=pr.get("title", f"PR #{pr_number}"),
                    html_url=pr.get("html_url", ""),
                    author=pr.get("user", {}).get("login", "unknown") if pr.get("user") else "unknown",
                    created_at=pr.get("created_at", ""),
                    age_days=int(age_days),
                    comments_count=pr.get("comments", 0)
                ))

        # Merged / Closed in period
        if merged_dt and merged_dt >= cutoff:
            merged_in_period += 1
        elif closed_dt and not merged_dt and closed_dt >= cutoff:
            closed_unmerged_in_period += 1

        # Check reviews for this PR
        reviews = reviews_by_pr.get(pr_number, [])
        first_human_review_dt: Optional[datetime] = None

        for rev in reviews:
            rev_user = rev.get("user", {}).get("login", "")
            if not is_bot_user(rev_user):
                # Count review towards contributor's workload
                contributor_reviews_count[rev_user] = contributor_reviews_count.get(rev_user, 0) + 1
                submitted_dt = parse_iso_datetime(rev.get("submitted_at"))
                if submitted_dt:
                    if first_human_review_dt is None or submitted_dt < first_human_review_dt:
                        first_human_review_dt = submitted_dt

        if created_dt and first_human_review_dt and first_human_review_dt >= created_dt:
            diff_hours = (first_human_review_dt - created_dt).total_seconds() / 3600.0
            first_review_delays_hours.append(diff_hours)

    median_review_hours = round(statistics.median(first_review_delays_hours), 1) if first_review_delays_hours else None
    median_pending_age = round(statistics.median(pending_ages_days), 1) if pending_ages_days else None

    sampled_count = len(reviews_by_pr)
    reviewed_ratio = round((len(first_review_delays_hours) / sampled_count * 100), 1) if sampled_count > 0 else None

    # Summary
    if median_review_hours is not None:
        summary = f"Median time to first recorded human review is {median_review_hours} hours ({len(first_review_delays_hours)} of {sampled_count} sampled PRs received human reviews)."
    elif open_prs_count > 0 and median_pending_age is not None:
        summary = f"Pending PRs have a median age of {median_pending_age} days. Review timestamp sampling was limited to {sampled_count} recent PRs."
    else:
        summary = f"{open_prs_count} open pull requests; {merged_in_period} merged in the last {period_days} days."

    metric = PRBottleneckMetric(
        total_open_prs=open_prs_count,
        merged_in_period=merged_in_period,
        closed_unmerged_in_period=closed_unmerged_in_period,
        median_time_to_first_review_hours=median_review_hours,
        median_pending_pr_age_days=median_pending_age,
        sampled_prs_count=sampled_count,
        reviewed_prs_ratio_percent=reviewed_ratio,
        review_sampling_coverage=f"Sampled up to {sampled_count} recent PR review threads to adhere to GitHub rate limits.",
        summary=summary
    )

    # Sort pending items by age descending (oldest waiting PRs first)
    pending_items.sort(key=lambda x: x.age_days, reverse=True)

    return metric, pending_items, contributor_reviews_count

def calculate_health_score(
    concentration: ContributorConcentrationMetric,
    backlog: IssueBacklogMetric,
    pr_metric: PRBottleneckMetric,
    pushed_at_str: Optional[str]
) -> RepoHealthScore:
    """
    Transparent rule-based heuristic across 4 core sustainability dimensions:
    1. Maintainer Distribution (25 pts)
    2. Backlog Resolution (25 pts)
    3. PR Review Responsiveness (25 pts)
    4. Commit & Maintenance Freshness (25 pts)
    Total: 0 to 100 points
    """
    # 1. Maintainer Distribution (25 pts)
    top1 = concentration.top1_share
    if top1 <= 25.0:
        dist_score = 25.0
        dist_status = "Good"
        dist_desc = f"Healthy contributor spread (top contributor: {top1}%)."
    elif top1 <= 45.0:
        dist_score = 20.0
        dist_status = "Good"
        dist_desc = f"Moderate distribution with solid secondary contributor presence (top: {top1}%)."
    elif top1 <= 65.0:
        dist_score = 14.0
        dist_status = "Fair"
        dist_desc = f"Elevated concentration in top contributor ({top1}%)."
    elif top1 <= 85.0:
        dist_score = 8.0
        dist_status = "Needs Attention"
        dist_desc = f"High single-maintainer dependency ({top1}% of counted activity)."
    else:
        dist_score = 4.0
        dist_status = "Needs Attention"
        dist_desc = f"Near total dependence on single contributor ({top1}%)."

    # 2. Backlog Resolution (25 pts)
    res_rate = backlog.resolution_rate_percent
    if res_rate >= 85.0:
        res_score = 25.0
        res_status = "Good"
        res_desc = f"High issue closure efficiency ({res_rate}% resolution in window)."
    elif res_rate >= 60.0:
        res_score = 18.0
        res_status = "Good"
        res_desc = f"Satisfactory issue resolution rate ({res_rate}%)."
    elif res_rate >= 35.0:
        res_score = 12.0
        res_status = "Fair"
        res_desc = f"Backlog accumulating faster than resolution ({res_rate}% closure rate)."
    else:
        res_score = 6.0
        res_status = "Needs Attention"
        res_desc = f"Low issue resolution velocity ({res_rate}% closure rate)."

    # 3. PR Review Responsiveness (25 pts)
    if pr_metric.median_time_to_first_review_hours is not None:
        med_h = pr_metric.median_time_to_first_review_hours
        if med_h <= 36.0:
            pr_score = 25.0
            pr_status = "Good"
            pr_desc = f"Fast turnaround to first review (~{med_h}h median)."
        elif med_h <= 96.0:
            pr_score = 19.0
            pr_status = "Good"
            pr_desc = f"Reasonable review response time (~{med_h}h median)."
        elif med_h <= 240.0:
            pr_score = 12.0
            pr_status = "Fair"
            pr_desc = f"Noticeable review lag (~{round(med_h/24, 1)} days median)."
        else:
            pr_score = 6.0
            pr_status = "Needs Attention"
            pr_desc = f"Prolonged review latency (~{round(med_h/24, 1)} days median)."
    elif pr_metric.median_pending_pr_age_days is not None:
        med_age = pr_metric.median_pending_pr_age_days
        if med_age <= 14.0:
            pr_score = 22.0
            pr_status = "Good"
            pr_desc = f"Open PR queue is actively moving (median pending age: {med_age}d)."
        elif med_age <= 45.0:
            pr_score = 16.0
            pr_status = "Fair"
            pr_desc = f"Moderate pending PR queue age (median {med_age}d)."
        else:
            pr_score = 9.0
            pr_status = "Needs Attention"
            pr_desc = f"Stale open pull requests (median age: {med_age}d)."
    else:
        pr_score = 18.0
        pr_status = "Fair"
        pr_desc = f"Limited review timestamp coverage; {pr_metric.total_open_prs} open PRs."

    # 4. Commit & Maintenance Freshness (25 pts)
    pushed_dt = parse_iso_datetime(pushed_at_str)
    now = datetime.now(timezone.utc)
    if pushed_dt:
        days_since_push = max(0, (now - pushed_dt).total_seconds() / 86400.0)
        if days_since_push <= 14.0:
            fresh_score = 25.0
            fresh_status = "Good"
            fresh_desc = f"Actively maintained (last repository push {int(days_since_push)} days ago)."
        elif days_since_push <= 45.0:
            fresh_score = 20.0
            fresh_status = "Good"
            fresh_desc = f"Steady cadence (last push {int(days_since_push)} days ago)."
        elif days_since_push <= 120.0:
            fresh_score = 13.0
            fresh_status = "Fair"
            fresh_desc = f"Moderate activity pause (last push {int(days_since_push)} days ago)."
        else:
            fresh_score = 6.0
            fresh_status = "Needs Attention"
            fresh_desc = f"Dormant activity (last push {int(days_since_push)} days ago)."
    else:
        fresh_score = 15.0
        fresh_status = "Fair"
        fresh_desc = "Last push timestamp unavailable."

    total_score = int(round(dist_score + res_score + pr_score + fresh_score))

    if total_score >= 80:
        rating = "Robust"
        color = "#10B981"  # Emerald
    elif total_score >= 65:
        rating = "Sustainable"
        color = "#14B8A6"  # Teal
    elif total_score >= 50:
        rating = "Moderate Risk"
        color = "#F59E0B"  # Amber
    else:
        rating = "High Concentration Risk"
        color = "#EF4444"  # Coral Red

    components = [
        HealthComponent(name="Maintainer Distribution", score=dist_score, max_score=25.0, status=dist_status, description=dist_desc),
        HealthComponent(name="Backlog Resolution", score=res_score, max_score=25.0, status=res_status, description=res_desc),
        HealthComponent(name="PR Responsiveness", score=pr_score, max_score=25.0, status=pr_status, description=pr_desc),
        HealthComponent(name="Maintenance Freshness", score=fresh_score, max_score=25.0, status=fresh_status, description=fresh_desc),
    ]

    methodology = (
        "VitalRepo sustainability index is calculated as an unweighted sum of 4 dimensions (0–25 each): "
        "Maintainer Distribution, Issue Backlog Resolution, PR Responsiveness, and Maintenance Freshness. "
        "This is an evidence-backed rule indicator, not an industry guarantee of repository success or failure."
    )

    return RepoHealthScore(
        overall_score=total_score,
        rating=rating,
        color=color,
        methodology=methodology,
        components=components
    )

def generate_signals_and_evidence(
    repo_url: str,
    concentration: ContributorConcentrationMetric,
    backlog: IssueBacklogMetric,
    pr_metric: PRBottleneckMetric,
    top_contributors: List[ContributorStats],
    pending_items: List[PendingPRItem],
    period_days: int
) -> List[SignalFinding]:
    signals: List[SignalFinding] = []

    # Signal 1: Maintainer Concentration
    if concentration.top1_share >= 40.0:
        sev = "critical" if concentration.top1_share >= 65.0 else "medium"
        top_name = top_contributors[0].login if top_contributors else "Top contributor"
        signals.append(SignalFinding(
            id="signal-maintainer-concentration",
            title="High Contributor Concentration",
            severity=sev,
            measured_value=f"{concentration.top1_share}% activity in lead contributor ({concentration.top3_share}% in top 3)",
            analysis_period=f"All-time sampled contributors ({concentration.total_contributors_sampled} contributors)",
            explanation=(
                f"A significant majority of counted repository contributions are attributed to @{top_name}. "
                "While common in open-source projects, concentrated maintenance poses operational vulnerability if "
                "unexpected review pauses occur."
            ),
            formula="Contributor share = (Top Contributor Commits / Total Counted Commits) × 100",
            evidence_items=[
                EvidenceItem(label="Lead Contributor", value=f"@{top_name}", url=top_contributors[0].html_url if top_contributors else None),
                EvidenceItem(label="Lead Share", value=f"{concentration.top1_share}%"),
                EvidenceItem(label="Top 3 Share", value=f"{concentration.top3_share}%"),
                EvidenceItem(label="Gini Inequality Coeff", value=str(concentration.gini_coefficient)),
                EvidenceItem(label="Contributor Pool", value=f"{concentration.total_contributors_sampled} contributors sampled"),
            ],
            limitations=(
                "GitHub Contributors API tallies commits to the default branch. It does not measure "
                "offline design discussions, issue triage, or pull request reviewing directly."
            )
        ))
    else:
        signals.append(SignalFinding(
            id="signal-maintainer-concentration",
            title="Distributed Contributor Base",
            severity="low",
            measured_value=f"Top contributor holds {concentration.top1_share}% of counted activity",
            analysis_period=f"All-time sampled contributors ({concentration.total_contributors_sampled} contributors)",
            explanation="The project exhibits healthy contributor diversity with no single individual dominating total commit volume.",
            formula="Contributor share = (Top Contributor Commits / Total Counted Commits) × 100",
            evidence_items=[
                EvidenceItem(label="Top 1 Share", value=f"{concentration.top1_share}%"),
                EvidenceItem(label="Top 3 Share", value=f"{concentration.top3_share}%"),
                EvidenceItem(label="Gini Coeff", value=str(concentration.gini_coefficient)),
            ],
            limitations="Based on default branch commit attribution from GitHub contributors endpoint."
        ))

    # Signal 2: Issue Backlog Growth vs Resolution
    if backlog.net_change > 0:
        sev = "critical" if backlog.resolution_rate_percent < 50.0 else "medium"
        signals.append(SignalFinding(
            id="signal-issue-backlog",
            title="Issue Backlog Accumulation",
            severity=sev,
            measured_value=f"+{backlog.net_change} net issues ({backlog.resolution_rate_percent}% resolution rate)",
            analysis_period=f"Last {period_days} days",
            explanation=(
                f"New issues ({backlog.opened_in_period}) arrived faster than they were closed ({backlog.closed_in_period}) "
                f"during the observation period, indicating a growing triage burden."
            ),
            formula="Net Backlog Growth = Issues Opened in Window − Issues Closed in Window",
            evidence_items=[
                EvidenceItem(label="Total Open Issues", value=str(backlog.total_open_issues)),
                EvidenceItem(label="Opened in Window", value=str(backlog.opened_in_period)),
                EvidenceItem(label="Closed in Window", value=str(backlog.closed_in_period)),
                EvidenceItem(label="Resolution Rate", value=f"{backlog.resolution_rate_percent}%"),
            ],
            limitations=(
                "Based on the most recent 100 issues retrieved via GitHub Issues API. Repositories with massive volume "
                "may have older issues not captured in this bounded query."
            )
        ))
    else:
        signals.append(SignalFinding(
            id="signal-issue-backlog",
            title="Active Issue Resolution Velocity",
            severity="low",
            measured_value=f"{backlog.resolution_rate_percent}% resolution rate (Net: {backlog.net_change})",
            analysis_period=f"Last {period_days} days",
            explanation=f"Maintainers closed {backlog.closed_in_period} issues against {backlog.opened_in_period} incoming issues in the observation window.",
            formula="Resolution Rate = (Issues Closed / Issues Opened) × 100",
            evidence_items=[
                EvidenceItem(label="Opened in Window", value=str(backlog.opened_in_period)),
                EvidenceItem(label="Closed in Window", value=str(backlog.closed_in_period)),
                EvidenceItem(label="Current Open Total", value=str(backlog.total_open_issues)),
            ],
            limitations="Reflects the recent issues sample available from the GitHub API."
        ))

    # Signal 3: Pull Request Review Bottleneck
    if pr_metric.median_time_to_first_review_hours is not None and pr_metric.median_time_to_first_review_hours > 72.0:
        days_med = round(pr_metric.median_time_to_first_review_hours / 24, 1)
        signals.append(SignalFinding(
            id="signal-pr-review-latency",
            title="Extended Pull Request Review Latency",
            severity="medium",
            measured_value=f"~{days_med} days median to first human review",
            analysis_period=f"Recent sample of {pr_metric.sampled_prs_count} pull requests",
            explanation=(
                f"Community contributions experience a median waiting duration of {days_med} days before receiving "
                "initial feedback from a human maintainer."
            ),
            formula="Median Time to First Review = median(first_human_review_timestamp − pr_created_timestamp)",
            evidence_items=[
                EvidenceItem(label="Median Review Wait", value=f"{pr_metric.median_time_to_first_review_hours} hours ({days_med} days)"),
                EvidenceItem(label="Sampled PRs", value=str(pr_metric.sampled_prs_count)),
                EvidenceItem(label="Open PRs Waiting", value=str(pr_metric.total_open_prs)),
            ],
            limitations=(
                "Calculated exclusively from recorded review thread submissions. Excludes bot comments and "
                "unthreaded regular issue comments on PRs."
            )
        ))
    elif pr_metric.total_open_prs > 20 and pr_metric.median_pending_pr_age_days and pr_metric.median_pending_pr_age_days > 30:
        signals.append(SignalFinding(
            id="signal-pr-queue-age",
            title="Aging Open Pull Request Queue",
            severity="medium",
            measured_value=f"{pr_metric.total_open_prs} open PRs (median age: {pr_metric.median_pending_pr_age_days} days)",
            analysis_period="Current snapshot of open pull requests",
            explanation=(
                f"The queue of pending pull requests is aging (median age: {pr_metric.median_pending_pr_age_days} days). "
                "This can lead to merge conflicts, community contributor churn, and stalled features."
            ),
            formula="Pending PR Age = current_time − pr_created_timestamp",
            evidence_items=[
                EvidenceItem(label="Open Pull Requests", value=str(pr_metric.total_open_prs)),
                EvidenceItem(label="Median PR Age", value=f"{pr_metric.median_pending_pr_age_days} days"),
                EvidenceItem(label="Oldest Pending PR", value=f"#{pending_items[0].number} ({pending_items[0].age_days}d)" if pending_items else "N/A", url=pending_items[0].html_url if pending_items else None),
            ],
            limitations="Assesses open PR creation dates. Does not differentiate draft PRs from ready-for-review submissions."
        ))

    return signals

def build_activity_trends(
    issues_raw: List[Dict[str, Any]],
    pulls_raw: List[Dict[str, Any]],
    period_days: int
) -> ActivityTrendsData:
    """
    Constructs weekly aggregated historical time series points for issues and PRs.
    """
    now = datetime.now(timezone.utc)
    # Number of weekly buckets
    num_weeks = max(4, min(26, period_days // 7))
    bucket_length_days = 7

    # Initialize buckets from oldest to newest
    points: List[TimeSeriesPoint] = []
    bucket_dates: List[Tuple[datetime, datetime]] = []

    for i in range(num_weeks - 1, -1, -1):
        end_date = now - timedelta(days=i * bucket_length_days)
        start_date = end_date - timedelta(days=bucket_length_days)
        bucket_dates.append((start_date, end_date))
        points.append(TimeSeriesPoint(
            date=start_date.strftime("%b %d"),
            issues_opened=0,
            issues_closed=0,
            prs_opened=0,
            prs_merged=0,
            active_contributors=0
        ))

    # Tally issues
    for issue in issues_raw:
        c_dt = parse_iso_datetime(issue.get("created_at"))
        cl_dt = parse_iso_datetime(issue.get("closed_at"))

        for idx, (b_start, b_end) in enumerate(bucket_dates):
            if c_dt and b_start <= c_dt < b_end:
                points[idx].issues_opened += 1
            if cl_dt and b_start <= cl_dt < b_end:
                points[idx].issues_closed += 1

    # Tally PRs
    for pr in pulls_raw:
        c_dt = parse_iso_datetime(pr.get("created_at"))
        m_dt = parse_iso_datetime(pr.get("merged_at"))

        for idx, (b_start, b_end) in enumerate(bucket_dates):
            if c_dt and b_start <= c_dt < b_end:
                points[idx].prs_opened += 1
            if m_dt and b_start <= m_dt < b_end:
                points[idx].prs_merged += 1

    return ActivityTrendsData(
        observation_period_days=period_days,
        points=points,
        is_partial=True,
        coverage_note=f"Aggregated from the recent 100 issues and 100 pull requests sampled across {period_days} days."
    )
