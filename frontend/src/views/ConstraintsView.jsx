import React, { useState } from 'react';
import { 
  Search, 
  ChevronDown, 
  CheckCircle2, 
  AlertTriangle, 
  Star,
  ArrowRight,
  ShieldAlert,
  Code2
} from 'lucide-react';

export default function ConstraintsView({ constraints = [], onNavigateTo }) {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [evalFilter, setEvalFilter] = useState('ALL');

  const filtered = constraints.filter((c) => {
    const matchesSearch =
      !search ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.forbidden_action.toLowerCase().includes(search.toLowerCase());

    const matchesSeverity = severityFilter === 'ALL' || c.severity === severityFilter;
    const matchesEval = evalFilter === 'ALL' || c.evaluation_type === evalFilter;

    return matchesSearch && matchesSeverity && matchesEval;
  });

  const getConstraintLinkage = (c) => {
    const policy = c.source_policy?.split(',')?.[0]?.trim() || 'P-001';
    let attack = 'A-001';
    if (c.id === 'C-004' || c.id === 'C-005') attack = 'A-004';
    if (c.id === 'C-009') attack = 'A-009';
    if (c.id === 'C-002') attack = 'A-001';

    return { policy, attack };
  };

  return (
    <div className="space-y-6 animate-view-fade">
      {/* Header with high-contrast type scale */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            Extracted Security Constraints
          </h1>
          <span className="px-2.5 py-0.5 rounded-sm text-xs font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 tracking-wider">
            {constraints.length} Enforced Rules
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          Formal preconditions, forbidden execution vectors, and deterministic verification criteria extracted from corporate security policies.
        </p>
      </div>

      {/* Filter Toolbar with Sharp Borders */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search constraint ID, action, or condition..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs font-mono bg-app-panel border border-app-border rounded-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
          />
        </div>

        {/* Severity Select */}
        <div className="relative">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="h-9 pl-3 pr-8 text-xs font-mono bg-app-panel border border-app-border rounded-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 appearance-none cursor-pointer hover:bg-white/[0.02] transition-all"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Evaluation Type Select */}
        <div className="relative">
          <select
            value={evalFilter}
            onChange={(e) => setEvalFilter(e.target.value)}
            className="h-9 pl-3 pr-8 text-xs font-mono bg-app-panel border border-app-border rounded-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 appearance-none cursor-pointer hover:bg-white/[0.02] transition-all"
          >
            <option value="ALL">All Evaluation Types</option>
            <option value="DETERMINISTIC">DETERMINISTIC</option>
            <option value="HYBRID">HYBRID</option>
            <option value="SEMANTIC">SEMANTIC</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Constraints Data Cards with Hierarchical Contrast & Linkage Chips */}
      <div className="space-y-3">
        {filtered.map((c) => {
          const isCritical = c.severity === 'CRITICAL';
          const link = getConstraintLinkage(c);

          return (
            <div
              key={c.id}
              className={`p-4 rounded-sm border transition-all space-y-3 ${
                isCritical
                  ? 'bg-[#120c10] border-red-500/30 border-l-4 border-l-red-500 shadow-panel'
                  : 'bg-app-card/70 border-app-borderSubtle hover:border-slate-700'
              }`}
            >
              {/* Header row: ID, Title, Severity, Evaluation Type */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Small monospace badge */}
                  <span className="font-mono text-xs font-bold text-slate-300 bg-black/50 px-2 py-0.5 rounded-sm border border-slate-800">
                    {c.id}
                  </span>

                  {/* Primary bold title */}
                  <h3 className="text-sm font-bold text-white font-sans">
                    {c.title}
                  </h3>

                  {/* Surface tag */}
                  <code className="text-[11px] font-mono text-sky-400 bg-black/40 px-2 py-0.5 rounded-sm border border-slate-800">
                    {c.primary_surface}
                  </code>
                </div>

                <div className="flex items-center gap-2">
                  {/* Severity Badge with Triangle Icon */}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider ${
                      isCritical
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40 ring-1 ring-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.15)]'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {c.severity}
                  </span>

                  {/* Evaluation type */}
                  <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono text-slate-300 bg-black/40 border border-slate-800">
                    {c.evaluation_type}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                {c.description}
              </p>

              {/* Distinct Forbidden Action & Required Condition Code Blocks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded-sm bg-[#090d15] border border-red-500/20 text-red-200">
                  <span className="text-red-400/80 font-bold block mb-1 select-none text-[10px] uppercase tracking-wider">
                    // FORBIDDEN_ACTION:
                  </span>
                  <code>{c.forbidden_action}</code>
                </div>

                <div className="p-2.5 rounded-sm bg-[#090d15] border border-emerald-500/20 text-emerald-200">
                  <span className="text-emerald-400/80 font-bold block mb-1 select-none text-[10px] uppercase tracking-wider">
                    // REQUIRED_CONDITION:
                  </span>
                  <code>{c.required_condition}</code>
                </div>
              </div>

              {/* Traceability Linkage Breadcrumb Chip */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-[10px] font-mono">
                <span className="text-slate-500">
                  POLICY-CONSTRAINT-ATTACK MAPPING
                </span>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-black/30 border border-slate-800 text-slate-400">
                  <button
                    onClick={() => onNavigateTo && onNavigateTo('config')}
                    className="text-blue-400 hover:text-blue-300 font-bold hover:underline"
                  >
                    {link.policy}
                  </button>
                  <span className="text-slate-600">→</span>
                  <span className="text-amber-300 font-bold">{c.id}</span>
                  <span className="text-slate-600">→</span>
                  <button
                    onClick={() => onNavigateTo && onNavigateTo('attacks')}
                    className="text-red-400 hover:text-red-300 font-bold hover:underline"
                  >
                    {link.attack}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
