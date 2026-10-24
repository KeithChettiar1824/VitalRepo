import React from 'react';
import { X, ExternalLink, Calculator, Calendar, Info, ShieldAlert } from 'lucide-react';
import type { SignalFinding } from '../../types';

interface EvidenceModalProps {
  finding: SignalFinding | null;
  onClose: () => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({ finding, onClose }) => {
  if (!finding) return null;

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'critical':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getSeverityStyle(
                  finding.severity
                )}`}
              >
                {finding.severity} attention
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {finding.analysis_period}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">{finding.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 text-sm text-slate-600">
          {/* Measured Value Callout */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Actual Measured Value
            </div>
            <div className="text-lg font-bold text-slate-900">{finding.measured_value}</div>
            <p className="mt-2 text-slate-600 leading-relaxed">{finding.explanation}</p>
          </div>

          {/* Formula */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              <Calculator className="w-3.5 h-3.5 text-[#4169F1]" />
              Calculation Formula & Logic
            </div>
            <div className="p-3 bg-slate-900 text-slate-100 font-mono text-xs rounded-lg overflow-x-auto select-all">
              {finding.formula}
            </div>
          </div>

          {/* Evidence Items & Direct GitHub Links */}
          {finding.evidence_items.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                <Info className="w-3.5 h-3.5 text-[#14B8A6]" />
                Supporting Data Points
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {finding.evidence_items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-slate-200 bg-white flex flex-col justify-between"
                  >
                    <span className="text-xs text-slate-500">{item.label}</span>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="font-semibold text-slate-900 truncate">{item.value}</span>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#4169F1] hover:text-[#3355CC] inline-flex items-center text-xs shrink-0"
                          title="View on GitHub"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Limitations and Disclaimers */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs leading-relaxed flex gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-950 mb-0.5">Measurement Limitations</div>
              <div>{finding.limitations}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-100 transition-colors shadow-xs"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
