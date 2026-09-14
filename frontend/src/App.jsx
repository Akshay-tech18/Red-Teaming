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
import JudgeMetricsView from './views/JudgeMetricsView';

import { api } from './lib/api';
import { INITIAL_DATA, DOCUBOT_DATA, BENCHMARK_EVAL_DATA } from './lib/seedData';

export default function App() {
  const [currentView, setView] = useState('config');
  const [currentVersion, setVersion] = useState('ver-1.0');
  const [isOnline, setIsOnline] = useState(false);
  const [isCoPilotOpen, setIsCoPilotOpen] = useState(true);

  // Multi-Target State (Day 18 Stretch Goal)
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

  // Core Data
  const [agent, setAgent] = useState(INITIAL_DATA.agent);
  const [constraints, setConstraints] = useState(INITIAL_DATA.constraints);
  const [threatModel, setThreatModel] = useState(INITIAL_DATA.threat_model);
  const [attacks, setAttacks] = useState(INITIAL_DATA.attacks);
  const [regressionTests, setRegressionTests] = useState(INITIAL_DATA.regression_tests);

  // Execution State
  const [selectedAttackId, setSelectedAttackId] = useState('A-001');
  const [activeRun, setActiveRun] = useState(INITIAL_DATA.sample_traces['A-001_v1.0']);
  const [isRunning, setIsRunning] = useState(false);
  const [runProgress, setRunProgress] = useState(null);

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
      setAgent(INITIAL_DATA.agent);
      setConstraints(INITIAL_DATA.constraints);
      setThreatModel(INITIAL_DATA.threat_model);
      setAttacks(INITIAL_DATA.attacks);
      setVersion('ver-1.0');
      setSelectedAttackId('A-001');
    }
  };

  // Load Data on startup & check health
  const loadData = async () => {
    try {
      const [fetchedAgent, fetchedAttacks, fetchedConstraints, fetchedTests] = await Promise.all([
        api.getAgent(),
        api.getAttacks(),
        api.checkHealth() ? api.baseUrl && fetch(`${api.baseUrl}/agents/agent-shopassist-01/constraints`).then(r => r.ok ? r.json() : null).catch(() => null) : null,
        api.getRegressionTests(),
      ]);

      if (fetchedAgent) setAgent(fetchedAgent);
      if (fetchedAttacks && fetchedAttacks.length > 0) setAttacks(fetchedAttacks);
      if (fetchedConstraints && fetchedConstraints.length > 0) setConstraints(fetchedConstraints);
      if (fetchedTests && fetchedTests.length > 0) setRegressionTests(fetchedTests);
    } catch (e) {
      console.warn('Fallback to local dataset:', e);
    }
  };

  useEffect(() => {
    api.checkHealth().then((online) => {
      setIsOnline(online);
      loadData();
    });

    api.onConnectionChange((online) => {
      setIsOnline(online);
      loadData();
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
    setRunProgress({ status: 'INITIALIZING', stage: 'Setting up sandboxed execution context' });

    try {
      const result = await api.runAttack(attackId, currentVersion, (progress) => {
        setRunProgress(progress);
      });
      setActiveRun(result);
    } catch (err) {
      console.error('Run failed:', err);
    } finally {
      setIsRunning(false);
      setRunProgress(null);
    }
  };

  const selectedAttack = attacks.find((a) => a.id === selectedAttackId) || attacks[0];

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
    setConstraints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleAddConstraint = (newConstraint) => {
    setConstraints((prev) => [newConstraint, ...prev]);
  };

  // Export Executive Security Audit Report for Hackathon Judges
  const handleExportAuditReport = () => {
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
        total_enforced: constraints.length,
        critical_count: constraints.filter(c => c.severity === 'CRITICAL').length,
        high_count: constraints.filter(c => c.severity === 'HIGH').length,
        rules: constraints.map(c => ({ id: c.id, title: c.title, forbidden: c.forbidden_action, condition: c.required_condition }))
      },
      evaluation_benchmarks: {
        hybrid_accuracy: `${(BENCHMARK_EVAL_DATA.summary.accuracy * 100).toFixed(2)}%`,
        critical_recall: `${(BENCHMARK_EVAL_DATA.summary.critical_action_recall * 100).toFixed(0)}%`,
        false_alarm_rate: `${((BENCHMARK_EVAL_DATA.summary.false_alarms / BENCHMARK_EVAL_DATA.summary.total_cases) * 100).toFixed(1)}%`,
        deterministic_latency: `${BENCHMARK_EVAL_DATA.summary.deterministic_gate_latency_ms}ms`,
        llm_judge_latency: `${BENCHMARK_EVAL_DATA.summary.llm_judge_latency_ms}ms`
      },
      regression_suite: {
        total_tracked: regressionTests.length,
        status: "AUTOMATED_CONTINUOUS_VERIFICATION_ACTIVE"
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
      versions: prev.versions.map((v) =>
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
          {/* Consolidated Pipeline Stepper (01 to 07) */}
          <PipelineStepper
            currentView={currentView}
            setView={setView}
          />

          {/* View Container */}
          <div className="flex-1">
            {currentView === 'config' && (
              <AgentConfigView
                agent={agent}
                currentVersion={currentVersion}
                onPromptChange={handlePromptChange}
                onNavigateTo={handleNavigateTo}
              />
            )}

            {currentView === 'constraints' && (
              <ConstraintsView 
                constraints={constraints} 
                onNavigateTo={handleNavigateTo}
                onUpdateConstraint={handleUpdateConstraint}
                onAddConstraint={handleAddConstraint}
              />
            )}

            {currentView === 'threat' && (
              <ThreatModelView 
                threatModel={threatModel} 
                onNavigateTo={handleNavigateTo}
              />
            )}

            {currentView === 'attacks' && (
              <AttackCatalogView
                attacks={attacks}
                onRunAttack={handleRunAttack}
                onNavigateTo={handleNavigateTo}
              />
            )}

            {currentView === 'execution' && (
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
            )}

            {currentView === 'compare' && (
              <RegressionSuiteView
                regressionTests={regressionTests}
                onRunAttack={handleRunAttack}
                setVersion={setVersion}
                onNavigateTo={handleNavigateTo}
              />
            )}

            {currentView === 'metrics' && (
              <JudgeMetricsView
                onNavigateTo={handleNavigateTo}
              />
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
