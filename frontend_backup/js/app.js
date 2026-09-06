/**
 * AI AGENT GUARDIAN — Frontend Application Controller
 * Enterprise Red-Teaming & Security Verification Platform
 * Modules:
 * - Shell & Navigation Controller
 * - Agent Configuration & Policy Ingestion
 * - Extracted Constraints & Rule Engine
 * - Threat Model Visualization & Interactive Topology
 * - Attack Queue & Scenario Catalog
 * - Attack Details & Objective Deep Inspector
 * - Sandboxed Execution, Trace Viewer & Verdict Scoring
 * - Fix Verification & Continuous Regression Testing
 */

class GuardianApp {
  constructor() {
    this.currentView = "config";
    this.currentVersion = "ver-1.0"; // 'ver-1.0' (vulnerable) | 'ver-1.1' (protected)
    this.selectedAttack = null;
    this.activeRun = null;
    this.selectedThreatNode = null;

    // Reactive State Cache (Populated from Live Backend API or Fallback)
    this.agent = null;
    this.attacks = [];
    this.constraints = [];
    this.regressionTests = [];

    this.filters = {
      constraintSearch: "",
      constraintSeverity: "ALL",
      constraintEval: "ALL",
      attackSearch: "",
      attackFamily: "ALL",
      attackPriority: "ALL"
    };

    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.checkBackendConnection();
    await this.loadData();
    this.renderAll();
  }

  async loadData() {
    try {
      this.agent = await window.guardianAPI.getAgent();
      this.attacks = await window.guardianAPI.getAttacks();
      this.constraints = await window.guardianAPI.getConstraints();
      this.regressionTests = await window.guardianAPI.getRegressionTests();
    } catch (e) {
      console.warn("Could not load data from API, using fallback:", e);
    }
  }

  async checkBackendConnection() {
    const isOnline = await window.guardianAPI.checkHealth();
    this.updateConnectionBadge(isOnline);
    window.guardianAPI.onConnectionChange(async (online) => {
      this.updateConnectionBadge(online);
      await this.loadData();
      this.renderAll();
    });
  }

  updateConnectionBadge(isOnline) {
    const el = document.getElementById("backend-conn-status");
    if (!el) return;
    if (isOnline) {
      el.className = "conn-pill online";
      el.innerHTML = `<span class="status-badge-dot"></span> LIVE BACKEND API (8000)`;
    } else {
      el.className = "conn-pill mock";
      el.innerHTML = `● OFFLINE (Local Seed Dataset)`;
    }
  }

