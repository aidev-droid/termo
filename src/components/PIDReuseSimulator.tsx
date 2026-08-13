import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, RefreshCw, AlertTriangle, Play, Lock } from 'lucide-react';
import { ActionResult } from '../types';

interface PIDReuseSimulatorProps {
  onExecuteAction: (target: any, simulatePidReuse?: boolean) => Promise<ActionResult>;
}

export const PIDReuseSimulator: React.FC<PIDReuseSimulatorProps> = ({ onExecuteAction }) => {
  const [testResult, setTestResult] = useState<ActionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunNormalTest = async () => {
    setIsRunning(true);
    setTestResult(null);

    const validTarget = {
      processId: 4820,
      creationTime: '2026-08-13T02:00:00.000Z',
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      applicationId: 'c:\\program files\\google\\chrome\\application\\chrome.exe',
      forceTerminate: false,
    };

    const res = await onExecuteAction(validTarget, false);
    setTestResult(res);
    setIsRunning(false);
  };

  const handleRunPidReuseAttack = async () => {
    setIsRunning(true);
    setTestResult(null);

    const recycledTarget = {
      processId: 4820,
      creationTime: '2026-08-13T02:00:00.000Z', // Original timestamp
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      applicationId: 'c:\\program files\\google\\chrome\\application\\chrome.exe',
      forceTerminate: true,
    };

    // Trigger PID reuse attack simulation
    const res = await onExecuteAction(recycledTarget, true);
    setTestResult(res);
    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">PID-Reuse Security Sandbox (TRD §22 & Threat T1)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tests mandatory target revalidation defense: never rely on PID alone. PID + CreationTime + ExecutablePath must match before any action.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Attack Scenario Explanation */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 text-xs text-slate-300">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" /> The PID Recycling Threat Vector (T1)
          </h3>

          <p className="leading-relaxed">
            On Windows, Process Identifiers (PIDs) are finite integers recycled by the OS kernel as soon as a process terminates.
            If a user selects PID 4820 in the UI, but that process exits and another application or malicious payload spawns with recycled PID 4820, a naive tool would terminate the wrong process.
          </p>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/80 space-y-2 font-mono">
            <div className="text-slate-400 font-bold">Resource Advisor Target Revalidation Formula:</div>
            <div className="text-emerald-400">
              Target Validated = (PID_now === PID_req) AND (CreationTime_now === CreationTime_req) AND (Path_now === Path_req)
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="font-bold text-white">Run Sandbox Tests:</h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRunNormalTest}
                disabled={isRunning}
                className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5" /> Test Valid Action (Matches All)
              </button>

              <button
                onClick={handleRunPidReuseAttack}
                disabled={isRunning}
                className="flex-1 py-2.5 px-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg shadow transition-colors flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-3.5 h-3.5" /> Simulate PID Reuse Attack
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Revalidation Result */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>Security Revalidation Engine Output</span>
              {testResult && (
                <span
                  className={`px-2.5 py-0.5 text-xs font-mono rounded-full ${
                    testResult.revalidationPassed
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {testResult.revalidationPassed ? 'PASSED' : 'BLOCKED BY DEFENSE'}
                </span>
              )}
            </h3>

            {isRunning && (
              <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                <span className="text-xs font-mono">Revalidating PID + CreationTime + ExecutablePath...</span>
              </div>
            )}

            {testResult && !isRunning && (
              <div className="space-y-3 mt-4 text-xs">
                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    testResult.revalidationPassed
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="font-bold flex items-center gap-2 text-sm">
                    {testResult.revalidationPassed ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-rose-400" />
                    )}
                    {testResult.message}
                  </div>
                  <p className="text-xs font-mono leading-relaxed opacity-90">{testResult.details}</p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1 text-slate-300">
                  <div>
                    <span className="text-slate-500">Result Code:</span>{' '}
                    <span className="text-amber-300 font-bold">{testResult.code}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Target PID:</span> {testResult.targetPid}
                  </div>
                  <div>
                    <span className="text-slate-500">PID Reuse Attack Detected:</span>{' '}
                    {testResult.isPidReused ? 'YES (ACTION SAFELY ABORTED)' : 'NO'}
                  </div>
                </div>
              </div>
            )}

            {!testResult && !isRunning && (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <Lock className="w-10 h-10 mx-auto text-slate-700" />
                <p className="text-xs">Click a test button on the left to run the PID revalidation engine.</p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-800 pt-3 text-[11px] text-slate-500 font-mono">
            Safety Guarantee: Zero accidental process terminations under PID recycling.
          </div>
        </div>
      </div>
    </div>
  );
};
