import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  HeartPulse,
  Users2,
  TrendingUp,
  Cpu,
  FileText,
  Settings,
  Activity,
  Bot,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useRepo } from '../../context/RepoContext';
import { DemoBadge } from '../common/DemoBadge';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentRepo, systemHealth } = useRepo();

  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/health', label: 'Repository Health', icon: HeartPulse },
    { to: '/dependencies', label: 'Maintainer Dependencies', icon: Users2 },
    { to: '/trends', label: 'Activity Trends', icon: TrendingUp },
    { to: '/simulator', label: 'Risk Simulator', icon: Cpu, badge: 'Signature' },
    { to: '/reports', label: 'Reports', icon: FileText },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const aiReady = systemHealth?.ollama_ai?.model_ready;
  const tokenSet = systemHealth?.github_api?.token_configured;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo and App Title */}
        <div>
          <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
            <NavLink to="/" onClick={onClose} className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#4169F1] flex items-center justify-center text-white shadow-sm shadow-[#4169F1]/30">
                <Activity className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-slate-900">
                  Vital<span className="text-[#4169F1]">Repo</span>
                </span>
                <span className="block text-[10px] text-slate-400 font-medium tracking-wide">
                  Ecosystem Sustainability
                </span>
              </div>
            </NavLink>
          </div>

          {/* Active Repo Snapshot */}
          {currentRepo && (
            <div className="px-4 py-3 mx-3 my-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Selected Repo
                </span>
                {currentRepo.is_demo && <DemoBadge size="sm" />}
              </div>
              <div className="font-bold text-xs text-slate-900 truncate" title={currentRepo.metadata.full_name}>
                {currentRepo.metadata.full_name}
              </div>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                <span className="flex items-center gap-0.5">
                  ★ {currentRepo.metadata.stars_count.toLocaleString()}
                </span>
                <span>•</span>
                <span className="font-medium text-emerald-600">
                  Health: {currentRepo.health.overall_score}/100
                </span>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#4169F1]/10 text-[#4169F1]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-[#4169F1] text-white">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* System Status Indicators at Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="flex items-center gap-1.5 text-[11px]">
              <Zap className="w-3.5 h-3.5 text-slate-400" />
              GitHub API
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                tokenSet
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
              title={systemHealth?.github_api?.rate_limit_tier}
            >
              {tokenSet ? '5k/hr (Token)' : '60/hr (Public)'}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-500">
            <span className="flex items-center gap-1.5 text-[11px]">
              <Bot className="w-3.5 h-3.5 text-slate-400" />
              Ollama AI
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                aiReady
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
              title={systemHealth?.ollama_ai?.message}
            >
              {aiReady ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Qwen Ready
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  Offline
                </>
              )}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
