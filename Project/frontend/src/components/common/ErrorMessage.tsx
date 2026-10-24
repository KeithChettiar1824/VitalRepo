import React from 'react';
import { AlertTriangle, RefreshCw, Database, Key } from 'lucide-react';
import { useRepo } from '../../context/RepoContext';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  const { loadDemo, clearError } = useRepo();
  const isRateLimit = message.toLowerCase().includes('rate limit');

  return (
    <div className="bg-white rounded-2xl border border-red-200 p-8 shadow-sm max-w-2xl mx-auto my-8">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-red-100 rounded-xl text-red-600 shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-3 flex-1">
          <h3 className="text-lg font-bold text-slate-900">Analysis Request Failed</h3>
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>

          {isRateLimit && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2">
              <div className="font-semibold flex items-center gap-1.5 text-amber-950">
                <Key className="w-4 h-4 text-amber-600" />
                GitHub API Rate Limits
              </div>
              <p>
                Unauthenticated requests to the GitHub API are limited to 60 requests per hour per IP.
                You can configure a GitHub Personal Access Token in the Settings page to unlock 5,000 requests per hour.
              </p>
            </div>
          )}

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-[#4169F1] text-white text-xs font-semibold rounded-lg hover:bg-[#3355CC] transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Try Again
              </button>
            )}
            <button
              onClick={() => {
                clearError();
                loadDemo();
              }}
              className="px-4 py-2 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Database className="w-3.5 h-3.5" />
              Load Curated Demo Data
            </button>
            <button
              onClick={clearError}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-200 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
