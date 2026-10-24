import React, { useState } from 'react';
import {
  HeartPulse,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Bot,
  Sparkles,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useRepo } from '../context/RepoContext';
import { explainHealthWithAI } from '../services/api';
import type { AIHealthExplanation } from '../types';
import { useNavigate } from 'react-router-dom';

export const HealthPage: React.FC = () => {
  const { currentRepo, systemHealth } = useRepo();
  const navigate = useNavigate();

  const [aiExplanation, setAiExplanation] = useState<AIHealthExplanation | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  if (!currentRepo) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-lg mx-auto">
        <HeartPulse className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">No Repository Loaded</h3>
        <p className="text-xs text-slate-500 mb-6">
          Analyze a public GitHub repository or load demo data to view its sustainability health breakdown.
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

  const { health, metadata } = currentRepo;

  const handleRunAiHealth = async () => {
    setIsAiLoading(true);
    try {
      const payload = {
        repo: metadata.full_name,
        score: health.overall_score,
        rating: health.rating,
        components: health.components
      };
      const res = await explainHealthWithAI(payload);
      setAiExplanation(res);
    } catch {
      // Handled in api client
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Sustainability Health Index</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Repository Health Breakdown
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Multi-factor evaluation of maintainer concentration, issue throughput, pull request velocity, and commit cadence.
          </p>
        </div>

        {/* Big Radial/Score Badge */}
        <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80 shrink-0">
          <div className="text-center">
            <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
              {health.overall_score}
            </span>
            <span className="text-xs text-slate-400 font-semibold block">out of 100</span>
          </div>
          <div className="h-10 w-px bg-slate-200" />
          <div>
            <span
              className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md text-white shadow-2xs"
              style={{ backgroundColor: health.color }}
            >
              {health.rating}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">Rule-based status</span>
          </div>
        </div>
      </div>

      {/* 4 Health Dimension Components */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-slate-900">Health Indicator Dimensions</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {health.components.map((comp, idx) => {
            const pct = Math.round((comp.score / comp.max_score) * 100);
            return (
              <div
                key={idx}
                className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900">{comp.name}</span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        comp.status === 'Good'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : comp.status === 'Fair'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {comp.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{comp.description}</p>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
                    <span>Dimension Score</span>
                    <span className="font-mono font-bold text-slate-800">
                      {comp.score} / {comp.max_score} pts ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Methodology Disclosure Note */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed flex items-start gap-3">
          <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-800">Scoring Methodology: </span>
            {health.methodology}
          </div>
        </div>
      </div>

      {/* AI Health Explanations & Next Steps */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#4169F1]" />
              <h3 className="font-bold text-base text-slate-900">AI Sustainability Advisor</h3>
            </div>
            <p className="text-xs text-slate-500">
              Powered by local open-weight model ({systemHealth?.ollama_ai?.configured_model || 'qwen2.5:3b'}) via Ollama.
            </p>
          </div>

          <button
            onClick={handleRunAiHealth}
            disabled={isAiLoading}
            className="px-4 py-2 bg-[#4169F1] text-white text-xs font-semibold rounded-xl hover:bg-[#3355CC] transition-colors flex items-center gap-2 shadow-xs shrink-0 disabled:opacity-50"
          >
            {isAiLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing Repository...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate AI Recommendations</span>
              </>
            )}
          </button>
        </div>

        {/* AI Output or Instructions */}
        {aiExplanation ? (
          aiExplanation.is_available ? (
            <div className="space-y-6 text-xs text-slate-700">
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4169F1] block mb-1">
                  Executive Summary
                </span>
                <p className="text-sm font-medium text-slate-800 leading-relaxed">
                  {aiExplanation.executive_summary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Strengths */}
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Sustainability Strengths</span>
                  </div>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                    {aiExplanation.sustainability_strengths.map((str, i) => (
                      <li key={i}>{str}</li>
                    ))}
                  </ul>
                </div>

                {/* Vulnerabilities */}
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Observed Vulnerabilities</span>
                  </div>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                    {aiExplanation.vulnerabilities.map((vuln, i) => (
                      <li key={i}>{vuln}</li>
                    ))}
                  </ul>
                </div>

                {/* Next Steps */}
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-blue-800">
                    <Sparkles className="w-4 h-4 text-[#4169F1]" />
                    <span>Recommended Next Steps</span>
                  </div>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                    {aiExplanation.actionable_next_steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
              <div className="font-bold text-amber-950 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Local AI Model Offline (Ollama)</span>
              </div>
              <p className="leading-relaxed">
                VitalRepo connects to a local open-weight model through Ollama to keep your analysis 100% private.
                To activate AI explanations, install Ollama from <a href="https://ollama.com" target="_blank" rel="noreferrer" className="underline font-semibold">ollama.com</a> and run:
              </p>
              <div className="p-2.5 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs select-all">
                ollama run {systemHealth?.ollama_ai?.configured_model || 'qwen2.5:3b'}
              </div>
            </div>
          )
        ) : (
          <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
            Click <strong>Generate AI Recommendations</strong> above to inspect model-generated sustainability advice based on verified metrics.
          </div>
        )}
      </div>

      {/* Simulator CTA */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50 via-teal-50 to-slate-50 border border-blue-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Test Maintainer Unavailability Scenarios</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate how review delays and pending pull requests scale if a key contributor takes temporary leave.
          </p>
        </div>
        <button
          onClick={() => navigate('/simulator')}
          className="px-5 py-2.5 bg-[#4169F1] text-white text-xs font-semibold rounded-xl hover:bg-[#3355CC] transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
        >
          <span>Open Risk Simulator</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
