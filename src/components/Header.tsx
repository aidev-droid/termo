import React from 'react';
import { Activity, ShieldCheck, Zap, RefreshCw, Cpu, HardDrive, Sliders } from 'lucide-react';
import { PerformanceMetrics } from '../types';

interface HeaderProps {
  metrics: PerformanceMetrics | null;
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  onManualRefresh: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isRefreshing: boolean;
  onOpenAdvancedPanel: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  metrics,
  autoRefresh,
  onToggleAutoRefresh,
  onManualRefresh,
  activeTab,
  onSelectTab,
  isRefreshing,
  onOpenAdvancedPanel,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0d1117]/80 backdrop-blur-md border-b border-white/10 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Navbar Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-[#0d1117] rounded-[7px] flex items-center justify-center">
                <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold tracking-tight text-[#EDEDED] font-['Segoe_UI_Variable_Display']">
                  Resource Advisor
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-500/15 text-[#8FE8C4] border border-emerald-500/30 rounded-full flex items-center gap-1 glass-pill">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5AD8A6]" />
                  Zero-Resident V1
                </span>
              </div>
              <p className="text-[11px] text-[#8A8F98]">
                Windows Process & System Resource Advisor • Glass Sentinel Architecture
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 text-xs bg-white/[0.04] backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 font-mono">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[#8A8F98]">Snapshot:</span>
              <span className="text-[#8FE8C4] font-semibold">{metrics ? `${metrics.totalSnapshotMs} ms` : '--'}</span>
            </div>
            <div className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-1.5 text-slate-300">
              <HardDrive className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[#8A8F98]">Total RAM:</span>
              <span className="text-purple-300 font-semibold">{metrics ? `${metrics.peakWorkingSetMb} MB` : '--'}</span>
            </div>
            <div className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-1.5 text-slate-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[#8A8F98]">Top-K:</span>
              <span className="text-amber-300 font-semibold">{metrics ? `${metrics.topKCount} Apps` : '--'}</span>
            </div>
          </div>

          {/* Refresh & Advanced Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleAutoRefresh}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
                autoRefresh
                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/30 hover:bg-blue-500/25'
                  : 'bg-white/[0.05] text-[#8A8F98] border-white/10 hover:bg-white/[0.08]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-blue-400 animate-ping' : 'bg-slate-500'}`} />
              Auto-Refresh (3s)
            </button>

            <button
              onClick={onManualRefresh}
              disabled={isRefreshing}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Snapshot Now
            </button>

            <button
              onClick={onOpenAdvancedPanel}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-[#D6D6D6] border border-white/10 transition-all flex items-center gap-1.5"
              title="Open Tier 3 Advanced Slide-in Panel"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              Advanced
            </button>
          </div>
        </div>

        {/* Tab Navigation Row */}
        <nav className="flex space-x-1 overflow-x-auto py-2 text-xs font-medium">
          {[
            { id: 'quickview', label: 'Quick View (Bento Grid)' },
            { id: 'rules', label: 'Rule Engine (rules.json)' },
            { id: 'ai', label: 'AI Process Advisor' },
            { id: 'pidreuse', label: 'PID-Reuse Security Sandbox' },
            { id: 'diagnostics', label: 'Performance Diagnostics' },
            { id: 'milestones', label: 'Antigravity Milestones' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white border border-white/15 font-semibold shadow-sm'
                  : 'text-[#8A8F98] hover:text-[#EDEDED] hover:bg-white/[0.05]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};
