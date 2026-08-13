import React from 'react';
import { GroupedApplication } from '../types';
import { X, ShieldCheck, CheckCircle2, FolderCheck, AppWindow, Cpu, HardDrive, Database, ShieldAlert } from 'lucide-react';

interface DetailsViewProps {
  app: GroupedApplication | null;
  onClose: () => void;
}

export const DetailsView: React.FC<DetailsViewProps> = ({ app, onClose }) => {
  if (!app) return null;

  const formatRAMDisplay = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb >= 1000) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${Math.round(mb)} MB`;
  };

  // Helper for trust pill badge
  const renderTrustPill = (level: string) => {
    switch (level) {
      case 'Green':
        return (
          <div className="inline-flex items-center gap-1.5 bg-[#5AD8A6]/15 border border-[#5AD8A6]/30 rounded-full px-3 py-1 glass-pill">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5AD8A6]" />
            <span className="text-xs text-[#8FE8C4] font-medium">Safe to close</span>
          </div>
        );
      case 'Yellow':
        return (
          <div className="inline-flex items-center gap-1.5 bg-[#F2C55A]/15 border border-[#F2C55A]/30 rounded-full px-3 py-1 glass-pill">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F2C55A]" />
            <span className="text-xs text-[#F2D89A] font-medium">Check first</span>
          </div>
        );
      case 'Red':
        return (
          <div className="inline-flex items-center gap-1.5 bg-[#E65A5A]/15 border border-[#E65A5A]/30 rounded-full px-3 py-1 glass-pill">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E65A5A]" />
            <span className="text-xs text-[#F2A8A8] font-medium">Protected</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-1.5 bg-[#9A9AA5]/15 border border-[#9A9AA5]/25 rounded-full px-3 py-1 glass-pill">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9A9AA5]" />
            <span className="text-xs text-[#C4C4CC] font-medium">Unclassified</span>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0d1117]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0d1117] border border-white/12 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4 text-[#EDEDED] font-['Segoe_UI_Variable_Text']">
        {/* Top Header Row */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-[#8A8F98] hover:text-white transition-colors p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-semibold text-[#EDEDED] font-['Segoe_UI_Variable_Display']">
              {app.displayName} — details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#8A8F98] hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Two-Column Glass Layout: Evidence (Left) | Process Tree (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* LEFT COLUMN: EVIDENCE LIST */}
          <div className="glass-card p-4 space-y-3">
            <div className="text-[10px] font-bold text-[#8A8F98] uppercase tracking-wider">EVIDENCE</div>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#5AD8A6] shrink-0" />
                <span className="text-xs text-[#D6D6D6]">Signed by {app.publisher}</span>
              </div>
              <div className="flex items-center gap-2">
                <FolderCheck className="w-4 h-4 text-[#5AD8A6] shrink-0" />
                <span className="text-xs text-[#D6D6D6]">
                  {app.identity.isSystemLocation ? 'Located in System Directory' : 'Path under Program Files'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#5AD8A6] shrink-0" />
                <span className="text-xs text-[#D6D6D6]">
                  {app.identity.isProtected ? 'Protected Access Boundary' : 'Known user application'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AppWindow className="w-4 h-4 text-[#5AD8A6] shrink-0" />
                <span className="text-xs text-[#D6D6D6]">
                  {app.mainProcess.mainWindowHandle ? 'Has visible main window' : 'Background process family'}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: PROCESS TREE */}
          <div className="glass-card p-4 space-y-3 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold text-[#8A8F98] uppercase tracking-wider mb-2">PROCESS TREE</div>
              <div className="font-['Cascadia_Code',Consolas,monospace] text-xs text-[#B8BCC2] space-y-1.5">
                <div className="font-semibold text-white">
                  {app.mainProcess.executablePath.split('\\').pop() || 'process.exe'}{' '}
                  <span className="text-[#6B7078]">· PID {app.mainProcess.processId}</span>
                </div>
                {app.processes.slice(1, 4).map((p, idx) => (
                  <div key={p.processId} className="pl-3 text-[11px] text-[#B8BCC2]">
                    ↳ {p.executablePath.split('\\').pop()} ({idx === 0 ? 'GPU' : idx === 1 ? 'Tab' : 'Worker'}){' '}
                    <span className="text-[#6B7078]">· PID {p.processId}</span>
                  </div>
                ))}
                {app.processes.length > 4 && (
                  <div className="pl-3 text-[10px] text-[#6B7078]">
                    + {app.processes.length - 4} additional child process(es)
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 text-[10px] text-[#8A8F98] font-mono">
              Created {app.mainProcess.creationTime.split('T')[1]?.slice(0, 8) || '09:14:02'} · grouped by publisher + path
            </div>
          </div>

          {/* FULL-WIDTH METRICS STRIP */}
          <div className="md:col-span-2 glass-card p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-[9px] font-bold text-[#8A8F98] uppercase tracking-wider mb-0.5">WORKING SET</div>
                <div className="text-base font-semibold text-[#F2F2F2] font-['Segoe_UI_Variable_Display']">
                  {formatRAMDisplay(app.totalWorkingSetBytes)}
                </div>
              </div>

              <div>
                <div className="text-[9px] font-bold text-[#8A8F98] uppercase tracking-wider mb-0.5">PRIVATE BYTES</div>
                <div className="text-base font-semibold text-[#F2F2F2] font-['Segoe_UI_Variable_Display']">
                  {formatRAMDisplay(app.totalPrivateBytes)}
                </div>
              </div>

              <div>
                <div className="text-[9px] font-bold text-[#8A8F98] uppercase tracking-wider mb-0.5">CPU</div>
                <div className="text-base font-semibold text-[#F2F2F2] font-['Segoe_UI_Variable_Display']">
                  {app.totalCpuPercent}%
                </div>
              </div>
            </div>

            <div>{renderTrustPill(app.recommendation.level)}</div>
          </div>
        </div>

        {/* ACTION BAR */}
        <div className="flex items-center gap-3 pt-2">
          {app.recommendation.canClose ? (
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#5AD8A6]/15 hover:bg-[#5AD8A6]/25 border border-[#5AD8A6]/30 text-[#8FE8C4] font-medium text-xs transition-all text-center shadow-md shadow-[#5AD8A6]/10"
            >
              Close
            </button>
          ) : (
            <div className="flex-1 py-2.5 px-4 rounded-xl bg-[#E65A5A]/15 border border-[#E65A5A]/30 text-[#F2A8A8] font-medium text-xs text-center flex items-center justify-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#E65A5A]" /> Protected System Process (Close Action Disabled)
            </div>
          )}

          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#8A8F98] hover:text-white font-medium text-xs transition-all text-center"
          >
            View in Task Manager
          </button>
        </div>
      </div>
    </div>
  );
};
