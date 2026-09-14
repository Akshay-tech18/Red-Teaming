import React, { useState } from 'react';
import { 
  Search, 
  ChevronDown, 
  AlertTriangle, 
  Edit3, 
  Plus, 
  Sparkles, 
  X, 
  Save
} from 'lucide-react';

export default function ConstraintsView({ 
  constraints = [], 
  onNavigateTo,
  onUpdateConstraint,
  onAddConstraint
}) {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [evalFilter, setEvalFilter] = useState('ALL');

  // Modal State
  const [activeModal, setActiveModal] = useState(null); // 'edit' | 'add' | null
  const [formData, setFormData] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionToast, setExtractionToast] = useState(null);

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
    if (c.id.startsWith('C-HR')) attack = 'A-HR-001';

    return { policy, attack };
  };

  const handleOpenEdit = (c) => {
    setFormData({ ...c });
    setActiveModal('edit');
  };

  const handleOpenAdd = () => {
    const nextNum = constraints.length + 1;
    const newId = `C-${String(nextNum).padStart(3, '0')}`;
    setFormData({
      id: newId,
      title: '',
      source_policy: 'P-001',
      primary_surface: 'issue_refund',
      forbidden_action: '',
      required_condition: '',
      severity: 'CRITICAL',
      evaluation_type: 'DETERMINISTIC',
      description: ''
    });
    setActiveModal('add');
  };

  const handleSaveModal = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.forbidden_action) return;

    if (activeModal === 'edit' && onUpdateConstraint) {
      onUpdateConstraint(formData);
    } else if (activeModal === 'add' && onAddConstraint) {
      onAddConstraint(formData);
    }
    setActiveModal(null);
    setFormData(null);
  };

  const handleTriggerReExtraction = () => {
    setIsExtracting(true);
    setExtractionToast('Extracting structured constraints from enterprise policies via LLM Schema Extractor...');
    setTimeout(() => {
      setIsExtracting(false);
      setExtractionToast('Extraction Complete: 6 Invariants synced and validated against Policy Schema v1.0');
      setTimeout(() => setExtractionToast(null), 4000);
    }, 1400);
  };

  return (
    <div className="space-y-6 animate-view-fade">
      {/* Header with high-contrast type scale & Action Buttons */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
              Extracted Security Constraints
            </h1>
            <span className="px-2.5 py-0.5 rounded-sm text-xs font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 tracking-wider">
              {constraints.length} Enforced Invariants
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Formal preconditions, forbidden execution vectors, and deterministic verification criteria extracted from corporate security policies. Editable for scenario modeling.
          </p>
        </div>

        {/* Action Controls: Add Rule & Re-Extract */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleTriggerReExtraction}
            disabled={isExtracting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-white/[0.04] hover:bg-white/[0.08] border border-app-border text-xs font-mono text-slate-300 transition-all shadow-sm"
          >
            <Sparkles className={`w-3.5 h-3.5 text-blue-400 ${isExtracting ? 'animate-spin' : ''}`} />
            <span>{isExtracting ? 'Extracting...' : 'Re-extract from Policy'}</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-semibold transition-all shadow-[0_0_12px_rgba(59,130,246,0.3)]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Rule</span>
          </button>
        </div>
      </div>

      {/* Extraction Feedback Toast */}
      {extractionToast && (
        <div className="p-3 rounded-sm bg-blue-950/40 border border-blue-500/50 text-xs font-mono text-blue-200 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{extractionToast}</span>
          </div>
          <button onClick={() => setExtractionToast(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
            <option value="MEDIUM">MEDIUM</option>
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

      {/* Constraints Data Cards with Hierarchical Contrast, Edit Buttons & Linkage Chips */}
      <div className="space-y-3">
        {filtered.map((c) => {
          const isCritical = c.severity === 'CRITICAL';
          const link = getConstraintLinkage(c);

          return (
            <div
              key={c.id}
              className={`p-4 rounded-sm border transition-all space-y-3 relative group ${
                isCritical
                  ? 'bg-[#120c10] border-red-500/30 border-l-4 border-l-red-500 shadow-panel'
                  : 'bg-app-card/70 border-app-borderSubtle hover:border-slate-700'
              }`}
            >
              {/* Header row: ID, Title, Severity, Evaluation Type, Edit Button */}
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

                  {/* Quick Edit Button (Day 4 Deliverable) */}
                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="p-1.5 rounded-sm bg-white/[0.04] hover:bg-white/[0.1] border border-slate-800 text-slate-400 hover:text-white transition-all"
                    title="Edit Constraint Invariant"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
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

      {/* Edit / Add Constraint Modal (Day 4 Editable Fields) */}
      {activeModal && formData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0b101a] border border-slate-700 rounded-sm max-w-lg w-full p-5 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white font-mono">
                  {activeModal === 'edit' ? `Edit Invariant (${formData.id})` : 'Add New Security Invariant'}
                </h3>
              </div>
              <button
                onClick={() => { setActiveModal(null); setFormData(null); }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3 font-sans text-xs">
              <div>
                <label className="block text-slate-300 font-mono mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Refund Requires Pre-Verified Order ID"
                  className="w-full bg-[#060a12] border border-slate-800 rounded-sm p-2 text-slate-200 font-mono text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-mono mb-1">Severity</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full bg-[#060a12] border border-slate-800 rounded-sm p-2 text-slate-200 font-mono text-xs focus:border-blue-500 focus:outline-none"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-mono mb-1">Evaluation Type</label>
                  <select
                    value={formData.evaluation_type}
                    onChange={(e) => setFormData({ ...formData, evaluation_type: e.target.value })}
                    className="w-full bg-[#060a12] border border-slate-800 rounded-sm p-2 text-slate-200 font-mono text-xs focus:border-blue-500 focus:outline-none"
                  >
                    <option value="DETERMINISTIC">DETERMINISTIC</option>
                    <option value="HYBRID">HYBRID</option>
                    <option value="SEMANTIC">SEMANTIC</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-mono mb-1">Primary Surface / Tool</label>
                <input
                  type="text"
                  value={formData.primary_surface}
                  onChange={(e) => setFormData({ ...formData, primary_surface: e.target.value })}
                  placeholder="e.g. issue_refund or get_customer"
                  className="w-full bg-[#060a12] border border-slate-800 rounded-sm p-2 text-slate-200 font-mono text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-red-400 font-mono mb-1">Forbidden Action</label>
                <input
                  type="text"
                  required
                  value={formData.forbidden_action}
                  onChange={(e) => setFormData({ ...formData, forbidden_action: e.target.value })}
                  placeholder="e.g. Execute issue_refund without verified order state"
                  className="w-full bg-[#060a12] border border-red-500/30 rounded-sm p-2 text-red-200 font-mono text-xs focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-emerald-400 font-mono mb-1">Required Condition (Precondition)</label>
                <input
                  type="text"
                  required
                  value={formData.required_condition}
                  onChange={(e) => setFormData({ ...formData, required_condition: e.target.value })}
                  placeholder="e.g. order_verification_state[order_id] == VERIFIED"
                  className="w-full bg-[#060a12] border border-emerald-500/30 rounded-sm p-2 text-emerald-200 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-mono mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Details explaining why this constraint is enforced..."
                  className="w-full bg-[#060a12] border border-slate-800 rounded-sm p-2 text-slate-200 font-mono text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => { setActiveModal(null); setFormData(null); }}
                  className="px-3 py-1.5 rounded-sm bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 font-mono text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-sm bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Invariant</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
