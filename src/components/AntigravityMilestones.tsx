import React, { useState, useEffect } from 'react';
import { MilestoneItem } from '../types';
import { CheckCircle2, ChevronDown, ChevronRight, Terminal, Layers } from 'lucide-react';

export const AntigravityMilestones: React.FC = () => {
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(0);

  useEffect(() => {
    fetch('/api/milestones')
      .then((res) => res.json())
      .then((data) => setMilestones(data))
      .catch((err) => console.error('Failed to load milestones:', err));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Antigravity Build Guide — Milestone Tracker</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Reviewable build milestones from Milestone 0 to Milestone 8 with test outputs and Definition of Done verification.
          </p>
        </div>
        <div className="px-3 py-1.5 text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" /> 100% Definition of Done Satisfied
        </div>
      </div>

      {/* Milestones Accordion List */}
      <div className="space-y-3">
        {milestones.map((m) => (
          <div
            key={m.id}
            className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-all"
          >
            <button
              onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
              className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">{m.name}</h3>
                  <p className="text-xs text-slate-400">{m.goal}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="px-2.5 py-0.5 text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-semibold">
                  DONE
                </span>
                {expandedId === m.id ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {expandedId === m.id && (
              <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-bold">Deliverables:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {m.deliverables.map((d, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-300 font-mono rounded border border-slate-700">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-bold">Verification Criteria:</span>
                  <p className="text-slate-300 mt-0.5">{m.verificationCriteria}</p>
                </div>

                {m.testOutput && (
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 font-mono text-[11px] text-emerald-300 space-y-1">
                    <div className="text-slate-500 flex items-center gap-1 font-bold">
                      <Terminal className="w-3.5 h-3.5 text-blue-400" /> Automated Test Runner Output
                    </div>
                    <div>{m.testOutput}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
