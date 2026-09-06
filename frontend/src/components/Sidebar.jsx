import React from 'react';
import { 
  Shield, 
  Settings, 
  FileCheck2, 
  Network, 
  Crosshair, 
  Activity, 
  GitCompare,
  GitFork,
  Wifi,
  WifiOff
} from 'lucide-react';

export default function Sidebar({ currentView, setView, isOnline }) {
  const navItems = [
    {
      group: "Security Pipeline",
      items: [
        { id: "config", num: "01", label: "Agent Configuration", tag: "Profile", icon: Settings },
        { id: "constraints", num: "02", label: "Extracted Constraints", tag: "Rules", icon: FileCheck2 },
        { id: "threat", num: "03", label: "Threat Decision Tree", tag: "Decision Fork", icon: GitFork },
        { id: "attacks", num: "04", label: "Attack Queue & Catalog", tag: "Scenarios", icon: Crosshair },
      ]
    },
    {
      group: "Evaluation & Regression",
      items: [
        { id: "execution", num: "05", label: "Live Run & Traces", tag: "Judged", icon: Activity },
        { id: "compare", num: "06", label: "Fix & Regression Suite", tag: "Diff", icon: GitCompare },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-app-sidebar border-r border-app-border flex flex-col h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-4 border-b border-app-border bg-[#0b0f17]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-[#101928] border border-blue-500/40 flex items-center justify-center text-blue-400 font-mono font-bold text-xs tracking-tighter shadow-icon-glow-subtle">
            &gt;_
          </div>
          <div>
            <div className="text-xs font-bold tracking-wider text-white font-mono flex items-center gap-1.5">
              AGENT.GUARDIAN
            </div>
            <div className="text-[10px] text-slate-400 font-mono tracking-wide mt-0.5">
              // RED-TEAM PLATFORM
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="p-2.5 flex-1 overflow-y-auto space-y-5">
        {navItems.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <div className="px-2.5 text-[9.5px] uppercase tracking-widest font-mono font-bold text-slate-400">
              {group.group}
            </div>
            <div className="space-y-0.5 pt-0.5">
              {group.items.map((item) => {
                const IconComponent = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={`group w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs transition-all duration-150 border text-left ${
                      isActive
                        ? 'bg-[#141f30] text-white border-blue-500/30 font-semibold shadow-sm'
                        : 'bg-transparent hover:bg-white/[0.03] text-slate-400 hover:text-slate-200 border-transparent'
                    }`}
                  >
                    {/* Icon container with targeted hover glow */}
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center font-mono text-[10px] transition-all duration-150 ${
                        isActive
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-icon-glow-subtle'
                          : 'bg-black/30 text-slate-400 border border-white/[0.05] group-hover:text-blue-400 group-hover:border-blue-500/50 group-hover:shadow-icon-glow group-hover:bg-blue-950/40'
                      }`}
                    >
                      <IconComponent className="w-3 h-3" />
                    </div>

                    {/* Step Name (primary visual weight) */}
                    <span className="truncate flex-1 font-sans text-xs tracking-tight">
                      {item.label}
                    </span>

                    {/* De-emphasized tag (receding, secondary) */}
                    <span
                      className={`text-[9px] font-mono transition-colors ${
                        isActive
                          ? 'text-blue-400/80 font-medium'
                          : 'text-slate-400 group-hover:text-slate-400'
                      }`}
                    >
                      {item.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / Backend Status Indicator */}
      <div className="p-3.5 border-t border-app-border bg-black/40 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-[10px] font-mono uppercase tracking-wider">ENGINE API</span>
          {isOnline ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              LIVE :8000
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-900 text-slate-400 border border-slate-700/50">
              <span className="w-2 h-2 rounded-full bg-slate-600"></span>
              OFFLINE (SEED)
            </span>
          )}
        </div>
        <div className="mt-1.5 text-[9.5px] text-slate-400 font-mono flex items-center justify-between">
          <span>FastAPI <code className="text-slate-400">/api/v1</code></span>
          <span>BUILD 0.1.0-SEC</span>
        </div>
      </div>
    </aside>
  );
}
