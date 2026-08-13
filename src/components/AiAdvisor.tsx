import React, { useState } from 'react';
import { GroupedApplication } from '../types';
import { Bot, Sparkles, Send, ShieldAlert, Cpu, CheckCircle2, ArrowRight } from 'lucide-react';

interface AiAdvisorProps {
  applications: GroupedApplication[];
}

export const AiAdvisor: React.FC<AiAdvisorProps> = ({ applications }) => {
  const [selectedApp, setSelectedApp] = useState<GroupedApplication | null>(applications[0] || null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRunAiAnalysis = async (app?: GroupedApplication) => {
    const target = app || selectedApp;
    setIsAnalyzing(true);
    setErrorMsg(null);
    setAnalysis(null);

    try {
      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          processName: target ? target.displayName : 'Custom Query',
          publisher: target ? target.publisher : 'Unknown',
          category: target ? target.category : 'Unknown',
          path: target ? target.mainProcess.executablePath : '',
          workingSetMb: target ? Math.round(target.totalWorkingSetBytes / (1024 * 1024)) : 0,
          query: customPrompt || (target ? `Analyze security and resource impact for ${target.displayName}` : ''),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gemini API call failed');
      }

      setAnalysis(data.analysis);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">AI Process & Security Advisor (Gemini 3.6 Flash)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Server-side AI analysis inspecting process behavior, OS kernel role, security risk assessment, and resource optimization.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Select Candidate App or Prompt */}
        <div className="space-y-4 lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Select Candidate Process to Analyze
            </h3>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {applications.map((app) => (
                <button
                  key={app.id}
                  onClick={() => {
                    setSelectedApp(app);
                    handleRunAiAnalysis(app);
                  }}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between ${
                    selectedApp?.id === app.id
                      ? 'bg-purple-600/20 border-purple-500/50 text-white font-bold'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div>{app.displayName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{app.publisher}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                </button>
              ))}
            </div>
          </div>

          {/* Custom Question */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Ask AI Custom Process Question
            </h3>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. Is it safe to close svchost.exe instances in Windows?"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white outline-none focus:border-purple-500"
              rows={3}
            />
            <button
              onClick={() => handleRunAiAnalysis()}
              disabled={isAnalyzing}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {isAnalyzing ? 'Analyzing with Gemini AI...' : 'Ask AI Advisor'}
            </button>
          </div>
        </div>

        {/* Right Column: AI Output */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 min-h-[420px] flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <h3 className="text-sm font-bold text-white">
                    {selectedApp ? `AI Audit Analysis for "${selectedApp.displayName}"` : 'AI Advisor Output'}
                  </h3>
                </div>
                <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                  Gemini 3.6 Flash
                </span>
              </div>

              {isAnalyzing && (
                <div className="py-12 flex flex-col items-center justify-center space-y-3 text-purple-400">
                  <Cpu className="w-8 h-8 animate-spin" />
                  <p className="text-xs font-mono animate-pulse">
                    Evaluating process parameters, digital signatures, and Windows system dependencies...
                  </p>
                </div>
              )}

              {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl text-rose-300 text-xs space-y-2">
                  <div className="font-bold flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> AI Analysis Error
                  </div>
                  <p>{errorMsg}</p>
                </div>
              )}

              {analysis && !isAnalyzing && (
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                  {analysis}
                </div>
              )}

              {!analysis && !isAnalyzing && !errorMsg && (
                <div className="py-16 text-center text-slate-500 space-y-2">
                  <Bot className="w-12 h-12 mx-auto text-slate-700" />
                  <p className="text-xs">
                    Select a candidate process on the left or type a custom question to get AI-powered system advice.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 pt-3 text-[11px] text-slate-500 flex items-center justify-between font-mono">
              <span>Server-Side Gemini SDK Integration (`@google/genai`)</span>
              <span>Model: gemini-3.6-flash</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
