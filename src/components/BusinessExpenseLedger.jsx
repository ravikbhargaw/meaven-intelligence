import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { parseMoney } from '../utils/financialUtils';

const BusinessExpenseLedger = ({ overheadConfig, setOverheadConfig, overheadMethod, setOverheadMethod, projects }) => {
  // Core States
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Overhead allocation local states
  const [showOverheadPanel, setShowOverheadPanel] = useState(false);
  const [localOverhead, setLocalOverhead] = useState(overheadConfig || { salaries: 0, officeRent: 0, software: 0, fuel: 0, internet: 0, admin: 0, misc: 0 });
  const [localMethod, setLocalMethod] = useState(overheadMethod || 'equal');

  // Sync with global state changes
  useEffect(() => {
    if (overheadConfig) setLocalOverhead(overheadConfig);
  }, [overheadConfig]);

  useEffect(() => {
    if (overheadMethod) setLocalMethod(overheadMethod);
  }, [overheadMethod]);

  const activeProjectsCount = useMemo(() => {
    return (projects || []).filter(p => p.status === 'Active' || !p.status).length;
  }, [projects]);

  const totalOverheadPool = useMemo(() => {
    return Object.values(localOverhead).reduce((sum, val) => sum + Number(val || 0), 0);
  }, [localOverhead]);

  // UI Control States
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Operations',
    amount: '',
    paidBy: '',
    notes: '',
    type: 'Office'
  });

  // Filter States
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterPaidBy, setFilterPaidBy] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown Configurations
  const categories = [
    'Operations',
    'Administration',
    'Marketing/Sales',
    'Taxes/Compliance',
    'Personnel',
    'Financial Services',
    'Miscellaneous'
  ];

  const types = [
    'Office',
    'Fuel',
    'Salary',
    'Software',
    'GST',
    'Bank Charges',
    'Marketing',
    'Founder Expense',
    'Miscellaneous'
  ];

  // Initialize: Load from localStorage first (offline-first strategy)
  useEffect(() => {
    const cached = localStorage.getItem('meaven_business_expenses');
    if (cached) {
      try {
        setExpenses(JSON.parse(cached));
        setLoading(false);
      } catch (e) {
        console.error('Error parsing meaven_business_expenses from localStorage', e);
      }
    }
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('business_expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setExpenses(data);
        localStorage.setItem('meaven_business_expenses', JSON.stringify(data));
        setErrorMsg(null);
      }
    } catch (error) {
      console.error('[Meaven] business_expenses table unreachable. Run Phase 1 SQL migration.', error);
      setErrorMsg('Supabase table business_expenses not found/unreachable. Falling back to local offline ledger.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedAmount = parseMoney(formData.amount);
    if (!formData.amount || parsedAmount <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }

    const newRecord = {
      id: Date.now(), // Generate numeric bigint-compliant key
      date: formData.date,
      category: formData.category,
      amount: parsedAmount,
      paidBy: formData.paidBy.trim() || 'Company Account',
      notes: formData.notes.trim() || '',
      type: formData.type,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 1. Optimistic UI update (instant response)
    const updatedExpenses = [newRecord, ...expenses];
    setExpenses(updatedExpenses);

    // 2. Cache locally
    localStorage.setItem('meaven_business_expenses', JSON.stringify(updatedExpenses));

    // 3. Sync to Supabase
    try {
      const { error } = await supabase.from('business_expenses').upsert(newRecord);
      if (error) {
        throw error;
      }
      setErrorMsg(null);
    } catch (error) {
      console.error('[Meaven] business_expenses table unreachable. Run Phase 1 SQL migration.', error);
      setErrorMsg('Write saved locally. Run Supabase SQL migration to sync with cloud database.');
    }

    // Reset Form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: 'Operations',
      amount: '',
      paidBy: '',
      notes: '',
      type: 'Office'
    });
    setShowAddForm(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this business expense?')) return;

    // 1. Optimistic local delete
    const updatedExpenses = expenses.filter(exp => exp.id !== id);
    setExpenses(updatedExpenses);

    // 2. Update cache
    localStorage.setItem('meaven_business_expenses', JSON.stringify(updatedExpenses));

    // 3. Delete from Supabase
    try {
      const { error } = await supabase.from('business_expenses').delete().eq('id', id);
      if (error) {
        throw error;
      }
      setErrorMsg(null);
    } catch (error) {
      console.error('[Meaven] business_expenses delete failed on remote DB.', error);
      setErrorMsg('Delete recorded locally. Sync pending database connection.');
    }
  };

  // Derive metrics
  const stats = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + parseMoney(e.amount), 0);
    
    const catMap = {};
    const typeMap = {};
    const paidByMap = {};

    expenses.forEach(e => {
      const amt = parseMoney(e.amount);
      catMap[e.category] = (catMap[e.category] || 0) + amt;
      typeMap[e.type] = (typeMap[e.type] || 0) + amt;
      const pb = e.paidBy || 'Company Account';
      paidByMap[pb] = (paidByMap[pb] || 0) + amt;
    });

    return {
      total,
      categories: Object.entries(catMap).map(([name, val]) => ({ name, val })).sort((a, b) => b.val - a.val),
      types: Object.entries(typeMap).map(([name, val]) => ({ name, val })).sort((a, b) => b.val - a.val),
      paidBy: Object.entries(paidByMap).map(([name, val]) => ({ name, val })).sort((a, b) => b.val - a.val)
    };
  }, [expenses]);

  // Unique listing of paidBy for filter
  const uniquePaidBy = useMemo(() => {
    const list = new Set();
    expenses.forEach(e => {
      if (e.paidBy) list.add(e.paidBy.trim());
    });
    return Array.from(list);
  }, [expenses]);

  // Filtered Ledger List
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesCat = filterCategory === 'ALL' || e.category === filterCategory;
      const matchesType = filterType === 'ALL' || e.type === filterType;
      const matchesPaidBy = filterPaidBy === 'ALL' || e.paidBy === filterPaidBy;
      
      const search = searchQuery.toLowerCase().trim();
      const matchesSearch = searchQuery === '' || 
        (e.notes && e.notes.toLowerCase().includes(search)) ||
        (e.paidBy && e.paidBy.toLowerCase().includes(search)) ||
        (e.category && e.category.toLowerCase().includes(search)) ||
        (e.type && e.type.toLowerCase().includes(search));

      return matchesCat && matchesType && matchesPaidBy && matchesSearch;
    });
  }, [expenses, filterCategory, filterType, filterPaidBy, searchQuery]);

  return (
    <div className="animate-fade-in" style={{ padding: '0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3.5rem', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 3.2rem)', fontWeight: '900', margin: 0, letterSpacing: '-0.04em' }}>Business Expense Ledger</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.8rem', letterSpacing: '0.25em', fontSize: '0.7rem', textTransform: 'uppercase' }}>Company-Level Operations Control</p>
        </div>
        <div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.8rem 1.6rem', fontSize: '0.85rem' }}
          >
            {showAddForm ? '✕ Close Portal' : '➕ Record Business Expense'}
          </button>
        </div>
      </div>

      {/* 💼 Corporate Overhead Allocation Configurator */}
      <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', marginBottom: '2.5rem', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
        <div 
          onClick={() => setShowOverheadPanel(!showOverheadPanel)} 
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ fontSize: '1.2rem' }}>💼</span>
            <span style={{ fontWeight: '850', fontSize: '0.85rem', letterSpacing: '0.1em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>Corporate Overhead Allocation Configurator</span>
            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: '750', background: 'rgba(102, 178, 194, 0.08)', color: 'var(--accent-color)', border: '1px solid var(--border-accent)' }}>
              Pool: ₹{totalOverheadPool.toLocaleString('en-IN')}
            </span>
          </div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 'bold' }}>{showOverheadPanel ? '▲ COLLAPSE' : '▼ MANAGE'}</span>
        </div>

        {showOverheadPanel && (
          <div className="animate-slide-up" style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              Define company-wide fixed overhead metrics (initialized to zero to prevent distorted project P&Ls). These costs are allocated across active projects using either equal or revenue-weighted proportional methods.
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              setOverheadConfig(localOverhead);
              setOverheadMethod(localMethod);
              alert('Company Overhead Configuration Saved!');
              setShowOverheadPanel(false);
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem', marginBottom: '2rem' }}>
                {Object.keys(localOverhead).map((key) => (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase' }}>
                      {key.replace(/([A-Z])/g, ' $1')} (INR)
                    </label>
                    <input 
                      type="number"
                      placeholder="₹ 0"
                      value={localOverhead[key] || ''}
                      onChange={(e) => {
                        const val = parseMoney(e.target.value);
                        setLocalOverhead(prev => ({ ...prev, [key]: val }));
                      }}
                      style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', padding: '0.65rem', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase' }}>Allocation Model:</span>
                  <div style={{ display: 'flex', gap: '1.2rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="overheadMethod" 
                        value="equal" 
                        checked={localMethod === 'equal'} 
                        onChange={() => setLocalMethod('equal')}
                        style={{ accentColor: 'var(--accent-color)' }}
                      />
                      Equal Allocation
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="overheadMethod" 
                        value="weighted" 
                        checked={localMethod === 'weighted'} 
                        onChange={() => setLocalMethod('weighted')}
                        style={{ accentColor: 'var(--accent-color)' }}
                      />
                      Revenue Weighted
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                    Active Sites: <strong>{activeProjectsCount}</strong><br/>
                    Share / Site: <strong>
                      {localMethod === 'equal' 
                        ? `₹${activeProjectsCount > 0 ? Math.round(totalOverheadPool / activeProjectsCount).toLocaleString('en-IN') : 0}` 
                        : 'Proportional'
                      }
                    </strong>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.5rem', fontSize: '0.8rem' }}>
                    💾 Save Overhead Rules
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Migration / Offline Warning Alert Banner */}
      {errorMsg && (
        <div style={{
          background: 'rgba(255, 69, 58, 0.1)',
          border: '1px solid var(--danger)',
          borderRadius: '12px',
          padding: '1rem 1.5rem',
          marginBottom: '2.5rem',
          color: '#FFD2D0',
          fontSize: '0.85rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>⚠️ <strong>Database Alert:</strong> {errorMsg}</span>
          <button 
            onClick={fetchExpenses}
            style={{ background: 'rgba(255,255,255,0.08)', padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Add Expense Drawer/Form */}
      {showAddForm && (
        <div className="card animate-slide-up" style={{ padding: '2rem', background: 'var(--bg-secondary)', marginBottom: '3rem', border: '1px solid var(--border-accent)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1.5rem', letterSpacing: '0.05em', color: 'var(--accent-color)' }}>💳 NEW OPERATION TRANSACTION</h3>
          
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase' }}>Transaction Date</label>
              <input 
                type="date" 
                name="date"
                required
                value={formData.date}
                onChange={handleInputChange}
                style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase' }}>Expense Category</label>
              <select 
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase' }}>Expense Type (Detailed Tag)</label>
              <select 
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
              >
                {types.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase' }}>Amount (INR)</label>
              <input 
                type="number" 
                step="0.01"
                placeholder="₹ Amount"
                name="amount"
                required
                value={formData.amount}
                onChange={handleInputChange}
                style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase' }}>Paid By / Account</label>
              <input 
                type="text" 
                placeholder="e.g. Ravi, HDFC Account"
                name="paidBy"
                value={formData.paidBy}
                onChange={handleInputChange}
                style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase' }}>Notes & Transaction Details</label>
              <input 
                type="text" 
                placeholder="Vendor, invoice details, purpose of expenditure..."
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ padding: '0.8rem 2rem', fontSize: '0.85rem' }}
              >
                💾 Securely Record Expense
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Corporate Financial HUD */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '4rem' 
      }}>
        <div className="card cinematic-hover" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.15em' }}>TOTAL CORPORATE OUTFLOW</div>
          <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--danger)' }}>
            ₹{stats.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Across all custom-logged business items</div>
        </div>

        <div className="card cinematic-hover" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.15em' }}>PRIMARY CATEGORY OUTFLOW</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '850', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {stats.categories[0] ? `${stats.categories[0].name} (₹${Math.round(stats.categories[0].val).toLocaleString('en-IN')})` : 'No Transactions'}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Highest cost operational category</div>
        </div>

        <div className="card cinematic-hover" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.15em' }}>LEDGER TRANSACTION LOOPS</div>
          <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--accent-color)' }}>
            {filteredExpenses.length} <span style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-secondary)' }}>shown / {expenses.length} total</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Active ledger record counts</div>
        </div>
      </div>

      {/* Analytics Breakdown & Charting Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
        {/* Category Share */}
        <div className="card" style={{ padding: '2rem', background: 'var(--bg-secondary)' }}>
          <h4 style={{ marginBottom: '2rem', fontSize: '0.8rem', letterSpacing: '0.15em', color: 'var(--accent-color)', fontWeight: '850' }}>📊 EXPENSE SHARE BY CATEGORY</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {stats.categories.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>No logged data available</p>
            ) : (
              stats.categories.map(cat => {
                const percent = stats.total > 0 ? Math.round((cat.val / stats.total) * 100) : 0;
                return (
                  <div key={cat.name} className="cinematic-hover">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: '700' }}>{cat.name}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        ₹{Math.round(cat.val).toLocaleString('en-IN')} | {percent}%
                      </span>
                    </div>
                    <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${percent}%`, 
                        background: 'var(--accent-color)',
                        borderRadius: '3px'
                      }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tag (Type) Share */}
        <div className="card" style={{ padding: '2rem', background: 'var(--bg-secondary)' }}>
          <h4 style={{ marginBottom: '2rem', fontSize: '0.8rem', letterSpacing: '0.15em', color: 'var(--accent-color)', fontWeight: '850' }}>🏷️ EXPENSE SHARE BY DETAILED TAG (TYPE)</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {stats.types.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>No logged data available</p>
            ) : (
              stats.types.map(t => {
                const percent = stats.total > 0 ? Math.round((t.val / stats.total) * 100) : 0;
                return (
                  <div key={t.name} className="cinematic-hover">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: '700' }}>{t.name}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        ₹{Math.round(t.val).toLocaleString('en-IN')} | {percent}%
                      </span>
                    </div>
                    <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${percent}%`, 
                        background: 'var(--success)',
                        borderRadius: '3px'
                      }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Paid By Account Share */}
        <div className="card" style={{ padding: '2rem', background: 'var(--bg-secondary)' }}>
          <h4 style={{ marginBottom: '2rem', fontSize: '0.8rem', letterSpacing: '0.15em', color: 'var(--accent-color)', fontWeight: '850' }}>💳 DISBURSEMENT ACCOUNTS</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {stats.paidBy.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>No logged data available</p>
            ) : (
              stats.paidBy.map(pb => {
                const percent = stats.total > 0 ? Math.round((pb.val / stats.total) * 100) : 0;
                return (
                  <div key={pb.name} className="cinematic-hover">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: '700' }}>{pb.name}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        ₹{Math.round(pb.val).toLocaleString('en-IN')} | {percent}%
                      </span>
                    </div>
                    <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${percent}%`, 
                        background: 'rgba(102, 178, 194, 0.5)',
                        borderRadius: '3px'
                      }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Table Filter HUD */}
      <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.2rem', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ flex: '1 1 250px' }}>
            <input 
              type="text" 
              placeholder="🔍 Search notes, accounts, types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', padding: '0.65rem 1rem', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800' }}>CATEGORY:</span>
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', padding: '0.5rem 0.8rem', borderRadius: '6px', color: '#fff', fontSize: '0.75rem' }}
              >
                <option value="ALL">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800' }}>TAG:</span>
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', padding: '0.5rem 0.8rem', borderRadius: '6px', color: '#fff', fontSize: '0.75rem' }}
              >
                <option value="ALL">All Tags</option>
                {types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800' }}>PAID BY:</span>
              <select 
                value={filterPaidBy} 
                onChange={(e) => setFilterPaidBy(e.target.value)}
                style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', padding: '0.5rem 0.8rem', borderRadius: '6px', color: '#fff', fontSize: '0.75rem' }}
              >
                <option value="ALL">All Accounts</option>
                {uniquePaidBy.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

          </div>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '1.2rem 1.5rem', fontWeight: '800', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Date</th>
                <th style={{ padding: '1.2rem 1.5rem', fontWeight: '800', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Category</th>
                <th style={{ padding: '1.2rem 1.5rem', fontWeight: '800', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Tag (Type)</th>
                <th style={{ padding: '1.2rem 1.5rem', fontWeight: '800', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Disbursement (Paid By)</th>
                <th style={{ padding: '1.2rem 1.5rem', fontWeight: '800', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Notes / Details</th>
                <th style={{ padding: '1.2rem 1.5rem', fontWeight: '800', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '1.2rem 1.5rem', fontWeight: '800', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No matching business expenses logged.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)' }} className="cinematic-hover">
                    <td style={{ padding: '1.2rem 1.5rem', fontWeight: '600' }}>
                      {new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '1.2rem 1.5rem' }}>
                      <span style={{ padding: '0.3rem 0.6rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '750', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                        {exp.category}
                      </span>
                    </td>
                    <td style={{ padding: '1.2rem 1.5rem' }}>
                      <span style={{ padding: '0.3rem 0.6rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '750', background: 'rgba(102,178,194,0.06)', border: '1px solid var(--border-accent)', color: 'var(--accent-color)' }}>
                        {exp.type}
                      </span>
                    </td>
                    <td style={{ padding: '1.2rem 1.5rem', color: 'var(--text-secondary)' }}>
                      {exp.paidBy || 'Company Account'}
                    </td>
                    <td style={{ padding: '1.2rem 1.5rem', color: 'var(--text-secondary)', maxWidth: '300px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {exp.notes || '—'}
                    </td>
                    <td style={{ padding: '1.2rem 1.5rem', fontWeight: '800', textAlign: 'right', color: 'var(--danger)' }}>
                      ₹{parseMoney(exp.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '1.2rem 1.5rem', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleDelete(exp.id)}
                        style={{ color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid rgba(255, 69, 58, 0.2)', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(255, 69, 58, 0.05)', transition: 'var(--transition)' }}
                        className="btn-outline"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BusinessExpenseLedger;
