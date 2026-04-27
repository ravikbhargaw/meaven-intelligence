import React, { useState, useEffect, useRef } from 'react';

const AiAssistant = ({ activeTab, clientView, userName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  const contextSuggestions = {
    dashboard: ["Show portfolio health", "What's the EBITDA trend?", "Identify high-risk projects"],
    projects: ["Check vendor payouts", "Update project milestones", "Financial summary for Project X"],
    vendors: ["Top performing vendors", "Vendor capacity report", "Onboard new partner"],
    readiness: ["Audit completion rate", "Site readiness blockers", "Lock project coordinates"],
    calculator: ["Calculate ROI", "Technical specs help", "Export estimation"]
  };

  const currentSuggestions = contextSuggestions[activeTab] || ["How can I help you today?"];

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        { 
          role: 'system', 
          content: `Welcome back, ${userName}. I am Meaven Intelligence. I've analyzed the ${activeTab} data and I'm ready to assist.` 
        }
      ]);
    }
  }, [userName, activeTab]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = (content) => {
    if (!content.trim()) return;
    
    const userMsg = { role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Mock AI Response
    setTimeout(() => {
      setIsTyping(false);
      const systemMsg = { 
        role: 'system', 
        content: `Analyzing ${content}... Based on current Tactical Data, I recommend checking the latest Site Readiness scores for active loops in ${selectedTabLabel()}.` 
      };
      setMessages(prev => [...prev, systemMsg]);
    }, 1500);
  };

  const selectedTabLabel = () => {
    switch(activeTab) {
      case 'dashboard': return 'Command Center';
      case 'projects': return 'Financial Hub';
      case 'vendors': return 'Partner Bench';
      case 'readiness': return 'Audit Hub';
      default: return 'Active Workspace';
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

      <div className={`ai-panel ${isOpen ? 'open' : ''}`}>
        <div className="ai-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#7b61ff', boxShadow: '0 0 10px #7b61ff' }} />
            <span style={{ fontWeight: '700', letterSpacing: '0.1em', fontSize: '0.8rem' }}>MEAVEN INTELLIGENCE</span>
          </div>
          <button onClick={() => setIsOpen(false)} style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>×</button>
        </div>

        <div className="ai-panel-content" ref={scrollRef}>
          {messages.map((msg, i) => (
            <div key={i} className={`ai-message ${msg.role}`}>
              {msg.content}
            </div>
          ))}
          {isTyping && (
            <div className="ai-message system" style={{ display: 'flex', gap: '4px', padding: '0.8rem' }}>
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          )}
        </div>

        <div className="ai-panel-footer">
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Suggested Actions</p>
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
              placeholder="Ask Meaven anything..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(input)}
              style={{ 
                width: '100%', 
                padding: '1rem 3rem 1rem 1.2rem', 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '16px', 
                color: '#fff',
                fontSize: '0.9rem'
              }} 
            />
            <button 
              onClick={() => handleSendMessage(input)}
              style={{ 
                position: 'absolute', 
                right: '1rem', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: 'var(--accent-color)'
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
