import React, { useState } from 'react';
import { 
  Shield, 
  FileText, 
  Save, 
  ArrowRight,
  AlertTriangle,
  Code2,
  Lock,
  Sparkles
} from 'lucide-react';

export default function AgentConfigView({ 
  agent, 
  currentVersion, 
  onPromptChange,
  onNavigateTo 
}) {
  const [savedNotice, setSavedNotice] = useState(false);

  const curVer = agent?.versions?.find((v) => v.id === currentVersion) || agent?.versions?.[0] || {};
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
      {/* Header with high-contrast type scale */}
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
          System prompt declarations, corporate security policies (P-001 through P-005), and interactive Red-Team Co-Pilot for ShopAssist.
        </p>
      </div>

      {/* Main Container */}
      <div className="space-y-6">
        {/* Target System Prompt Card */}
        <div className="p-5 rounded-sm bg-app-panel border border-app-border space-y-3 shadow-panel">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                <FileText className="w-4 h-4 text-blue-400" />
                Target System Prompt ({curVer.version_label || 'v1.0'})
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Directives, behavioral rules, and persona boundaries loaded into agent context.
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
              rows={8}
              className="w-full bg-[#080d14] text-slate-200 text-xs font-mono p-3.5 rounded-sm border border-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40 leading-relaxed transition-colors"
              spellCheck="false"
            />
          </div>
        </div>

        {/* Corporate Security Policies: Responsive Grid of Uniform Square Cards (Part C2) */}
        <div className="p-5 rounded-sm bg-app-panel border border-app-border space-y-4 shadow-panel">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                <Shield className="w-4 h-4 text-emerald-400" />
                Corporate Security Policies (Ingested Baseline)
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Formal enterprise requirements enforced across all agent workflows.
              </p>
            </div>
            <span className="text-[10.5px] font-mono text-slate-400 bg-black/40 px-2 py-0.5 rounded-sm border border-slate-800">
              {policies.length} Policies Ingested
            </span>
          </div>

          {/* Grid of Uniform Square Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {policies.map((p) => {
              const isCritical = p.severity === 'CRITICAL';
              const link = getPolicyLinkage(p.id);

              return (
                <div
                  key={p.id}
                  className="p-4 rounded-sm bg-[#0c111a] border border-app-borderSubtle hover:border-slate-700 transition-all flex flex-col justify-between h-[230px] group shadow-panel"
                >
                  {/* Top Row: Muted Monospace ID + Severity Badge */}
                  <div className="flex items-center justify-between pb-1 border-b border-white/[0.04]">
                    <span className="font-mono text-[10.5px] font-bold text-slate-400 bg-black/50 px-2 py-0.5 rounded-sm border border-slate-800">
                      {p.id}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[9.5px] font-mono font-bold uppercase tracking-wider ${
                        isCritical
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40 ring-1 ring-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.15)]'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {p.severity}
                    </span>
                  </div>

                  {/* Middle Section: Title + Description */}
                  <div className="space-y-1.5 my-2 flex-1">
                    <h4 className="text-xs font-bold text-white font-sans line-clamp-1 group-hover:text-blue-300 transition-colors">
                      {p.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed line-clamp-3">
                      {p.description}
                    </p>
                  </div>

                  {/* Pinned Bottom Section: Protected Action Code Tag + Linkage Breadcrumb */}
                  <div className="space-y-2 pt-2 border-t border-white/[0.04] mt-auto">
                    {/* Protected Action Tag */}
                    <div className="p-1.5 rounded-sm bg-[#070b12] border border-slate-800/80 text-[10.5px] font-mono text-sky-300 flex items-center justify-between truncate">
                      <span className="text-slate-500 select-none text-[9.5px]">ACTION:</span>
                      <code className="truncate ml-1">{p.protected_action}</code>
                    </div>

                    {/* Traceability Linkage Breadcrumb */}
                    <div className="flex items-center justify-between text-[9.5px] font-mono">
                      <span className="text-slate-500">TRACE:</span>
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-black/40 border border-slate-800">
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
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
