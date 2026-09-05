import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LogoIntro({ onAnimationPhaseChange, onComplete }) {
  const [glyphVisible, setGlyphVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const [subtitleVisible, setSubtitleVisible] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const TITLE_WORD = "AGENT.GUARDIAN";
  const titleLetters = TITLE_WORD.split('');

  useEffect(() => {
    if (onAnimationPhaseChange) onAnimationPhaseChange('splash');

    // 1. T = 250ms: Big Neon Logo Glyph appears first in the center
    const tGlyph = setTimeout(() => {
      setGlyphVisible(true);
    }, 250);

    // 2. T = 1300ms: Logo stays firmly anchored in place, and AGENT.GUARDIAN flows in smoothly
    const tText = setTimeout(() => {
      setTextVisible(true);
    }, 1300);

    // 3. T = 2500ms: Subtitle smoothly illuminates below with tracking expansion
    const tSubtitle = setTimeout(() => {
      setSubtitleVisible(true);
    }, 2500);

    // 4. T = 3800ms: Hold ends -> Smooth continuous morph & glide into TopBar header!
    const tSlide = setTimeout(() => {
      setIsSliding(true);
      if (onAnimationPhaseChange) onAnimationPhaseChange('header');
    }, 3800);

    // 5. T = 5000ms: Settle complete -> Unmount splash overlay
    const tEnd = setTimeout(() => {
      setIsFinished(true);
      if (onComplete) onComplete();
    }, 5000);

    return () => {
      clearTimeout(tGlyph);
      clearTimeout(tText);
      clearTimeout(tSubtitle);
      clearTimeout(tSlide);
      clearTimeout(tEnd);
    };
  }, []);

  if (isFinished) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none select-none flex items-center justify-center">
      {/* Cinematic Dark Cyber Backdrop */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: isSliding ? 0 : 1 }}
        transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 bg-[#070b14]"
      >
        {/* Soft Radial Neon Bloom */}
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(37, 99, 235, 0.2) 0%, rgba(6, 182, 212, 0.08) 45%, transparent 70%)'
          }}
        />

        {/* Ambient Subtle Cyber Grid */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(59, 130, 246, 0.35) 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }}
        />

        {/* Ethereal Horizontal Light Scanline */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '100% 4px'
          }}
        />
      </motion.div>

      {/* Centered Splash Logo (Shared layoutId continuous glide into header) */}
      {!isSliding && (
        <motion.div
          layoutId="brand-logo-lockup"
          transition={{
            type: "spring",
            stiffness: 110,
            damping: 22,
            mass: 1.1
          }}
          className="relative z-10 flex items-center gap-5 md:gap-6 cursor-default p-8"
        >
          {/* 1. The Big Neon Logo Icon (>_) */}
          <motion.div
            layoutId="brand-logo-glyph"
            initial={{ scale: 0.6, opacity: 0, rotate: -4 }}
            animate={{ 
              scale: glyphVisible ? 1 : 0.6, 
              opacity: glyphVisible ? 1 : 0,
              rotate: glyphVisible ? 0 : -4
            }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 18,
              mass: 0.9 
            }}
            className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-[#091122] border-2 border-blue-400/80 flex items-center justify-center text-blue-400 font-mono font-bold text-3xl md:text-4xl tracking-tighter shadow-[0_0_35px_rgba(59,130,246,0.65),0_0_75px_rgba(37,99,235,0.35),inset_0_0_20px_rgba(59,130,246,0.4)] ring-1 ring-blue-500/40 shrink-0"
          >
            <span style={{ textShadow: '0 0 12px #60a5fa, 0 0 25px #3b82f6' }}>
              &gt;_
            </span>
          </motion.div>

          {/* 2. Wordmark & Subtitle with Smooth Aesthetic Flow */}
          <div className="flex flex-col justify-center min-w-0">
            {/* Wordmark: AGENT.GUARDIAN (Smooth liquid light flow wave) */}
            <motion.div
              layoutId="brand-logo-title"
              className="text-2xl md:text-4xl font-bold tracking-wider font-mono leading-tight whitespace-nowrap flex items-center text-white"
            >
              {titleLetters.map((char, idx) => (
                <motion.span
                  key={idx}
                  initial={{ opacity: 0, y: 14, filter: 'blur(10px)' }}
                  animate={{ 
                    opacity: textVisible ? 1 : 0, 
                    y: textVisible ? 0 : 14,
                    filter: textVisible ? 'blur(0px)' : 'blur(10px)'
                  }}
                  transition={{ 
                    duration: 0.6, 
                    ease: [0.16, 1, 0.3, 1], 
                    delay: idx * 0.04 
                  }}
                  style={{
                    textShadow: textVisible
                      ? '0 0 10px rgba(147, 197, 253, 0.9), 0 0 24px rgba(59, 130, 246, 0.7), 0 0 40px rgba(37, 99, 235, 0.5)'
                      : 'none'
                  }}
                  className="inline-block transition-all"
                >
                  {char}
                </motion.span>
              ))}
            </motion.div>

            {/* Subtitle: // RED-TEAM PLATFORM (Smooth glowing flow) */}
            <motion.div
              layoutId="brand-logo-subtitle"
              initial={{ opacity: 0, y: 8, letterSpacing: '0.12em' }}
              animate={{ 
                opacity: subtitleVisible ? 1 : 0, 
                y: subtitleVisible ? 0 : 8,
                letterSpacing: subtitleVisible ? '0.24em' : '0.12em'
              }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-xs md:text-sm font-mono font-medium tracking-widest leading-tight whitespace-nowrap mt-2 text-cyan-400/90"
              style={{
                textShadow: subtitleVisible ? '0 0 10px rgba(34, 211, 238, 0.7)' : 'none'
              }}
            >
              // RED-TEAM PLATFORM
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
