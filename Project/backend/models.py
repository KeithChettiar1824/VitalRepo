from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class RepoAnalyzeRequest(BaseModel):
    url: str = Field(..., description="GitHub repository URL or owner/repo format")
    period_days: int = Field(90, ge=30, le=365, description="Observation period in days")

class RepoMetadata(BaseModel):
    owner: str
    name: str
    full_name: str
    description: Optional[str] = None
    html_url: str
    language: Optional[str] = None
    stars_count: int = 0
    forks_count: int = 0
    open_issues_count: int = 0
    license_name: Optional[str] = None
    default_branch: str = "main"
    created_at: str
    pushed_at: str
    last_analyzed_at: str
    is_demo: bool = False

class ContributorStats(BaseModel):
    login: str
    avatar_url: str
    html_url: str
    contributions: int  # Commits/counted contributions
    share_percentage: float  # Percentage of top counted activity
    reviews_count: int = 0  # From observed review sample
    is_top_contributor: bool = False
    role_description: str = "Contributor"

class ContributorConcentrationMetric(BaseModel):
    top1_share: float
    top3_share: float
    top5_share: float
    total_contributors_sampled: int
    total_counted_activity: int
    activity_type: str = "Commits / Contributors API activity"
    gini_coefficient: float
    concentration_level: str  # "Balanced", "Moderate Concentration", "Critical Concentration"
    summary: str

class IssueBacklogMetric(BaseModel):
    total_open_issues: int
    opened_in_period: int
    closed_in_period: int
    net_change: int
    resolution_rate_percent: float
    observation_period_days: int
    summary: str

class PRBottleneckMetric(BaseModel):
    total_open_prs: int
    merged_in_period: int
    closed_unmerged_in_period: int
    median_time_to_first_review_hours: Optional[float] = None
    median_pending_pr_age_days: Optional[float] = None
    sampled_prs_count: int = 0
    reviewed_prs_ratio_percent: Optional[float] = None
    review_sampling_coverage: str
    summary: str

class HealthComponent(BaseModel):
    name: str
    score: float  # 0 to 25
    max_score: float = 25.0
    status: str  # "Good", "Fair", "Needs Attention"
    description: str

class RepoHealthScore(BaseModel):
    overall_score: int  # 0 to 100
    rating: str  # "Robust", "Sustainable", "Moderate Risk", "High Concentration Risk"
    color: str  # Hex or Tailwind color token
    methodology: str
    components: List[HealthComponent]

class EvidenceItem(BaseModel):
    label: str
    value: str
    url: Optional[str] = None

class SignalFinding(BaseModel):
    id: str
    title: str
    severity: str  # "low", "medium", "critical"
    measured_value: str
    analysis_period: str
    explanation: str
    formula: str
    evidence_items: List[EvidenceItem] = []
    limitations: str

class TimeSeriesPoint(BaseModel):
    date: str
    issues_opened: int = 0
    issues_closed: int = 0
    prs_opened: int = 0
    prs_merged: int = 0
    active_contributors: int = 0

class ActivityTrendsData(BaseModel):
    observation_period_days: int
    points: List[TimeSeriesPoint]
    is_partial: bool = False
    coverage_note: str

class PendingPRItem(BaseModel):
    number: int
    title: str
    html_url: str
    author: str
    created_at: str
    age_days: int
    comments_count: int = 0

class SimulationRequest(BaseModel):
    repo_url: Optional[str] = None
    contributor_login: str
    scenario_days: int = Field(14, ge=7, le=90)
    capacity_reduction_percent: int = Field(100, ge=10, le=100)
    # Optional client-provided repo data if running against loaded state
    repo_context: Optional[Dict[str, Any]] = None

class BackupContributor(BaseModel):
    login: str
    avatar_url: str
    html_url: str
    observed_reviews: int
    review_share_percent: float

class SimulationResult(BaseModel):
    selected_contributor: str
    scenario_duration_days: int
    capacity_reduction_percent: int
    observed_historical_period_days: int
    observed_total_reviews: int
    contributor_observed_reviews: int
    contributor_review_share_percent: float
    contributor_daily_review_rate: float
    estimated_lost_reviews: float
    estimated_delayed_prs_count: int
    total_open_prs_at_risk: int
    potentially_affected_prs: List[PendingPRItem]
    backup_contributors: List[BackupContributor]
    backup_coverage_status: str  # "Adequate", "Fragile", "No Observed Backup"
    formula_used: str
    assumptions: List[str]
    disclaimer: str

class AISimulationExplanation(BaseModel):
    is_available: bool
    model_name: str
    summary_of_scenario: str
    evidence_supporting_concern: List[str]
    critical_assumptions: List[str]
    alternative_explanations: List[str]
    practical_recommendations: List[str]
    disclaimer: str
    raw_response: Optional[str] = None
    error_message: Optional[str] = None

class AIHealthExplanation(BaseModel):
    is_available: bool
    model_name: str
    executive_summary: str
    sustainability_strengths: List[str]
    vulnerabilities: List[str]
    actionable_next_steps: List[str]
    error_message: Optional[str] = None

class FullRepoAnalysis(BaseModel):
    metadata: RepoMetadata
    health: RepoHealthScore
    maintainer_concentration: ContributorConcentrationMetric
    issue_backlog: IssueBacklogMetric
    pr_bottleneck: PRBottleneckMetric
    top_contributors: List[ContributorStats]
    signals: List[SignalFinding]
    activity_trends: ActivityTrendsData
    pending_prs_sample: List[PendingPRItem]
    data_coverage: Dict[str, Any]
    rate_limit_info: Optional[Dict[str, Any]] = None
    is_demo: bool = False
