import React, { useState } from 'react';
import { RulesConfig, Rule, MatchType, ClosePolicy } from '../types';
import { FileJson, Plus, ShieldCheck, AlertTriangle, XCircle, Search, Save, Check } from 'lucide-react';

interface RulesManagerProps {
  rulesConfig: RulesConfig | null;
  onSaveRules: (newConfig: RulesConfig) => Promise<void>;
  isSaving: boolean;
}

export const RulesManager: React.FC<RulesManagerProps> = ({
  rulesConfig,
  onSaveRules,
  isSaving,
}) => {
  const [rulesList, setRulesList] = useState<Rule[]>(rulesConfig?.identities || []);
  const [testFileName, setTestFileName] = useState('chrome.exe');
  const [testPublisher, setTestPublisher] = useState('Google LLC');
  const [testResult, setTestResult] = useState<Rule | null>(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRule, setNewRule] = useState<Partial<Rule>>({
    id: `rule-custom-${Date.now()}`,
    matchType: 'PublisherAndFileName',
    publisher: '',
    fileName: '',
    path: '',
    displayName: '',
    category: 'User Utility',
    closePolicy: 'UserApplication',
    impact: 'Application process will close.',
    priority: 100,
  });

  const handleTestRule = () => {
    if (!rulesList) return;

    // Ordered precedence matching simulation
    const sorted = [...rulesList].sort((a, b) => b.priority - a.priority);
    const matched = sorted.find((r) => {
      if (r.fileName.toLowerCase() === testFileName.toLowerCase()) {
        if (r.publisher && testPublisher) {
          return testPublisher.toLowerCase().includes(r.publisher.toLowerCase());
        }
        return true;
      }
      return false;
    });

    setTestResult(matched || null);
  };

  const handleAddRule = async () => {
    if (!newRule.fileName || !newRule.displayName) return;

    const createdRule: Rule = {
      id: newRule.id || `rule-${Date.now()}`,
      matchType: (newRule.matchType as MatchType) || 'PublisherAndFileName',
      publisher: newRule.publisher || 'Unknown Publisher',
      fileName: newRule.fileName,
      path: newRule.path || '',
      displayName: newRule.displayName,
      category: newRule.category || 'General Application',
      closePolicy: (newRule.closePolicy as ClosePolicy) || 'UserApplication',
      impact: newRule.impact || 'Process will terminate.',
      priority: Number(newRule.priority) || 100,
    };

    const updatedList = [createdRule, ...rulesList];
    setRulesList(updatedList);
    setIsAddModalOpen(false);

    await onSaveRules({
      version: rulesConfig?.version || '1.0.0',
      identities: updatedList,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Rule Engine Configuration (rules.json)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic rule matching with precedence order: Exact Signed &gt; Publisher + Executable &gt; Known Path &gt; Executable Name &gt; Generic.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-md flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Rule
        </button>
      </div>

      {/* Interactive Rule Tester */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-400" /> Test Rule Matching Precedence Simulator
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-mono">Executable Name</label>
            <input
              type="text"
              value={testFileName}
              onChange={(e) => setTestFileName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono focus:border-blue-500 outline-none"
              placeholder="e.g. chrome.exe"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-mono">Publisher Name</label>
            <input
              type="text"
              value={testPublisher}
              onChange={(e) => setTestPublisher(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono focus:border-blue-500 outline-none"
              placeholder="e.g. Google LLC"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleTestRule}
              className="w-full py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              Run Match Simulation
            </button>
          </div>
        </div>

        {testResult && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-lg text-xs font-mono space-y-1">
            <div className="text-emerald-300 font-bold flex items-center gap-1">
              <Check className="w-4 h-4" /> Matched Rule ID: {testResult.id}
            </div>
            <div className="text-slate-300">
              Display Name: <span className="text-white font-bold">{testResult.displayName}</span> • Policy:{' '}
              <span className="text-amber-300">{testResult.closePolicy}</span> • Priority: {testResult.priority}
            </div>
            <div className="text-slate-400 text-[11px]">{testResult.impact}</div>
          </div>
        )}
      </div>

      {/* Rules Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Active Rule Definitions ({rulesList.length})</h3>
          <span className="text-xs font-mono text-slate-400">Higher Priority Number = Evaluated First</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="p-3">Priority</th>
                <th className="p-3">Display Name / Category</th>
                <th className="p-3">Match Type</th>
                <th className="p-3">Executable & Publisher</th>
                <th className="p-3">Close Policy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {rulesList.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-bold text-blue-400">{rule.priority}</td>
                  <td className="p-3">
                    <div className="text-white font-bold">{rule.displayName}</div>
                    <div className="text-slate-500 text-[11px]">{rule.category}</div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 text-[11px] bg-slate-800 rounded border border-slate-700 text-slate-300">
                      {rule.matchType}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="text-slate-200">{rule.fileName}</div>
                    <div className="text-slate-500 text-[11px]">{rule.publisher || 'Any Publisher'}</div>
                  </td>
                  <td className="p-3">
                    {rule.closePolicy === 'ProtectedSystem' && (
                      <span className="px-2 py-0.5 text-[11px] bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded flex items-center gap-1 w-fit">
                        <XCircle className="w-3 h-3" /> Protected System
                      </span>
                    )}
                    {rule.closePolicy === 'CautionRequired' && (
                      <span className="px-2 py-0.5 text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3" /> Caution Required
                      </span>
                    )}
                    {rule.closePolicy === 'UserApplication' && (
                      <span className="px-2 py-0.5 text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded flex items-center gap-1 w-fit">
                        <ShieldCheck className="w-3 h-3" /> User Application
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Custom Rule Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2">Add New Rule to rules.json</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Display Name</label>
                <input
                  type="text"
                  value={newRule.displayName}
                  onChange={(e) => setNewRule({ ...newRule, displayName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                  placeholder="e.g. Slack Desktop"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono">Executable File Name</label>
                <input
                  type="text"
                  value={newRule.fileName}
                  onChange={(e) => setNewRule({ ...newRule, fileName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono outline-none focus:border-blue-500"
                  placeholder="e.g. slack.exe"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono">Publisher Name</label>
                <input
                  type="text"
                  value={newRule.publisher}
                  onChange={(e) => setNewRule({ ...newRule, publisher: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono outline-none focus:border-blue-500"
                  placeholder="e.g. Slack Technologies"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Match Type</label>
                  <select
                    value={newRule.matchType}
                    onChange={(e) => setNewRule({ ...newRule, matchType: e.target.value as MatchType })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none"
                  >
                    <option value="PublisherAndFileName">PublisherAndFileName</option>
                    <option value="ExactSigned">ExactSigned</option>
                    <option value="KnownPathAndFileName">KnownPathAndFileName</option>
                    <option value="KnownExecutableName">KnownExecutableName</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Close Policy</label>
                  <select
                    value={newRule.closePolicy}
                    onChange={(e) => setNewRule({ ...newRule, closePolicy: e.target.value as ClosePolicy })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none"
                  >
                    <option value="UserApplication">UserApplication (Green)</option>
                    <option value="CautionRequired">CautionRequired (Yellow)</option>
                    <option value="ProtectedSystem">ProtectedSystem (Red)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Impact Warning Message</label>
                <textarea
                  value={newRule.impact}
                  onChange={(e) => setNewRule({ ...newRule, impact: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-800 pt-3">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRule}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md"
              >
                {isSaving ? 'Saving...' : 'Save Rule to rules.json'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
