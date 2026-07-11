import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { parseMoney } from '../utils/financialUtils';

// Utility helper: Check if attachment is a PDF
const isPdf = (base64Str) => typeof base64Str === 'string' && base64Str.startsWith('data:application/pdf');

// Utility helper: Open attachment in a new tab/window
const openAttachmentWindow = (base64Data) => {
  const newTab = window.open();
  if (!newTab) return;
  if (isPdf(base64Data)) {
    newTab.document.write(`
      <html>
        <head><title>Bill / Invoice PDF</title>
        <style>body{margin:0;background:#0d0d0d;display:flex;align-items:center;justify-content:center;height:100vh;}</style>
        </head>
        <body>
          <embed src="${base64Data}" type="application/pdf" width="100%" height="100%" style="position:fixed;top:0;left:0;width:100%;height:100%;" />
        </body>
      </html>`);
    newTab.document.close();
  } else {
    openImageWindow(base64Data);
    newTab.close();
  }
};

// Utility helper: Open image attachment in a new tab/window
const openImageWindow = (base64Data) => {
  const newTab = window.open();
  if (newTab) {
    newTab.document.write(`
      <html>
        <head>
          <title>Attachment View</title>
          <style>
            body { margin: 0; background: #0b0f19; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui, sans-serif; color: #fff; }
            img { max-width: 90%; max-height: 85vh; object-fit: contain; box-shadow: 0 20px 50px rgba(0,0,0,0.6); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
            .container { text-align: center; padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 20px; }
            .btn { padding: 8px 24px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
            .btn:hover { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.3); }
          </style>
        </head>
        <body>
          <div class="container">
            <img src="${base64Data}" alt="Attachment" />
            <button class="btn" onclick="window.close()">Close Preview</button>
          </div>
        </body>
      </html>`);
    newTab.document.close();
  }
};

