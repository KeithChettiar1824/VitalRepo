import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  ChevronRight,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { useRepo } from '../../context/RepoContext';
import { DemoBadge } from '../common/DemoBadge';

interface TopNavbarProps {
  onOpenSidebar: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenSidebar }) => {
  const { currentRepo, periodDays, setPeriodDays, analyze, isLoading } = useRepo();
  const [quickInput, setQuickInput] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/':
        return 'Overview';
      case '/health':
        return 'Repository Health';
      case '/dependencies':
        return 'Maintainer Dependencies';
      case '/trends':
        return 'Activity Trends';
      case '/simulator':
        return 'Risk Simulator';
      case '/reports':
        return 'Reports';
      case '/settings':
        return 'Settings';
      default:
        return 'Dashboard';
    }
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickInput.trim()) {
      analyze(quickInput.trim());
      setQuickInput('');
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile trigger & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="font-semibold text-slate-900 hidden sm:inline">VitalRepo</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
          {currentRepo ? (
            <>
              <span className="text-slate-600 font-medium truncate max-w-[140px] sm:max-w-[200px]">
                {currentRepo.metadata.name}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </>
          ) : null}
          <span className="font-bold text-[#4169F1]">{getPageTitle(location.pathname)}</span>
        </div>
      </div>

      {/* Right: Quick Search, Period Selector, Repo Link, Demo Tag */}
      <div className="flex items-center gap-3">
        {/* Quick Search */}
        <form onSubmit={handleQuickSubmit} className="relative hidden md:block">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Analyze owner/repo..."
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            disabled={isLoading}
            className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#4169F1] focus:bg-white w-48 lg:w-64 transition-all"
          />
        </form>

        {/* Observation Period Selector */}
        {currentRepo && (
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1 hidden sm:inline" />
            {[30, 90, 180].map((days) => (
              <button
                key={days}
                onClick={() => setPeriodDays(days)}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  periodDays === days
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
        )}

        {/* Demo Indicator */}
        {currentRepo?.is_demo && (
          <div className="hidden sm:block">
            <DemoBadge size="sm" />
          </div>
        )}

        {/* GitHub External Link */}
        {currentRepo && (
          <a
            href={currentRepo.metadata.html_url}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span>GitHub</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        )}
      </div>
    </header>
  );
};
