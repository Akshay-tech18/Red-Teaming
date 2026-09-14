import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  Zap, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles, 
  Play, 
  ChevronDown,
  BookOpen
} from 'lucide-react';

export default function TopBar({ 
  currentVersion, 
  setVersion, 
  agent, 
  isOnline,
  isCoPilotOpen,
  onToggleCoPilot,
  onRunDemo, 
  onExport,
  onExportAuditReport,
  onStartTour,
  activeTargetId = 'shopassist',
  onSwitchTarget,
  logoInHeader = true,
  onReplayLogo
}) {
  const isVulnerable = currentVersion === 'ver-1.0' || currentVersion === 'docu-1.0';
  const [hoveredOption, setHoveredOption] = useState(null);

  return (
    <header className="h-16 w-full bg-gradient-to-b from-[#0e1424] via-[#0b101c] to-[#080c15] border-b border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-md sticky top-0 z-30 select-none">
      <div className="max-w-[1440px] w-full mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-2 lg:gap-3">
        
        {/* ================================================================
            ZONE 1: Brand & Platform Identity
            ================================================================ */}
        <div className="flex items-center gap-3 shrink-0 min-w-max">
          {logoInHeader ? (
            <motion.div
              layoutId="brand-logo-lockup"
              onClick={onReplayLogo}
              title="Agent Guardian — Click to replay intro animation"
              transition={{
                type: "spring",
                stiffness: 110,
                damping: 22,
                mass: 1.1
              }}
              className="flex items-center gap-2.5 shrink-0 min-w-max cursor-pointer group"
            >
              <motion.div 
                layoutId="brand-logo-glyph"
                className="w-8 h-8 rounded-md bg-[#0d1627] border border-blue-500/40 flex items-center justify-center text-blue-400 font-mono font-bold text-xs tracking-tighter shadow-[0_0_12px_rgba(59,130,246,0.15)]"
              >
                &gt;_
              </motion.div>
              <div className="flex flex-col justify-center">
                <motion.div 
                  layoutId="brand-logo-title"
                  className="text-xs font-bold tracking-wider text-white font-mono leading-tight whitespace-nowrap"
                >
                  AGENT.GUARDIAN
                </motion.div>
                <motion.div 
                  layoutId="brand-logo-subtitle"
                  className="text-[9.5px] text-slate-400 font-mono tracking-wide leading-tight whitespace-nowrap"
                >
                  // RED-TEAM PLATFORM
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <div className="flex items-center gap-3 opacity-0 pointer-events-none select-none">
              <div className="w-8 h-8 rounded-md" />
              <div className="flex flex-col justify-center">
                <div className="text-xs font-mono">AGENT.GUARDIAN</div>
                <div className="text-[9.5px] font-mono">// RED-TEAM PLATFORM</div>
              </div>
            </div>
          )}
        </div>

        {/* Zone Divider 1 */}
        <div className="h-6 w-px bg-white/10 shrink-0 hidden sm:block" />

        {/* ================================================================
            ZONE 2: Multi-Target Switcher & Version Toggle (Day 18 & Day 13)
            ================================================================ */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Multi-Target Switcher Dropdown (Day 18 Stretch Goal) */}
          <div className="relative">
            <select
              value={activeTargetId}
              onChange={(e) => onSwitchTarget && onSwitchTarget(e.target.value)}
              className="h-8 pl-2.5 pr-7 text-xs font-mono bg-[#0c121e] border border-white/15 rounded-md text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer hover:bg-white/[0.04] transition-all shadow-sm"
              title="Switch Target Agent Architecture"
            >
              <option value="shopassist">Target: ShopAssist (E-Commerce)</option>
              <option value="docubot">Target: DocuBot (HR &amp; Salary)</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Unified Sliding-Pill Version Toggle */}
          <div className="relative flex items-center p-0.5 rounded-full bg-[#060912] border border-white/10 shadow-inner">
            <div 
              className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full transition-all duration-200 ease-out pointer-events-none ${
                isVulnerable ? 'left-0.5' : 'left-[calc(50%+1px)]'
              } ${
                isVulnerable
                  ? 'bg-red-500/20 border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.25)]'
                  : 'bg-emerald-500/20 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
              }`}
            />

            {/* Option 1: Vulnerable */}
            <button
              onClick={() => setVersion(activeTargetId === 'docubot' ? 'docu-1.0' : 'ver-1.0')}
              className={`relative z-10 px-2.5 py-1 text-[11px] font-mono font-semibold transition-colors flex items-center gap-1 leading-none ${
                isVulnerable ? 'text-red-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertCircle className={`w-3 h-3 shrink-0 ${isVulnerable ? 'text-red-400' : 'text-slate-500'}`} />
              <span>{activeTargetId === 'docubot' ? 'v1.0 (Vulnerable)' : 'v1.0 (Vulnerable)'}</span>
            </button>

            {/* Option 2: Protected */}
            <button
              onClick={() => setVersion(activeTargetId === 'docubot' ? 'docu-1.1' : 'ver-1.1')}
              className={`relative z-10 px-2.5 py-1 text-[11px] font-mono font-semibold transition-colors flex items-center gap-1 leading-none ${
                !isVulnerable ? 'text-emerald-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className={`w-3 h-3 shrink-0 ${!isVulnerable ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{activeTargetId === 'docubot' ? 'v1.1 (Protected)' : 'v1.1 (Protected)'}</span>
            </button>
          </div>
        </div>

        {/* Zone Divider 2 */}
        <div className="h-6 w-px bg-white/10 shrink-0 hidden md:block" />

        {/* ================================================================
            ZONE 3: Engine Status & AI Co-Pilot
            ================================================================ */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Engine Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0e1422]/90 border border-white/10 text-xs font-mono shadow-sm">
            <span className="text-[9.5px] uppercase text-slate-400 font-bold tracking-wider">ENGINE</span>
            {isOnline ? (
              <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>LIVE :8000</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10.5px] text-slate-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                <span>OFFLINE (SEED)</span>
              </span>
            )}
          </div>

          {/* AI Co-Pilot Toggle */}
          <button
            onClick={onToggleCoPilot}
            className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono font-medium transition-all shadow-sm cursor-pointer ${
              isCoPilotOpen
                ? 'bg-blue-600/20 text-blue-300 border-blue-500/50 ring-1 ring-blue-500/30'
                : 'bg-[#0e1422]/90 hover:bg-white/[0.06] text-slate-200 border-white/10'
            }`}
            title="Toggle Red-Team AI Guardian Co-Pilot"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Co-Pilot</span>
          </button>
        </div>

        {/* Zone Divider 3 */}
        <div className="h-6 w-px bg-white/10 shrink-0 hidden lg:block" />

        {/* ================================================================
            ZONE 4: Actions & Guided 5-Minute Judge Demo Tour
            ================================================================ */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {/* Export Executive Security Audit Report */}
          <button
            onClick={onExportAuditReport || onExport}
            className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0e1422]/90 hover:bg-white/[0.06] border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all shadow-sm whitespace-nowrap"
            title="Export full executive security audit report for hackathon judges"
          >
            <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition-colors" />
            <span className="hidden md:inline">Audit Report</span>
          </button>

          {/* Guided Red Team Playbook */}
          <button
            onClick={onStartTour}
            className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-amber-500/20 to-blue-600/30 hover:from-amber-500/30 hover:to-blue-600/40 border border-amber-400/40 text-xs font-mono font-bold text-amber-200 shadow-[0_0_14px_rgba(245,158,11,0.2)] transition-all cursor-pointer leading-none whitespace-nowrap"
            title="Open Red Team Playbook — guided attack scenario walkthrough"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>Red Team Playbook</span>
          </button>


        </div>

      </div>
    </header>
  );
}
