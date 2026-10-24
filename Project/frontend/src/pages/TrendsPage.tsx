import React from 'react';
import {
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { useRepo } from '../context/RepoContext';
import { useNavigate } from 'react-router-dom';

export const TrendsPage: React.FC = () => {
  const { currentRepo, periodDays, setPeriodDays } = useRepo();
  const navigate = useNavigate();

  if (!currentRepo) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-lg mx-auto">
        <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">No Repository Loaded</h3>
        <p className="text-xs text-slate-500 mb-6">
          Analyze a public GitHub repository or load demo data to view historical activity trends.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 bg-[#4169F1] text-white text-xs font-semibold rounded-xl hover:bg-[#3355CC] transition-colors"
        >
          Go to Overview
        </button>
      </div>
    );
  }

  const { activity_trends, issue_backlog, pr_bottleneck } = currentRepo;
  const points = activity_trends.points;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-teal-50 text-[#14B8A6] text-xs font-semibold border border-teal-200">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Activity Trends & Throughput</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Activity Trends
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Observed issue resolution cadence, pull request merges, and review velocity.
          </p>
        </div>

        {/* Observation Period Buttons */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs self-start sm:self-auto">
          {[30, 90, 180].map((days) => (
            <button
              key={days}
              onClick={() => setPeriodDays(days)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                periodDays === days
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Issue Resolution Rate
          </span>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {issue_backlog.resolution_rate_percent}%
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {issue_backlog.closed_in_period} closed vs {issue_backlog.opened_in_period} opened in {periodDays}d.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            PR Merge Velocity
          </span>
          <div className="text-3xl font-black text-teal-600 tracking-tight">
            {pr_bottleneck.merged_in_period} Merged
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Out of recent sample ({pr_bottleneck.closed_unmerged_in_period} closed unmerged).
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            First Review Turnaround
          </span>
          <div className="text-3xl font-black text-[#4169F1] tracking-tight">
            {pr_bottleneck.median_time_to_first_review_hours !== null
              ? `${pr_bottleneck.median_time_to_first_review_hours}h`
              : 'N/A'}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Median wait to first human review ({pr_bottleneck.sampled_prs_count} sampled).
          </p>
        </div>
      </div>

      {/* Issues Time Series Chart */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Issue Arrival vs Resolution Trends</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Weekly volume of opened versus closed issues across the observation period.
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

      {/* Pull Requests Time Series Chart */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Pull Request Intake vs Merge Cadence</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Weekly pull request creation volume compared with merged community contributions.
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrMerged" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPrOpened" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4169F1" stopOpacity={0.25} />
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
              <Area type="monotone" dataKey="prs_opened" name="PRs Opened" stroke="#4169F1" fill="url(#colorPrOpened)" strokeWidth={2} />
              <Area type="monotone" dataKey="prs_merged" name="PRs Merged" stroke="#14B8A6" fill="url(#colorPrMerged)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Coverage Disclosure */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-700">Data Coverage Notice: </span>
          {activity_trends.coverage_note} Missing data is not synthesized or extrapolated beyond observed GitHub API responses.
        </div>
      </div>
    </div>
  );
};
