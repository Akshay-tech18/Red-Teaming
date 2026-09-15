import React, { useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import PipelineStepper from './components/PipelineStepper';
import AICoPilotDrawer from './components/AICoPilotDrawer';
import LogoIntro from './components/LogoIntro';
import JudgeDemoTour from './components/JudgeDemoTour';

import AgentConfigView from './views/AgentConfigView';
import ConstraintsView from './views/ConstraintsView';
import ThreatModelView from './views/ThreatModelView';
import AttackCatalogView from './views/AttackCatalogView';
import LiveExecutionView from './views/LiveExecutionView';
import RegressionSuiteView from './views/RegressionSuiteView';

import { api } from './lib/api';
import { DOCUBOT_DATA, BENCHMARK_EVAL_DATA } from './lib/seedData';

// A fetch failure must never be indistinguishable from a working view (step
// 4e). This renders in place of a view's normal content whenever its data
// failed to load - deliberately plain/red, not styled to blend in.
function ErrorBanner({ what, error, onRetry }) {
  return (
    <div className="rounded-md border border-red-500/50 bg-red-950/40 p-6 text-red-200">
      <div className="font-semibold text-red-300 mb-1">Could not load {what} from the backend</div>
      <div className="text-sm text-red-300/80 font-mono mb-3">{error?.message || String(error)}</div>
      <div className="text-xs text-red-300/60 mb-3">
        This view is intentionally showing an error instead of seed data. Confirm the backend is
        running (uvicorn, JUDGE_PROVIDER set) and the DB is seeded (scripts/seed_db.py), then retry.
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1.5 rounded-md bg-red-500/20 border border-red-500/50 text-red-200 text-xs hover:bg-red-500/30"
        >
          Retry
        </button>
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-app-bg text-slate-300 flex items-center justify-center">
      <div className="text-sm font-mono">Loading live data from backend...</div>
    </div>
  );
}

export default function App() {
  const [currentView, setView] = useState('config');
  const [currentVersion, setVersion] = useState('ver-1.0');
  const [isOnline, setIsOnline] = useState(false);
  const [isCoPilotOpen, setIsCoPilotOpen] = useState(true);

  // Multi-Target State (Day 18 Stretch Goal) - DocuBot is a separate, always-
  // mock demo target (the real backend only knows ShopAssist); switching to
  // it is not a live-data claim, so it keeps using DOCUBOT_DATA.
  const [activeTargetId, setActiveTargetId] = useState('shopassist');

  // Guided 5-Minute Judge Demo Tour State (Day 15 & Section 10)
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(1);

  // Logo Intro Animation Phase State ('splash' -> 'header')
  const [logoPhase, setLogoPhase] = useState('splash');
  const [introKey, setIntroKey] = useState(0);

  useEffect(() => {
    const handleOpenCopilot = () => setIsCoPilotOpen(true);
    window.addEventListener('open-copilot', handleOpenCopilot);
    return () => window.removeEventListener('open-copilot', handleOpenCopilot);
  }, []);

  const handleReplayIntro = () => {
    setLogoPhase('splash');
    setIntroKey((k) => k + 1);
  };

  // Core Data - starts empty/null, not seed data. A viewer should see a
  // loading state or an error, never seed data quietly standing in.
  const [agent, setAgent] = useState(null);
  const [constraints, setConstraints] = useState(null);
  const [threatModel, setThreatModel] = useState(null);
  const [attacks, setAttacks] = useState(null);
  const [regressionTests] = useState([]); // no backend endpoint fits - see RegressionSuiteView's unavailable banner

  const [isLoading, setIsLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState({ agent: null, attacks: null, constraints: null });

  // Real backend AgentVersion UUIDs, keyed by build - resolved from
  // agent.versions once the agent loads. currentVersion stays the existing
  // 'ver-1.0'/'ver-1.1' UI token (TopBar/JudgeDemoTour already hardcode
  // those); this is the translation layer to what the backend actually needs.
  const [versionIds, setVersionIds] = useState({ vulnerable: null, protected: null });
  const isProtectedToken = (v) => v === 'ver-1.1' || v === 'docu-1.1';

  // Execution State
  const [selectedAttackId, setSelectedAttackId] = useState('A-001');
  const [activeRun, setActiveRun] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runProgress, setRunProgress] = useState(null);
  const [runError, setRunError] = useState(null);

  // Switch Target Agent Architecture (Day 18)
  const handleSwitchTarget = (targetId) => {
    setActiveTargetId(targetId);
    if (targetId === 'docubot') {
      setAgent(DOCUBOT_DATA.agent);
      setConstraints(DOCUBOT_DATA.constraints);
      setThreatModel(DOCUBOT_DATA.threat_model);
      setAttacks(DOCUBOT_DATA.attacks);
      setVersion('docu-1.0');
      setSelectedAttackId('A-HR-001');
    } else {
      setVersion('ver-1.0');
      setSelectedAttackId('A-001');
      loadData(); // re-fetch live ShopAssist data rather than falling back to seed data
    }
  };

  // Load Data on startup & check health - each resource fetched
  // independently; a failure on one does not block or fake the others, and
  // never falls back to seed data (step 4e).
  const loadData = async () => {
    const [agentResult, attacksResult, constraintsResult] = await Promise.allSettled([
      api.getAgent(),
      api.getAttacks(),
      api.getConstraints(),
    ]);

    if (agentResult.status === 'fulfilled') {
      setAgent(agentResult.value);
      const versions = agentResult.value.versions || [];
      setVersionIds({
        vulnerable: versions.find((v) => v.version_label === 'vulnerable')?.id || null,
        protected: versions.find((v) => v.version_label === 'protected')?.id || null,
      });
    } else {
      setAgent(null);
    }

    if (attacksResult.status === 'fulfilled') setAttacks(attacksResult.value);
    else setAttacks(null);

    if (constraintsResult.status === 'fulfilled') setConstraints(constraintsResult.value);
    else setConstraints(null);

    setLoadErrors({
      agent: agentResult.status === 'rejected' ? agentResult.reason : null,
      attacks: attacksResult.status === 'rejected' ? attacksResult.reason : null,
      constraints: constraintsResult.status === 'rejected' ? constraintsResult.reason : null,
    });

    setIsLoading(false);
  };

  useEffect(() => {
    api.checkHealth().then((online) => {
      setIsOnline(online);
      loadData();
    });

    api.onConnectionChange((online) => {
      setIsOnline(online);
    });

    const interval = setInterval(() => {
      api.checkHealth();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Run attack handler
  const handleRunAttack = async (attackId) => {
    setSelectedAttackId(attackId);
    setView('execution');
    setIsRunning(true);
    setRunError(null);
    setRunProgress({ status: 'INITIALIZING', stage: 'Setting up sandboxed execution context' });

    const buildMode = isProtectedToken(currentVersion) ? 'protected' : 'vulnerable';
    const realVersionId = versionIds[buildMode];

    if (!realVersionId) {
      setRunError(new Error(
        `No ${buildMode} AgentVersion id resolved from the backend - the agent likely failed to load (see the Understand Config error banner) or scripts/seed_db.py has not been run.`
      ));
      setIsRunning(false);
      setRunProgress(null);
      return;
    }

    try {
      const result = await api.runAttack(attackId, realVersionId, buildMode, (progress) => {
        setRunProgress(progress);
      });
      setActiveRun(result);
    } catch (err) {
      console.error('Run failed:', err);
      setRunError(err);
      setActiveRun(null);
    } finally {
      setIsRunning(false);
      setRunProgress(null);
    }
  };

  const selectedAttack = (attacks || []).find((a) => a.id === selectedAttackId) || (attacks || [])[0];

  // Guided Judge Demo Tour Actions (Day 15 & Section 10)
  const handleStartTour = () => {
    setIsTourActive(true);
    setTourStep(1);
    handleSwitchTarget('shopassist');
    setView('constraints');
    setVersion('ver-1.0');
  };

  const handleTourStepExecution = (stepObj) => {
    if (!stepObj) return;
    setView(stepObj.view);
    if (stepObj.version) setVersion(stepObj.version);

    if (stepObj.step === 2) {
      setSelectedAttackId('A-001');
      handleRunAttack('A-001');
    } else if (stepObj.step === 4) {
      setVersion('ver-1.1');
      handleRunAttack('A-001');
    }
  };

  // Day 4: Update / Add Constraint Handlers
  const handleUpdateConstraint = (updated) => {
    setConstraints((prev) => (prev || []).map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleAddConstraint = (newConstraint) => {
    setConstraints((prev) => [newConstraint, ...(prev || [])]);
  };

  // Export Executive Security Audit Report for Hackathon Judges
  const handleExportAuditReport = () => {
    const safeConstraints = constraints || [];
    const report = {
      platform: "AI Agent Guardian",
      hackathon_evaluation_report: true,
      timestamp: new Date().toISOString(),
      active_target: {
        id: agent?.id,
        name: agent?.name,
        architecture_type: activeTargetId === 'docubot' ? 'HR & Operations' : 'E-Commerce Support',
        active_version: currentVersion,
      },
      security_invariants: {
        total_enforced: safeConstraints.length,
        critical_count: safeConstraints.filter(c => c.severity === 'CRITICAL').length,
        high_count: safeConstraints.filter(c => c.severity === 'HIGH').length,
        rules: safeConstraints.map(c => ({ id: c.id, title: c.title, forbidden: c.forbidden_action, condition: c.required_condition }))
      },
      evaluation_benchmarks: {
        hybrid_accuracy: `${(BENCHMARK_EVAL_DATA.summary.accuracy * 100).toFixed(2)}%`,
        critical_recall: `${(BENCHMARK_EVAL_DATA.summary.critical_action_recall * 100).toFixed(0)}%`,
        false_alarm_rate: `${((BENCHMARK_EVAL_DATA.summary.false_alarms / BENCHMARK_EVAL_DATA.summary.total_cases) * 100).toFixed(1)}%`,
        deterministic_latency: `${BENCHMARK_EVAL_DATA.summary.deterministic_gate_latency_ms}ms`,
        llm_judge_latency: `${BENCHMARK_EVAL_DATA.summary.llm_judge_latency_ms}ms`,
        note: "Benchmark figures are illustrative seed data - no live /evaluations/metrics endpoint exists yet.",
      },
      regression_suite: {
        total_tracked: regressionTests.length,
        status: "NOT_AVAILABLE_IN_THIS_BUILD"
      }
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `agent_guardian_audit_report_${activeTargetId}.json`);
    dlAnchor.click();
  };

  // Export Agent Config
  const handleExportConfig = () => {
    const ver = agent?.versions?.find((v) => v.id === currentVersion) || agent?.versions?.[0];
    const payload = {
      schema_version: '1.0',
      agent: {
        name: agent?.name,
        description: agent?.description,
        version: ver?.version_label,
      },
      prompt: {
        system_prompt: ver?.system_prompt,
      },
      tools: agent?.tools,
      policies: agent?.policies,
      constraints,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `${activeTargetId}_config_${currentVersion}.json`);
    dlAnchor.click();
  };

  // Update prompt in memory
  const handlePromptChange = (newPrompt) => {
    setAgent((prev) => ({
      ...prev,
      versions: (prev?.versions || []).map((v) =>
        v.id === currentVersion ? { ...v, system_prompt: newPrompt } : v
      ),
    }));
  };

  // Cross-view navigation helper for traceability chips
  const handleNavigateTo = (view, targetId) => {
    setView(view);
    if (view === 'attacks' && targetId) {
      setSelectedAttackId(targetId);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-app-bg text-slate-100 flex flex-col">
      {/* Signature Initial Load Logo Intro Reveal & Slide Transition */}
      <LogoIntro
        key={introKey}
        onAnimationPhaseChange={(phase) => setLogoPhase(phase)}
      />

      {/* Consolidated Top Bar with brand mark, Multi-Target Switcher, and 5-Min Judge Tour button */}
      <TopBar
        currentVersion={currentVersion}
        setVersion={setVersion}
        agent={agent}
        isOnline={isOnline}
        isCoPilotOpen={isCoPilotOpen}
        onToggleCoPilot={() => setIsCoPilotOpen(!isCoPilotOpen)}
        onRunDemo={() => handleRunAttack(activeTargetId === 'docubot' ? 'A-HR-001' : 'A-001')}
        onExport={handleExportConfig}
        onExportAuditReport={handleExportAuditReport}
        onStartTour={handleStartTour}
        activeTargetId={activeTargetId}
        onSwitchTarget={handleSwitchTarget}
        logoInHeader={logoPhase === 'header'}
        onReplayLogo={handleReplayIntro}
      />

      {/* Workspace Area: Main Pipeline Views + Persistent Global AI Co-Pilot Panel */}
      <div className="flex-1 flex min-w-0">
        {/* Main Content Area */}
        <main className="p-6 md:p-8 max-w-[1440px] w-full mx-auto flex-1 flex flex-col min-w-0">
          {/* Consolidated Pipeline Stepper (01 to 06) */}
          <PipelineStepper
            currentView={currentView}
            setView={setView}
          />

          {/* View Container */}
          <div className="flex-1">
            {currentView === 'config' && (
              loadErrors.agent ? (
                <ErrorBanner what="agent config" error={loadErrors.agent} onRetry={loadData} />
              ) : (
                <AgentConfigView
                  agent={agent}
                  currentVersion={currentVersion}
                  onPromptChange={handlePromptChange}
                  onNavigateTo={handleNavigateTo}
                />
              )
            )}

            {currentView === 'constraints' && (
              loadErrors.constraints ? (
                <ErrorBanner what="constraints" error={loadErrors.constraints} onRetry={loadData} />
              ) : (
                <ConstraintsView
                  constraints={constraints || []}
                  onNavigateTo={handleNavigateTo}
                  onUpdateConstraint={handleUpdateConstraint}
                  onAddConstraint={handleAddConstraint}
                />
              )
            )}

            {currentView === 'threat' && (
              <ThreatModelView
                threatModel={threatModel}
                onNavigateTo={handleNavigateTo}
              />
            )}

            {currentView === 'attacks' && (
              loadErrors.attacks ? (
                <ErrorBanner what="attack catalog" error={loadErrors.attacks} onRetry={loadData} />
              ) : (
                <AttackCatalogView
                  attacks={attacks || []}
                  onRunAttack={handleRunAttack}
                  onNavigateTo={handleNavigateTo}
                />
              )
            )}

            {currentView === 'execution' && (
              <>
                {runError && (
                  <div className="mb-4">
                    <ErrorBanner what="this run" error={runError} />
                  </div>
                )}
                <LiveExecutionView
                  attack={selectedAttack}
                  currentVersion={currentVersion}
                  setVersion={setVersion}
                  activeRun={activeRun}
                  isRunning={isRunning}
                  runProgress={runProgress}
                  onRerun={handleRunAttack}
                  onNavigateTo={handleNavigateTo}
                />
              </>
            )}

            {currentView === 'compare' && (
              <div className="rounded-md border border-amber-500/40 bg-amber-950/20 p-6 text-amber-200">
                <div className="font-semibold mb-1">Regression view not available in this build</div>
                <div className="text-sm text-amber-200/80">
                  The backend has no flat regression-listing endpoint yet (only per-run
                  /runs/&#123;run_id&#125;/regressions). status_diff itself is real and runs from the CLI -
                  that's how this is being demoed tonight, not from here.
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Persistent Global Red-Team AI Guardian Co-Pilot (Active across ALL tabs) */}
        <AICoPilotDrawer
          isOpen={isCoPilotOpen}
          onClose={() => setIsCoPilotOpen(false)}
          currentView={currentView}
          currentVersion={currentVersion}
          agent={agent}
          activeAttack={selectedAttack}
          activeRun={activeRun}
          onNavigateTo={handleNavigateTo}
        />
      </div>

      {/* Guided 5-Minute Judge Demo Tour Presentation Controller (Day 15 & Section 10) */}
      <JudgeDemoTour
        isActive={isTourActive}
        onClose={() => setIsTourActive(false)}
        currentStep={tourStep}
        setCurrentStep={setTourStep}
        onExecuteStep={handleTourStepExecution}
      />
    </div>
  );
}
