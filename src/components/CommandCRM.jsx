import React, { useState, useEffect } from 'react';
import './CommandCRM.css';

// --- CONSTANTS ---
const PIPELINES = [
  { id: 'sales', name: 'Sales Pipeline', columns: [
    { name: 'Lead', type: 'open' },
    { name: 'Contacted', type: 'open' },
    { name: 'Proposal', type: 'open' },
    { name: 'Negotiation', type: 'open' },
    { name: 'Won', type: 'closed_won' },
    { name: 'Lost', type: 'closed_lost' }
  ]},
  { id: 'execution', name: 'Site Execution', columns: [
    { name: 'Mobilization', type: 'open' },
    { name: 'Procurement', type: 'open' },
    { name: 'Civil Works', type: 'open' },
    { name: 'Finishing', type: 'open' },
    { name: 'Handover', type: 'closed_won' }
  ]}
];

// --- DATA ---
const INITIAL_CLIENTS = [
  { id: 'c1', name: 'Adam Neumann', company: 'WeWork', role: 'Founder', email: 'adam@wework.com' },
  { id: 'c2', name: 'Miguel McKelvey', company: 'WeWork', role: 'Co-Founder', email: 'miguel@wework.com' },
  { id: 'c3', name: 'Sarah Jones', company: 'WeWork', role: 'VP Operations', email: 'sarah@wework.com' },
  { id: 'c4', name: 'Tony Stark', company: 'Stark Industries', role: 'CEO', email: 'tony@stark.com' },
  { id: 'c5', name: 'Pepper Potts', company: 'Stark Industries', role: 'COO', email: 'pepper@stark.com' },
];

const INITIAL_DEALS = [
  { 
    id: '1', pipelineId: 'sales', title: 'Global HQ Infrastructure', company: 'WeWork', clientIds: ['c1', 'c2', 'c3'], value: 1250000, stage: 'Negotiation', 
    nextAction: { date: '2026-05-05', type: 'Meeting', text: 'Finalize SLA terms' },
    notes: [
      { id: 'n1', text: 'Adam requested a 10% discount on implementation fees.', date: '2026-05-02 10:30 AM', type: 'note' },
      { id: 'n2', text: 'Followed up via call. Board meeting scheduled for Wednesday.', date: '2026-05-01 02:15 PM', type: 'note' }
    ],
    emails: [
      { id: 'e1', subject: 'Draft SLA for review', body: 'Attached is the first draft...', date: '2026-05-01 09:00 AM', type: 'email' }
    ],
    history: [
      { id: 'h1', text: 'Stage moved from Proposal to Negotiation', date: '2026-04-30 04:00 PM', type: 'system' }
    ],
    files: [
      { id: 'f1', name: 'SLA_Draft_v1.pdf', size: '2.4 MB', date: '2026-05-01' },
      { id: 'f2', name: 'Site_Plan.dwg', size: '15.1 MB', date: '2026-04-28' }
    ]
  },
  { 
    id: '2', pipelineId: 'sales', title: 'Arc Reactor Analytics', company: 'Stark Industries', clientIds: ['c4', 'c5'], value: 850000, stage: 'Proposal', 
    nextAction: { date: '2026-05-04', type: 'Call', text: 'Check on board approval' },
    notes: [], emails: [], history: [], files: []
  },
  { 
    id: '3', pipelineId: 'execution', title: 'Modular Hub Alpha', company: 'Wayne Enterprises', clientIds: [], value: 110000, stage: 'Procurement', 
    readiness: 65,
    nextAction: { date: '2026-05-01', type: 'Email', text: 'Order structural beams' },
    notes: [], emails: [], history: [], files: []
  }
];

