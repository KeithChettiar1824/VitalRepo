from typing import Dict, Any, List, Optional
from backend.models import (
    SimulationRequest,
    SimulationResult,
    PendingPRItem,
    BackupContributor
)

def run_risk_simulation(
    request: SimulationRequest,
    repo_analysis: Dict[str, Any]
) -> SimulationResult:
    """
    Executes a deterministic what-if analysis modeling the hypothetical temporary
    unavailability or capacity reduction of a specific key maintainer.
    """
    contributor_login = request.contributor_login.strip()
    scenario_days = request.scenario_days
    reduction_pct = request.capacity_reduction_percent
    reduction_fraction = reduction_pct / 100.0

    # Extract historical context from repo_analysis
    period_days = repo_analysis.get("issue_backlog", {}).get("observation_period_days", 90)
    top_contributors = repo_analysis.get("top_contributors", [])
    pr_bottleneck = repo_analysis.get("pr_bottleneck", {})
    pending_prs: List[Dict[str, Any]] = repo_analysis.get("pending_prs_sample", [])

    # Find the target contributor's records
    target_stat = next((c for c in top_contributors if c.get("login") == contributor_login), None)

    # In our analysis, we track review counts and commit shares
    # If explicit review counts exist in top_contributors, use them; otherwise estimate from activity share
    target_reviews = target_stat.get("reviews_count", 0) if target_stat else 0
    total_reviews = sum(c.get("reviews_count", 0) for c in top_contributors)

    # If review sampling returned small numbers or target had 0 reviews in the sampled PRs,
    # we use their observed contribution share to model review responsibility realistically:
    target_contrib_share = (target_stat.get("share_percentage", 0.0) / 100.0) if target_stat else 0.10

    if total_reviews > 0 and target_reviews > 0:
        contributor_review_share = target_reviews / total_reviews
        daily_review_rate = target_reviews / max(1, period_days)
    else:
        # Fallback to bounded estimation from merged PRs and contributor commit share
        merged_count = pr_bottleneck.get("merged_in_period", 10)
        estimated_total_reviews = max(total_reviews, int(merged_count * 1.5))
        total_reviews = estimated_total_reviews
        target_reviews = max(1, int(estimated_total_reviews * target_contrib_share))
        contributor_review_share = target_contrib_share
        daily_review_rate = round(target_reviews / max(1, period_days), 2)

    # Core deterministic formula:
    # Estimated lost review capacity = Observed average reviews per day × Scenario days × Assumed unavailable capacity fraction
    estimated_lost_reviews = round(daily_review_rate * scenario_days * reduction_fraction, 1)

    # Pending PRs: Which pending PRs are likely affected?
    # Open PRs that need review and have no other explicit maintainer activity
    affected_prs: List[PendingPRItem] = []
    for pr in pending_prs:
        affected_prs.append(PendingPRItem(**pr))

    # Bound affected PR count by estimated lost reviews and total open PRs
    total_open_prs = pr_bottleneck.get("total_open_prs", len(pending_prs))
    estimated_delayed_count = min(total_open_prs, max(1, int(round(estimated_lost_reviews))))

    # Other contributors who can serve as backup reviewers
    backup_list: List[BackupContributor] = []
    other_contributors = [c for c in top_contributors if c.get("login") != contributor_login]

    # Calculate backup shares
    other_total_reviews = sum(c.get("reviews_count", 0) for c in other_contributors)
    for c in other_contributors[:5]:
        c_revs = c.get("reviews_count", 0)
        c_share = round((c_revs / other_total_reviews * 100), 1) if other_total_reviews > 0 else round(c.get("share_percentage", 0.0), 1)
        backup_list.append(BackupContributor(
            login=c.get("login", "unknown"),
            avatar_url=c.get("avatar_url", ""),
            html_url=c.get("html_url", ""),
            observed_reviews=c_revs,
            review_share_percent=c_share
        ))

    # Determine backup coverage status
    if len(backup_list) >= 3 and any(b.review_share_percent >= 25.0 for b in backup_list):
        coverage_status = "Adequate"
    elif len(backup_list) >= 1:
        coverage_status = "Fragile"
    else:
        coverage_status = "No Observed Backup"

    formula_str = (
        f"Estimated Lost Review Capacity = (Daily Review Rate {daily_review_rate} rev/day) × "
        f"(Scenario Duration {scenario_days} days) × (Capacity Reduction {reduction_pct}%) = "
        f"{estimated_lost_reviews} review actions"
    )

    assumptions = [
        f"Baseline review pace is derived from @{contributor_login}'s observed historical activity ({period_days}-day window).",
        f"Assumes incoming pull request rate remains comparable to historical averages during the {scenario_days}-day scenario.",
        "Assumes existing secondary reviewers do not immediately accelerate review throughput without proactive coordination.",
        "Does not account for differing complexity across individual pull requests or seasonal development pauses."
    ]

    disclaimer = (
        "This is a hypothetical scenario based on historical activity, not a prediction about an individual "
        "or the future of a repository. It is designed to identify single points of dependency and assist maintainers "
        "in distributing workload proactively."
    )

    return SimulationResult(
        selected_contributor=contributor_login,
        scenario_duration_days=scenario_days,
        capacity_reduction_percent=reduction_pct,
        observed_historical_period_days=period_days,
        observed_total_reviews=total_reviews,
        contributor_observed_reviews=target_reviews,
        contributor_review_share_percent=round(contributor_review_share * 100, 1),
        contributor_daily_review_rate=daily_review_rate,
        estimated_lost_reviews=estimated_lost_reviews,
        estimated_delayed_prs_count=estimated_delayed_count,
        total_open_prs_at_risk=total_open_prs,
        potentially_affected_prs=affected_prs[:10],
        backup_contributors=backup_list,
        backup_coverage_status=coverage_status,
        formula_used=formula_str,
        assumptions=assumptions,
        disclaimer=disclaimer
    )
