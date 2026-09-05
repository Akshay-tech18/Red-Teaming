import React from 'react';
import { Download, Zap, ShieldCheck, AlertCircle } from 'lucide-react';

export default function TopBar({ 
  currentVersion, 
  setVersion, 
  agent, 
  onRunDemo, 
  onExport 
}) {
  const isVulnerable = currentVersion === 'ver-1.0';

  return (
    <header className="h-14 px-6 bg-app-sidebar border-b border-app-border flex items-center justify-between sticky top-0 z-20">
      {/* Left controls */}
      <div className="flex items-center gap-4">
        {/* Target Agent Tag */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-app-panel border border-app-border text-xs">
          <span className="text-slate-400">Target Agent:</span>
          <span className="font-semibold text-white">{agent?.name || 'ShopAssist'}</span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
              isVulnerable
                ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {isVulnerable ? <AlertCircle className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
            {isVulnerable ? 'v1.0 (Vulnerable)' : 'v1.1 (Protected)'}
          </span>
        </div>

        {/* Version Switcher */}
        <div className="flex items-center p-0.5 rounded-md bg-black/40 border border-app-border">
          <button
            onClick={() => setVersion('ver-1.0')}
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
              isVulnerable
                ? 'bg-[#182030] text-red-400 font-semibold shadow-sm border border-red-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            v1.0 (Vulnerable)
          </button>
          <button
            onClick={() => setVersion('ver-1.1')}
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
              !isVulnerable
                ? 'bg-[#182030] text-emerald-400 font-semibold shadow-sm border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            v1.1 (Protected)
          </button>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onExport}
          className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-app-panel hover:bg-white/[0.04] border border-app-border hover:border-slate-600 text-xs text-slate-300 transition-all"
        >
          <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 group-hover:shadow-icon-glow transition-all" />
          <span>Export Config</span>
        </button>

        <button
          onClick={onRunDemo}
          className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white border border-blue-500 transition-all shadow-sm"
        >
          <Zap className="w-3.5 h-3.5 text-blue-200 group-hover:text-yellow-300 transition-colors" />
          <span>Run Primary Demo (A-001)</span>
        </button>
      </div>
    </header>
  );
}
