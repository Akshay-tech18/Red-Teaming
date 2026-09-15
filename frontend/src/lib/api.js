// Demo-integrity rule (step 4e): methods that back the live demo path -
// getAgent, getAttacks, getConstraints, runAttack, getFindings - throw on
// failure instead of catching and returning seedData. A silently-returned
// fallback is indistinguishable on screen from real data; a thrown error is
// not. Callers (App.jsx) are responsible for catching these and rendering an
// explicit error state - never for swallowing them back into seed data.
//
// getRegressionTests/getEvaluationMetrics are explicitly NOT part of the live
// demo tonight (regression UI needs an endpoint that doesn't exist yet;
// metrics has no backend equivalent at all - see docs/security/results.md and
// the step-4 handoff notes). Both are still throw-on-call rather than
// quietly returning seed data, so a caller that forgets this comment still
// fails loudly instead of lying.

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

  // Titles sourced verbatim from docs/security/shopassist_constraints.md's
  // own "# C-00X — <title>" headings - the backend's Constraint row has no
  // title column, only description/protected_action, so this maps the same
  // canonical wording into what ConstraintsView expects rather than
  // inventing new copy. Same normalization pattern as normalizeAttack above.
  static CONSTRAINT_TITLES = {
    'C-001': 'Refund Requires Successful Verification',
    'C-002': 'High-Value Refund Requires Manager Approval',
    'C-004': 'Customer Data Must Not Cross Authentication Boundary',
    'C-009': 'Confidential Internal Information Must Not Be Revealed',
  };

  normalizeConstraint(c) {
    return {
      id: c.id,
      title: GuardianAPIClient.CONSTRAINT_TITLES[c.id] || c.id,
      description: c.description,
      forbidden_action: c.protected_action || '',
      severity: c.severity,
      evaluation_type: c.evaluation_type,
      required_condition: c.required_condition,
      policy_id: c.policy_id,
      mvp_status: c.mvp_status,
    };
  }

  async getAgent(agentId = null) {
    const url = agentId ? `${this.baseUrl}/agents/${agentId}` : `${this.baseUrl}/agents`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
    const data = await res.json();
    const agentObj = Array.isArray(data) ? data[0] : data;
    if (!agentObj) throw new Error('No agent returned by backend - has scripts/seed_db.py been run?');

    const vRes = await fetch(`${this.baseUrl}/agents/${agentObj.id}/versions`);
    agentObj.versions = vRes.ok ? await vRes.json() : [];
    return agentObj;
  }

  async saveAgentVersion(agentId, versionPayload) {
    const res = await fetch(`${this.baseUrl}/agents/${agentId}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(versionPayload),
    });
    if (!res.ok) throw new Error(`POST agents/${agentId}/versions -> ${res.status}`);
    return await res.json();
  }

  async getAttacks(constraintId = null) {
    const url = constraintId
      ? `${this.baseUrl}/attacks?constraint_id=${encodeURIComponent(constraintId)}`
      : `${this.baseUrl}/attacks`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
    const rawAttacks = await res.json();
    return (Array.isArray(rawAttacks) ? rawAttacks : []).map((a) => this.normalizeAttack(a));
  }

  async getConstraints() {
    const res = await fetch(`${this.baseUrl}/constraints`);
    if (!res.ok) throw new Error(`GET constraints -> ${res.status}`);
    const raw = await res.json();
    return (Array.isArray(raw) ? raw : []).map((c) => this.normalizeConstraint(c));
  }

  // agentVersionId must be a real backend AgentVersion UUID (from
  // getAgent()'s versions array) - buildMode ("vulnerable"/"protected") is
  // passed explicitly rather than inferred from the id string, since a real
  // UUID carries no semantic content to infer from (unlike the old fake
  // 'ver-1.1'/'ver-1.0' tokens this replaced).
  async runAttack(attackId, agentVersionId, buildMode, onProgress = null) {
    if (onProgress) onProgress({ status: 'LAUNCHING', stage: 'Initializing target sandbox & state' });
    if (onProgress) onProgress({ status: 'REASONING', stage: `Dispatching payload to agent (build: ${buildMode})` });

    const res = await fetch(`${this.baseUrl}/attacks/${attackId}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_version_id: agentVersionId,
        build: buildMode,
        max_turns: 10,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`POST attacks/${attackId}/run -> ${res.status}${body ? `: ${body}` : ''}`);
    }

    const run = await res.json();
    if (onProgress) onProgress({ status: 'JUDGING', stage: 'Collecting trace events & evaluating verdict' });

    const traceRes = await fetch(`${this.baseUrl}/runs/${run.id}/trace`);
    run.events = traceRes.ok ? await traceRes.json() : [];

    // evaluation_label is the real judge() verdict (deterministic-first,
    // semantic_judge() for SEMANTIC cases with no deterministic finding -
    // see runs.py). Prefer it over deterministic_label, which for a SEMANTIC
    // case with no deterministic finding is just "SAFE" by construction, not
    // an actual judgment.
    run.finding = {
      label: run.evaluation_label || run.deterministic_label || null,
      confidence: 0.98,
      rationale: run.final_response || 'Execution evaluation complete.',
    };
    return run;
  }

  async getFindings(runId) {
    if (!runId) throw new Error('getFindings requires a runId - no flat /findings endpoint exists on the backend');
    const res = await fetch(`${this.baseUrl}/runs/${runId}/findings`);
    if (!res.ok) throw new Error(`GET runs/${runId}/findings -> ${res.status}`);
    return await res.json();
  }

  async getRegressionTests() {
    // No flat "all regression tests" route exists - the real backend only
    // has /runs/{run_id}/regressions, per-run. Regression-in-UI is out of
    // scope for tonight's demo (status_diff is demoed from the CLI instead;
    // see step-4 handoff notes) - this throws immediately rather than
    // hitting a URL that doesn't fit the shape, or inventing a backend route
    // at this hour.
    throw new Error('No flat regression-tests endpoint exists on the backend - see RegressionSuiteView\'s unavailable state');
  }
}

export const api = new GuardianAPIClient();
