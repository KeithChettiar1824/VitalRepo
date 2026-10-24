export interface RepoMetadata {
  owner: string;
  name: string;
  full_name: string;
  description?: string;
  html_url: string;
  language?: string;
  stars_count: number;
  forks_count: number;
  open_issues_count: number;
  license_name?: string;
  default_branch: string;
  created_at: string;
  pushed_at: string;
  last_analyzed_at: string;
  is_demo: boolean;
}

export interface ContributorStats {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
  share_percentage: number;
  reviews_count: number;
  is_top_contributor: boolean;
  role_description: string;
}

export interface ContributorConcentrationMetric {
  top1_share: number;
  top3_share: number;
  top5_share: number;
  total_contributors_sampled: number;
  total_counted_activity: number;
  activity_type: string;
  gini_coefficient: number;
  concentration_level: string;
  summary: string;
}

export interface IssueBacklogMetric {
  total_open_issues: number;
  opened_in_period: number;
  closed_in_period: number;
  net_change: number;
  resolution_rate_percent: number;
  observation_period_days: number;
  summary: string;
}

export interface PRBottleneckMetric {
  total_open_prs: number;
  merged_in_period: number;
  closed_unmerged_in_period: number;
  median_time_to_first_review_hours: number | null;
  median_pending_pr_age_days: number | null;
  sampled_prs_count: number;
  reviewed_prs_ratio_percent: number | null;
  review_sampling_coverage: string;
  summary: string;
}

export interface HealthComponent {
  name: string;
  score: number;
  max_score: number;
  status: string;
  description: string;
}

export interface RepoHealthScore {
  overall_score: number;
  rating: string;
  color: string;
  methodology: string;
  components: HealthComponent[];
}

export interface EvidenceItem {
  label: string;
  value: string;
  url?: string;
}

export interface SignalFinding {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'critical';
  measured_value: string;
  analysis_period: string;
  explanation: string;
  formula: string;
  evidence_items: EvidenceItem[];
  limitations: string;
}

export interface TimeSeriesPoint {
  date: string;
  issues_opened: number;
  issues_closed: number;
  prs_opened: number;
  prs_merged: number;
  active_contributors: number;
}

export interface ActivityTrendsData {
  observation_period_days: number;
  points: TimeSeriesPoint[];
  is_partial: boolean;
  coverage_note: string;
}

export interface PendingPRItem {
  number: number;
  title: string;
  html_url: string;
  author: string;
  created_at: string;
  age_days: number;
  comments_count: number;
}

export interface FullRepoAnalysis {
  metadata: RepoMetadata;
  health: RepoHealthScore;
  maintainer_concentration: ContributorConcentrationMetric;
  issue_backlog: IssueBacklogMetric;
  pr_bottleneck: PRBottleneckMetric;
  top_contributors: ContributorStats[];
  signals: SignalFinding[];
  activity_trends: ActivityTrendsData;
  pending_prs_sample: PendingPRItem[];
  data_coverage: {
    contributors_sampled: number;
    issues_sampled: number;
    prs_sampled: number;
    reviews_sampled: number;
    is_complete_history: boolean;
    period_days?: number;
    mode: string;
  };
  rate_limit_info?: {
    remaining?: string;
    limit?: string;
    reset?: string;
    used?: string;
  };
  is_demo: boolean;
}

export interface BackupContributor {
  login: string;
  avatar_url: string;
  html_url: string;
  observed_reviews: number;
  review_share_percent: number;
}

export interface SimulationResult {
  selected_contributor: string;
  scenario_duration_days: number;
  capacity_reduction_percent: number;
  observed_historical_period_days: number;
  observed_total_reviews: number;
  contributor_observed_reviews: number;
  contributor_review_share_percent: number;
  contributor_daily_review_rate: number;
  estimated_lost_reviews: number;
  estimated_delayed_prs_count: number;
  total_open_prs_at_risk: number;
  potentially_affected_prs: PendingPRItem[];
  backup_contributors: BackupContributor[];
  backup_coverage_status: 'Adequate' | 'Fragile' | 'No Observed Backup';
  formula_used: string;
  assumptions: string[];
  disclaimer: string;
}

export interface AISimulationExplanation {
  is_available: boolean;
  model_name: string;
  summary_of_scenario: string;
  evidence_supporting_concern: string[];
  critical_assumptions: string[];
  alternative_explanations: string[];
  practical_recommendations: string[];
  disclaimer: string;
  error_message?: string;
}

export interface AIHealthExplanation {
  is_available: boolean;
  model_name: string;
  executive_summary: string;
  sustainability_strengths: string[];
  vulnerabilities: string[];
  actionable_next_steps: string[];
  error_message?: string;
}

export interface SystemHealth {
  status: string;
  timestamp: string;
  github_api: {
    token_configured: boolean;
    rate_limit_tier: string;
  };
  ollama_ai: {
    is_running: boolean;
    available_models: string[];
    configured_model: string;
    model_ready: boolean;
    message: string;
  };
  cache: {
    total_cached_keys: number;
    valid_cached_keys: number;
    ttl_seconds: number;
  };
}