  // Navigation and Routing
  switchView(viewId) {
    this.currentView = viewId;

    // Update nav item states
    document.querySelectorAll(".nav-item").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === viewId);
    });

    // Update demo flow breadcrumb
    document.querySelectorAll(".flow-step-item").forEach((step) => {
      step.classList.toggle("active", step.dataset.view === viewId);
    });

    // Toggle view visibility
    document.querySelectorAll(".view-section").forEach((sec) => {
      sec.style.display = sec.id === `view-${viewId}` ? "block" : "none";
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  setVersion(verId) {
    this.currentVersion = verId;

    document.querySelectorAll(".version-toggle-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.version === verId);
    });

    const isVuln = verId === "ver-1.0";
    const labelEl = document.getElementById("header-version-label");
    if (labelEl) {
      labelEl.textContent = isVuln ? "v1.0 (Vulnerable)" : "v1.1 (Protected)";
      labelEl.className = isVuln ? "pill p-critical" : "pill p-safe";
    }

    // Update system prompt textarea if in config view
    const versionObj = window.GUARDIAN_DATA.agent.versions.find((v) => v.id === verId);
    const promptInput = document.getElementById("prompt-input");
    if (promptInput && versionObj) {
      promptInput.value = versionObj.system_prompt;
    }
  }

  setupEventListeners() {
    // Nav menu items
    document.querySelectorAll(".nav-item, .flow-step-item").forEach((el) => {
      el.addEventListener("click", () => {
        const view = el.dataset.view;
        if (view) this.switchView(view);
      });
    });

    // Version switcher buttons
    document.querySelectorAll(".version-toggle-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.setVersion(btn.dataset.version);
      });
    });

    // Constraint filters
    const cSearch = document.getElementById("constraint-search");
    if (cSearch) cSearch.addEventListener("input", (e) => {
      this.filters.constraintSearch = e.target.value.toLowerCase();
      this.renderConstraints();
    });

    const cSev = document.getElementById("constraint-sev-filter");
    if (cSev) cSev.addEventListener("change", (e) => {
      this.filters.constraintSeverity = e.target.value;
      this.renderConstraints();
    });

    const cEval = document.getElementById("constraint-eval-filter");
    if (cEval) cEval.addEventListener("change", (e) => {
      this.filters.constraintEval = e.target.value;
      this.renderConstraints();
    });

    // Attack filters
    const aSearch = document.getElementById("attack-search");
    if (aSearch) aSearch.addEventListener("input", (e) => {
      this.filters.attackSearch = e.target.value.toLowerCase();
      this.renderAttackQueue();
    });

    const aFam = document.getElementById("attack-family-filter");
    if (aFam) aFam.addEventListener("change", (e) => {
      this.filters.attackFamily = e.target.value;
      this.renderAttackQueue();
    });

    const aPri = document.getElementById("attack-priority-filter");
    if (aPri) aPri.addEventListener("change", (e) => {
      this.filters.attackPriority = e.target.value;
      this.renderAttackQueue();
    });

    // Modal Close
    const closeBtn = document.getElementById("modal-close-btn");
    if (closeBtn) closeBtn.addEventListener("click", () => this.closeAttackModal());

    const modalOverlay = document.getElementById("attack-detail-modal");
    if (modalOverlay) {
      modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) this.closeAttackModal();
      });
    }

    // Modal Execute Button
    const modalExecBtn = document.getElementById("modal-exec-attack-btn");
    if (modalExecBtn) {
      modalExecBtn.addEventListener("click", () => {
        if (this.selectedAttack) {
          this.closeAttackModal();
          this.executeAttack(this.selectedAttack.id);
        }
      });
    }

    // Export Config JSON
    const exportBtn = document.getElementById("btn-export-config");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => this.exportAgentConfig());
    }

    // Regenerate Threat Model
    const regenBtn = document.getElementById("btn-regen-threat");
    if (regenBtn) {
      regenBtn.addEventListener("click", () => this.regenerateThreatModel());
    }

    // Compare Run buttons
    const btnRunV10 = document.getElementById("btn-run-v10-compare");
    if (btnRunV10) {
      btnRunV10.addEventListener("click", () => {
        this.setVersion("ver-1.0");
        this.executeAttack("A-001");
      });
    }

    const btnRunV11 = document.getElementById("btn-run-v11-compare");
    if (btnRunV11) {
      btnRunV11.addEventListener("click", () => {
        this.setVersion("ver-1.1");
        this.executeAttack("A-001");
      });
    }
  }

  renderAll() {
    this.renderAgentConfig();
    this.renderConstraints();
    this.renderThreatModel();
    this.renderAttackQueue();
    this.renderRegressionSuite();
    this.switchView(this.currentView);
  }

  // =========================================================================
  // SECTION 1: AGENT CONFIGURATION & POLICIES
  // =========================================================================
  renderAgentConfig() {
    const agent = this.agent || window.GUARDIAN_DATA.agent;
    const versions = agent.versions || window.GUARDIAN_DATA.agent.versions;
    const curVer = versions.find((v) => v.id === this.currentVersion) || versions[0];

    const promptInput = document.getElementById("prompt-input");
    if (promptInput) promptInput.value = curVer.system_prompt;

    // Render Tools List
    const toolsContainer = document.getElementById("tools-list-container");
    if (toolsContainer) {
      toolsContainer.innerHTML = agent.tools.map((t) => `
        <div class="tool-card">
          <div class="tool-card-head" onclick="guardianApp.toggleToolAccordion('${t.id}')">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="tool-name-code">${t.name}()</span>
              <span class="badge-sev badge-sev-${t.risk_level.toLowerCase()}">${t.risk_level}</span>
            </div>
            <span class="text-muted" style="font-size:11px;">${t.is_protected ? "🛡️ Policy Guarded" : "Open access"} ▾</span>
          </div>
          <div class="tool-card-body" id="tool-body-${t.id}">
            <p style="margin-bottom:8px; color:var(--text-main);">${t.description}</p>
            <div class="tool-detail-row">
              <span class="tool-detail-lbl">Precondition:</span>
              <span class="tool-detail-val">${t.preconditions}</span>
            </div>
            <div class="tool-detail-row">
              <span class="tool-detail-lbl">Side Effects:</span>
              <span class="tool-detail-val">${t.side_effects}</span>
            </div>
            <div class="tool-detail-row">
              <span class="tool-detail-lbl">Input Schema:</span>
              <span class="tool-detail-val">${JSON.stringify(t.input_schema.properties)}</span>
            </div>
          </div>
        </div>
      `).join("");
    }

    // Render Policies
    const policyContainer = document.getElementById("policies-list-container");
    if (policyContainer) {
      policyContainer.innerHTML = agent.policies.map((p) => `
        <div class="policy-item">
          <div class="policy-item-title">
            <span><strong>${p.id}</strong> · ${p.title}</span>
            <span class="badge-sev badge-sev-${p.severity.toLowerCase()}">${p.severity}</span>
          </div>
          <p class="policy-item-body">${p.description}</p>
          <div style="margin-top:6px; font-size:11px; color:var(--text-faint);">
            Target Action: <code class="code-pill">${p.protected_action}</code>
          </div>
        </div>
      `).join("");
    }
  }

  toggleToolAccordion(toolId) {
    const el = document.getElementById(`tool-body-${toolId}`);
    if (el) {
      el.style.display = el.style.display === "none" ? "block" : "none";
    }
  }

  exportAgentConfig() {
    const agent = window.GUARDIAN_DATA.agent;
    const ver = agent.versions.find((v) => v.id === this.currentVersion);
    const configPayload = {
      schema_version: "1.0",
      agent: {
        name: agent.name,
        description: agent.description,
        version: ver.version_label
      },
      prompt: {
        system_prompt: document.getElementById("prompt-input").value
      },
      tools: agent.tools,
      policies: agent.policies,
      constraints: window.GUARDIAN_DATA.constraints
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(configPayload, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `shopassist_config_${this.currentVersion}.json`);
    dlAnchor.click();
  }

  // =========================================================================
  // SECTION 2: EXTRACTED CONSTRAINTS
  // =========================================================================
  renderConstraints() {
    const list = this.constraints && this.constraints.length > 0
      ? this.constraints
      : window.GUARDIAN_DATA.constraints;
    const tableBody = document.getElementById("constraints-table-body");
    if (!tableBody) return;

    const filtered = list.filter((c) => {
      const matchSearch =
        !this.filters.constraintSearch ||
        c.id.toLowerCase().includes(this.filters.constraintSearch) ||
        c.title.toLowerCase().includes(this.filters.constraintSearch) ||
        c.forbidden_action.toLowerCase().includes(this.filters.constraintSearch);

      const matchSev =
        this.filters.constraintSeverity === "ALL" || c.severity === this.filters.constraintSeverity;

      const matchEval =
        this.filters.constraintEval === "ALL" || c.evaluation_type === this.filters.constraintEval;

      return matchSearch && matchSev && matchEval;
    });

    tableBody.innerHTML = filtered.map((c) => {
      const isPinned = c.id === "C-001" || c.id === "C-002";
      return `
        <tr class="${isPinned ? "pinned-row" : ""}">
          <td>
            <strong>${c.id}</strong>
            ${isPinned ? '<span style="color:#ef4444; font-size:10px; margin-left:4px;">★ P0</span>' : ""}
          </td>
          <td>
            <div style="font-weight:600;">${c.title}</div>
            <div style="font-size:11.5px; color:var(--text-muted); margin-top:2px;">${c.forbidden_action}</div>
          </td>
          <td><code class="code-pill">${c.primary_surface}</code></td>
          <td><span class="badge-sev badge-sev-${c.severity.toLowerCase()}">${c.severity}</span></td>
          <td><span class="text-mono" style="font-size:11px; color:#cbd5e1;">${c.evaluation_type}</span></td>
          <td>
            <span class="pill ${c.mvp_status === "ACTIVE" ? "p-safe" : "p-leak"}" style="font-size:10px;">
              ${c.mvp_status}
            </span>
          </td>
        </tr>
      `;
    }).join("");
  }

  // =========================================================================
  // SECTION 3: THREAT MODEL VISUALIZATION
  // =========================================================================
  renderThreatModel() {
    const tm = window.GUARDIAN_DATA.threat_model;

    // Assets
    const assetCol = document.getElementById("threat-col-assets");
    if (assetCol) {
      assetCol.innerHTML = tm.assets.map((a) => `
        <div class="threat-node ${this.selectedThreatNode?.id === a.id ? "selected" : ""}" onclick="guardianApp.selectThreatNode('asset', '${a.id}')">
          <div class="threat-node-title">
            <span>${a.name}</span>
            <span class="badge-sev badge-sev-${a.risk.toLowerCase()}">${a.risk}</span>
          </div>
          <div class="threat-node-sub">${a.type}</div>
        </div>
      `).join("");
    }

    // Boundaries
    const bCol = document.getElementById("threat-col-boundaries");
    if (bCol) {
      bCol.innerHTML = tm.trust_boundaries.map((b) => `
        <div class="threat-node ${this.selectedThreatNode?.id === b.id ? "selected" : ""}" onclick="guardianApp.selectThreatNode('boundary', '${b.id}')">
          <div class="threat-node-title">
            <span>${b.name}</span>
          </div>
          <div class="threat-node-sub">${b.description}</div>
        </div>
      `).join("");
    }

    // Dangerous Actions
    const actCol = document.getElementById("threat-col-actions");
    if (actCol) {
      actCol.innerHTML = tm.dangerous_actions.map((act) => `
        <div class="threat-node ${this.selectedThreatNode?.id === act.id ? "selected" : ""}" onclick="guardianApp.selectThreatNode('action', '${act.id}')">
          <div class="threat-node-title">
            <code class="code-pill">${act.tool}()</code>
            <span class="badge-sev badge-sev-critical">CRITICAL</span>
          </div>
          <div class="threat-node-sub">${act.condition}</div>
        </div>
      `).join("");
    }

    // Default inspection
    if (!this.selectedThreatNode) {
      this.selectThreatNode("asset", "asset-refund");
    }
  }

  selectThreatNode(type, id) {
    const tm = window.GUARDIAN_DATA.threat_model;
    let node = null;
    if (type === "asset") node = tm.assets.find((n) => n.id === id);
    if (type === "boundary") node = tm.trust_boundaries.find((n) => n.id === id);
    if (type === "action") node = tm.dangerous_actions.find((n) => n.id === id);

    this.selectedThreatNode = node;
    this.renderThreatModel();

    const inspector = document.getElementById("threat-inspector-content");
    if (!inspector || !node) return;

    inspector.innerHTML = `
      <div style="margin-bottom:12px;">
        <span class="text-mono" style="font-size:10px; color:var(--text-faint); text-transform:uppercase;">${type} details</span>
        <h4 style="font-size:15px; margin:4px 0; color:var(--text-main);">${node.name || node.tool}</h4>
      </div>
      <p style="font-size:12px; color:var(--text-muted); margin-bottom:14px;">${node.description || node.condition}</p>
      <div style="border-top:1px solid var(--border-subtle); padding-top:12px; font-size:11.5px;">
        <div style="margin-bottom:6px;"><strong>Target Constraints:</strong> <code class="code-pill">${node.constraint_id || "C-001, C-002"}</code></div>
        <div style="margin-bottom:6px;"><strong>Target Policy:</strong> P-001 (Refund Verification)</div>
        <div><strong>Mitigation Surface:</strong> Policy Guard on <code>issue_refund</code></div>
      </div>
    `;
  }

  regenerateThreatModel() {
    const btn = document.getElementById("btn-regen-threat");
    if (btn) btn.innerHTML = `<span>⏳ Synthesizing...</span>`;
    setTimeout(() => {
      if (btn) btn.innerHTML = `<span>⚡ Threat Model Generated</span>`;
      this.renderThreatModel();
      setTimeout(() => {
        if (btn) btn.innerHTML = `<span>⚡ Regenerate Model</span>`;
      }, 1500);
    }, 600);
  }

  // =========================================================================
  // SECTION 4: ATTACK QUEUE & SCENARIOS
  // =========================================================================
  renderAttackQueue() {
    const list = this.attacks && this.attacks.length > 0
      ? this.attacks
      : window.GUARDIAN_DATA.attacks;
    const container = document.getElementById("attack-queue-container");
    if (!container) return;

    const filtered = list.filter((a) => {
      const matchSearch =
        !this.filters.attackSearch ||
        a.id.toLowerCase().includes(this.filters.attackSearch) ||
        a.name.toLowerCase().includes(this.filters.attackSearch) ||
        a.objective.toLowerCase().includes(this.filters.attackSearch);

      const matchFam =
        this.filters.attackFamily === "ALL" || a.attack_family === this.filters.attackFamily;

      const matchPri =
        this.filters.attackPriority === "ALL" || a.priority === this.filters.attackPriority;

      return matchSearch && matchFam && matchPri;
    });

    container.innerHTML = filtered.map((a) => {
      const isPinned = a.id === "A-001" || a.id === "A-002";
      return `
        <div class="attack-queue-card ${isPinned ? "pinned" : ""}">
          <div class="attack-card-left">
            <div class="attack-meta-row">
              <span class="badge-priority p-${a.priority.toLowerCase()}">${a.priority}</span>
              <strong>${a.id}</strong>
              <span class="pill p-policy" style="font-size:10px;">${a.attack_family}</span>
              <span class="code-pill">${a.target_constraints.join(", ")}</span>
            </div>
            <div class="attack-title">${a.name}</div>
            <div class="attack-obj">${a.objective}</div>
          </div>
          <div class="attack-card-actions">
            <button class="btn btn-secondary btn-sm" onclick="guardianApp.openAttackModal('${a.id}')">
              Inspect Details 🔍
            </button>
            <button class="btn btn-danger btn-sm" onclick="guardianApp.executeAttack('${a.id}')">
              Run Attack ↗
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  // ATTACK DETAILS & OBJECTIVE DEEP INSPECTOR MODAL
  openAttackModal(attackId) {
    const attackList = this.attacks && this.attacks.length > 0
      ? this.attacks
      : window.GUARDIAN_DATA.attacks;
    const attack = attackList.find((a) => a.id === attackId);
    if (!attack) return;
    this.selectedAttack = attack;

    document.getElementById("modal-attack-id").textContent = `${attack.id} · ${attack.name}`;
    document.getElementById("modal-priority-badge").className = `badge-priority p-${attack.priority.toLowerCase()}`;
    document.getElementById("modal-priority-badge").textContent = attack.priority;

    document.getElementById("modal-family-tag").textContent = attack.attack_family;
    document.getElementById("modal-constraints-tag").textContent = attack.target_constraints.join(", ");
    document.getElementById("modal-objective-text").textContent = attack.objective;
    document.getElementById("modal-expected-violation").textContent = attack.expected_violation;
    document.getElementById("modal-rationale-text").textContent = attack.rationale;

    // Render Payload Prompt (Single turn or multi-turn)
    const payloadContainer = document.getElementById("modal-payload-content");
    if (payloadContainer) {
      if (Array.isArray(attack.payload) && attack.payload.length > 1) {
        payloadContainer.innerHTML = attack.payload.map((turn, idx) => `
          <div class="turn-bubble">
            <span class="turn-tag">Turn ${idx + 1} / ${attack.payload.length}</span>
            <div style="color:#f1f5f9;">${turn}</div>
          </div>
        `).join("");
      } else {
        const text = Array.isArray(attack.payload) ? attack.payload[0] : attack.payload;
        payloadContainer.innerHTML = `<div class="prompt-display-box">${text}</div>`;
      }
    }

    // Render Initial State JSON
    const stateContainer = document.getElementById("modal-state-json");
    if (stateContainer) {
      stateContainer.textContent = JSON.stringify(attack.initial_security_state, null, 2);
    }

    const modal = document.getElementById("attack-detail-modal");
    if (modal) modal.classList.add("open");
  }

  closeAttackModal() {
    const modal = document.getElementById("attack-detail-modal");
    if (modal) modal.classList.remove("open");
  }

  // =========================================================================
  // SCREEN 4 & 5: RUN ATTACK & TRACE VIEWER
  // =========================================================================
  async executeAttack(attackId) {
    const attackList = this.attacks && this.attacks.length > 0
      ? this.attacks
      : window.GUARDIAN_DATA.attacks;
    const attack = attackList.find((a) => a.id === attackId) || attackList[0];
    this.switchView("execution");

    const execHeader = document.getElementById("exec-target-header");
    if (execHeader) {
      execHeader.textContent = `${attack.id} · ${attack.name}`;
    }

    // Set Running State (State A)
    const runningBox = document.getElementById("exec-running-box");
    const verdictBox = document.getElementById("exec-verdict-box");
    const traceList = document.getElementById("trace-events-list");

    if (runningBox) runningBox.style.display = "block";
    if (verdictBox) verdictBox.style.display = "none";
    if (traceList) traceList.innerHTML = `<div class="text-muted" style="text-align:center; padding:20px;">Initializing sandboxed run...</div>`;

    const statusText = document.getElementById("exec-status-message");

    const runResult = await window.guardianAPI.runAttack(
      attack.id,
      this.currentVersion,
      (progress) => {
        if (statusText) statusText.textContent = `${progress.status}: ${progress.stage}`;
      }
    );

    this.activeRun = runResult;
    this.renderExecutionResult(runResult, attack);
  }

  renderExecutionResult(run, attack) {
    const runningBox = document.getElementById("exec-running-box");
    const verdictBox = document.getElementById("exec-verdict-box");
    if (runningBox) runningBox.style.display = "none";
    if (verdictBox) verdictBox.style.display = "block";

    const label = run.finding?.label || run.deterministic_result?.label || "SAFE";
    const pillClass = `p-${label.toLowerCase().replace("_", "-")}`;

    // Verdict Box
    const pillEl = document.getElementById("verdict-pill");
    if (pillEl) {
      pillEl.className = `pill ${pillClass}`;
      pillEl.textContent = label;
    }

    const rationaleEl = document.getElementById("verdict-rationale");
    if (rationaleEl) {
      rationaleEl.textContent = run.finding?.rationale || "Completed execution analysis.";
    }

    const confEl = document.getElementById("verdict-confidence");
    if (confEl) {
      confEl.textContent = `Confidence: ${(run.finding?.confidence || 0.95) * 100}% · Rule: ${run.deterministic_result?.violations?.[0] || "C-001"}`;
    }

    // Render Trace Events (Screen 5)
    const traceList = document.getElementById("trace-events-list");
    if (traceList && run.events) {
      traceList.innerHTML = run.events.map((evt) => {
        const isFlag = evt.type === "SECURITY_EVENT";
        const isBlock = evt.type === "POLICY_INTERCEPT";

        let badgeClass = "tt-agent";
        if (evt.type === "USER_MESSAGE") badgeClass = "tt-user";
        if (evt.type === "TOOL_CALL") badgeClass = "tt-tool-call";
        if (evt.type === "TOOL_RESULT") badgeClass = "tt-tool-result";
        if (isFlag) badgeClass = "tt-security";
        if (isBlock) badgeClass = "tt-intercept";

        let detailHtml = "";
        if (evt.tool && evt.arguments) {
          detailHtml = `<div class="text-mono" style="color:#d8b4fe; font-size:11.5px; margin-top:2px;">${evt.tool}( ${JSON.stringify(evt.arguments)} )</div>`;
        } else if (evt.result) {
          detailHtml = `<div class="text-mono" style="color:#5eead4; font-size:11.5px; margin-top:2px;">result: ${JSON.stringify(evt.result)}</div>`;
        } else if (evt.content) {
          detailHtml = `<div style="color:var(--text-main); font-size:12px; margin-top:2px;">${evt.content}</div>`;
        }

        return `
          <div class="trace-item ${isFlag ? "flagged" : ""}">
            <span class="trace-type-badge ${badgeClass}">${evt.type}</span>
            <div class="trace-content">
              ${detailHtml}
            </div>
            <span class="trace-time">${evt.timestamp.slice(11, 19)}</span>
          </div>
        `;
      }).join("");
    }
  }

  // =========================================================================
  // SECTION 6: REGRESSION SUITE & CONTINUOUS VERIFICATION
  // =========================================================================
  renderRegressionSuite() {
    const tests = this.regressionTests && this.regressionTests.length > 0
      ? this.regressionTests
      : window.GUARDIAN_DATA.regression_tests;
    const container = document.getElementById("regression-tests-body");
    if (!container) return;

    container.innerHTML = tests.map((t) => {
      const isReg = t.status_diff === "REGRESSION";
      return `
        <tr style="${isReg ? "background-color:rgba(239, 68, 68, 0.08);" : ""}">
          <td><strong>${t.attack_id}</strong></td>
          <td>${t.attack_name}</td>
          <td><code class="code-pill">${t.target_constraint}</code></td>
          <td><span class="pill p-blocked">${t.baseline_label}</span></td>
          <td>
            <span class="pill ${isReg ? "p-critical" : "p-blocked"}">${t.new_label}</span>
          </td>
          <td>
            <span class="pill ${isReg ? "p-critical" : "p-safe"}">
              ${isReg ? "⚠ REGRESSION" : t.status_diff}
            </span>
          </td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="guardianApp.rerunRegression('${t.id}')">
              Rerun ↻
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  async rerunRegression(testId) {
    const res = await window.guardianAPI.rerunRegressionTest(testId, this.currentVersion);
    const alertBox = document.getElementById("regression-alert-box");
    if (alertBox) {
      alertBox.style.display = "flex";
      alertBox.scrollIntoView({ behavior: "smooth" });
    }
  }
}

// Instantiate on load
document.addEventListener("DOMContentLoaded", () => {
  window.guardianApp = new GuardianApp();
});
