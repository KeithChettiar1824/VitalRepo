import pytest
from datetime import datetime, timezone, timedelta
from backend.services.metrics_calculator import (
    calculate_maintainer_concentration,
    calculate_issue_backlog,
    calculate_pr_bottlenecks,
    calculate_health_score,
    calculate_gini,
    is_bot_user
)

def test_bot_detection():
    assert is_bot_user("dependabot[bot]") is True
    assert is_bot_user("github-actions[bot]") is True
    assert is_bot_user("codecov[bot]") is True
    assert is_bot_user("renovate[bot]") is True
    assert is_bot_user("gaearon") is False
    assert is_bot_user("torvalds") is False

def test_gini_calculation():
    assert calculate_gini([]) == 0.0
    assert calculate_gini([10.0]) == 0.0
    # Equal distribution
    assert calculate_gini([10.0, 10.0, 10.0, 10.0]) == 0.0
    # Skewed distribution
    gini_skewed = calculate_gini([1.0, 1.0, 1.0, 100.0])
    assert gini_skewed > 0.5

def test_maintainer_concentration_empty():
    metric, stats = calculate_maintainer_concentration([])
    assert metric.top1_share == 0.0
    assert metric.total_contributors_sampled == 0
    assert len(stats) == 0

def test_maintainer_concentration_valid():
    raw = [
        {"login": "lead", "contributions": 70, "avatar_url": "", "html_url": ""},
        {"login": "core1", "contributions": 20, "avatar_url": "", "html_url": ""},
        {"login": "contrib1", "contributions": 10, "avatar_url": "", "html_url": ""},
    ]
    metric, stats = calculate_maintainer_concentration(raw)
    assert metric.top1_share == 70.0
    assert metric.top3_share == 100.0
    assert metric.concentration_level == "Critical Concentration"
    assert stats[0].login == "lead"
    assert stats[0].is_top_contributor is True

def test_issue_backlog_calculation():
    now = datetime.now(timezone.utc)
    metadata = {"open_issues_count": 50}
    issues = [
        # Opened 5 days ago, still open
        {"created_at": (now - timedelta(days=5)).isoformat(), "closed_at": None},
        # Opened 10 days ago, closed 2 days ago
        {"created_at": (now - timedelta(days=10)).isoformat(), "closed_at": (now - timedelta(days=2)).isoformat()},
        # Opened 100 days ago (outside 30-day window), closed 5 days ago
        {"created_at": (now - timedelta(days=100)).isoformat(), "closed_at": (now - timedelta(days=5)).isoformat()}
    ]

    metric = calculate_issue_backlog(metadata, issues, period_days=30)
    assert metric.total_open_issues == 50
    assert metric.opened_in_period == 2
    assert metric.closed_in_period == 2
    assert metric.net_change == 0
    assert metric.resolution_rate_percent == 100.0

def test_pr_bottlenecks_calculation():
    now = datetime.now(timezone.utc)
    pulls = [
        {
            "number": 101,
            "state": "open",
            "title": "PR 101",
            "html_url": "https://github.com/org/repo/pull/101",
            "created_at": (now - timedelta(days=4)).isoformat(),
            "closed_at": None,
            "merged_at": None,
            "user": {"login": "author1"}
        },
        {
            "number": 102,
            "state": "closed",
            "title": "PR 102",
            "html_url": "https://github.com/org/repo/pull/102",
            "created_at": (now - timedelta(days=10)).isoformat(),
            "closed_at": (now - timedelta(days=8)).isoformat(),
            "merged_at": (now - timedelta(days=8)).isoformat(),
            "user": {"login": "author2"}
        }
    ]

    reviews_by_pr = {
        102: [
            {
                "user": {"login": "reviewer_human"},
                "submitted_at": (now - timedelta(days=9)).isoformat()
            }
        ]
    }

    metric, pending_items, rev_counts = calculate_pr_bottlenecks(pulls, reviews_by_pr, period_days=30)
    assert metric.total_open_prs == 1
    assert metric.merged_in_period == 1
    assert len(pending_items) == 1
    assert pending_items[0].number == 101
    assert rev_counts.get("reviewer_human") == 1
    # PR 102 took 24 hours (10 days ago created, 9 days ago reviewed)
    assert metric.median_time_to_first_review_hours == 24.0

def test_health_score_calculation():
    from backend.models import ContributorConcentrationMetric, IssueBacklogMetric, PRBottleneckMetric

    conc = ContributorConcentrationMetric(
        top1_share=20.0, top3_share=45.0, top5_share=60.0,
        total_contributors_sampled=50, total_counted_activity=1000,
        activity_type="Commits", gini_coefficient=0.35,
        concentration_level="Balanced", summary="Healthy"
    )
    backlog = IssueBacklogMetric(
        total_open_issues=20, opened_in_period=30, closed_in_period=28,
        net_change=2, resolution_rate_percent=93.3,
        observation_period_days=90, summary="Good"
    )
    pr = PRBottleneckMetric(
        total_open_prs=5, merged_in_period=25, closed_unmerged_in_period=3,
        median_time_to_first_review_hours=24.0, median_pending_pr_age_days=5.0,
        sampled_prs_count=10, reviewed_prs_ratio_percent=90.0,
        review_sampling_coverage="Sampled", summary="Fast"
    )

    now_iso = datetime.now(timezone.utc).isoformat()
    health = calculate_health_score(conc, backlog, pr, now_iso)
    assert health.overall_score >= 80
    assert health.rating in ("Robust", "Sustainable")
    assert len(health.components) == 4
