import time
from typing import Dict, Any
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

def get_demo_repository_data() -> FullRepoAnalysis:
    """
    Returns a rich, fully populated, realistic demo analysis for demonstration mode.
    Tagged with is_demo=True and distinct DEMO DATA markers.
    """
    metadata = RepoMetadata(
        owner="facebook",
        name="react",
        full_name="facebook/react",
        description="The library for web and native user interfaces. (Curated Demo Dataset)",
        html_url="https://github.com/facebook/react",
        language="JavaScript",
        stars_count=227540,
        forks_count=46120,
        open_issues_count=642,
        license_name="MIT License",
        default_branch="main",
        created_at="2013-05-24T16:15:54Z",
        pushed_at="2026-10-23T14:20:00Z",
        last_analyzed_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        is_demo=True
    )

    concentration = ContributorConcentrationMetric(
        top1_share=34.2,
        top3_share=61.8,
        top5_share=73.5,
        total_contributors_sampled=100,
        total_counted_activity=14850,
        activity_type="Commits / Contributors API count",
        gini_coefficient=0.68,
        concentration_level="Moderate Concentration",
        summary="Top 3 contributors account for 61.8% of counted commits, indicating moderate reliance on a dedicated core group."
    )

    top_contributors = [
        ContributorStats(
            login="sophiebits",
            avatar_url="https://avatars.githubusercontent.com/u/6820?v=4",
            html_url="https://github.com/sophiebits",
            contributions=5078,
            share_percentage=34.2,
            reviews_count=42,
            is_top_contributor=True,
            role_description="Lead Contributor"
        ),
        ContributorStats(
            login="gaearon",
            avatar_url="https://avatars.githubusercontent.com/u/810438?v=4",
            html_url="https://github.com/gaearon",
            contributions=2310,
            share_percentage=15.6,
            reviews_count=28,
            is_top_contributor=False,
            role_description="Core Contributor"
        ),
        ContributorStats(
            login="acdlite",
            avatar_url="https://avatars.githubusercontent.com/u/3624098?v=4",
            html_url="https://github.com/acdlite",
            contributions=1782,
            share_percentage=12.0,
            reviews_count=35,
            is_top_contributor=False,
            role_description="Core Contributor"
        ),
        ContributorStats(
            login="sebmarkbage",
            avatar_url="https://avatars.githubusercontent.com/u/63648?v=4",
            html_url="https://github.com/sebmarkbage",
            contributions=1020,
            share_percentage=6.9,
            reviews_count=19,
            is_top_contributor=False,
            role_description="Core Contributor"
        ),
        ContributorStats(
            login="zpao",
            avatar_url="https://avatars.githubusercontent.com/u/8445?v=4",
            html_url="https://github.com/zpao",
            contributions=712,
            share_percentage=4.8,
            reviews_count=12,
            is_top_contributor=False,
            role_description="Contributor"
        ),
        ContributorStats(
            login="rickhanlonii",
            avatar_url="https://avatars.githubusercontent.com/u/2440089?v=4",
            html_url="https://github.com/rickhanlonii",
            contributions=580,
            share_percentage=3.9,
            reviews_count=24,
            is_top_contributor=False,
            role_description="Contributor"
        )
    ]

    backlog = IssueBacklogMetric(
        total_open_issues=642,
        opened_in_period=88,
        closed_in_period=94,
        net_change=-6,
        resolution_rate_percent=106.8,
        observation_period_days=90,
        summary="Backlog reduced by 6 issues in the last 90 days (106.8% resolution rate)."
    )

    pr_bottleneck = PRBottleneckMetric(
        total_open_prs=184,
        merged_in_period=142,
        closed_unmerged_in_period=28,
        median_time_to_first_review_hours=44.5,
        median_pending_pr_age_days=18.5,
        sampled_prs_count=20,
        reviewed_prs_ratio_percent=85.0,
        review_sampling_coverage="Sampled 20 recent PR review threads to adhere to rate limits.",
        summary="Median time to first recorded human review is 44.5 hours (~1.9 days). Open PR queue shows steady throughput."
    )

    health_components = [
        HealthComponent(
            name="Maintainer Distribution",
            score=20.0,
            max_score=25.0,
            status="Good",
            description="Moderate distribution with active secondary contributor involvement (top contributor holds 34.2%)."
        ),
        HealthComponent(
            name="Backlog Resolution",
            score=25.0,
            max_score=25.0,
            status="Good",
            description="High issue closure efficiency (106.8% resolution rate in 90-day window)."
        ),
        HealthComponent(
            name="PR Responsiveness",
            score=21.0,
            max_score=25.0,
            status="Good",
            description="Fast turnaround to first review (~44.5h median response time)."
        ),
        HealthComponent(
            name="Maintenance Freshness",
            score=25.0,
            max_score=25.0,
            status="Good",
            description="Actively maintained (repository push recorded yesterday)."
        )
    ]

    health = RepoHealthScore(
        overall_score=91,
        rating="Robust",
        color="#10B981",
        methodology="VitalRepo sustainability index: 4 dimensions (0–25 each) evaluating distribution, backlog, PR turnaround, and freshness.",
        components=health_components
    )

    pending_prs_sample = [
        PendingPRItem(
            number=31245,
            title="Fix compiler transform bug when destructing nested useMemo calls",
            html_url="https://github.com/facebook/react/pull/31245",
            author="external-dev-alex",
            created_at="2026-10-18T10:14:00Z",
            age_days=6,
            comments_count=4
        ),
        PendingPRItem(
            number=31220,
            title="Add warning when server action returns non-serializable promise",
            html_url="https://github.com/facebook/react/pull/31220",
            author="community-coder",
            created_at="2026-10-12T08:30:00Z",
            age_days=12,
            comments_count=7
        ),
        PendingPRItem(
            number=31190,
            title="Refactor reconciliation queue to reduce memory overhead in microtasks",
            html_url="https://github.com/facebook/react/pull/31190",
            author="perf-specialist",
            created_at="2026-10-02T14:45:00Z",
            age_days=22,
            comments_count=15
        ),
        PendingPRItem(
            number=31050,
            title="Update DOM event listener delegation for pointer events in Firefox",
            html_url="https://github.com/facebook/react/pull/31050",
            author="browser-compat",
            created_at="2026-09-18T11:20:00Z",
            age_days=36,
            comments_count=9
        )
    ]

    signals = [
        SignalFinding(
            id="signal-maintainer-concentration",
            title="Core Group Concentration",
            severity="medium",
            measured_value="Top 3 maintainers handle 61.8% of commits",
            analysis_period="Historical commit archive (100 sampled contributors)",
            explanation="While @sophiebits, @gaearon, and @acdlite maintain strong throughput, architecture review depends closely on this core trio.",
            formula="Contributor share = (Top Contributor Commits / Total Commits) × 100",
            evidence_items=[
                EvidenceItem(label="Top 1 Share", value="34.2% (@sophiebits)", url="https://github.com/sophiebits"),
                EvidenceItem(label="Top 3 Share", value="61.8%"),
                EvidenceItem(label="Gini Inequality Coeff", value="0.68"),
                EvidenceItem(label="Sampled Contributors", value="100"),
            ],
            limitations="Based on default branch commit attribution. Excludes asynchronous RFC discussions and internal meetings."
        ),
        SignalFinding(
            id="signal-issue-backlog",
            title="Positive Backlog Clearance",
            severity="low",
            measured_value="106.8% resolution rate (-6 net issues)",
            analysis_period="Last 90 days",
            explanation="The maintainer group resolved 94 issues against 88 incoming issues in the past quarter, demonstrating positive triage momentum.",
            formula="Net Backlog Growth = Issues Opened − Issues Closed",
            evidence_items=[
                EvidenceItem(label="Total Open", value="642"),
                EvidenceItem(label="Opened in 90d", value="88"),
                EvidenceItem(label="Closed in 90d", value="94"),
                EvidenceItem(label="Net Change", value="-6"),
            ],
            limitations="Based on the recent 100 issues retrieved via GitHub API."
        ),
        SignalFinding(
            id="signal-pr-review-latency",
            title="Healthy First Review Turnaround",
            severity="low",
            measured_value="44.5 hours median to first human review",
            analysis_period="Sample of 20 recent PR review threads",
            explanation="Community pull requests receive initial human maintainer engagement within approximately 1.9 days.",
            formula="Median Time to First Review = median(review_timestamp − pr_created_timestamp)",
            evidence_items=[
                EvidenceItem(label="Median Wait", value="44.5 hours"),
                EvidenceItem(label="Sampled PRs", value="20"),
                EvidenceItem(label="Open PR Queue", value="184"),
            ],
            limitations="Sampled up to 20 recent pull request threads to preserve GitHub API rate limits."
        )
    ]

    points = [
        TimeSeriesPoint(date="Aug 10", issues_opened=7, issues_closed=8, prs_opened=12, prs_merged=11, active_contributors=14),
        TimeSeriesPoint(date="Aug 17", issues_opened=9, issues_closed=6, prs_opened=10, prs_merged=9, active_contributors=11),
        TimeSeriesPoint(date="Aug 24", issues_opened=6, issues_closed=8, prs_opened=14, prs_merged=12, active_contributors=15),
        TimeSeriesPoint(date="Aug 31", issues_opened=8, issues_closed=10, prs_opened=11, prs_merged=13, active_contributors=16),
        TimeSeriesPoint(date="Sep 07", issues_opened=7, issues_closed=9, prs_opened=15, prs_merged=14, active_contributors=18),
        TimeSeriesPoint(date="Sep 14", issues_opened=10, issues_closed=7, prs_opened=13, prs_merged=10, active_contributors=12),
        TimeSeriesPoint(date="Sep 21", issues_opened=5, issues_closed=8, prs_opened=9, prs_merged=11, active_contributors=13),
        TimeSeriesPoint(date="Sep 28", issues_opened=8, issues_closed=7, prs_opened=12, prs_merged=10, active_contributors=15),
        TimeSeriesPoint(date="Oct 05", issues_opened=9, issues_closed=11, prs_opened=16, prs_merged=15, active_contributors=19),
        TimeSeriesPoint(date="Oct 12", issues_opened=11, issues_closed=12, prs_opened=14, prs_merged=13, active_contributors=17),
        TimeSeriesPoint(date="Oct 19", issues_opened=8, issues_closed=8, prs_opened=16, prs_merged=15, active_contributors=18),
    ]

    activity_trends = ActivityTrendsData(
        observation_period_days=90,
        points=points,
        is_partial=False,
        coverage_note="Demo dataset aggregated across 90 days of synthetic weekly activity reflecting real-world react repository rhythms."
    )

    return FullRepoAnalysis(
        metadata=metadata,
        health=health,
        maintainer_concentration=concentration,
        issue_backlog=backlog,
        pr_bottleneck=pr_bottleneck,
        top_contributors=top_contributors,
        signals=signals,
        activity_trends=activity_trends,
        pending_prs_sample=pending_prs_sample,
        data_coverage={
            "contributors_sampled": 100,
            "issues_sampled": 100,
            "prs_sampled": 100,
            "review_threads_sampled": 20,
            "is_complete_history": False,
            "mode": "DEMO_DATA"
        },
        rate_limit_info={
            "remaining": "DEMO",
            "limit": "DEMO",
            "used": "0"
        },
        is_demo=True
    )
