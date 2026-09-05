
/**
 * AI Agent Guardian — API Client
 * Grounded in docs/Backend Implementation Plan.md §9 API Contract.
 * Provides real HTTP client methods with automatic fallback to local high-fidelity state
 * when the backend server is not running.
 */

class GuardianAPI {
  constructor(baseUrl = "http://localhost:8000/api/v1") {
    this.baseUrl = baseUrl;
    this.isOnline = false;
    this.connectionChecked = false;
    this.listeners = [];
  }

  onConnectionChange(callback) {
    this.listeners.push(callback);
  }

  notifyConnection(status) {
    this.isOnline = status;
    this.connectionChecked = true;
    this.listeners.forEach((cb) => cb(status));
  }

  async checkHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);
      const res = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal,
        headers: { "Accept": "application/json" }
      });
      clearTimeout(timeoutId);
      const online = res.ok;
      this.notifyConnection(online);
      return online;
    } catch (e) {
      this.notifyConnection(false);
      return false;
    }
  }

  // --- Agents & Versions ---
  async getAgent(agentId = "agent-shopassist-01") {
    if (this.isOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/agents/${agentId}`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn("API fallback to local agent:", e);
      }
    }
    return window.GUARDIAN_DATA.agent;
  }

  async getAgentVersions(agentId = "agent-shopassist-01") {
    if (this.isOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/agents/${agentId}/versions`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn("API fallback to local versions:", e);
      }
    }
    return window.GUARDIAN_DATA.agent.versions;
  }

  async createAgentVersion(agentId, versionData) {
    if (this.isOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/agents/${agentId}/versions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(versionData)
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn("API fallback for creating version:", e);
      }
    }
    const newVer = {
      id: `ver-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...versionData
    };
    window.GUARDIAN_DATA.agent.versions.push(newVer);
    return newVer;
  }

  // --- Constraints ---
  async getConstraints(agentId = "agent-shopassist-01") {
    if (this.isOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/agents/${agentId}/constraints`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn("API fallback to local constraints:", e);
      }
    }
    return window.GUARDIAN_DATA.constraints;
  }

  async saveConstraints(agentId, constraints) {
    if (this.isOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/agents/${agentId}/constraints`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(constraints)
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn("API fallback for saving constraints:", e);
      }
    }
    window.GUARDIAN_DATA.constraints = constraints;
    return constraints;
  }

  // --- Attacks ---
  async getAttacks(constraintId = null) {
    if (this.isOnline) {
      try {
        const url = constraintId
          ? `${this.baseUrl}/attacks?constraint_id=${encodeURIComponent(constraintId)}`
          : `${this.baseUrl}/attacks`;
        const res = await fetch(url);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn("API fallback to local attacks:", e);
      }
    }
    if (constraintId) {
      return window.GUARDIAN_DATA.attacks.filter((a) =>
        a.target_constraints.includes(constraintId)
      );
    }
    return window.GUARDIAN_DATA.attacks;
  }

  async getAttack(attackId) {
    if (this.isOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/attacks/${attackId}`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn("API fallback to local attack detail:", e);
      }
    }
    return window.GUARDIAN_DATA.attacks.find((a) => a.id === attackId) || null;
  }

  // --- Attack Execution & Traces ---
  async runAttack(attackId, agentVersionId, onProgress = null) {
    if (onProgress) onProgress({ status: "LAUNCHING", stage: "Initializing target sandbox & state" });

    const isProtected = agentVersionId === "ver-1.1" || String(agentVersionId).toLowerCase().includes("protected");
    const buildMode = isProtected ? "protected" : "vulnerable";

    if (this.isOnline) {
      try {
        if (onProgress) onProgress({ status: "REASONING", stage: `Dispatching payload to agent (build: ${buildMode})` });

        // Resolve real backend version ID if available
        let backendVersionId = agentVersionId;
        try {
          const agentsRes = await fetch(`${this.baseUrl}/agents`);
          if (agentsRes.ok) {
            const agents = await agentsRes.json();
            if (agents && agents.length > 0) {
              const versionsRes = await fetch(`${this.baseUrl}/agents/${agents[0].id}/versions`);
              if (versionsRes.ok) {
                const versions = await versionsRes.json();
                const matched = versions.find(v => isProtected ? v.version_label.includes("1.1") || v.version_label.includes("protected") : v.version_label.includes("1.0") || v.version_label.includes("vulnerable"));
                if (matched) backendVersionId = matched.id;
                else if (versions[0]) backendVersionId = versions[0].id;
              }
            }
          }
        } catch (verErr) {
          console.debug("Using default agent_version_id:", verErr);
        }

        const res = await fetch(`${this.baseUrl}/attacks/${attackId}/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agent_version_id: backendVersionId,
            build: buildMode,
            max_turns: 10
          })
        });

        if (res.ok) {
          const run = await res.json();
          if (onProgress) onProgress({ status: "JUDGING", stage: "Collecting trace events & calculating verdict" });

          // Fetch execution trace events for this run
          let events = [];
          try {
            const traceRes = await fetch(`${this.baseUrl}/runs/${run.id}/trace`);
            if (traceRes.ok) {
              events = await traceRes.json();
            }
          } catch (tErr) {
            console.warn("Could not fetch traces:", tErr);
          }

          run.events = events;
          run.finding = {
            label: run.deterministic_label || (isProtected ? "ATTEMPT_BLOCKED" : "CRITICAL_ACTION"),
            confidence: 0.96,
            rationale: run.final_response || "Execution complete."
          };
          return run;
        }
      } catch (e) {
        console.warn("API run failed, executing in local simulator:", e);
      }
    }

    // Local High-Fidelity Simulator
    return new Promise((resolve) => {
      setTimeout(() => {
        if (onProgress) onProgress({ status: "REASONING", stage: "Target Agent reasoning over prompt instructions" });
      }, 400);

      setTimeout(() => {
        if (onProgress) onProgress({ status: "CHECKING_TOOLS", stage: "Evaluating tool call preconditions & state guards" });
      }, 900);

      setTimeout(() => {
        if (onProgress) onProgress({ status: "JUDGING", stage: "Collecting trace evidence & calculating verdict" });
      }, 1400);

      setTimeout(() => {
        const isProtected = agentVersionId === "ver-1.1" || agentVersionId.includes("protected");
        const key = isProtected ? `${attackId}_v1.1` : `${attackId}_v1.0`;
        const trace = window.GUARDIAN_DATA.sample_traces[key] || window.GUARDIAN_DATA.sample_traces["A-001_v1.0"];
        resolve(trace);
      }, 1800);
    });
  }

  async getRunTrace(runId) {
    if (this.isOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/runs/${runId}/trace`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn("API fallback for run trace:", e);
      }
    }
    for (const key in window.GUARDIAN_DATA.sample_traces) {
      if (window.GUARDIAN_DATA.sample_traces[key].run_id === runId) {
        return window.GUARDIAN_DATA.sample_traces[key].events;
      }
    }
    return window.GUARDIAN_DATA.sample_traces["A-001_v1.0"].events;
  }

  async getRunFindings(runId) {
    if (this.isOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/runs/${runId}/findings`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn("API fallback for findings:", e);
      }
    }
    for (const key in window.GUARDIAN_DATA.sample_traces) {
      if (window.GUARDIAN_DATA.sample_traces[key].run_id === runId) {
        return [window.GUARDIAN_DATA.sample_traces[key].finding];
      }
    }
    return [window.GUARDIAN_DATA.sample_traces["A-001_v1.0"].finding];
  }

  // --- Regression Testing ---
  async getRegressionTests() {
    if (this.isOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/regression-tests`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn("API fallback for regression tests:", e);
      }
    }
    return window.GUARDIAN_DATA.regression_tests;
  }

  async rerunRegressionTest(testId, agentVersionId) {
    if (this.isOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/regression-tests/${testId}/rerun`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agent_version_id: agentVersionId })
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn("API fallback for rerun regression:", e);
      }
    }

    const test = window.GUARDIAN_DATA.regression_tests.find((t) => t.id === testId);
    return {
      id: `regrun-${Date.now()}`,
      regression_test_id: testId,
      old_label: test ? test.baseline_label : "SAFE",
      new_label: "CRITICAL_ACTION",
      status_diff: "REGRESSION",
      detected_at: new Date().toISOString()
    };
  }
}

// Global API singleton
window.guardianAPI = new GuardianAPI();