const CommandCRM = () => {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('crm_active_subtab') || 'Pipelines');
  const [activePipelineId, setActivePipelineId] = useState('sales');
  const [deals, setDeals] = useState(INITIAL_DEALS);
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [selectedDealId, setSelectedDealId] = useState(null);
  
  // Modal States
  const [isNewDealModalOpen, setIsNewDealModalOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('crm_active_subtab', activeTab);
  }, [activeTab]);

  const activePipeline = PIPELINES.find(p => p.id === activePipelineId);
  const navItems = ['Action Center', 'Pipelines', 'Deals', 'Clients', 'Settings'];
  const selectedDeal = deals.find(d => d.id === selectedDealId);

  // --- HELPERS ---
  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const getActionStatus = (dateString) => {
    if (!dateString) return null;
    const today = new Date('2026-05-04');
    const actionDate = new Date(dateString);
    const diff = Math.ceil((actionDate - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: 'Overdue', status: 'danger' };
    if (diff === 0) return { label: 'Today', status: 'warning' };
    if (diff === 1) return { label: 'Tomorrow', status: 'info' };
    return { label: actionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), status: 'neutral' };
  };

  // --- ACTIONS ---
  const handleAddDeal = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newDeal = {
      id: Date.now().toString(),
      pipelineId: activePipelineId,
      title: formData.get('title'),
      company: formData.get('company'),
      value: parseInt(formData.get('value')) || 0,
      stage: activePipeline.columns[0].name,
      clientIds: [],
      nextAction: { date: formData.get('nextDate'), type: formData.get('nextType'), text: formData.get('nextText') },
      notes: [], emails: [], history: [], files: []
    };
    setDeals([newDeal, ...deals]);
    setIsNewDealModalOpen(false);
  };

  const handleAddClient = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newClient = {
      id: 'c' + Date.now().toString(),
      name: formData.get('name'),
      company: formData.get('company'),
      role: formData.get('role'),
      email: formData.get('email')
    };
    setClients([newClient, ...clients]);
    setIsNewClientModalOpen(false);
  };

  const handleAddNote = (dealId, text) => {
    if (!text.trim()) return;
    const now = new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, month: 'short', day: 'numeric', year: 'numeric' });
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, notes: [{ id: Date.now().toString(), text, date: now, type: 'note' }, ...d.notes] } : d));
  };

  // --- SUB-COMPONENTS ---
  const Modal = ({ title, onClose, children }) => (
    <div className="detail-drawer-overlay" style={{background: 'rgba(0,0,0,0.4)'}} onClick={onClose}>
      <div className="workspace-card animate-fade-in" style={{width: '450px', padding: '30px'}} onClick={e => e.stopPropagation()}>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
          <h2 style={{margin: 0, fontSize: '1.2rem'}}>{title}</h2>
          <button onClick={onClose} style={{background:'none', border:'none', fontSize:'1.2rem', cursor:'pointer'}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );

  const UnifiedTimeline = ({ deal }) => {
    const combined = [
      ...(deal.notes || []),
      ...(deal.emails || []),
      ...(deal.history || [])
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
      <div className="activity-timeline">
        {combined.map(item => (
          <div key={item.id} className="timeline-item">
            <div className={`timeline-dot ${item.type}`}></div>
            <div className="timeline-content">
              <div className="timeline-header">
                <span className="timeline-type">{item.type}</span>
                <span>{item.date}</span>
              </div>
              <div style={{fontSize: '0.85rem', fontWeight: 600}}>{item.subject || (item.type === 'system' ? 'Status Update' : 'Note')}</div>
              <div style={{fontSize: '0.85rem', color: '#515154', marginTop: '4px'}}>{item.text || item.body}</div>
            </div>
          </div>
        ))}
        {combined.length === 0 && <div style={{textAlign: 'center', color: '#86868b', fontSize: '0.8rem', padding: '20px'}}>No activity recorded yet.</div>}
      </div>
    );
  };

  const FullDealView = ({ deal, onBack }) => {
    const linkedClients = clients.filter(c => deal.clientIds.includes(c.id));
    const [noteText, setNoteText] = useState('');
    
    return (
      <div className="full-deal-view animate-fade-in">
        <div className="deal-full-header">
          <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
            <button className="back-to-pipeline" onClick={onBack}>← Back</button>
            <div>
              <h1 className="deal-full-title">{deal.title}</h1>
              <div className="deal-full-meta">{deal.company} • <span style={{color: '#0071e3', fontWeight: 600}}>{formatCurrency(deal.value)}</span></div>
            </div>
          </div>
          <div style={{display: 'flex', gap: '10px'}}>
            {deal.readiness && <div className="readiness-pill">Readiness: {deal.readiness}%</div>}
            <div className="deal-full-status-pill">{deal.stage}</div>
          </div>
        </div>

        <div className="deal-workspace-grid">
          <div className="workspace-column">
            <div className="workspace-card">
              <h3>Linked Contacts</h3>
              <div className="contact-list-mini">
                {linkedClients.map(c => (
                  <div key={c.id} className="contact-item-mini">
                    <div className="contact-avatar-mini">{c.name.charAt(0)}</div>
                    <div className="contact-info-mini">
                      <div className="contact-name-mini">{c.name}</div>
                      <div className="contact-role-mini">{c.role}</div>
                    </div>
                  </div>
                ))}
                <button className="btn-add-stage" style={{fontSize: '0.8rem', width: '100%'}} onClick={() => setIsNewClientModalOpen(true)}>+ Add Contact</button>
              </div>
            </div>

            <div className="workspace-card">
              <h3>Associated Files</h3>
              <div className="file-list">
                {deal.files?.map(f => (
                  <div key={f.id} className="file-item">
                    <span className="file-icon">📄</span>
                    <div className="file-info">
                      <div style={{fontWeight: 600}}>{f.name}</div>
                      <div className="file-meta">{f.size} • {f.date}</div>
                    </div>
                  </div>
                ))}
                <button className="btn-add-stage" style={{fontSize: '0.8rem', width: '100%'}}>+ Upload Document</button>
              </div>
            </div>
          </div>

          <div className="workspace-column center">
            <div className="workspace-card" style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
              <h3>Unified Activity Stream</h3>
              <div style={{flex: 1, overflowY: 'auto', paddingRight: '10px'}}>
                <UnifiedTimeline deal={deal} />
              </div>
              <div className="note-entry" style={{padding: '15px 0 0 0', borderTop: '1px solid rgba(0,0,0,0.05)', marginTop: '15px'}}>
                <textarea 
                  placeholder="Drop a strategy note or update..." 
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  style={{minHeight: '60px', width: '100%', borderRadius: '8px', border: '1px solid #e8e8ed', padding: '10px'}}
                ></textarea>
                <div style={{textAlign: 'right', marginTop: '10px'}}>
                  <button className="btn-send" style={{padding: '8px 16px'}} onClick={() => { handleAddNote(deal.id, noteText); setNoteText(''); }}>Add to Timeline</button>
                </div>
              </div>
            </div>
          </div>

          <div className="workspace-column">
            <div className="workspace-card">
              <h3>Next Objective</h3>
              {deal.nextAction ? (
                <div className="action-focus-box">
                  <div className={`action-badge ${getActionStatus(deal.nextAction.date).status}`}>{getActionStatus(deal.nextAction.date).label}</div>
                  <div className="action-title-focus">{deal.nextAction.type}: {deal.nextAction.text}</div>
                  <button className="btn-add-stage" style={{fontSize: '0.75rem', marginTop: '15px'}}>Mark as Done</button>
                </div>
              ) : <button className="btn-add-stage" style={{fontSize: '0.8rem'}}>+ Schedule Follow-up</button>}
            </div>

            <div className="workspace-card">
              <h3>Email Composer</h3>
              <div className="email-composer">
                <div className="composer-field"><label>To</label><input type="text" defaultValue={linkedClients.map(c => c.email).join(', ')} /></div>
                <div className="composer-field"><label>Subject</label><input type="text" placeholder="Regarding project..." /></div>
                <div className="composer-actions">
                  <button className="btn-send" style={{padding: '8px 16px'}}>Transmit</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="crm-container">
      {!selectedDealId ? (
        <>
          <div className="crm-top-nav">
            <div style={{display: 'flex', alignItems: 'center'}}>
              <div className="pipeline-selector">
                <select 
                  className="pipeline-select-btn"
                  value={activePipelineId}
                  onChange={(e) => setActivePipelineId(e.target.value)}
                >
                  {PIPELINES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="crm-brand">Client Relations</div>
            </div>
            
            <div className="crm-tabs">
              {navItems.map(t => <button key={t} className={`crm-tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>)}
            </div>
            <div className="crm-actions">
              {activeTab === 'Clients' 
                ? <button className="btn-send" style={{padding: '8px 16px'}} onClick={() => setIsNewClientModalOpen(true)}>+ Add Contact</button>
                : <button className="btn-send" style={{padding: '8px 16px'}} onClick={() => setIsNewDealModalOpen(true)}>+ New Deal</button>
              }
            </div>
          </div>

          <div className="crm-content">
            {activeTab === 'Action Center' && (
              <div className="crm-module">
                <h2>Today's Priorities</h2>
                <div className="crm-table-container" style={{maxWidth: '800px'}}>
                  <table className="crm-table">
                    <thead><tr><th>Deal</th><th>Action Required</th><th>Status</th></tr></thead>
                    <tbody>
                      {deals.filter(d => d.nextAction && (getActionStatus(d.nextAction.date).status === 'danger' || getActionStatus(d.nextAction.date).status === 'warning')).map(d => (
                        <tr key={d.id} onClick={() => setSelectedDealId(d.id)} style={{cursor: 'pointer'}}>
                          <td><strong>{d.title}</strong><br/><span style={{fontSize: '0.75rem', color: '#86868b'}}>{d.company}</span></td>
                          <td><span style={{fontSize: '0.9rem'}}>{d.nextAction.type}: {d.nextAction.text}</span></td>
                          <td><span className={`action-badge ${getActionStatus(d.nextAction.date).status}`}>{getActionStatus(d.nextAction.date).label}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'Pipelines' && (
              <div className="kanban-board">
                {activePipeline.columns.map(col => (
                  <div key={col.name} className={`kanban-column ${col.type === 'closed_won' ? 'border-won' : col.type === 'closed_lost' ? 'border-lost' : ''}`}>
                    <div className="kanban-column-header">
                      <div>
                        <div className="kanban-column-title">{col.name}</div>
                        <div style={{fontSize: '0.8rem', color: '#86868b'}}>{formatCurrency(deals.filter(d => d.pipelineId === activePipelineId && d.stage === col.name).reduce((sum, d) => sum + d.value, 0))}</div>
                      </div>
                      <span className="kanban-column-count">{deals.filter(d => d.pipelineId === activePipelineId && d.stage === col.name).length}</span>
                    </div>
                    <div className="kanban-column-body">
                      {deals.filter(d => d.pipelineId === activePipelineId && d.stage === col.name).map(deal => (
                        <div key={deal.id} className="kanban-card" onClick={() => setSelectedDealId(deal.id)}>
                          <div className="kanban-card-title">{deal.title}</div>
                          <div className="kanban-card-client">{deal.company}</div>
                          {deal.nextAction && (
                            <div className={`action-badge ${getActionStatus(deal.nextAction.date).status}`}>
                              {getActionStatus(deal.nextAction.date).label}: {deal.nextAction.type}
                            </div>
                          )}
                          <div className="kanban-card-footer">
                            <div className="kanban-card-value">{formatCurrency(deal.value)}</div>
                            <div className="avatar-stack">
                              {clients.filter(c => deal.clientIds.includes(c.id)).map(c => <div key={c.id} className="kanban-card-avatar" title={c.name}>{c.name.charAt(0)}</div>)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {activeTab === 'Deals' && (
              <div className="crm-module">
                <div className="crm-table-container">
                  <table className="crm-table">
                    <thead><tr><th>Title</th><th>Pipeline</th><th>Org</th><th>Value</th><th>Stage</th></tr></thead>
                    <tbody>
                      {deals.map(d => (
                        <tr key={d.id} onClick={() => setSelectedDealId(d.id)} style={{cursor:'pointer'}}>
                          <td><strong>{d.title}</strong></td>
                          <td><span style={{fontSize: '0.75rem', textTransform: 'uppercase'}}>{d.pipelineId}</span></td>
                          <td>{d.company}</td><td>{formatCurrency(d.value)}</td><td><span className="badge-stage">{d.stage}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'Clients' && (
              <div className="crm-module">
                <div className="crm-table-container">
                  <table className="crm-table">
                    <thead><tr><th>Name</th><th>Company</th><th>Role</th><th>Email</th></tr></thead>
                    <tbody>
                      {clients.map(c => (
                        <tr key={c.id}><td><strong>{c.name}</strong></td><td>{c.company}</td><td>{c.role}</td><td>{c.email}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <FullDealView deal={selectedDeal} onBack={() => setSelectedDealId(null)} />
      )}

      {/* MODALS */}
      {isNewDealModalOpen && (
        <Modal title="Create New Deal" onClose={() => setIsNewDealModalOpen(false)}>
          <form className="email-composer" onSubmit={handleAddDeal}>
            <div className="composer-field"><label>Title</label><input name="title" required placeholder="Project Name" /></div>
            <div className="composer-field"><label>Client</label><input name="company" required placeholder="Organization" /></div>
            <div className="composer-field"><label>Value</label><input name="value" type="number" placeholder="₹ Amount" /></div>
            <div style={{marginTop: '15px'}}><label style={{fontSize:'0.8rem', color:'#86868b'}}>First Action</label></div>
            <div className="composer-field"><label>Type</label><select name="nextType" className="stage-select" style={{minWidth:0}}><option>Call</option><option>Email</option><option>Meeting</option></select></div>
            <div className="composer-field"><label>Task</label><input name="nextText" placeholder="What needs to be done?" /></div>
            <div className="composer-field"><label>Date</label><input name="nextDate" type="date" defaultValue="2026-05-04" /></div>
            <button className="btn-send" style={{marginTop: '20px', padding:'12px'}}>Initialize Deal</button>
          </form>
        </Modal>
      )}

      {isNewClientModalOpen && (
        <Modal title="Add New Contact" onClose={() => setIsNewClientModalOpen(false)}>
          <form className="email-composer" onSubmit={handleAddClient}>
            <div className="composer-field"><label>Name</label><input name="name" required placeholder="Full Name" /></div>
            <div className="composer-field"><label>Company</label><input name="company" required placeholder="Organization" /></div>
            <div className="composer-field"><label>Role</label><input name="role" placeholder="Designation" /></div>
            <div className="composer-field"><label>Email</label><input name="email" type="email" placeholder="email@address.com" /></div>
            <button className="btn-send" style={{marginTop: '20px', padding:'12px'}}>Save Contact</button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CommandCRM;
