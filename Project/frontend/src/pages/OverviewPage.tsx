import React, { useState } from 'react';
import {
  Search,
  ArrowRight,
  Database,
  HeartPulse,
  Users2,
  Inbox,
  GitPullRequest,
  Star,
  GitFork,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { useRepo } from '../context/RepoContext';
import { MetricCard } from '../components/common/MetricCard';
import { DemoBadge } from '../components/common/DemoBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { useNavigate } from 'react-router-dom';

export const OverviewPage: React.FC = () => {
  const {
    currentRepo,
    isLoading,
    error,
    analyze,
    loadDemo,
    periodDays,
    setActiveEvidence
  } = useRepo();

  const [inputUrl, setInputUrl] = useState('');
  const [formValidation, setFormValidation] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputUrl.trim();
    if (!clean) {
      setFormValidation('Please enter a GitHub repository URL or owner/repo.');
      return;
    }
    setFormValidation(null);
    analyze(clean);
  };

  const handleChipClick = (example: string) => {
    setInputUrl(example);
    setFormValidation(null);
    analyze(example);
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => inputUrl && analyze(inputUrl)} />;
  }

  // 1. Landing Hero State (No active repository yet)
  if (!currentRepo) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:py-16">
        {/* Hero Header */}
        <div className="text-center space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4169F1]/10 text-[#4169F1] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Source Health & Sustainability Intelligence</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#172033] tracking-tight max-w-2xl mx-auto leading-tight">
            Understand the health behind your dependencies.
          </h1>
          <p className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed">
            Analyze public GitHub repositories, identify maintenance bottlenecks, and discover evidence-backed ways to strengthen open-source sustainability.
          </p>
        </div>

        {/* Input Box */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 mb-8">
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="https://github.com/owner/repository or owner/repo"
                  value={inputUrl}
                  onChange={(e) => {
                    setInputUrl(e.target.value);
                    if (formValidation) setFormValidation(null);
                  }}
                  className="w-full pl-12 pr-4 py-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#4169F1] focus:bg-white focus:ring-2 focus:ring-[#4169F1]/20 transition-all font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 bg-[#4169F1] text-white text-sm font-semibold rounded-xl hover:bg-[#3355CC] transition-all flex items-center justify-center gap-2 shadow-md shadow-[#4169F1]/25 hover:shadow-lg hover:shadow-[#4169F1]/30 shrink-0"
              >
                <span>Analyze Repository</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {formValidation && (
              <p className="text-xs text-red-600 font-medium pl-1">{formValidation}</p>
            )}

            {/* Quick Demo Button */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>Want to see it in action without API keys?</span>
                <button
                  type="button"
                  onClick={loadDemo}
                  className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-md border border-amber-200 transition-colors"
                >
                  <Database className="w-3 h-3 text-amber-600" />
                  Try Demo Repository (facebook/react)
                </button>
              </div>

              {/* Example Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-400">Popular:</span>
                {['pallets/flask', 'fastapi/fastapi', 'vuejs/core'].map((repo) => (
                  <button
                    key={repo}
                    type="button"
                    onClick={() => handleChipClick(repo)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono text-[11px] transition-colors"
                  >
                    {repo}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#4169F1] flex items-center justify-center mb-3">
              <Users2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">Maintainer Concentration</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Measure workload distribution and review concentration among leading maintainers.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#14B8A6] flex items-center justify-center mb-3">
              <GitPullRequest className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">PR Review Latency</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Detect queue bottlenecks and median time to first human review on community contributions.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <HeartPulse className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">What-If Risk Simulator</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Explore hypothetical capacity changes when a maintainer pauses and discover backup coverage.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Repository Dashboard State
  const { metadata, health, maintainer_concentration, issue_backlog, pr_bottleneck, signals, activity_trends } = currentRepo;

  return (
    <div className="space-y-8">
      {/* Repository Header Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {metadata.full_name}
              </h1>
              {metadata.language && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#4169F1] border border-blue-200">
                  {metadata.language}
                </span>
              )}
              {metadata.license_name && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                  {metadata.license_name}
                </span>
              )}
              {currentRepo.is_demo && <DemoBadge />}
            </div>

            <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
              {metadata.description || 'No description provided by repository owners.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                {metadata.stars_count.toLocaleString()} stars
              </span>
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <GitFork className="w-3.5 h-3.5 text-slate-400" />
                {metadata.forks_count.toLocaleString()} forks
              </span>
              <span>•</span>
              <span>Observed Window: {periodDays} days</span>
              <span>•</span>
              <span>Analyzed: {new Date(metadata.last_analyzed_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/simulator')}
              className="px-4 py-2.5 bg-[#4169F1] text-white text-xs font-semibold rounded-xl hover:bg-[#3355CC] transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Users2 className="w-3.5 h-3.5" />
              <span>Simulate Risk Scenario</span>
            </button>
            <a
              href={metadata.html_url}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              title="Open repository on GitHub"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* 4 Core Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Health Score */}
        <MetricCard
          title="Repository Health"
          value={`${health.overall_score}/100`}
          subtitle={health.rating}
          icon={<HeartPulse className="w-5 h-5 text-emerald-600" />}
          badge={{
            text: health.rating,
            type: health.overall_score >= 80 ? 'good' : health.overall_score >= 60 ? 'warning' : 'critical'
          }}
          clickable
          onClick={() => navigate('/health')}
        />

        {/* Metric 2: Maintainer Concentration */}
        <MetricCard
          title="Maintainer Concentration"
          value={`${maintainer_concentration.top1_share}%`}
          subtitle={`Top 3 handle ${maintainer_concentration.top3_share}% (Gini: ${maintainer_concentration.gini_coefficient})`}
          icon={<Users2 className="w-5 h-5 text-[#4169F1]" />}
          badge={{
            text: maintainer_concentration.concentration_level,
            type: maintainer_concentration.top1_share > 60 ? 'critical' : maintainer_concentration.top1_share > 35 ? 'warning' : 'good'
          }}
          clickable
          onClick={() => navigate('/dependencies')}
        />

        {/* Metric 3: Issue Backlog */}
        <MetricCard
          title="Issue Backlog"
          value={issue_backlog.total_open_issues.toLocaleString()}
          subtitle={`${issue_backlog.opened_in_period} opened vs ${issue_backlog.closed_in_period} closed in ${periodDays}d`}
          icon={<Inbox className="w-5 h-5 text-purple-600" />}
          badge={{
            text: issue_backlog.net_change > 0 ? `+${issue_backlog.net_change} Net` : `${issue_backlog.net_change} Net`,
            type: issue_backlog.net_change > 0 ? 'warning' : 'good'
          }}
          clickable
          onClick={() => navigate('/trends')}
        />

        {/* Metric 4: PR Review Bottleneck */}
        <MetricCard
          title="PR Review Latency"
          value={
            pr_bottleneck.median_time_to_first_review_hours !== null
              ? `${pr_bottleneck.median_time_to_first_review_hours}h`
              : `${pr_bottleneck.total_open_prs} Open`
          }
          subtitle={
            pr_bottleneck.median_time_to_first_review_hours !== null
              ? `Median wait to first human review (${pr_bottleneck.sampled_prs_count} sampled)`
              : `Median age: ${pr_bottleneck.median_pending_pr_age_days || 'N/A'} days`
          }
          icon={<GitPullRequest className="w-5 h-5 text-[#14B8A6]" />}
          badge={{
            text: pr_bottleneck.median_time_to_first_review_hours && pr_bottleneck.median_time_to_first_review_hours > 72 ? 'Slow' : 'Steady',
            type: pr_bottleneck.median_time_to_first_review_hours && pr_bottleneck.median_time_to_first_review_hours > 72 ? 'warning' : 'good'
          }}
          clickable
          onClick={() => navigate('/trends')}
        />
      </div>

      {/* Activity Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues Opened vs Closed Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Issues: Opened vs Closed</h3>
              <p className="text-xs text-slate-500 mt-0.5">Weekly resolution cadence over observed window</p>
            </div>
            <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
              {activity_trends.points.length} Weeks
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activity_trends.points} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="issues_opened" name="Issues Opened" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="issues_closed" name="Issues Closed" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pull Requests Opened vs Merged Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pull Requests: Opened vs Merged</h3>
              <p className="text-xs text-slate-500 mt-0.5">Contribution intake and merge velocity</p>
            </div>
            <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
              {activity_trends.points.length} Weeks
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity_trends.points} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMerged" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4169F1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4169F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="prs_opened" name="PRs Opened" stroke="#4169F1" fill="url(#colorOpened)" strokeWidth={2} />
                <Area type="monotone" dataKey="prs_merged" name="PRs Merged" stroke="#14B8A6" fill="url(#colorMerged)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Signals Worth Your Attention Section */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Signals Worth Your Attention</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Empirical repository observations derived from GitHub metrics and activity patterns.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
            {signals.length} Findings
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {signals.map((sig) => (
            <div key={sig.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                      sig.severity === 'critical'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : sig.severity === 'medium'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {sig.severity}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900">{sig.title}</h4>
                </div>
                <div className="text-xs font-semibold text-slate-700">{sig.measured_value}</div>
                <p className="text-xs text-slate-500 leading-relaxed">{sig.explanation}</p>
              </div>

              <button
                onClick={() => setActiveEvidence(sig)}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-center"
              >
                <span>View Evidence</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
