import React, { useState } from 'react';
import { GroupedApplication, ActionTarget, ActionResult } from '../types';
import { ShieldCheck, AlertTriangle, ShieldAlert, HelpCircle, Layers, Cpu, ChevronRight, X, AlertOctagon, CheckCircle2, Lock } from 'lucide-react';

interface QuickViewProps {
  applications: GroupedApplication[];
  onSelectAppForDetails: (app: GroupedApplication) => void;
  onExecuteAction: (target: ActionTarget, simulatePidReuse?: boolean) => Promise<ActionResult>;
  isProcessingAction: boolean;
}

export const QuickView: React.FC<QuickViewProps> = ({
  applications,
  onSelectAppForDetails,
  onExecuteAction,
  isProcessingAction,
}) => {
  const [selectedActionApp, setSelectedActionApp] = useState<GroupedApplication | null>(null);
  const [actionType, setActionType] = useState<'GracefulClose' | 'ForceTerminate'>('GracefulClose');
  const [simulatePidReuse, setSimulatePidReuse] = useState(false);
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);
  const [metricMode, setMetricMode] = useState<'workingset' | 'private'>('workingset');
  const [pageIndex, setPageIndex] = useState(0);

  const itemsPerPage = 4;
  const totalPages = Math.ceil(applications.length / itemsPerPage) || 1;
  const visibleApps = applications.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage);

  const heroApp = visibleApps[0] || null;
  const secondaryApps = visibleApps.slice(1, 4);

  const handleOpenActionModal = (app: GroupedApplication, type: 'GracefulClose' | 'ForceTerminate') => {
    setSelectedActionApp(app);
    setActionType(type);
    setSimulatePidReuse(false);
    setActionResult(null);
  };

  const handleConfirmAction = async () => {
    if (!selectedActionApp) return;

    const target: ActionTarget = {
      processId: selectedActionApp.mainProcess.processId,
      creationTime: selectedActionApp.mainProcess.creationTime,
      executablePath: selectedActionApp.mainProcess.executablePath,
      applicationId: selectedActionApp.id,
      forceTerminate: actionType === 'ForceTerminate',
    };

    const res = await onExecuteAction(target, simulatePidReuse);
    setActionResult(res);
  };

  // Helper for app family monogram gradients
  const getAppIconGradient = (app: GroupedApplication) => {
    const name = app.displayName.toLowerCase();
    const cat = app.category.toLowerCase();

    if (name.includes('chrome') || name.includes('edge') || name.includes('firefox') || name.includes('browser') || cat.includes('browser')) {
      return 'linear-gradient(135deg, #4A90E2, #357ABD)';
    }
    if (name.includes('zoom') || name.includes('teams') || name.includes('slack') || name.includes('discord') || cat.includes('communication')) {
      return 'linear-gradient(135deg, #F2A65A, #D97D3D)';
    }
    if (name.includes('defender') || name.includes('system') || name.includes('svchost') || cat.includes('system')) {
      return 'linear-gradient(135deg, #5A6B7A, #3D4A56)';
    }
    if (name.includes('code') || name.includes('visual') || name.includes('studio') || cat.includes('developer')) {
      return 'linear-gradient(135deg, #9B51E0, #702EB8)';
    }
    return 'linear-gradient(135deg, #3A4750, #222831)';
  };

  const getMonogramText = (displayName: string) => {
    const words = displayName.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  };

  const formatRAMDisplay = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb >= 1000) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${Math.round(mb)} MB`;
  };

  // Trust pill renderer
  const renderTrustPill = (level: string) => {
    switch (level) {
      case 'Green':
        return (
          <div className="inline-flex items-center gap-1.5 bg-[#5AD8A6]/15 border border-[#5AD8A6]/30 rounded-full px-2.5 py-0.5 glass-pill">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5AD8A6]" />
            <span className="text-[10px] text-[#8FE8C4] font-medium">Safe to close</span>
          </div>
        );
      case 'Yellow':
        return (
          <div className="inline-flex items-center gap-1.5 bg-[#F2C55A]/15 border border-[#F2C55A]/30 rounded-full px-2.5 py-0.5 glass-pill">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F2C55A]" />
            <span className="text-[10px] text-[#F2D89A] font-medium">Check first</span>
          </div>
        );
      case 'Red':
        return (
          <div className="inline-flex items-center gap-1.5 bg-[#E65A5A]/15 border border-[#E65A5A]/30 rounded-full px-2.5 py-0.5 glass-pill">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E65A5A]" />
            <span className="text-[10px] text-[#F2A8A8] font-medium">Protected</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-1.5 bg-[#9A9AA5]/15 border border-[#9A9AA5]/25 rounded-full px-2.5 py-0.5 glass-pill">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9A9AA5]" />
            <span className="text-[10px] text-[#C4C4CC] font-medium">Unclassified</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4 font-['Segoe_UI_Variable_Text']">
      {/* Bento Grid (3-column layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* HERO CELL (Top Consumer) - Spans 2 rows on large screens */}
        {heroApp ? (
          <div className="lg:row-span-2 glass-card-hero p-4 flex flex-col justify-between border border-white/12 hover:border-white/20 transition-all group">
            <div className="space-y-4">
              {/* Header row */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-md"
                    style={{ background: getAppIconGradient(heroApp) }}
                  >
                    {getMonogramText(heroApp.displayName)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#F2F2F2] tracking-tight">{heroApp.displayName}</h3>
                    <p className="text-[11px] text-[#8A8F98]">
                      {heroApp.processCount} {heroApp.processCount === 1 ? 'process' : 'processes'} • PID {heroApp.mainProcess.processId}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onSelectAppForDetails(heroApp)}
                  className="text-[#8A8F98] hover:text-white transition-colors p-1"
                  title="Expand into Tier 2 Details"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* RAM Metric Display */}
              <div className="space-y-2 pt-2">
                <div className="text-2xl font-semibold text-[#F5F5F5] font-['Segoe_UI_Variable_Display']">
                  {formatRAMDisplay(metricMode === 'workingset' ? heroApp.totalWorkingSetBytes : heroApp.totalPrivateBytes)}
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(15, (heroApp.totalWorkingSetBytes / (1024 * 1024 * 1024)) * 40))}%`,
                      backgroundColor: heroApp.recommendation.level === 'Green' ? '#5AD8A6' : heroApp.recommendation.level === 'Yellow' ? '#F2C55A' : '#E65A5A',
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#8A8F98]">
                  <span>{heroApp.category}</span>
                  <span>CPU: {heroApp.totalCpuPercent}%</span>
                </div>
              </div>

              {/* Recommendation Explanation preview */}
              <div className="text-xs text-[#D6D6D6] bg-black/20 p-2.5 rounded-lg border border-white/5 leading-relaxed">
                {heroApp.recommendation.explanation}
              </div>
            </div>

            {/* Bottom Trust Pill & Action Row */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              {renderTrustPill(heroApp.recommendation.level)}

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onSelectAppForDetails(heroApp)}
                  className="px-2.5 py-1 text-[11px] font-medium text-[#D6D6D6] hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all"
                >
                  Details
                </button>
                {heroApp.recommendation.canClose && (
                  <button
                    onClick={() => handleOpenActionModal(heroApp, 'GracefulClose')}
                    className="px-2.5 py-1 text-[11px] font-medium text-[#8FE8C4] bg-[#5AD8A6]/15 hover:bg-[#5AD8A6]/25 border border-[#5AD8A6]/30 rounded-lg transition-all"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card p-6 text-center text-[#8A8F98] text-xs">No process data available.</div>
        )}

        {/* SECONDARY BENTO CELLS (2nd, 3rd, 4th Candidates) */}
        {secondaryApps.map((app) => (
          <div
            key={app.id}
            className="glass-card p-3.5 flex flex-col justify-between group cursor-pointer"
            onClick={() => onSelectAppForDetails(app)}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] text-white"
                    style={{ background: getAppIconGradient(app) }}
                  >
                    {getMonogramText(app.displayName)}
                  </div>
                  <h4 className="text-xs font-semibold text-[#F2F2F2] truncate max-w-[140px]">
                    {app.displayName}
                  </h4>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#8A8F98] group-hover:text-white transition-colors" />
              </div>

              <div className="text-lg font-semibold text-[#F2F2F2]">
                {formatRAMDisplay(metricMode === 'workingset' ? app.totalWorkingSetBytes : app.totalPrivateBytes)}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-white/5 mt-2">
              {renderTrustPill(app.recommendation.level)}
              <span className="text-[10px] text-[#8A8F98] font-mono">PID {app.mainProcess.processId}</span>
            </div>
          </div>
        ))}
      </div>

      {/* WIDE EVIDENCE STRIP */}
      {heroApp && (
        <div className="glass-card p-3 px-4 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-[#8A8F98] uppercase tracking-wider">EVIDENCE:</span>
            <div className="flex flex-wrap items-center gap-2 text-[#D6D6D6]">
              {heroApp.recommendation.evidence.map((ev, i) => (
                <span key={i} className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/10 text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-[#5AD8A6]" />
                  {ev}
                </span>
              ))}
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[#5AD8A6] font-mono text-[11px] shrink-0">
            <ShieldCheck className="w-4 h-4" />
            <span>Deterministic Safety Verified</span>
          </div>
        </div>
      )}

      {/* TOOLBAR & PAGINATION */}
      <div className="glass-card p-2.5 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8A8F98]">
        {/* Metric Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[11px]">Show Metric:</span>
          <button
            onClick={() => setMetricMode('workingset')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              metricMode === 'workingset'
                ? 'bg-white/15 text-white font-semibold'
                : 'hover:bg-white/5 text-[#8A8F98]'
            }`}
          >
            Working Set RAM
          </button>
          <button
            onClick={() => setMetricMode('private')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              metricMode === 'private'
                ? 'bg-white/15 text-white font-semibold'
                : 'hover:bg-white/5 text-[#8A8F98]'
            }`}
          >
            Private Bytes
          </button>
        </div>

        {/* Pagination Dots */}
        <div className="flex items-center gap-2">
          <span className="text-[11px]">Display Candidates ({applications.length}):</span>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setPageIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  pageIndex === idx ? 'bg-[#4A90E2] w-4' : 'bg-white/20 hover:bg-white/40'
                }`}
                title={`Page ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Zero-Resident Promise note */}
        <div className="text-[10px] text-[#6B7078] font-mono">
          Zero-Resident: Transient glance overlay
        </div>
      </div>

      {/* PROCESS ACTION & PID REVALIDATION CONFIRMATION MODAL */}
      {selectedActionApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0d1117] border border-white/15 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-[#EDEDED] font-['Segoe_UI_Variable_Text']">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 font-bold">
                <AlertOctagon className="w-5 h-5 text-amber-400" />
                <span>Confirm Process Action — Target Revalidation</span>
              </div>
              <button
                onClick={() => setSelectedActionApp(null)}
                className="text-[#8A8F98] hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-black/30 p-3.5 rounded-xl border border-white/10 font-mono space-y-1 text-slate-300">
                <div>
                  <span className="text-[#8A8F98]">Target App:</span>{' '}
                  <span className="text-white font-bold">{selectedActionApp.displayName}</span>
                </div>
                <div>
                  <span className="text-[#8A8F98]">Main PID:</span>{' '}
                  <span className="text-amber-300">{selectedActionApp.mainProcess.processId}</span>
                </div>
                <div>
                  <span className="text-[#8A8F98]">Creation Time:</span>{' '}
                  <span className="text-slate-300">{selectedActionApp.mainProcess.creationTime}</span>
                </div>
                <div className="truncate">
                  <span className="text-[#8A8F98]">Executable Path:</span>{' '}
                  <span className="text-slate-300">{selectedActionApp.mainProcess.executablePath}</span>
                </div>
              </div>

              {/* Consequence Warning */}
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-amber-300 leading-relaxed">
                <span className="font-bold">Consequence:</span> {selectedActionApp.recommendation.consequence}
              </div>

              {/* Simulation Sandbox Checkbox for PID Recycling */}
              <label className="flex items-center gap-2.5 bg-black/40 p-3 rounded-xl border border-white/10 cursor-pointer hover:border-white/20 transition-all">
                <input
                  type="checkbox"
                  checked={simulatePidReuse}
                  onChange={(e) => setSimulatePidReuse(e.target.checked)}
                  className="rounded border-white/20 text-blue-600 focus:ring-blue-500 bg-slate-900"
                />
                <span className="text-xs text-slate-300">
                  Simulate PID Reuse Attack / Recycling (Tests safety defense mechanism)
                </span>
              </label>

              {/* Action Result Box */}
              {actionResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                    actionResult.success
                      ? 'bg-[#5AD8A6]/15 border-[#5AD8A6]/30 text-[#8FE8C4]'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="font-bold">{actionResult.message}</div>
                  <div className="text-[11px] opacity-90 mt-1 font-mono">{actionResult.details}</div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
              <button
                onClick={() => setSelectedActionApp(null)}
                className="px-4 py-2 text-xs font-medium text-[#8A8F98] hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
              >
                Close
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={isProcessingAction}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-xl transition-all shadow-md ${
                  actionType === 'ForceTerminate'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                    : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                }`}
              >
                {isProcessingAction ? 'Revalidating Target...' : `Execute ${actionType}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
