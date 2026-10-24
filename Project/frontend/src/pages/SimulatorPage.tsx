import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Play,
  GitPullRequest,
  Users2,
  Calculator,
  Bot,
  Sparkles,
  ExternalLink,
  Info,
  RefreshCw,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { useRepo } from '../context/RepoContext';
import { runSimulation, explainSimulationWithAI } from '../services/api';
import type { AISimulationExplanation } from '../types';
import { useNavigate } from 'react-router-dom';

export const SimulatorPage: React.FC = () => {
  const {
    currentRepo,
    simulationResult,
    setSimulationResult,
    systemHealth,
    preselectedMaintainer
  } = useRepo();
  const navigate = useNavigate();

  const [selectedContributor, setSelectedContributor] = useState<string>('');
  const [durationDays, setDurationDays] = useState<number>(14);
  const [capacityReduction, setCapacityReduction] = useState<number>(100);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [aiExplanation, setAiExplanation] = useState<AISimulationExplanation | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [simError, setSimError] = useState<string | null>(null);

  // Initialize selected contributor from preselected maintainer or top contributor
  useEffect(() => {
    if (currentRepo && currentRepo.top_contributors.length > 0) {
      if (preselectedMaintainer) {
        setSelectedContributor(preselectedMaintainer);
      } else if (!selectedContributor) {
        setSelectedContributor(currentRepo.top_contributors[0].login);
      }
    }
  }, [currentRepo, preselectedMaintainer, selectedContributor]);

  if (!currentRepo) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-lg mx-auto">
        <Cpu className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">No Repository Loaded</h3>
        <p className="text-xs text-slate-500 mb-6">
          Analyze a public GitHub repository or load demo data to run the Maintainer Risk Simulator.
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

  const handleRunSimulation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedContributor) return;

    setIsSimulating(true);
    setSimError(null);
    setAiExplanation(null);

    try {
      const result = await runSimulation(
        selectedContributor,
        durationDays,
        capacityReduction,
        currentRepo
      );
      setSimulationResult(result);
    } catch (err: any) {
      setSimError(err.message || 'Simulation calculation failed.');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleRunAiExplanation = async () => {
    if (!simulationResult) return;
    setIsAiLoading(true);
    try {
      const res = await explainSimulationWithAI(simulationResult);
      setAiExplanation(res);
    } catch {
      // Handled in api client
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#4169F1] text-xs font-semibold border border-blue-200">
            <Cpu className="w-3.5 h-3.5" />
            <span>Signature Feature: What-If Capacity Simulator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            What if a key maintainer became unavailable?
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Explore hypothetical changes in review capacity and discover where additional contributor coverage may be needed.
          </p>
        </div>

        {/* Mandatory Ethical Guidelines Note */}
        <div className="mt-6 p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs leading-relaxed flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-950">Hypothetical Simulation Note: </span>
            "This is a hypothetical scenario based on historical activity, not a prediction about an individual or the future of a repository.
            The goal is identifying review coverage gaps before they become critical."
          </div>
        </div>
      </div>

      {/* Scenario Controls Panel */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-6">Scenario Parameters</h2>

        <form onSubmit={handleRunSimulation} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Control 1: Contributor Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Select Key Contributor
              </label>
              <select
                value={selectedContributor}
                onChange={(e) => setSelectedContributor(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-[#4169F1] focus:bg-white transition-colors"
              >
                {currentRepo.top_contributors.map((c) => (
                  <option key={c.login} value={c.login}>
                    @{c.login} ({c.share_percentage}% activity, {c.contributions} commits)
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-400 block">
                Populated from repository contributor analysis.
              </span>
            </div>

            {/* Control 2: Scenario Duration */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Scenario Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[7, 14, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setDurationDays(days)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      durationDays === days
                        ? 'bg-[#4169F1] text-white border-[#4169F1] shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {days} Days
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-slate-400 block">
                Duration of simulated unavailability.
              </span>
            </div>

            {/* Control 3: Capacity Reduction Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Capacity Reduction
                </label>
                <span className="text-xs font-bold text-[#4169F1]">{capacityReduction}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={capacityReduction}
                onChange={(e) => setCapacityReduction(Number(e.target.value))}
                className="w-full accent-[#4169F1] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>10% (Minor Pause)</span>
                <span>50% (Part-time)</span>
                <span>100% (Full Absence)</span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-500 hidden sm:inline">
              Deterministic calculation: evaluates daily historical review rate × scenario days × capacity fraction.
            </span>
            <button
              type="submit"
              disabled={isSimulating}
              className="px-6 py-2.5 bg-[#4169F1] text-white text-xs font-bold rounded-xl hover:bg-[#3355CC] transition-all flex items-center gap-2 shadow-xs shrink-0 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{isSimulating ? 'Computing Scenario...' : 'Run Simulation'}</span>
            </button>
          </div>
        </form>
      </div>

      {simError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          {simError}
        </div>
      )}

      {/* Simulation Results Section */}
      {simulationResult && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Result Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Estimated Lost Review Actions
              </span>
              <div className="text-3xl font-black text-rose-600 tracking-tight">
                ~{simulationResult.estimated_lost_reviews}
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Based on @{simulationResult.selected_contributor}'s baseline of {simulationResult.contributor_daily_review_rate} reviews/day.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Estimated Delayed PRs
              </span>
              <div className="text-3xl font-black text-amber-600 tracking-tight">
                {simulationResult.estimated_delayed_prs_count} PRs
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Out of {simulationResult.total_open_prs_at_risk} currently pending pull requests awaiting triage.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Backup Review Coverage
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-lg font-bold px-2.5 py-0.5 rounded-md ${
                    simulationResult.backup_coverage_status === 'Adequate'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : simulationResult.backup_coverage_status === 'Fragile'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {simulationResult.backup_coverage_status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {simulationResult.backup_contributors.length} secondary maintainers with recorded review activity.
              </p>
            </div>
          </div>

          {/* Backup Contributors & Potentially Affected PRs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Backup Contributors */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Observed Backup Reviewers</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Other contributors who have performed reviews in recent samples.
                  </p>
                </div>
                <Users2 className="w-4 h-4 text-[#14B8A6]" />
              </div>

              {simulationResult.backup_contributors.length > 0 ? (
                <div className="space-y-3">
                  {simulationResult.backup_contributors.map((b) => (
                    <div
                      key={b.login}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        {b.avatar_url ? (
                          <img
                            src={b.avatar_url}
                            alt={b.login}
                            className="w-7 h-7 rounded-full border border-slate-200 object-cover"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-[10px]">
                            {b.login.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-slate-900">@{b.login}</span>
                          <span className="text-[10px] text-slate-400 block">
                            {b.observed_reviews} recorded reviews
                          </span>
                        </div>
                      </div>
                      <span className="font-semibold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {b.review_share_percent}% share
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 text-amber-800 text-xs">
                  No other active reviewers were identified in the sampled pull request threads.
                </div>
              )}
            </div>

            {/* Potentially Affected Pending PRs */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Potentially Affected Pull Requests</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Open submissions vulnerable to review delays during this window.
                  </p>
                </div>
                <GitPullRequest className="w-4 h-4 text-purple-600" />
              </div>

              {simulationResult.potentially_affected_prs.length > 0 ? (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {simulationResult.potentially_affected_prs.slice(0, 5).map((pr) => (
                    <div
                      key={pr.number}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors text-xs flex items-start justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-900 line-clamp-1">{pr.title}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                          <span>#{pr.number} by @{pr.author}</span>
                          <span>•</span>
                          <span>Waiting {pr.age_days} days</span>
                        </div>
                      </div>
                      {pr.html_url && (
                        <a
                          href={pr.html_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#4169F1] hover:text-[#3355CC] shrink-0 mt-0.5"
                          title="Open PR on GitHub"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 text-slate-500 text-xs">
                  No open pull requests recorded in this repository.
                </div>
              )}
            </div>
          </div>

          {/* Formula and Assumptions Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Calculator className="w-4 h-4 text-[#4169F1]" />
              <span>Calculation Logic & Scenario Assumptions</span>
            </div>

            <div className="p-3 bg-slate-900 text-slate-100 font-mono text-xs rounded-lg select-all">
              {simulationResult.formula_used}
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
              {simulationResult.assumptions.map((ass, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-[#4169F1] font-bold">•</span>
                  <span>{ass}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* AI Explanation Section */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-[#4169F1]" />
                  <h3 className="font-bold text-base text-slate-900">AI Scenario Explanation</h3>
                </div>
                <p className="text-xs text-slate-500">
                  Explains the deterministic output using your local open-weight model ({systemHealth?.ollama_ai?.configured_model || 'qwen2.5:3b'}).
                </p>
              </div>

              <button
                onClick={handleRunAiExplanation}
                disabled={isAiLoading}
                className="px-4 py-2 bg-[#4169F1] text-white text-xs font-semibold rounded-xl hover:bg-[#3355CC] transition-colors flex items-center gap-2 shadow-xs shrink-0 disabled:opacity-50"
              >
                {isAiLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Output...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Explain Scenario with AI</span>
                  </>
                )}
              </button>
            </div>

            {aiExplanation ? (
              aiExplanation.is_available ? (
                <div className="space-y-6 text-xs text-slate-700">
                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#4169F1] block mb-1">
                      What This Scenario Shows
                    </span>
                    <p className="text-sm font-medium text-slate-800 leading-relaxed">
                      {aiExplanation.summary_of_scenario}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Supporting Evidence */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="font-bold text-slate-900">Evidence Supporting Concern</div>
                      <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                        {aiExplanation.evidence_supporting_concern.map((ev, i) => (
                          <li key={i}>{ev}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Alternative Explanations */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="font-bold text-slate-900">Alternative Explanations & Context</div>
                      <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                        {aiExplanation.alternative_explanations.map((alt, i) => (
                          <li key={i}>{alt}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Practical Recommendations */}
                  <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/30 space-y-2">
                    <div className="font-bold text-teal-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#14B8A6]" />
                      <span>Practical Actions to Reduce Maintainer Dependency</span>
                    </div>
                    <ul className="space-y-1.5 list-disc list-inside text-slate-700">
                      {aiExplanation.practical_recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-[11px] text-slate-400 italic">
                    {aiExplanation.disclaimer}
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                  <div className="font-bold text-amber-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Local Ollama AI Service Offline</span>
                  </div>
                  <p className="leading-relaxed">
                    VitalRepo uses an open-weight model through Ollama to keep your analysis 100% private.
                    The simulation numbers above were successfully calculated deterministically. To enable AI narrative explanations:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-amber-900 font-medium">
                    <li>Install Ollama from <a href="https://ollama.com" target="_blank" rel="noreferrer" className="underline">ollama.com</a>.</li>
                    <li>Open terminal and run: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">ollama run {systemHealth?.ollama_ai?.configured_model || 'qwen2.5:3b'}</code></li>
                    <li>Click <strong>Explain Scenario with AI</strong> again.</li>
                  </ol>
                </div>
              )
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                Click <strong>Explain Scenario with AI</strong> to generate evidence-based explanations and practical recommendations from the open-weight model.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
