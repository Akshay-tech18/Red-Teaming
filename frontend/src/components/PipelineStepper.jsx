import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function PipelineStepper({ currentView, setView }) {
  const steps = [
    { id: "config", num: "01", label: "Understand Config" },
    { id: "constraints", num: "02", label: "Derive Constraints" },
    { id: "threat", num: "03", label: "Threat Decision Tree" },
    { id: "attacks", num: "04", label: "Targeted Attacks" },
    { id: "execution", num: "05", label: "Judge & Traces" },
    { id: "compare", num: "06", label: "Fix & Regression" },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1 bg-app-sidebar border border-app-border rounded-lg shadow-sm mb-6 overflow-x-auto select-none">
      {steps.map((step, idx) => {
        const isActive = currentView === step.id;
        return (
          <React.Fragment key={step.id}>
            <button
              onClick={() => setView(step.id)}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-all duration-150 border whitespace-nowrap ${
                isActive
                  ? 'bg-[#172233] text-white font-semibold border-blue-500/40 shadow-sm'
                  : 'bg-transparent hover:bg-white/[0.04] text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              {/* Target Icon/Number Glow (Only the number badge glows on hover, text stays sharp) */}
              <span
                className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-icon-glow-subtle'
                    : 'bg-white/[0.05] text-slate-400 border border-white/[0.06] group-hover:text-blue-400 group-hover:border-blue-500/50 group-hover:shadow-icon-glow group-hover:bg-blue-950/40'
                }`}
              >
                {step.num}
              </span>

              {/* Step Title (no glow) */}
              <span className="tracking-tight">
                {step.label}
              </span>
            </button>

            {idx < steps.length - 1 && (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
