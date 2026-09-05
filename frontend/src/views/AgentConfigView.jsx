import React, { useState } from 'react';
import { 
  Shield, 
  Wrench, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Lock, 
  Save, 
  ArrowRight,
  AlertTriangle,
  Code2
} from 'lucide-react';

export default function AgentConfigView({ 
  agent, 
  currentVersion, 
  onPromptChange,
  onNavigateTo 
}) {
  const [openTool, setOpenTool] = useState('tool-issue-refund');
  const [savedNotice, setSavedNotice] = useState(false);

  const curVer = agent?.versions?.find((v) => v.id === currentVersion) || agent?.versions?.[0] || {};
  const tools = agent?.tools || [];
  const policies = agent?.policies || [];

  const handleSavePrompt = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1800);
  };

  const getPolicyLinkage = (policyId) => {
    switch (policyId) {
      case 'P-001':
        return { constraint: 'C-001', attack: 'A-001' };
      case 'P-002':
        return { constraint: 'C-002', attack: 'A-001' };
      case 'P-003':
        return { constraint: 'C-004', attack: 'A-004' };
      case 'P-004':
        return { constraint: 'C-005', attack: 'A-004' };
      case 'P-005':
        return { constraint: 'C-009', attack: 'A-009' };
      default:
        return { constraint: 'C-001', attack: 'A-001' };
    }
  };

  return (
    <div className="space-y-6 animate-view-fade">
      {/* View Header with high-contrast type scale */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            Agent Configuration &amp; Policy Ingestion
          </h1>
          <span className="px-2.5 py-0.5 rounded-sm text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 tracking-wider">
            Active Target Profile
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          System prompt declarations, sandboxed tool preconditions, and formal corporate security requirements for ShopAssist.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: System Prompt & Policies (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Target System Prompt Card */}
          <div className="p-5 rounded-sm bg-app-panel border border-app-border space-y-3 shadow-panel">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Target System Prompt ({curVer.version_label || 'v1.0'})
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Directives, behavioral rules, and contextual knowledge loaded into agent context.
                </p>
              </div>
              <button
                onClick={handleSavePrompt}
                className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-white/[0.04] hover:bg-white/[0.08] border border-app-border text-xs font-mono text-slate-300 transition-all"
              >
                <Save className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 group-hover:shadow-icon-glow transition-all" />
                <span>{savedNotice ? 'Saved!' : 'Save Changes'}</span>
              </button>
            </div>

            <div className="relative">
              <textarea
                value={curVer.system_prompt || ''}
                onChange={(e) => onPromptChange && onPromptChange(e.target.value)}
                rows={9}
                className="w-full bg-[#080d14] text-slate-200 text-xs font-mono p-3.5 rounded-sm border border-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40 leading-relaxed transition-colors"
                spellCheck="false"
              />
            </div>
          </div>

          {/* Corporate Security Policies with Hierarchical Fix & Linkage Chips */}
          <div className="p-5 rounded-sm bg-app-panel border border-app-border space-y-3 shadow-panel">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                <Shield className="w-4 h-4 text-emerald-400" />
                Corporate Security Policies (Ingested Baseline)
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Ground-truth enterprise security policies for ShopAssist.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {policies.map((p) => {
                const link = getPolicyLinkage(p.id);
                const isCritical = p.severity === 'CRITICAL';

                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-sm bg-[#0c111a] border border-app-borderSubtle hover:border-slate-700 transition-colors space-y-2.5"
                  >
                    {/* Header: ID, Title, Severity */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {/* Small monospace badge */}
                          <span className="font-mono text-[10px] text-slate-400 bg-black/40 px-1.5 py-0.5 rounded-sm border border-slate-800">
                            {p.id}
                          </span>

                          {/* Bold, larger, primary title */}
                          <h4 className="text-sm font-bold text-white font-sans">
                            {p.title}
                          </h4>
                        </div>
                      </div>

                      {/* Severity badge with triangle icon */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider ${
                          isCritical
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40 ring-1 ring-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.15)]'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {p.severity}
                      </span>
                    </div>

                    {/* Secondary description */}
                    <p className="text-xs text-slate-400 font-sans leading-relaxed">
                      {p.description}
                    </p>

                    {/* Distinct Protected Action Code-Block */}
                    <div className="p-2.5 rounded-sm bg-[#070b12] border border-slate-800 text-xs font-mono text-sky-300 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-400 select-none">PROTECTED_ACTION: </span>
                        <code>{p.protected_action}</code>
                      </div>
                    </div>

                    {/* Traceability Linkage Breadcrumb Chip */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                      <span className="text-[10px] font-mono text-slate-500">
                        PIPELINE TRACEABILITY
                      </span>
                      <div className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-sm bg-black/30 border border-slate-800 text-slate-400">
                        <span className="text-blue-400 font-bold">{p.id}</span>
                        <span className="text-slate-600">→</span>
                        <button
                          onClick={() => onNavigateTo && onNavigateTo('constraints', link.constraint)}
                          className="text-amber-300 hover:text-amber-200 font-bold hover:underline"
                        >
                          {link.constraint}
                        </button>
                        <span className="text-slate-600">→</span>
                        <button
                          onClick={() => onNavigateTo && onNavigateTo('attacks')}
                          className="text-red-400 hover:text-red-200 font-bold hover:underline"
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
        </div>

        {/* Right: Mock Tool Schemas (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-sm bg-app-panel border border-app-border space-y-3 shadow-panel">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                <Wrench className="w-4 h-4 text-amber-400" />
                Tool Capabilities &amp; Schemas
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Sandboxed tools exposed to the agent execution state machine.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              {tools.map((t) => {
                const isOpen = openTool === t.id;
                const isCritical = t.risk_level === 'CRITICAL';
                return (
                  <div
                    key={t.id}
                    className="rounded-sm bg-[#0c111a] border border-app-borderSubtle overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setOpenTool(isOpen ? null : t.id)}
                      className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-sky-400 font-bold">{t.name}()</span>
                        <span className={`px-1.5 py-0.2 rounded-sm text-[9px] font-mono font-bold uppercase border ${
                          isCritical
                            ? 'bg-red-500/20 text-red-300 border-red-500/40 ring-1 ring-red-500/20'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}>
                          {t.risk_level}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {t.is_protected ? (
                          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Guarded
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">Open</span>
                        )}
                        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-3.5 py-3 border-t border-slate-800/80 bg-[#080c13] text-xs font-mono space-y-2.5">
                        <p className="text-slate-300 font-sans text-xs">{t.description}</p>
                        <div className="space-y-1.5 text-[11px]">
                          <div>
                            <span className="text-slate-500">PRECONDITION: </span>
                            <span className="text-slate-300">{t.preconditions}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">SIDE_EFFECTS: </span>
                            <span className="text-slate-300">{t.side_effects}</span>
                          </div>
                          <div className="p-2 rounded-sm bg-black/40 border border-slate-800/80">
                            <span className="text-slate-500 block mb-1">PARAM_SCHEMA: </span>
                            <code className="text-amber-300 text-[10.5px]">{JSON.stringify(t.input_schema.properties, null, 2)}</code>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