const BusinessExpenseLedger = ({ 
  user,
  vendors = [], 
  projects = [], 
  setVendors, 
  setProjects, 
  onAddVendorPayment, 
  onAddClientReceipt, 
  onNavigateVendor, 
  overheadConfig, 
  setOverheadConfig, 
  overheadMethod, 
  setOverheadMethod 
}) => {
  // Check if current user is an Admin
  const isAdmin = user?.role === 'SuperAdmin' || 
                  user?.role === 'Admin' || 
                  user?.email === 'ravi.bhargaw@meaven.in';

  const activeVendors = vendors || [];
  const activeProjects = projects || [];

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
    return activeProjects.filter(p => p.status === 'Active' || !p.status).length;
  }, [activeProjects]);

  const totalOverheadPool = useMemo(() => {
    return Object.values(localOverhead).reduce((sum, val) => sum + Number(val || 0), 0);
  }, [localOverhead]);

  // UI Control States
  const [showAddForm, setShowAddForm] = useState(false);
  const [formCategoryType, setFormCategoryType] = useState('business_expense'); // business_expense, vendor_payment, client_receipt
  const [formAttachment, setFormAttachment] = useState(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Operations',
    amount: '',
    paidBy: '',
    notes: '',
    type: 'Office',
    vendorId: '',
    contractId: '',
    projectId: '',
    receiptType: 'Milestone Payment'
  });

  // Filter States
  const [filterTypeSelector, setFilterTypeSelector] = useState('ALL'); // ALL, Debit, Credit
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormAttachment(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper to extract entry date from timestamp or return date
  const getEntryDate = (id, dateStr) => {
    if (id && !isNaN(id) && Number(id) > 1000000000000) {
      try {
        return new Date(Number(id)).toISOString().split('T')[0];
      } catch (e) {
        // ignore
      }
    }
    return dateStr || '';
  };

  // Helper to split notes and base64 attachment suffix
  const parseNotes = (notesStr) => {
    if (!notesStr) return { text: '', attachment: null };
    const parts = notesStr.split(' ||attachment:');
    if (parts.length > 1) {
      return {
        text: parts[0],
        attachment: parts[1]
      };
    }
    return { text: notesStr, attachment: null };
  };

  // Compile Unified Transactions Array
  const unifiedTransactions = useMemo(() => {
    const list = [];

    // 1. Corporate Business Expenses
    expenses.forEach(exp => {
      const { text, attachment } = parseNotes(exp.notes);
      list.push({
        uid: `business_expense_${exp.id}`,
        id: exp.id,
        date: exp.date,
        entryDate: exp.created_at ? exp.created_at.split('T')[0] : getEntryDate(exp.id, exp.date),
        category: exp.category || 'Operations',
        type: 'Debit',
        tag: exp.type || 'Office',
        amount: Number(exp.amount || 0),
        paidBy: exp.paidBy || 'Company Account',
        notes: text,
        attachment: attachment,
        vendor: null,
        project: null,
        source: 'business_expense',
        raw: exp
      });
    });

    // 2. Vendor Payments
    activeVendors.forEach(v => {
      (v.contracts || []).forEach(c => {
        (c.payments || []).forEach(p => {
          const screenshot = p.screenshot || p.photo || (Array.isArray(p.photos) && p.photos[0]) || null;
          list.push({
            uid: `vendor_payment_${v.id}_${c.id}_${p.id}`,
            id: p.id,
            date: p.date,
            entryDate: getEntryDate(p.id, p.date),
            category: 'Vendor Payment',
            type: 'Debit',
            tag: 'Material/Service',
            amount: Number(p.amount || 0),
            paidBy: v.name || 'Vendor',
            notes: p.ref ? `Ref: ${p.ref} | Contract: ${c.projectName || 'Active Contract'}` : `Contract: ${c.projectName || 'Active Contract'}`,
            attachment: screenshot,
            vendor: { id: v.id, name: v.name },
            project: c.projectId ? { id: c.projectId, name: c.projectName } : null,
            source: 'vendor_payment',
            vendorId: v.id,
            contractId: c.id,
            raw: p
          });
        });
      });
    });

    // 3. Client Receipts
    activeProjects.forEach(proj => {
      if (proj.clientFinancials && Array.isArray(proj.clientFinancials.received)) {
        proj.clientFinancials.received.forEach(r => {
          const screenshot = r.screenshot || r.photo || (Array.isArray(r.photos) && r.photos[0]) || null;
          list.push({
            uid: `client_receipt_${proj.id}_${r.id}`,
            id: r.id,
            date: r.date,
            entryDate: getEntryDate(r.id, r.date),
            category: 'Client Inflow',
            type: 'Credit',
            tag: r.type || 'Project Inflow',
            amount: Number(r.amount || 0),
            paidBy: proj.client || 'Client',
            notes: r.ref ? `Ref: ${r.ref} | Project: ${proj.name}` : `Project: ${proj.name}`,
            attachment: screenshot,
            vendor: null,
            project: { id: proj.id, name: proj.name },
            source: 'client_receipt',
            projectId: proj.id,
            raw: r
          });
        });
      }
    });

    // Sort: Newest transaction date first. Fallback to ID descending.
    return list.sort((a, b) => {
      const dateDiff = new Date(b.date) - new Date(a.date);
      if (dateDiff !== 0) return dateDiff;
      return b.id - a.id;
    });
  }, [expenses, activeVendors, activeProjects]);

  // Derive metrics
  const stats = useMemo(() => {
    let totalInflow = 0;
    let totalOutflow = 0;

    const catMap = {};
    const tagMap = {};
    const paidByMap = {};

    unifiedTransactions.forEach(t => {
      const amt = t.amount;
      if (t.type === 'Credit') {
        totalInflow += amt;
      } else {
        totalOutflow += amt;
      }

      catMap[t.category] = (catMap[t.category] || 0) + amt;
      tagMap[t.tag] = (tagMap[t.tag] || 0) + amt;
      paidByMap[t.paidBy] = (paidByMap[t.paidBy] || 0) + amt;
    });

    return {
      totalInflow,
      totalOutflow,
      netCashFlow: totalInflow - totalOutflow,
      categories: Object.entries(catMap).map(([name, val]) => ({ name, val })).sort((a, b) => b.val - a.val),
      tags: Object.entries(tagMap).map(([name, val]) => ({ name, val })).sort((a, b) => b.val - a.val),
      paidBy: Object.entries(paidByMap).map(([name, val]) => ({ name, val })).sort((a, b) => b.val - a.val)
    };
  }, [unifiedTransactions]);

  // Derived filter options
  const uniqueCategories = useMemo(() => {
    const set = new Set(categories);
    unifiedTransactions.forEach(t => set.add(t.category));
    return Array.from(set);
  }, [unifiedTransactions]);

  const uniqueTags = useMemo(() => {
    const set = new Set(types);
    unifiedTransactions.forEach(t => set.add(t.tag));
    return Array.from(set);
  }, [unifiedTransactions]);

  const uniquePaidBy = useMemo(() => {
    const set = new Set();
    unifiedTransactions.forEach(t => {
      if (t.paidBy) set.add(t.paidBy.trim());
    });
    return Array.from(set);
  }, [unifiedTransactions]);

  // Filtered list
  const filteredExpenses = useMemo(() => {
    return unifiedTransactions.filter(t => {
      const matchesType = filterTypeSelector === 'ALL' || t.type === filterTypeSelector;
      const matchesCat = filterCategory === 'ALL' || t.category === filterCategory;
      const matchesTag = filterType === 'ALL' || t.tag === filterType;
      const matchesPaidBy = filterPaidBy === 'ALL' || t.paidBy === filterPaidBy;
      
      const search = searchQuery.toLowerCase().trim();
      const matchesSearch = searchQuery === '' || 
        (t.notes && t.notes.toLowerCase().includes(search)) ||
        (t.paidBy && t.paidBy.toLowerCase().includes(search)) ||
        (t.category && t.category.toLowerCase().includes(search)) ||
        (t.tag && t.tag.toLowerCase().includes(search)) ||
        (t.vendor && t.vendor.name.toLowerCase().includes(search)) ||
        (t.project && t.project.name.toLowerCase().includes(search));

      return matchesType && matchesCat && matchesTag && matchesPaidBy && matchesSearch;
    });
  }, [unifiedTransactions, filterTypeSelector, filterCategory, filterType, filterPaidBy, searchQuery]);

  // Dropdown lists for the creation form
  const selectedVendor = activeVendors.find(v => String(v.id) === String(formData.vendorId));
  const availableContracts = selectedVendor ? (selectedVendor.contracts || []) : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedAmount = parseMoney(formData.amount);
    if (!formData.amount || parsedAmount <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }

    if (formCategoryType === 'business_expense') {
      let finalNotes = formData.notes.trim() || 'General Business Expense';
      if (formAttachment) {
        finalNotes = `${finalNotes} ||attachment:${formAttachment}`;
      }

      const newRecord = {
        id: Date.now(),
        date: formData.date,
        category: formData.category,
        amount: parsedAmount,
        paidBy: formData.paidBy.trim() || 'Company Account',
        notes: finalNotes,
        type: formData.type,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // 1. Optimistic UI update
      const updatedExpenses = [newRecord, ...expenses];
      setExpenses(updatedExpenses);

      // 2. Cache locally
      localStorage.setItem('meaven_business_expenses', JSON.stringify(updatedExpenses));

      // 3. Sync to Supabase
      try {
        const { error } = await supabase.from('business_expenses').upsert(newRecord);
        if (error) throw error;
        setErrorMsg(null);
      } catch (error) {
        console.error('[Meaven] business_expenses table unreachable.', error);
        setErrorMsg('Write saved locally. Will sync when database is online.');
      }
    } 
    else if (formCategoryType === 'vendor_payment') {
      if (!onAddVendorPayment) return;
      const vId = formData.vendorId;
      const cId = formData.contractId;
      if (!vId || !cId) {
        alert('Please select a Vendor and a Contract.');
        return;
      }

      const paymentObj = {
        amount: parsedAmount,
        date: formData.date,
        ref: formData.notes.trim() || 'Vendor payment',
        screenshot: formAttachment,
      };

      onAddVendorPayment(vId, cId, paymentObj);
      alert('Vendor Payment recorded successfully!');
    } 
    else if (formCategoryType === 'client_receipt') {
      if (!onAddClientReceipt) return;
      const projId = formData.projectId;
      if (!projId) {
        alert('Please select a Project.');
        return;
      }

      onAddClientReceipt(
        projId, 
        parsedAmount, 
        formData.notes.trim() || 'Client Payment Received', 
        formData.date, 
        formAttachment ? [formAttachment] : [], 
        formData.receiptType || 'Milestone Payment', 
        parsedAmount, 
        0
      );
      alert('Client Receipt recorded successfully!');
    }

    // Reset Form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: 'Operations',
      amount: '',
      paidBy: '',
      notes: '',
      type: 'Office',
      vendorId: '',
      contractId: '',
      projectId: '',
      receiptType: 'Milestone Payment'
    });
    setFormAttachment(null);
    setShowAddForm(false);
  };

  const handleDeleteTransaction = async (t) => {
    if (!window.confirm(`Are you sure you want to permanently delete this ${t.type.toLowerCase()} transaction?`)) return;

    if (t.source === 'business_expense') {
      // 1. Optimistic UI update
      const updatedExpenses = expenses.filter(exp => exp.id !== t.id);
      setExpenses(updatedExpenses);

      // 2. Cache update
      localStorage.setItem('meaven_business_expenses', JSON.stringify(updatedExpenses));

      // 3. Delete from Supabase
      try {
        const { error } = await supabase.from('business_expenses').delete().eq('id', t.id);
        if (error) throw error;
        setErrorMsg(null);
      } catch (error) {
        console.error('[Meaven] business_expenses delete failed on remote DB.', error);
        setErrorMsg('Delete recorded locally. Sync pending database connection.');
      }
    } 
    else if (t.source === 'vendor_payment') {
      if (!setVendors) return;
      // Filter out vendor payment in vendor contracts state
      setVendors(prev => prev.map(v => {
        if (String(v.id) === String(t.vendorId)) {
          return {
            ...v,
            contracts: (v.contracts || []).map(c => {
              if (String(c.id) === String(t.contractId)) {
                return {
                  ...c,
                  payments: (c.payments || []).filter(pay => String(pay.id) !== String(t.id))
                };
              }
              return c;
            })
          };
        }
        return v;
      }));

      // Also filter payout from projects
      if (setProjects) {
        setProjects(prev => prev.map(p => {
          return {
            ...p,
            payouts: (p.payouts || []).filter(pay => String(pay.id) !== String(t.id))
          };
        }));
      }
      alert('Vendor Payment deleted!');
    } 
    else if (t.source === 'client_receipt') {
      if (!setProjects) return;
      // Filter out receipt in project clientFinancials received state
      setProjects(prev => prev.map(p => {
        if (String(p.id) === String(t.projectId)) {
          const received = (p.clientFinancials?.received || []).filter(r => String(r.id) !== String(t.id));
          return {
            ...p,
            clientFinancials: {
              ...p.clientFinancials,
              received
            }
          };
        }
        return p;
      }));
      alert('Client Receipt deleted!');
    }
  };

  // Row-level document uploader for missing attachments
  const handleUploadRowAttachment = async (t, file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result;

      if (t.source === 'business_expense') {
        const currentNotes = t.raw.notes || '';
        const notesWithoutAttachment = currentNotes.split(' ||attachment:')[0];
        const newNotes = `${notesWithoutAttachment} ||attachment:${base64Data}`;

        const updatedRecord = {
          ...t.raw,
          notes: newNotes,
          updated_at: new Date().toISOString()
        };

        // UI & LocalStorage Update
        const updatedExpenses = expenses.map(exp => exp.id === t.id ? updatedRecord : exp);
        setExpenses(updatedExpenses);
        localStorage.setItem('meaven_business_expenses', JSON.stringify(updatedExpenses));

        // Supabase Sync
        try {
          const { error } = await supabase.from('business_expenses').upsert(updatedRecord);
          if (error) throw error;
        } catch (error) {
          console.error('Failed to update business expense attachment:', error);
          alert('Saved locally. Will sync when database is online.');
        }
      } 
      else if (t.source === 'vendor_payment') {
        if (!setVendors) return;
        setVendors(prev => prev.map(v => {
          if (String(v.id) === String(t.vendorId)) {
            return {
              ...v,
              contracts: (v.contracts || []).map(c => {
                if (String(c.id) === String(t.contractId)) {
                  return {
                    ...c,
                    payments: (c.payments || []).map(pay => {
                      if (String(pay.id) === String(t.id)) {
                        return {
                          ...pay,
                          screenshot: base64Data,
                          photo: base64Data,
                          photos: [base64Data]
                        };
                      }
                      return pay;
                    })
                  };
                }
                return c;
              })
            };
          }
          return v;
        }));

        if (setProjects) {
          setProjects(prev => prev.map(p => {
            return {
              ...p,
              payouts: (p.payouts || []).map(pay => {
                if (String(pay.id) === String(t.id)) {
                  return {
                    ...pay,
                    screenshot: base64Data,
                    photo: base64Data,
                    photos: [base64Data]
                  };
                }
                return pay;
              })
            };
          }));
        }
      } 
      else if (t.source === 'client_receipt') {
        if (!setProjects) return;
        setProjects(prev => prev.map(p => {
          if (String(p.id) === String(t.projectId)) {
            return {
              ...p,
              clientFinancials: {
                ...p.clientFinancials,
                received: (p.clientFinancials.received || []).map(r => {
                  if (String(r.id) === String(t.id)) {
                    return {
                      ...r,
                      screenshot: base64Data,
                      photo: base64Data,
                      photos: [base64Data]
                    };
                  }
                  return r;
                })
              }
            };
          }
          return p;
        }));
      }
      alert('Document attached successfully!');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3.5rem', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 3.2rem)', fontWeight: '900', margin: 0, letterSpacing: '-0.04em' }}>Business Ledger</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.8rem', letterSpacing: '0.25em', fontSize: '0.7rem', textTransform: 'uppercase' }}>Company-Level Operations Control</p>
        </div>
        {isAdmin && (
          <div>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.8rem 1.6rem', fontSize: '0.85rem' }}
            >
              {showAddForm ? '✕ Close Portal' : '➕ Record Transaction'}
            </button>
          </div>
        )}
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
              if (!isAdmin) {
                alert('Only administrators can update overhead rules.');
                return;
              }
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
                      disabled={!isAdmin}
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
                        disabled={!isAdmin}
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
                        disabled={!isAdmin}
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
                  {isAdmin && (
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.5rem', fontSize: '0.8rem' }}>
                      💾 Save Overhead Rules
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Database Warning Alert Banner */}
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

      {/* Add Expense Drawer/Form (Admin Only) */}
      {isAdmin && showAddForm && (
        <div className="card animate-slide-up" style={{ padding: '2rem', background: 'var(--bg-secondary)', marginBottom: '3rem', border: '1px solid var(--border-accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '850', margin: 0, letterSpacing: '0.05em', color: 'var(--accent-color)', textTransform: 'uppercase' }}>
              💳 Record New transaction
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-accent)', padding: '0.3rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <button 
                type="button" 
                onClick={() => setFormCategoryType('business_expense')} 
                style={{ background: formCategoryType === 'business_expense' ? 'var(--accent-color)' : 'transparent', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Corporate Expense
              </button>
              <button 
                type="button" 
                onClick={() => setFormCategoryType('vendor_payment')} 
                style={{ background: formCategoryType === 'vendor_payment' ? 'var(--accent-color)' : 'transparent', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Vendor Payment
              </button>
              <button 
                type="button" 
                onClick={() => setFormCategoryType('client_receipt')} 
                style={{ background: formCategoryType === 'client_receipt' ? 'var(--accent-color)' : 'transparent', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Client Receipt
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            
            {/* Dynamic input sections */}
            {formCategoryType === 'business_expense' && (
              <>
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
              </>
            )}

            {formCategoryType === 'vendor_payment' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase' }}>Select Vendor</label>
                  <select 
                    name="vendorId"
                    required
                    value={formData.vendorId}
                    onChange={handleInputChange}
                    style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                  >
                    <option value="">-- Choose Vendor --</option>
                    {activeVendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase' }}>Select Vendor Contract</label>
                  <select 
                    name="contractId"
                    required
                    value={formData.contractId}
                    onChange={handleInputChange}
                    style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                  >
                    <option value="">-- Choose Contract --</option>
                    {availableContracts.map(c => (
                      <option key={c.id} value={c.id}>{c.projectName} (Value: ₹{c.orderValue?.toLocaleString()})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase' }}>Payment Date</label>
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
              </>
            )}

            {formCategoryType === 'client_receipt' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase' }}>Select Project</label>
                  <select 
                    name="projectId"
                    required
                    value={formData.projectId}
                    onChange={handleInputChange}
                    style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                  >
                    <option value="">-- Choose Project --</option>
                    {activeProjects.map(proj => (
                      <option key={proj.id} value={proj.id}>{proj.name} ({proj.client || 'No Client'})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase' }}>Collection Date</label>
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
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase' }}>Amount Received (INR)</label>
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
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase' }}>Receipt Category/Type</label>
                  <select 
                    name="receiptType"
                    value={formData.receiptType}
                    onChange={handleInputChange}
                    style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                  >
                    <option value="Milestone Payment">Milestone Payment</option>
                    <option value="Advance">Advance Payment</option>
                    <option value="Retainer">Retainer Fee</option>
                    <option value="GST Reimbursement">GST Reimbursement</option>
                    <option value="Other">Other Inflow</option>
                  </select>
                </div>
              </>
            )}

            {/* Common Notes & Upload Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase' }}>
                {formCategoryType === 'business_expense' ? 'Notes & Details' : 'Payment Reference (UTR/Cheque/Details)'}
              </label>
              <input 
                type="text" 
                placeholder={formCategoryType === 'business_expense' ? 'Vendor, invoice details, purpose...' : 'Enter payment reference or UTR details...'}
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase' }}>
                Attach Document / Screenshot
              </label>
              <input 
                type="file" 
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', padding: '0.65rem', borderRadius: '8px', color: '#fff', fontSize: '0.8rem' }}
              />
              {formAttachment && (
                <span style={{ fontSize: '0.65rem', color: 'var(--success)' }}>✓ Document loaded in memory</span>
              )}
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ padding: '0.8rem 2rem', fontSize: '0.85rem' }}
              >
                💾 Securely Record Transaction
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Corporate Financial HUD */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '4rem' 
      }}>
        {/* Total Inflow */}
        <div className="card cinematic-hover" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', borderLeft: '4px solid var(--success)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.15em' }}>TOTAL CORPORATE INFLOW</div>
          <div style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--success)' }}>
            ₹{stats.totalInflow.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>From all client payments and inflows</div>
        </div>

        {/* Total Outflow */}
        <div className="card cinematic-hover" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', borderLeft: '4px solid var(--danger)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.15em' }}>TOTAL CORPORATE OUTFLOW</div>
          <div style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--danger)' }}>
            ₹{stats.totalOutflow.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>From general expenses and vendor payouts</div>
        </div>

        {/* Net Cash Position */}
        <div className="card cinematic-hover" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', borderLeft: `4px solid ${stats.netCashFlow >= 0 ? 'var(--accent-color)' : 'var(--danger)'}` }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.15em' }}>NET CASH POSITION</div>
          <div style={{ fontSize: '2.2rem', fontWeight: '900', color: stats.netCashFlow >= 0 ? 'var(--accent-color)' : 'var(--danger)' }}>
            ₹{stats.netCashFlow.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Overall ledger net cash flow status</div>
        </div>

        {/* Transaction Count */}
        <div className="card cinematic-hover" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.15em' }}>LEDGER LOOPS COUNT</div>
          <div style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--text-primary)' }}>
            {filteredExpenses.length} <span style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-secondary)' }}>shown / {unifiedTransactions.length} total</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Active filters count</div>
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
                const totalCombined = stats.totalInflow + stats.totalOutflow;
                const percent = totalCombined > 0 ? Math.round((cat.val / totalCombined) * 100) : 0;
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
                        background: cat.name.includes('Inflow') ? 'var(--success)' : 'var(--accent-color)',
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
            {stats.tags.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>No logged data available</p>
            ) : (
              stats.tags.map(t => {
                const totalCombined = stats.totalInflow + stats.totalOutflow;
                const percent = totalCombined > 0 ? Math.round((t.val / totalCombined) * 100) : 0;
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
                const totalCombined = stats.totalInflow + stats.totalOutflow;
                const percent = totalCombined > 0 ? Math.round((pb.val / totalCombined) * 100) : 0;
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
              placeholder="🔍 Search notes, accounts, types, projects, vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', padding: '0.65rem 1rem', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800' }}>TYPE:</span>
              <select 
                value={filterTypeSelector} 
                onChange={(e) => setFilterTypeSelector(e.target.value)}
                style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', padding: '0.5rem 0.8rem', borderRadius: '6px', color: '#fff', fontSize: '0.75rem' }}
              >
                <option value="ALL">All Types</option>
                <option value="Debit">Debit (Outflow)</option>
                <option value="Credit">Credit (Inflow)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800' }}>CATEGORY:</span>
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', padding: '0.5rem 0.8rem', borderRadius: '6px', color: '#fff', fontSize: '0.75rem' }}
              >
                <option value="ALL">All Categories</option>
                {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
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
                {uniqueTags.map(t => <option key={t} value={t}>{t}</option>)}
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
                <th style={{ padding: '1.2rem 1.5rem', fontWeight: '800', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Dates</th>
                <th style={{ padding: '1.2rem 1.5rem', fontWeight: '800', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Category</th>
                <th style={{ padding: '1.2rem 1.5rem', fontWeight: '800', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Tag (Type)</th>
                <th style={{ padding: '1.2rem 1.5rem', fontWeight: '800', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Disbursement (Paid By)</th>
                <th style={{ padding: '1.2rem 1.5rem', fontWeight: '800', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Notes / Details</th>
                <th style={{ padding: '1.2rem 1.5rem', fontWeight: '800', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center' }}>Type</th>
                <th style={{ padding: '1.2rem 1.5rem', fontWeight: '800', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '1.2rem 1.5rem', fontWeight: '800', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center' }}>Document</th>
                {isAdmin && (
                  <th style={{ padding: '1.2rem 1.5rem', fontWeight: '800', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center' }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No matching ledger transactions logged.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((t) => (
                  <tr key={t.uid} style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)' }} className="cinematic-hover">
                    <td style={{ padding: '1.2rem 1.5rem' }}>
                      <div style={{ fontWeight: '600' }}>
                        {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        Entered: {t.entryDate ? new Date(t.entryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                      </div>
                    </td>
                    <td style={{ padding: '1.2rem 1.5rem' }}>
                      <span style={{ padding: '0.3rem 0.6rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '750', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                        {t.category}
                      </span>
                    </td>
                    <td style={{ padding: '1.2rem 1.5rem' }}>
                      <span style={{ padding: '0.3rem 0.6rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '750', background: 'rgba(102,178,194,0.06)', border: '1px solid var(--border-accent)', color: 'var(--accent-color)' }}>
                        {t.tag}
                      </span>
                    </td>
                    <td style={{ padding: '1.2rem 1.5rem', color: 'var(--text-secondary)' }}>
                      {t.vendor ? (
                        <a 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            if (onNavigateVendor) onNavigateVendor(t.vendor.id);
                          }}
                          style={{ color: 'var(--accent-color)', fontWeight: '700', textDecoration: 'underline' }}
                        >
                          🤝 {t.vendor.name}
                        </a>
                      ) : (
                        t.paidBy || 'Company Account'
                      )}
                    </td>
                    <td style={{ padding: '1.2rem 1.5rem', color: 'var(--text-secondary)', maxWidth: '280px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={t.notes}>
                      {t.notes || '—'}
                    </td>
                    <td style={{ padding: '1.2rem 1.5rem', textAlign: 'center' }}>
                      <span style={{ 
                        fontWeight: '800', 
                        color: t.type === 'Credit' ? 'var(--success)' : 'var(--danger)',
                        fontSize: '0.75rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.2rem'
                      }}>
                        {t.type === 'Credit' ? '➕ Credit' : '➖ Debit'}
                      </span>
                    </td>
                    <td style={{ padding: '1.2rem 1.5rem', fontWeight: '800', textAlign: 'right', color: t.type === 'Credit' ? 'var(--success)' : 'var(--danger)' }}>
                      {t.type === 'Credit' ? '+' : '-'} ₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '1.2rem 1.5rem', textAlign: 'center' }}>
                      {t.attachment ? (
                        <button 
                          type="button"
                          onClick={() => openAttachmentWindow(t.attachment)}
                          style={{ 
                            background: isPdf(t.attachment) ? 'rgba(255,149,0,0.1)' : 'rgba(102,178,194,0.1)', 
                            border: '1px solid ' + (isPdf(t.attachment) ? 'rgba(255,149,0,0.6)' : 'var(--accent-color)'), 
                            borderRadius: '4px', 
                            color: isPdf(t.attachment) ? '#ff9500' : 'var(--accent-color)', 
                            padding: '0.3rem 0.6rem', 
                            fontSize: '0.7rem', 
                            cursor: 'pointer', 
                            fontWeight: '800',
                            transition: 'all 0.2s'
                          }}
                        >
                          {isPdf(t.attachment) ? '📄 PDF' : 'Evidence 📎'}
                        </button>
                      ) : (
                        isAdmin ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>⚠️ No Doc</span>
                            <label style={{ 
                              background: 'rgba(255,255,255,0.05)', 
                              border: '1px dashed var(--border-color)', 
                              borderRadius: '4px', 
                              padding: '0.2rem 0.4rem', 
                              fontSize: '0.65rem', 
                              cursor: 'pointer', 
                              color: 'var(--text-secondary)',
                              transition: 'all 0.2s'
                            }}>
                              📎 Upload
                              <input 
                                type="file" 
                                accept="image/*,application/pdf"
                                onChange={(e) => handleUploadRowAttachment(t, e.target.files[0])}
                                style={{ display: 'none' }}
                              />
                            </label>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>No Doc</span>
                        )
                      )}
                    </td>
                    {isAdmin && (
                      <td style={{ padding: '1.2rem 1.5rem', textAlign: 'center' }}>
                        <button 
                          onClick={() => handleDeleteTransaction(t)}
                          style={{ color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid rgba(255, 69, 58, 0.2)', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(255, 69, 58, 0.05)', transition: 'var(--transition)' }}
                          className="btn-outline"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    )}
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
