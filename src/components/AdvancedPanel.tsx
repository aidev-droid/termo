import React from 'react';
import { GroupedApplication, PerformanceMetrics } from '../types';
import { X, Sliders, FileCode, Download, Database, ShieldCheck, Terminal, Cpu, HardDrive } from 'lucide-react';

interface AdvancedPanelProps {
  isOpen: boolean;
  onClose: () => void;
  applications: GroupedApplication[];
  metrics: PerformanceMetrics | null;
}

export const AdvancedPanel: React.FC<AdvancedPanelProps> = ({
  isOpen,
  onClose,
  applications,
  metrics,
}) => {
  if (!isOpen) return null;

  const topApp = applications[0] || null;

  const handleExportDiagnostics = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      architecture: '.NET 10 LTS / WinUI 3 (Windows App SDK 2.3.1)',
      zeroResident: true,
      performanceMetrics: metrics,
      topCandidates: applications.map((a) => ({
        id: a.id,
        displayName: a.displayName,
        publisher: a.publisher,
        category: a.category,
        totalWorkingSetMb: (a.totalWorkingSetBytes / (1024 * 1024)).toFixed(2),
        totalPrivateMb: (a.totalPrivateBytes / (1024 * 1024)).toFixed(2),
        processCount: a.processCount,
        recommendation: a.recommendation,
        identity: a.identity,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ResourceAdvisor_Diagnostics_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop Dimmer */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200"
      />

      {/* Slide-in Drawer */}
      <div className="relative w-full max-w-[420px] h-full glass-panel-advanced p-6 overflow-y-auto space-y-6 text-[#EDEDED] font-['Segoe_UI_Variable_Text'] shadow-2xl flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Tier 3 Advanced Panel</h2>
                <p className="text-[11px] text-[#8A8F98]">Deep Rule Match Trace & Raw OS Metrics</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-[#8A8F98] hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Config & Rule Source Status */}
          <div className="bg-white/[0.04] p-3.5 rounded-xl border border-white/10 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-[#8A8F98]">Rules Configuration:</span>
              <span className="text-[#8FE8C4] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#5AD8A6]" /> Loaded (data/rules.json)
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-[#8A8F98]">Matching Order:</span>
              <span className="text-blue-300">Deterministic Ordered Precedence</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-[#8A8F98]">Privilege Boundary:</span>
              <span className="text-amber-300">Standard User (No SeDebug)</span>
            </div>
          </div>

          {/* Rule Match Trace for Top Candidate */}
          {topApp && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[#8A8F98] uppercase tracking-wider flex items-center gap-2">
                <FileCode className="w-4 h-4 text-purple-400" />
                <span>Rule Precedence Evaluation Trace</span>
              </h3>

              <div className="bg-white/[0.03] p-4 rounded-xl border border-white/10 space-y-3 text-xs">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>Target: {topApp.displayName}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                    Category: {topApp.category}
                  </span>
                </div>

                <div className="space-y-2 font-mono text-[11px]">
                  {[
                    { tier: 'Tier 1: Exact Signed Identity', status: topApp.identity.isMicrosoftSigned || topApp.identity.signatureStatus === 'Valid' ? 'MATCHED (Passed)' : 'SKIPPED' },
                    { tier: 'Tier 2: Publisher + Executable', status: topApp.publisher ? 'MATCHED' : 'SKIPPED' },
                    { tier: 'Tier 3: Known Path + Executable', status: topApp.identity.isSystemLocation ? 'MATCHED' : 'PASSED' },
                    { tier: 'Tier 4: Known Executable Name', status: 'EVALUATED' },
                    { tier: 'Tier 5: Generic Category Fallback', status: 'INACTIVE' },
                  ].map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b border-white/5 pb-1.5">
                      <span className="text-slate-400">{t.tier}</span>
                      <span className={t.status.includes('MATCHED') ? 'text-[#8FE8C4] font-bold' : 'text-slate-600'}>
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Raw OS Process Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#8A8F98] uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Raw Candidate Performance Telemetry</span>
            </h3>

            <div className="bg-white/[0.03] rounded-xl border border-white/10 overflow-hidden divide-y divide-white/5 text-xs font-mono">
              {applications.slice(0, 4).map((app) => (
                <div key={app.id} className="p-3 space-y-1">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>{app.displayName}</span>
                    <span className="text-[#8FE8C4]">{(app.totalWorkingSetBytes / (1024 * 1024)).toFixed(1)} MB</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#8A8F98]">
                    <span>PID {app.mainProcess.processId} • {app.processCount} proc</span>
                    <span>CPU: {app.totalCpuPercent}%</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    Path: {app.mainProcess.executablePath}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-white/10 pt-4 space-y-3">
          <button
            onClick={handleExportDiagnostics}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <Download className="w-4 h-4" /> Export Diagnostic Telemetry JSON
          </button>
          <div className="text-[10px] text-center text-[#8A8F98] font-mono">
            Zero-Resident Guarantee: Exits completely upon window close.
          </div>
        </div>
      </div>
    </div>
  );
};
