import React, { useState } from 'react';
import { 
  Search, 
  ChevronDown, 
  Eye, 
  Play, 
  X, 
  ShieldAlert, 
  Layers,
  ArrowRight,
  Activity,
  Flame,
  AlertTriangle
} from 'lucide-react';

export default function AttackCatalogView({ 
  attacks = [], 
  onRunAttack,
  onNavigateTo 
}) {
  const [search, setSearch] = useState('');
  const [familyFilter, setFamilyFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [modalAttack, setModalAttack] = useState(null);
  const [executingId, setExecutingId] = useState(null);

  const filtered = attacks.filter((a) => {
    const matchesSearch =
      !search ||
      a.id.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.objective.toLowerCase().includes(search.toLowerCase());

    const matchesFamily = familyFilter === 'ALL' || a.attack_family === familyFilter;
    const matchesPriority = priorityFilter === 'ALL' || a.priority === priorityFilter;

    return matchesSearch && matchesFamily && matchesPriority;
  });

  const handleTriggerRun = (attackId) => {
    setExecutingId(attackId);
    setTimeout(() => {
      onRunAttack(attackId);
      setExecutingId(null);
    }, 450);
  };

  const getBreadcrumbChip = (attack) => {
    const constraint = attack.target_constraints?.[0] || 'C-001';
    const policy = constraint.startsWith('C-001') || constraint.startsWith('C-002') || constraint.startsWith('C-003')
      ? 'P-001'
      : constraint.startsWith('C-004') || constraint.startsWith('C-005')
      ? 'P-003'
      : 'P-005';

    return (
      <div className="inline-flex items-center gap-1 font-mono text-[9.5px] px-2 py-0.5 rounded-sm bg-black/40 border border-slate-800 text-slate-400">
        <span className="text-blue-400 font-bold">{policy}</span>
        <span className="text-slate-600">→</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigateTo && onNavigateTo('constraints', constraint);
          }}
          className="text-amber-300 font-bold hover:underline"
        >
          {constraint}
        </button>
        <span className="text-slate-600">→</span>
        <span className="text-red-400 font-bold">{attack.id}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-view-fade">
      {/* Header with high-contrast type scale */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            Attack Queue &amp; Scenario Inspector
          </h1>
          <span className="px-2.5 py-0.5 rounded-sm text-xs font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/30 tracking-wider">
            {attacks.length} Test Scenarios
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          Systematic adversarial test harness categorized across 5 attack families. Target constraints and policies are verified in deterministic sandbox runs.
        </p>
      </div>

      {/* Filter Controls with Sharp Borders */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search attack ID, objective, or prompt keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs font-mono bg-app-panel border border-app-border rounded-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
          />
        </div>

        {/* Attack Family Dropdown */}
        <div className="relative">
          <select
            value={familyFilter}
            onChange={(e) => setFamilyFilter(e.target.value)}
            className="h-9 pl-3 pr-8 text-xs font-mono bg-app-panel border border-app-border rounded-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 appearance-none cursor-pointer hover:bg-white/[0.02] transition-all"
          >
            <option value="ALL">All Attack Families</option>
            <option value="tool_workflow_bypass">Tool Workflow Bypass</option>
            <option value="authority_impersonation">Authority Impersonation</option>
            <option value="multi_turn_manipulation">Multi-Turn Manipulation</option>
            <option value="data_access_boundary">Data Access Boundary</option>
            <option value="confidential_information_disclosure">Confidential Information Disclosure</option>
            <option value="benign_control">Benign Control</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Priority Dropdown */}
        <div className="relative">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-9 pl-3 pr-8 text-xs font-mono bg-app-panel border border-app-border rounded-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 appearance-none cursor-pointer hover:bg-white/[0.02] transition-all"
          >
            <option value="ALL">All Priorities</option>
            <option value="P0">P0 (Critical Exploit Focus)</option>
            <option value="P1">P1 (Secondary Exploit Path)</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Attack Cards Catalog: Distinct P0 Elevation vs P1 Receding */}
      <div className="space-y-3">
        {filtered.map((a) => {
          const isP0 = a.priority === 'P0';
          const isCurrentlyExecuting = executingId === a.id;

          return (
            <div
              key={a.id}
              className={`p-4 rounded-sm transition-all duration-150 flex items-center justify-between gap-4 border ${
                isP0
                  ? 'bg-[#150d11] border-red-500/40 border-l-4 border-l-red-500 shadow-card-p0 ring-1 ring-red-500/20'
                  : 'bg-app-card/60 border-app-borderSubtle hover:border-slate-700 opacity-90 hover:opacity-100'
              }`}
            >
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap text-xs">
                  {/* Priority Badge */}
                  <span
                    className={`px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold tracking-wider uppercase border ${
                      isP0
                        ? 'bg-red-500/20 text-red-300 border-red-500/50 shadow-sm'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {a.priority}
                  </span>

                  {/* ID */}
                  <span className="font-mono font-bold text-white text-xs tracking-wide">
                    {a.id}
                  </span>

                  {/* Attack Family */}
                  <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono bg-white/[0.04] text-slate-400 border border-app-borderSubtle">
                    {a.attack_family}
                  </span>

                  {/* Clickable Constraint Badges with Linkage */}
                  <div className="flex items-center gap-1">
                    {a.target_constraints?.map((cid) => (
                      <button
                        key={cid}
                        onClick={() => onNavigateTo && onNavigateTo('constraints', cid)}
                        className="text-amber-300 hover:text-amber-200 font-mono text-[10.5px] px-1.5 py-0.5 rounded-sm bg-black/40 border border-slate-800 hover:border-amber-500/40 transition-colors"
                      >
                        {cid}
                      </button>
                    ))}
                  </div>

                  {/* Traceability Linkage Breadcrumb Chip */}
                  {getBreadcrumbChip(a)}
                </div>

                <div className="text-sm font-semibold text-white font-sans">{a.name}</div>
                <div className="text-xs text-slate-400 line-clamp-1 font-sans">{a.objective}</div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setModalAttack(a)}
                  className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-app-panel hover:bg-white/[0.04] border border-app-border text-xs font-mono text-slate-200 transition-all"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 group-hover:shadow-icon-glow transition-all" />
                  <span>Inspect</span>
                </button>

                <button
                  onClick={() => handleTriggerRun(a.id)}
                  disabled={isCurrentlyExecuting}
                  className={`group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm text-xs font-mono font-semibold transition-all shadow-sm ${
                    isP0
                      ? 'bg-red-600 hover:bg-red-500 text-white border border-red-500'
                      : 'bg-white/[0.05] hover:bg-white/[0.08] text-slate-200 border border-slate-700'
                  }`}
                >
                  {isCurrentlyExecuting ? (
                    <>
                      <Activity className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Executing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-white/90 group-hover:scale-110 transition-all" />
                      <span>Run Attack</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Inspector */}
      {modalAttack && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e131d] border border-app-border rounded-sm max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-view-fade">
            {/* Modal Header */}
            <div className="p-4 border-b border-app-border flex items-center justify-between bg-[#111827]">
              <div className="flex items-center gap-2.5">
                <span className={`px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold border ${
                  modalAttack.priority === 'P0' 
                    ? 'bg-red-500/20 text-red-300 border-red-500/50' 
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {modalAttack.priority}
                </span>
                <h3 className="text-sm font-bold text-white font-mono">{modalAttack.id} · {modalAttack.name}</h3>
              </div>
              <button
                onClick={() => setModalAttack(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/[0.05]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto text-xs font-mono">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold block mb-1">Objective</span>
                <p className="text-slate-200 font-sans text-xs leading-relaxed">{modalAttack.objective}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold block mb-1">Attack Payload Prompt Sequence</span>
                <div className="space-y-2">
                  {modalAttack.payload?.map((turn, idx) => (
                    <div key={idx} className="p-3 rounded-sm bg-[#070a10] border border-slate-800/90 text-xs text-amber-200/90 leading-relaxed">
                      {modalAttack.payload.length > 1 && (
                        <div className="text-[10px] text-slate-500 mb-1 select-none">Turn {idx + 1} of {modalAttack.payload.length}</div>
                      )}
                      {turn}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold block mb-1">Evaluation &amp; Ground Truth Rationale</span>
                <p className="text-slate-300 leading-relaxed bg-black/40 p-3 rounded-sm border border-slate-800/80 font-sans text-xs">
                  {modalAttack.rationale}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold block mb-1">Initial Session Security State</span>
                <pre className="p-3 rounded-sm bg-black/50 border border-slate-800 text-[11px] text-sky-300 overflow-x-auto">
                  {JSON.stringify(modalAttack.initial_security_state, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-app-border flex items-center justify-end gap-3 bg-black/40">
              <button
                onClick={() => setModalAttack(null)}
                className="px-3.5 py-1.5 rounded-sm border border-app-border text-xs font-mono text-slate-300 hover:bg-white/[0.04]"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const id = modalAttack.id;
                  setModalAttack(null);
                  handleTriggerRun(id);
                }}
                className="px-4 py-1.5 rounded-sm bg-red-600 hover:bg-red-500 text-white font-mono font-semibold text-xs transition-all shadow-sm flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 text-white" />
                <span>Execute in Sandbox</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
