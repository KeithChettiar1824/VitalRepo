import React, { useState } from 'react';
import {
  Settings,
  Key,
  Bot,
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Shield,
  HelpCircle,
  Trash2
} from 'lucide-react';
import { useRepo } from '../context/RepoContext';
import { updateSystemSettings, clearBackendCache } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { systemHealth, refreshHealth } = useRepo();

  const [tokenInput, setTokenInput] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('http://127.0.0.1:11434');
  const [ollamaModel, setOllamaModel] = useState(systemHealth?.ollama_ai?.configured_model || 'qwen2.5:3b');
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setStatusMsg(null);
    try {
      const payload: any = {
        ollama_base_url: ollamaUrl.trim(),
        ollama_model: ollamaModel.trim()
      };
      if (tokenInput.trim()) {
        payload.github_token = tokenInput.trim();
      }
      await updateSystemSettings(payload);
      await refreshHealth();
      setStatusMsg({ text: 'Settings updated successfully.', type: 'success' });
      setTokenInput('');
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to update settings.', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      await clearBackendCache();
      await refreshHealth();
      setStatusMsg({ text: 'In-memory cache cleared successfully.', type: 'success' });
    } catch {
      setStatusMsg({ text: 'Failed to clear cache.', type: 'error' });
    } finally {
      setIsClearingCache(false);
    }
  };

  const isTokenSet = systemHealth?.github_api?.token_configured;
  const isAiReady = systemHealth?.ollama_ai?.model_ready;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
            <Settings className="w-3.5 h-3.5" />
            <span>Service & API Configuration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Configure GitHub API tokens for higher rate limits and local Ollama model endpoints for AI explanations.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2 border ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* GitHub API Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#4169F1]" />
                <h2 className="text-base font-bold text-slate-900">GitHub API Access</h2>
              </div>
              <p className="text-xs text-slate-500">
                Optional GitHub Personal Access Token to expand rate limits from 60 to 5,000 requests per hour.
              </p>
            </div>

            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                isTokenSet
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {isTokenSet ? '5,000 req/hr (Token Active)' : '60 req/hr (Public Tier)'}
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Personal Access Token (classic or fine-grained)
            </label>
            <input
              type="password"
              placeholder={isTokenSet ? '•••••••••••••••••••••••• (Token configured)' : 'ghp_... (paste token to configure)'}
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#4169F1] focus:bg-white transition-all font-mono"
            />
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>Tokens are stored in backend process memory only and are never exposed to browser clients.</span>
            </div>
          </div>
        </div>

        {/* Ollama Open-Weight AI Model Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-600" />
                <h2 className="text-base font-bold text-slate-900">Local Open-Weight AI (Ollama)</h2>
              </div>
              <p className="text-xs text-slate-500">
                Configure your local model endpoint for evidence-backed explanations and recommendations.
              </p>
            </div>

            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                isAiReady
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {isAiReady ? 'Model Ready' : 'Service Offline'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">Ollama Base URL</label>
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                placeholder="http://127.0.0.1:11434"
                className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-[#4169F1] focus:bg-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">Model Name</label>
              <input
                type="text"
                value={ollamaModel}
                onChange={(e) => setOllamaModel(e.target.value)}
                placeholder="qwen2.5:3b"
                className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-[#4169F1] focus:bg-white"
              />
            </div>
          </div>

          {/* Model License Notice */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 leading-relaxed space-y-1.5">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>Model Licensing & Terms Disclosure:</span>
            </div>
            <p>
              VitalRepo defaults to <strong>Qwen 2.5 (3B parameters)</strong>, created by the Qwen team and licensed under the permissive <strong>Apache 2.0 license</strong>.
              All inference executes on your local CPU or GPU; no repository code or metrics are sent to remote proprietary APIs.
            </p>
          </div>
        </div>

        {/* Save Changes Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isUpdating}
            className="px-6 py-2.5 bg-[#4169F1] text-white text-xs font-bold rounded-xl hover:bg-[#3355CC] transition-all flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>Save & Apply Settings</span>
          </button>
        </div>
      </form>

      {/* In-Memory Cache Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-500" />
            <span>In-Memory Request Cache</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            VitalRepo caches recent GitHub API queries for 15 minutes to conserve rate limits.
            Currently caching {systemHealth?.cache?.valid_cached_keys || 0} active repository records.
          </p>
        </div>

        <button
          onClick={handleClearCache}
          disabled={isClearingCache}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5 text-slate-500" />
          <span>Clear Cache</span>
        </button>
      </div>
    </div>
  );
};
