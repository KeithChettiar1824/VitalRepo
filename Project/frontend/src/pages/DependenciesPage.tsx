import React from 'react';
import {
  Users2,
  ArrowRight,
  ExternalLink,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { useRepo } from '../context/RepoContext';
import { useNavigate } from 'react-router-dom';

export const DependenciesPage: React.FC = () => {
  const { currentRepo, setPreselectedMaintainer } = useRepo();
  const navigate = useNavigate();

  if (!currentRepo) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-lg mx-auto">
        <Users2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">No Repository Loaded</h3>
        <p className="text-xs text-slate-500 mb-6">
          Analyze a public GitHub repository or load demo data to view maintainer concentration.
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

  const { maintainer_concentration, top_contributors } = currentRepo;

  // Chart data for top 8 contributors
  const chartData = top_contributors.slice(0, 8).map((c) => ({
    name: `@${c.login}`,
    share: c.share_percentage,
    contributions: c.contributions,
    login: c.login
  }));

  const handleExploreScenario = (login: string) => {
    setPreselectedMaintainer(login);
    navigate('/simulator');
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#4169F1] text-xs font-semibold border border-blue-200">
            <Users2 className="w-3.5 h-3.5" />
            <span>Maintainer Concentration & Bus Factor Analysis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Maintainer Dependencies
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Understand how contribution volume and review duties are shared across project maintainers.
          </p>
        </div>

        {/* Mandatory Ethical Guidelines Note */}
        <div className="mt-6 p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs leading-relaxed flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-950">Ethical Analysis Note: </span>
            "High contributor concentration can indicate a maintenance bottleneck, but it does not necessarily mean that a project is unhealthy.
            Many successful libraries are shepherded by small, dedicated core teams."
          </div>
        </div>
      </div>

      {/* Contributor Activity Distribution Chart */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Contributor Activity Distribution</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Share of counted default branch contributions among top contributors (Gini Inequality: {maintainer_concentration.gini_coefficient})
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 self-start sm:self-auto">
            {maintainer_concentration.concentration_level}
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
            >
              <XAxis
                type="number"
                unit="%"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#94A3B8' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: '#334155', fontWeight: 500 }}
                width={110}
              />
              <Tooltip
                formatter={(val: any) => [`${val}% of total activity`, 'Share']}
                contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', fontSize: '12px' }}
              />
              <Bar dataKey="share" radius={[0, 6, 6, 0]}>
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? '#4169F1' : index < 3 ? '#14B8A6' : '#94A3B8'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Leading Contributors Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Leading Project Contributors</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sampled contributors with counted activity and observed review activity.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-6">Contributor</th>
                <th className="py-3 px-4">Role / Title</th>
                <th className="py-3 px-4">Counted Activity</th>
                <th className="py-3 px-4">Activity Share</th>
                <th className="py-3 px-4">Observed Reviews</th>
                <th className="py-3 px-6 text-right">What-If Analysis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {top_contributors.map((c, idx) => (
                <tr key={c.login} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3">
                      {c.avatar_url ? (
                        <img
                          src={c.avatar_url}
                          alt={c.login}
                          className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                          {c.login.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>@{c.login}</span>
                          <a
                            href={c.html_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-[#4169F1]"
                            title="View on GitHub"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <span className="text-[10px] text-slate-400">Rank #{idx + 1}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        c.is_top_contributor
                          ? 'bg-blue-50 text-[#4169F1] border border-blue-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {c.role_description}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                    {c.contributions.toLocaleString()}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#4169F1] h-full rounded-full"
                          style={{ width: `${Math.min(100, c.share_percentage)}%` }}
                        />
                      </div>
                      <span className="font-semibold text-slate-900">{c.share_percentage}%</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-700">
                    {c.reviews_count > 0 ? (
                      <span className="font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        {c.reviews_count} reviews
                      </span>
                    ) : (
                      <span className="text-slate-400">Unsampled</span>
                    )}
                  </td>

                  <td className="py-3.5 px-6 text-right">
                    <button
                      onClick={() => handleExploreScenario(c.login)}
                      className="px-3 py-1.5 bg-[#4169F1]/10 text-[#4169F1] hover:bg-[#4169F1] hover:text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>Explore Risk Scenario</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
