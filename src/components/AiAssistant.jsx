import React, { useState, useEffect, useRef } from 'react';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

const AiAssistant = ({ activeTab, clientView, userName, projects = [], vendors = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  const contextSuggestions = {
    dashboard: ["What's my EBITDA trend?", "Which project is underperforming?", "Portfolio health summary"],
    projects: ["Which project has the highest outstanding?", "Show me collection status", "Which site is most delayed?"],
    vendors: ["Who is my top performing vendor?", "Which vendor has pending dues?", "Vendor capacity summary"],
    readiness: ["Which site has lowest readiness?", "Audit completion summary", "What's blocking progress?"],
    calculator: ["Help me calculate ROI", "Explain the estimate breakdown", "What margin should I target?"]
  };

  const currentSuggestions = contextSuggestions[activeTab] || ["How can I help you today?"];

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'system',
          content: `Welcome back, ${userName}. I am Meaven Intelligence — powered by Gemini AI. I have access to all your live project and vendor data. Ask me anything about your business.`
        }
      ]);
    }
  }, [userName]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Build a concise but complete data snapshot for the AI context
  const buildContext = () => {
    const projectSummaries = projects.map(p => {
      const totalValue = p.clientFinancials?.totalValue || 0;
      const received = (p.clientFinancials?.received || []).reduce((s, r) => s + (r.amount || 0), 0);
      const outstanding = totalValue - received;
      const totalPayouts = (p.payouts || []).reduce((s, r) => s + (r.amount || 0), 0);
      const totalExpenses = (p.expenses || []).reduce((s, r) => s + (r.amount || 0), 0);
      const grossProfit = received - totalPayouts - totalExpenses;
      const ebitda = totalValue > 0 ? ((grossProfit / totalValue) * 100).toFixed(1) : 0;
      return `Project: ${p.name} | Status: ${p.status || 'Unknown'} | Contract: ₹${(totalValue/100000).toFixed(2)}L | Collected: ₹${(received/100000).toFixed(2)}L | Outstanding: ₹${(outstanding/100000).toFixed(2)}L | Vendor Payouts: ₹${(totalPayouts/100000).toFixed(2)}L | EBITDA: ${ebitda}% | Readiness: ${p.readiness || 0}%`;
    }).join('\n');

    const vendorSummaries = vendors.map(v => {
      const activeContracts = (v.contracts || []).filter(c => c.status === 'Active');
      const totalOrder = (v.contracts || []).reduce((s, c) => s + (c.orderValue || 0), 0);
      const totalPaid = (v.contracts || []).reduce((s, c) => (c.payments || []).reduce((ss, p) => ss + (p.amount || 0), s), 0);
      return `Vendor: ${v.name} | Score: ${v.score || 'N/A'} | Active Contracts: ${activeContracts.length} | Total Order Value: ₹${(totalOrder/100000).toFixed(2)}L | Total Paid: ₹${(totalPaid/100000).toFixed(2)}L`;
    }).join('\n');

    return `
=== MEAVEN INTELLIGENCE — LIVE BUSINESS DATA ===
Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
Total Projects: ${projects.length}
Total Vendors/Partners: ${vendors.length}

--- PROJECT DATA ---
${projectSummaries || 'No projects found.'}

--- VENDOR / PARTNER DATA ---
${vendorSummaries || 'No vendors found.'}
=================================================
    `.trim();
  };

  const handleSendMessage = async (content) => {
    if (!content.trim()) return;

    const userMsg = { role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const systemPrompt = `You are Meaven Intelligence, a sharp and concise AI financial assistant for a construction project management business in India. 
You have access to real-time business data provided below. Answer all questions based strictly on this data.
Be direct, specific, and use Indian number formats (Lakhs). Keep responses under 120 words unless asked for detail.
Never make up data. If something isn't in the data, say so clearly.

${buildContext()}`;

      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: `${systemPrompt}\n\nUser question: ${content}` }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 300,
          }
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error?.message || 'Gemini API error');
      }

      const data = await response.json();
      const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not generate a response. Please try again.';

      setMessages(prev => [...prev, { role: 'system', content: aiText }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'system',
        content: `⚠️ AI Error: ${err.message}. Please check your API key or internet connection.`
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <div className="ai-orb-container">
        <div
          className={`ai-orb ${isOpen ? '' : 'ai-orb-active'}`}
          onClick={() => setIsOpen(!isOpen)}
          title="Ask Meaven Intelligence"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
            <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
            <path d="M12 12l.01 0" />
            <path d="M12 7v1" />
            <path d="M12 16v1" />
            <path d="M7 12h1" />
            <path d="M16 12h1" />
          </svg>
        </div>
      </div>

      <div className={`ai-panel ${isOpen ? 'open' : ''}`} style={{
        background: 'rgba(15, 15, 15, 0.85)',
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 20px 80px rgba(0,0,0,0.8)'
      }}>
        <div className="ai-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#7b61ff', boxShadow: '0 0 10px #7b61ff' }} />
            <div>
              <span style={{ fontWeight: '700', letterSpacing: '0.1em', fontSize: '0.8rem' }}>MEAVEN INTELLIGENCE</span>
              <span style={{ fontSize: '0.55rem', color: '#7b61ff', display: 'block', letterSpacing: '0.05em' }}>Powered by Gemini AI</span>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>×</button>
        </div>

        <div className="ai-panel-content" ref={scrollRef}>
          {messages.map((msg, i) => (
            <div key={i} className={`ai-message ${msg.role}`} style={{ whiteSpace: 'pre-wrap' }}>
              {msg.content}
            </div>
          ))}
          {isTyping && (
            <div className="ai-message system" style={{ display: 'flex', gap: '4px', padding: '0.8rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginRight: '0.4rem' }}>Gemini is thinking</span>
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          )}
        </div>

        <div className="ai-panel-footer">
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Suggested Questions</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {currentSuggestions.map((s, i) => (
                <div key={i} className="ai-suggestion-chip" onClick={() => handleSendMessage(s)}>
                  {s}
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Ask anything about your business..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isTyping && handleSendMessage(input)}
              disabled={isTyping}
              style={{
                width: '100%',
                padding: '1rem 3rem 1rem 1.2rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                color: '#fff',
                fontSize: '0.9rem',
                opacity: isTyping ? 0.6 : 1
              }}
            />
            <button
              onClick={() => !isTyping && handleSendMessage(input)}
              disabled={isTyping}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--accent-color)',
                opacity: isTyping ? 0.4 : 1
              }}
            >
              →
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .typing-dot {
          width: 6px;
          height: 6px;
          background: var(--text-secondary);
          border-radius: 50%;
          animation: typing-dot 1.4s infinite ease-in-out;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing-dot {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </>
  );
};

export default AiAssistant;
