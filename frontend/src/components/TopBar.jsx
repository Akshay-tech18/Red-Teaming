import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  Zap, 
  ShieldCheck, 
  AlertCircle,
  Sparkles,
  Bot
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
  logoInHeader = true,
  onReplayLogo
}) {
  const isVulnerable = currentVersion === 'ver-1.0';
  const [hoveredOption, setHoveredOption] = useState(null);

  return (
    <header className="h-16 w-full bg-gradient-to-b from-[#0e1424] via-[#0b101c] to-[#080c15] border-b border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-md sticky top-0 z-30 select-none">
      <div className="max-w-[1440px] w-full mx-auto px-6 md:px-8 h-full flex items-center justify-between gap-3 lg:gap-5 overflow-x-auto">
        
        {/* ================================================================
            ZONE 1: Brand & Platform Identity (Point 1 & 4)
            - Fixed nowrap, min-width to prevent title wrap
            - Shared layoutId for continuous morphing animation from splash
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
              className="flex items-center gap-3 shrink-0 min-w-max cursor-pointer group"
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
            /* Invisible layout placeholder so other zones don't shift */
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
            ZONE 2: Target Agent & Segmented Mode Toggle (Point 1, 2, 3, 9)
            - Shared rounded-full pill container with sliding background
            - Standardized rounded-md target chip
            ================================================================ */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Target Profile Chip */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#0e1422]/90 border border-white/10 text-xs font-mono shadow-sm">
            <span className="text-slate-400 text-[10px] font-bold tracking-wider uppercase">TARGET</span>
            <span className="font-semibold text-white text-xs font-sans">{agent?.name || 'ShopAssist'}</span>
          </div>

          {/* Unified Sliding-Pill Version Toggle (Point 2 & 9) */}
          <div className="relative flex items-center p-1 rounded-full bg-[#060912] border border-white/10 shadow-inner">
            {/* Sliding background pill indicator */}
            <div 
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-all duration-200 ease-out pointer-events-none ${
                isVulnerable ? 'left-1' : 'left-[calc(50%+2px)]'
              } ${
                hoveredOption === 'ver-1.0' && !isVulnerable
                  ? 'bg-red-500/15 border border-red-500/30'
                  : hoveredOption === 'ver-1.1' && isVulnerable
                  ? 'bg-emerald-500/15 border border-emerald-500/30'
                  : isVulnerable
                  ? 'bg-red-500/20 border border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.25)]'
                  : 'bg-emerald-500/20 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
              }`}
            />

            {/* Option 1: v1.0 Vulnerable */}
            <button
              onClick={() => setVersion('ver-1.0')}
              onMouseEnter={() => setHoveredOption('ver-1.0')}
              onMouseLeave={() => setHoveredOption(null)}
              className={`relative z-10 px-3 py-1 text-xs font-mono font-semibold transition-colors duration-150 flex items-center gap-1.5 leading-none ${
                isVulnerable
                  ? 'text-red-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertCircle className={`w-3.5 h-3.5 shrink-0 ${isVulnerable ? 'text-red-400' : 'text-slate-500'}`} />
              <span>v1.0 (Vulnerable)</span>
            </button>

            {/* Option 2: v1.1 Protected */}
            <button
              onClick={() => setVersion('ver-1.1')}
              onMouseEnter={() => setHoveredOption('ver-1.1')}
              onMouseLeave={() => setHoveredOption(null)}
              className={`relative z-10 px-3 py-1 text-xs font-mono font-semibold transition-colors duration-150 flex items-center gap-1.5 leading-none ${
                !isVulnerable
                  ? 'text-emerald-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${!isVulnerable ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>v1.1 (Protected)</span>
            </button>
          </div>
        </div>

        {/* Zone Divider 2 */}
        <div className="h-6 w-px bg-white/10 shrink-0 hidden md:block" />

        {/* ================================================================
            ZONE 3: Engine Status & AI Co-Pilot (Point 1, 3, 5, 7)
            - Consistent chip style
            - AI Co-Pilot looks clickable with spark icon + real pulsing live dot
            ================================================================ */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Engine API Status Chip */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#0e1422]/90 border border-white/10 text-xs font-mono shadow-sm">
            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">ENGINE</span>
            {isOnline ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 duration-1000"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>LIVE :8000</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                <span>OFFLINE (SEED)</span>
              </span>
            )}
          </div>

          {/* AI Co-Pilot Clickable Chip with Spark icon and live pulsing indicator */}
          <button
            onClick={onToggleCoPilot}
            className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-mono font-medium transition-all shadow-sm cursor-pointer ${
              isCoPilotOpen
                ? 'bg-blue-600/20 text-blue-300 border-blue-500/50 ring-1 ring-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                : 'bg-[#0e1422]/90 hover:bg-white/[0.06] hover:border-blue-500/30 text-slate-200 border-white/10'
            }`}
            title="Toggle Red-Team AI Guardian Co-Pilot Drawer (Active across all tabs)"
          >
            <Sparkles className={`w-3.5 h-3.5 shrink-0 transition-all ${isCoPilotOpen ? 'text-blue-400 scale-105' : 'text-slate-400 group-hover:text-blue-400'}`} />
            <span>AI Co-Pilot</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 duration-1000"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </button>
        </div>

        {/* Zone Divider 3 */}
        <div className="h-6 w-px bg-white/10 shrink-0 hidden lg:block" />

        {/* ================================================================
            ZONE 4: Actions (Point 1, 3, 7, 8, 9)
            - Export button: consistent secondary chip style
            - Run Demo CTA: High contrast, elevated shadow/glow, clear dominance
            ================================================================ */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Export Config */}
          <button
            onClick={onExport}
            className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0e1422]/90 hover:bg-white/[0.06] border border-white/10 hover:border-white/20 text-xs font-mono text-slate-300 hover:text-white transition-all shadow-sm cursor-pointer leading-none"
            title="Export full agent security configuration"
          >
            <Download className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-blue-400 transition-colors" />
            <span>Export</span>
          </button>

          {/* Primary CTA: Run Demo with subtle glow, elevated contrast */}
          <button
            onClick={onRunDemo}
            className="group inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-xs font-mono font-bold text-white border border-blue-400/60 shadow-[0_0_16px_rgba(37,99,235,0.45)] hover:shadow-[0_0_22px_rgba(37,99,235,0.65)] hover:border-blue-300 transition-all cursor-pointer leading-none"
            title="Trigger sandboxed execution trace for Attack A-001"
          >
            <Zap className="w-3.5 h-3.5 shrink-0 text-blue-100 group-hover:text-yellow-300 transition-colors fill-blue-100/20" />
            <span>Run Demo (A-001)</span>
          </button>
        </div>

      </div>
    </header>
  );
}
