import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import PipelineStepper from './components/PipelineStepper';

import AgentConfigView from './views/AgentConfigView';
import ConstraintsView from './views/ConstraintsView';
import ThreatModelView from './views/ThreatModelView';
import AttackCatalogView from './views/AttackCatalogView';
import LiveExecutionView from './views/LiveExecutionView';
import RegressionSuiteView from './views/RegressionSuiteView';

import { api } from './lib/api';
import { INITIAL_DATA } from './lib/seedData';

export default function App() {
  const [currentView, setView] = useState('config');
  const [currentVersion, setVersion] = useState('ver-1.0');
  const [isOnline, setIsOnline] = useState(false);

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
    dlAnchor.setAttribute('download', `shopassist_config_${currentVersion}.json`);
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
    <div className="flex min-h-screen bg-app-bg text-slate-100">
      {/* Sidebar navigation with targeted icon glow */}
      <Sidebar
        currentView={currentView}
        setView={setView}
        isOnline={isOnline}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          currentVersion={currentVersion}
          setVersion={setVersion}
          agent={agent}
          onRunDemo={() => handleRunAttack('A-001')}
          onExport={handleExportConfig}
        />

        <main className="p-7 max-w-7xl w-full mx-auto flex-1">
          {/* Segmented Pipeline Stepper (01 to 06) with targeted icon glow */}
          <PipelineStepper
            currentView={currentView}
            setView={setView}
          />

          {/* View Container */}
          <div>
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
          </div>
        </main>
      </div>
    </div>
  );
}
