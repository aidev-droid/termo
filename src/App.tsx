import { useState, useEffect, useCallback } from 'react';
import { GroupedApplication, PerformanceMetrics, RulesConfig, ActionTarget, ActionResult } from './types';
import { Header } from './components/Header';
import { QuickView } from './components/QuickView';
import { DetailsView } from './components/DetailsView';
import { AdvancedPanel } from './components/AdvancedPanel';
import { RulesManager } from './components/RulesManager';
import { AiAdvisor } from './components/AiAdvisor';
import { PIDReuseSimulator } from './components/PIDReuseSimulator';
import { DiagnosticsView } from './components/DiagnosticsView';
import { AntigravityMilestones } from './components/AntigravityMilestones';

export default function App() {
  const [activeTab, setActiveTab] = useState('quickview');
  const [applications, setApplications] = useState<GroupedApplication[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [rulesConfig, setRulesConfig] = useState<RulesConfig | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedDetailsApp, setSelectedDetailsApp] = useState<GroupedApplication | null>(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingRules, setIsSavingRules] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Fetch Snapshot API
  const fetchSnapshot = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/processes/snapshot?maxItems=8');
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications);
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Failed to fetch snapshot:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Fetch Rules API
  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch('/api/rules');
      if (res.ok) {
        const data = await res.json();
        setRulesConfig(data);
      }
    } catch (err) {
      console.error('Failed to fetch rules:', err);
    }
  }, []);

  // Initial Load & Auto Refresh Polling
  useEffect(() => {
    fetchSnapshot();
    fetchRules();
  }, [fetchSnapshot, fetchRules]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      fetchSnapshot();
    }, 3000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchSnapshot]);

  // Handle Save Rules
  const handleSaveRules = async (newConfig: RulesConfig) => {
    setIsSavingRules(true);
    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });

      if (res.ok) {
        setRulesConfig(newConfig);
        await fetchSnapshot(); // Re-trigger snapshot to re-evaluate evidence
      }
    } catch (err) {
      console.error('Failed to save rules:', err);
    } finally {
      setIsSavingRules(false);
    }
  };

  // Handle Execute Action with PID Revalidation
  const handleExecuteAction = async (target: ActionTarget, simulatePidReuse: boolean = false): Promise<ActionResult> => {
    setIsProcessingAction(true);
    try {
      const res = await fetch('/api/processes/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, simulatePidReuse }),
      });

      const data: ActionResult = await res.json();
      if (data.success) {
        await fetchSnapshot();
      }
      return data;
    } catch (err: any) {
      return {
        success: false,
        targetPid: target.processId,
        action: target.forceTerminate ? 'ForceTerminate' : 'GracefulClose',
        message: 'Network / Action Execution Failed',
        revalidationPassed: false,
        details: err.message,
      };
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-glow text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Header Bar */}
      <Header
        metrics={metrics}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
        onManualRefresh={fetchSnapshot}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isRefreshing={isRefreshing}
        onOpenAdvancedPanel={() => setIsAdvancedOpen(true)}
      />

      {/* Main Workspace Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'quickview' && (
          <QuickView
            applications={applications}
            onSelectAppForDetails={(app) => setSelectedDetailsApp(app)}
            onExecuteAction={handleExecuteAction}
            isProcessingAction={isProcessingAction}
          />
        )}

        {activeTab === 'rules' && (
          <RulesManager
            rulesConfig={rulesConfig}
            onSaveRules={handleSaveRules}
            isSaving={isSavingRules}
          />
        )}

        {activeTab === 'ai' && <AiAdvisor applications={applications} />}

        {activeTab === 'pidreuse' && <PIDReuseSimulator onExecuteAction={handleExecuteAction} />}

        {activeTab === 'diagnostics' && <DiagnosticsView metrics={metrics} />}

        {activeTab === 'milestones' && <AntigravityMilestones />}
      </main>

      {/* Deep Details Modal */}
      <DetailsView app={selectedDetailsApp} onClose={() => setSelectedDetailsApp(null)} />

      {/* Tier 3 Advanced Slide-in Panel */}
      <AdvancedPanel
        isOpen={isAdvancedOpen}
        onClose={() => setIsAdvancedOpen(false)}
        applications={applications}
        metrics={metrics}
      />
    </div>
  );
}
