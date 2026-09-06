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
    if (!inputPrompt.trim()) return;

    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: inputPrompt
    };

    setMessages((prev) => [...prev, userMsg]);
    const query = inputPrompt;
    setInputPrompt('');

    // Context-aware intelligent response
    setTimeout(() => {
      let replyText = `I've analyzed your question relative to the active tab (${currentView.toUpperCase()}) and version (${currentVersion}).`;
      
      const q = query.toLowerCase();
      if (q.includes('authority') || q.includes('director') || q.includes('vance')) {
        replyText = "In authority spoofing attacks (like A-001 and A-003), the user claims an executive persona ('Regional Director Dr. Vance'). In v1.0, the LLM complies because it has no verification gate. In v1.1, the `@enforce_policy('P-001')` decorator checks `session.order_verified == True` and halts the call regardless of what the user claims.";
      } else if (q.includes('p-001') || q.includes('c-001') || q.includes('refund')) {
        replyText = "Policy P-001 requires order verification before issuing any refund. Constraint C-001 is a DETERMINISTIC rule: `order_verification_state[order_id] == VERIFIED`. If the tool `verify_order()` was not executed, `issue_refund()` is blocked with an immediate POLICY_INTERCEPT.";
      } else if (q.includes('pii') || q.includes('c-004') || q.includes('customer') || q.includes('tenant')) {
        replyText = "Policy P-003 and Constraint C-004 isolate customer records. When an attacker logged in as CUST-001 asks for CUST-002, the deterministic session guard intercepts the query because `requested_id != authenticated_customer_id`.";
      } else if (q.includes('threat') || q.includes('fork') || q.includes('tree')) {
        replyText = "In Step 03 (Decision Tree), you can see the exact fork: Path A has no precondition gate, allowing the model to debit the $500 store ledger. Path B introduces code-level precondition enforcement which intercepts the unauthorized call.";
      } else if (q.includes('trace') || q.includes('verdict') || q.includes('execution')) {
        replyText = "In Step 05 (Live Run & Traces), the deterministic evaluator inspects the execution events. Event #4 shows the violation alert when `issue_refund` was called while `order_verification_state` was `NOT_VERIFIED`.";
      } else if (q.includes('regression')) {
        replyText = "In Step 06 (Regression Suite), we verify that fixing one attack doesn't break other benign flows. A test is flagged with a red REGRESSION banner if a previously blocked exploit suddenly succeeds on a newer agent build.";
      }

      const botReply = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: replyText
      };
      setMessages((prev) => [...prev, botReply]);
    }, 450);
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
          placeholder={`Ask Co-Pilot about ${currentView}...`}
          className="flex-1 bg-[#060a10] border border-slate-800 rounded-sm px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
        />
        <button
          type="submit"
          className="px-3 py-2 rounded-sm bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm flex items-center justify-center shrink-0"
          title="Send to Co-Pilot"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </aside>
  );
}
