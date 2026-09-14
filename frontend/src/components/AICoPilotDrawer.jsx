import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Minimize2, 
  Maximize2, 
  Sparkles, 
  Terminal, 
  HelpCircle, 
  ShieldCheck, 
  AlertTriangle,
  ChevronRight,
  MessageSquare
} from 'lucide-react';

export default function AICoPilotDrawer({ 
  isOpen, 
  onClose, 
  currentView, 
  currentVersion,
  agent,
  activeAttack,
  activeRun,
  onNavigateTo
}) {
  const [messages, setMessages] = useState([
    {
      id: 'msg-init',
      sender: 'assistant',
      time: '18:30',
      text: "Hello! I'm your Red-Team Co-Pilot. I monitor all 6 pipeline stages in real time to audit prompts, explain security preconditions, analyze exploit paths, and debug live execution traces."
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [isLoading, setIsLoading] = useState(false);

  // Listen for external trigger to open and pre-fill prompt
  useEffect(() => {
    const handleOpenCopilot = (e) => {
      if (e.detail?.prompt) {
        setInputPrompt(e.detail.prompt);
        // We cannot directly call handleSendMessage since it takes an event,
        // but since we updated inputPrompt, the user just hits Send.
      }
    };
    window.addEventListener('open-copilot', handleOpenCopilot);
    return () => window.removeEventListener('open-copilot', handleOpenCopilot);
  }, []);

  // Tab-specific contextual suggestions
  const getContextSuggestions = () => {
    switch (currentView) {
      case 'config':
        return [
          "Audit prompt for authority bypass",
          "Explain Policy P-001 rules",
          "How to guard issue_refund()?"
        ];
      case 'constraints':
        return [
          "Explain Constraint C-001 precondition",
          "Deterministic vs Semantic rules",
          "Why is C-004 critical for tenant isolation?"
        ];
      case 'threat':
        return [
          "Explain Path A vs Path B fork",
          "Where does v1.0 fail on A-001?",
          "How does v1.1 protect store money?"
        ];
      case 'attacks':
        return [
          "Which attack tests P0 authority spoofing?",
          "Explain Multi-Turn attack A-006",
          "How does A-009 probe supplier margins?"
        ];
      case 'execution':
        return [
          "Explain evaluator rationale",
          "Why was the verdict CRITICAL_ACTION?",
          "Analyze tool call arguments in trace"
        ];
      case 'compare':
        return [
          "Why did A-001 cause a regression?",
          "Explain ATTEMPT_BLOCKED status",
          "How to resolve continuous test regressions?"
        ];
      default:
        return [
          "Audit agent configuration",
          "Explain active security policies"
        ];
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isLoading) return;

    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: inputPrompt
    };

    setMessages((prev) => [...prev, userMsg]);
    const query = inputPrompt;
    setInputPrompt('');
    setIsLoading(true);

    // Context-aware intelligent response
    const fetchReply = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query,
            context: {
              view: currentView,
              version: currentVersion?.version_label,
              attack: activeAttack?.id
            }
          })
        });
        
        const data = await response.json();
        
        const botReply = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: data.reply
        };
        setMessages((prev) => [...prev, botReply]);
      } catch (error) {
        const errorReply = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: "Sorry, I couldn't connect to the backend LLM service."
        };
        setMessages((prev) => [...prev, errorReply]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReply();
  };

  if (!isOpen) return null;

  return (
    <aside 
      aria-label="AI Guardian Co-Pilot"
      className="w-80 md:w-96 bg-[#0c111c] border-l border-app-border flex flex-col h-[calc(100vh-4rem)] sticky top-16 z-20 shadow-2xl select-none"
    >
      {/* Header */}
      <div className="p-3.5 bg-[#0f1726] border-b border-app-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-sm bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-mono text-xs shadow-icon-glow-subtle">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white font-mono tracking-wider flex items-center gap-1.5">
              <span>RED-TEAM CO-PILOT</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-[9.5px] text-slate-400 font-mono">
              ACTIVE TAB: <span className="text-blue-400 uppercase font-bold">{currentView}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-sm hover:bg-white/[0.05] transition-colors"
          title="Close Co-Pilot Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Message Thread */}
      <div className="p-3.5 flex-1 overflow-y-auto space-y-3 font-mono text-xs">
        {messages.map((msg) => {
          const isBot = msg.sender === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[9.5px] text-slate-500">
                <span>{isBot ? 'CO-PILOT' : 'YOU'}</span>
                <span>·</span>
                <span>{msg.time}</span>
              </div>

              <div
                className={`p-3 rounded-sm leading-relaxed max-w-[94%] ${
                  isBot
                    ? 'bg-[#080d16] text-slate-200 border border-slate-800 font-sans text-xs shadow-sm'
                    : 'bg-blue-600/25 text-blue-200 border border-blue-500/40 font-sans text-xs'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        
        {isLoading && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5 mb-1 text-[9.5px] text-slate-500">
              <span>CO-PILOT</span>
            </div>
            <div className="p-3 rounded-sm bg-[#080d16] text-slate-400 border border-slate-800 font-sans text-xs flex items-center gap-2">
              <span className="flex gap-0.5">
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
              </span>
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Tab Context Quick Prompts */}
      <div className="p-2.5 bg-[#080d16] border-t border-app-borderSubtle space-y-1.5">
        <div className="text-[9.5px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Tab Suggestions ({currentView}):</span>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {getContextSuggestions().map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => setInputPrompt(suggestion)}
              className="text-[10px] font-mono px-2 py-1 rounded-sm bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-app-borderSubtle hover:border-blue-500/40 transition-colors text-left"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Pinned Input Form */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-[#0a0f18] border-t border-app-border flex items-center gap-2"
      >
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          disabled={isLoading}
          placeholder={isLoading ? "Co-Pilot is thinking..." : `Ask Co-Pilot about ${currentView}...`}
          className="flex-1 bg-[#060a10] border border-slate-800 rounded-sm px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-3 py-2 rounded-sm bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Send to Co-Pilot"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </aside>
  );
}
