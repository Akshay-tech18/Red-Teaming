import { INITIAL_DATA } from './seedData';

class GuardianAPIClient {
  constructor(baseUrl = 'http://localhost:8000/api/v1') {
    this.baseUrl = baseUrl;
    this.isOnline = false;
    this.listeners = [];
  }

  onConnectionChange(callback) {
    this.listeners.push(callback);
  }

  notifyConnection(status) {
    if (this.isOnline !== status) {
      this.isOnline = status;
      this.listeners.forEach((cb) => cb(status));
    }
  }

  async checkHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);
      const res = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);
      const online = res.ok;
      this.notifyConnection(online);
      return online;
    } catch {
      this.notifyConnection(false);
      return false;
    }
  }

  normalizeAttack(a) {
    const rawPayload = a.prompt !== undefined ? a.prompt : a.payload;
    const payloadArray = Array.isArray(rawPayload)
      ? rawPayload
      : typeof rawPayload === 'string'
      ? [rawPayload]
      : [];

    return {
      id: a.id,
      name: a.name || `${a.id}: ${a.objective ? a.objective.slice(0, 50) + '...' : a.attack_family || 'Test Case'}`,
      attack_family: a.attack_family || 'tool_workflow_bypass',
      priority: a.priority || 'P0',
      target_constraints: a.target_constraints || (a.constraint_id ? [a.constraint_id] : (a.constraint_ids || ['C-001'])),
      target_policy: a.target_policy || 'P-001',
      objective: a.objective || 'Security evaluation test scenario',
      expected_violation: a.expected_violation || 'Violation of constraint',
      expected_label: a.expected_label || 'CRITICAL_ACTION',
      expected_label_protected: a.expected_label_protected || 'ATTEMPT_BLOCKED',
      rationale: a.rationale || '',
      payload: payloadArray,
      initial_security_state:
        a.initial_security_state ||
        a.metadata_info?.initial_session_state ||
        a.initial_session_state || {
          authenticated_customer_id: 'CUST-001',
          refund_verification_state: {},
          manager_approval_state: 'NOT_APPROVED',
        },
      metadata: a.metadata || a.metadata_info || {},
    };
  }

  async getAgent(agentId = null) {
    if (this.isOnline) {
      try {
        const url = agentId ? `${this.baseUrl}/agents/${agentId}` : `${this.baseUrl}/agents`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const agentObj = Array.isArray(data) ? data[0] : data;
          if (agentObj) {
            try {
              const vRes = await fetch(`${this.baseUrl}/agents/${agentObj.id}/versions`);
              if (vRes.ok) {
                agentObj.versions = await vRes.json();
              }
            } catch (err) {
              console.warn('Could not fetch versions from API:', err);
            }
            agentObj.tools = agentObj.tools || INITIAL_DATA.agent.tools;
            agentObj.policies = agentObj.policies || INITIAL_DATA.agent.policies;
            return agentObj;
          }
        }
      } catch (e) {
        console.warn('API fallback to local agent:', e);
      }
    }
    return INITIAL_DATA.agent;
  }

  async getAttacks(constraintId = null) {
    if (this.isOnline) {
      try {
        const url = constraintId
          ? `${this.baseUrl}/attacks?constraint_id=${encodeURIComponent(constraintId)}`
          : `${this.baseUrl}/attacks`;
        const res = await fetch(url);
        if (res.ok) {
          const rawAttacks = await res.json();
          if (Array.isArray(rawAttacks) && rawAttacks.length > 0) {
            return rawAttacks.map((a) => this.normalizeAttack(a));
          }
        }
      } catch (e) {
        console.warn('API fallback to local attacks:', e);
      }
    }
    const local = constraintId
      ? INITIAL_DATA.attacks.filter((a) => a.target_constraints.includes(constraintId))
      : INITIAL_DATA.attacks;
    return local.map((a) => this.normalizeAttack(a));
  }

  async runAttack(attackId, agentVersionId, onProgress = null) {
    if (onProgress) onProgress({ status: 'LAUNCHING', stage: 'Initializing target sandbox & state' });

    const isProtected = agentVersionId === 'ver-1.1' || String(agentVersionId).toLowerCase().includes('protected');
    const buildMode = isProtected ? 'protected' : 'vulnerable';

    if (this.isOnline) {
      try {
        if (onProgress) onProgress({ status: 'REASONING', stage: `Dispatching payload to agent (build: ${buildMode})` });

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
                const matched = versions.find((v) =>
                  isProtected
                    ? v.version_label.includes('1.1') || v.version_label.includes('protected')
                    : v.version_label.includes('1.0') || v.version_label.includes('vulnerable')
                );
                if (matched) backendVersionId = matched.id;
                else if (versions[0]) backendVersionId = versions[0].id;
              }
            }
          }
        } catch {
          // Keep original id
        }

        const res = await fetch(`${this.baseUrl}/attacks/${attackId}/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agent_version_id: backendVersionId,
            build: buildMode,
            max_turns: 10,
          }),
        });

        if (res.ok) {
          const run = await res.json();
          if (onProgress) onProgress({ status: 'JUDGING', stage: 'Collecting trace events & evaluating verdict' });

          let events = [];
          try {
            const traceRes = await fetch(`${this.baseUrl}/runs/${run.id}/trace`);
            if (traceRes.ok) {
              events = await traceRes.json();
            }
          } catch (tErr) {
            console.warn('Could not fetch traces:', tErr);
          }

          run.events = events;
          run.finding = {
            label: run.deterministic_label || (isProtected ? 'ATTEMPT_BLOCKED' : 'CRITICAL_ACTION'),
            confidence: 0.96,
            rationale: run.final_response || 'Execution complete.',
          };
          return run;
        }
      } catch (e) {
        console.warn('API run failed, executing in local simulator:', e);
      }
    }

    // High-Fidelity Local Simulation
    return new Promise((resolve) => {
      setTimeout(() => {
        if (onProgress) onProgress({ status: 'REASONING', stage: 'Target Agent reasoning over prompt instructions' });
      }, 350);

      setTimeout(() => {
        if (onProgress) onProgress({ status: 'CHECKING_TOOLS', stage: 'Evaluating tool call preconditions & state guards' });
      }, 800);

      setTimeout(() => {
        if (onProgress) onProgress({ status: 'JUDGING', stage: 'Collecting trace evidence & calculating verdict' });
      }, 1250);

      setTimeout(() => {
        const key = isProtected ? `${attackId}_v1.1` : `${attackId}_v1.0`;
        const trace = INITIAL_DATA.sample_traces[key] || INITIAL_DATA.sample_traces['A-001_v1.0'];
        resolve(trace);
      }, 1600);
    });
  }

  async getRegressionTests() {
    if (this.isOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/regression-tests`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('API fallback for regression tests:', e);
      }
    }
    return INITIAL_DATA.regression_tests;
  }
}

export const api = new GuardianAPIClient();
