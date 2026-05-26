import React, { useState, useEffect } from 'react'
import SiteReadiness from './components/SiteReadiness'
import SiteReadinessAudit from './components/SiteReadinessAudit'
import AccessGateway from './components/AccessGateway'
import SecuritySetup from './components/SecuritySetup'
import PinModal from './components/PinModal'
import NewProjectModal from './components/NewProjectModal'
import useAuth from './hooks/useAuth'
import VendorScoring from './components/VendorScoring'
import ProjectDirectory from './components/ProjectDirectory'
import ClientExperienceHub from './components/ClientExperienceHub'
import StrategicPricingEngine from './components/StrategicPricingEngine'
import AdminPanel from './components/AdminPanel'
import CommandCenter from './components/CommandCenter'
import NewPortfolioModal from './components/NewPortfolioModal'
import ExecutiveSummary from './components/ExecutiveSummary'
import ClientPortalGate from './components/ClientPortalGate'
import AiAssistant from './components/AiAssistant'
import FieldPortal from './components/FieldPortal'
import IntelligenceReports from './components/IntelligenceReports'
import { supabase } from './supabaseClient'
import VendorPublicRegistration from './components/VendorPublicRegistration'
import PostInstallationQC from './components/PostInstallationQC'
import ExecutionOS from './components/ExecutionOS'
import ExecutionPartnerSystem from './components/ExecutionPartnerSystem'
import FounderControlTower from './components/FounderControlTower'

// --- SAFETY VAULT: ERROR BOUNDARY ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '5rem', textAlign: 'center', background: '#1a0000', color: '#ff453a', height: '100vh', width: '100vw', position: 'fixed', inset: 0, zIndex: 9999 }}>
          <h1 style={{ fontSize: '3rem', fontWeight: '900' }}>🚨 CRITICAL RENDER FAILURE</h1>
          <p style={{ fontSize: '1.2rem', margin: '2rem 0' }}>The War Room has encountered a data collision. Please capture this report for Meaven Support.</p>
          <pre style={{ background: '#000', padding: '2rem', borderRadius: '12px', textAlign: 'left', display: 'inline-block', color: '#fff', maxWidth: '80%' }}>
            {this.state.error?.toString()}
          </pre>
          <div style={{ marginTop: '3rem' }}>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="btn btn-primary">REBOOT & CLEAR CACHE ⟳</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const { user, login, loginAsClient, logout, isFirstLogin, updateSecurity, verifyPin, showPinModal, setShowPinModal, users, addUser, removeUser, resetUser, verifyMasterKey } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // --- AUTOMATED ACCESS (PORTAL & PIN CAPTURE) ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const portalParam = params.get('portal')
    const pinParam = params.get('pin')
    if ((portalParam || pinParam) && !user) {
        // Debounce slightly to allow cloud auth to initialize
        const timer = setTimeout(() => handleClientLogin(portalParam, pinParam), 1000)
        return () => clearTimeout(timer)
    }
  }, [user])

  const handleClientLogin = async (portal, pin) => {
    try {
        const { data: cloudPortfolios } = await supabase.from('portfolios').select('*')
        let portfolio = null
        
        if (portal) {
            portfolio = cloudPortfolios?.find(p => 
                (p.data.accessKey === portal || String(p.id) === String(portal)) && 
                (!pin || p.data.clientPin === pin)
            )
        } else if (pin) {
            portfolio = cloudPortfolios?.find(p => p.data.clientPin === pin)
        }
        
        if (portfolio) {
            loginAsClient(portfolio.data)
            setSelectedClient(portfolio.data.name)
            setIsProjectSelected(true)
            setIsClientAuthorized(portfolio.data.isPortalActive === true)
            setClientView(true)
            
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname)
            return true
        }
    } catch (e) {
        console.error("Client PIN Sync Failed:", e)
    }
    return false
  }
   const [clientView, setClientView] = useState(false)
  useEffect(() => {
    if (user) {
        if (user.role === 'Client') {
            setClientView(true)
        } else if (user.role === 'SuperAdmin' || user.role === 'Admin') {
            setClientView(false)
        }
    }
  }, [user])

  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'register') return 'register';
    if (params.get('view') === 'partner') return 'partner';
    const cached = localStorage.getItem('hub_active_tab');
    if (cached === 'partner' || cached === 'register') return 'dashboard';
    return cached || 'dashboard';
  })
  
  useEffect(() => {
    if (activeTab !== 'partner' && activeTab !== 'register') {
        localStorage.setItem('hub_active_tab', activeTab);
    }
  }, [activeTab]);

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)
  const [isNewPortfolioModalOpen, setIsNewPortfolioModalOpen] = useState(false)
  const [isProjectSelected, setIsProjectSelected] = useState(false)
  const [selectedClient, setSelectedClient] = useState('')
  const [projects, setProjects] = useState([])
  const [vendors, setVendors] = useState([])
  const [portfolios, setPortfolios] = useState([])
  const [activeProjectId, setActiveProjectId] = useState(null)
  const activeProject = projects.find(p => Number(p.id) === Number(activeProjectId))
  const [selectedVendorId, setSelectedVendorId] = useState(null)
  const [isClientAuthorized, setIsClientAuthorized] = useState(false)
  const [readinessData, setReadinessData] = useState({})
  const [playbookProposals, setPlaybookProposals] = useState([])
  const [isFieldPortalActive, setIsFieldPortalActive] = useState(false)
  const [isSyncing, setIsSyncing] = useState(true)
  const [navHistory, setNavHistory] = useState([])
  const [theme, setTheme] = useState(() => localStorage.getItem('meaven_theme') || 'dark')
  const [viewingAudit, setViewingAudit] = useState(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('meaven_theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  const defaultMsaTemplate = `
<h2>MASTER SERVICE AGREEMENT</h2>
<p>This Agreement is made on <strong>{{DATE}}</strong> between:</p>
<p><strong>Meaven Designs Intelligence Hub (Meaven)</strong> AND <strong>{{VENDOR_NAME}}</strong>, located at {{ADDRESS}}.</p>

<h3>1. SERVICES</h3>
<p>The Partner agrees to provide <strong>{{CATEGORY}}</strong> services as per individual Project Work Orders.</p>

<h3>2. COMPLIANCE</h3>
<p>The Partner represents that GST (<strong>{{GST}}</strong>) and PAN (<strong>{{PAN}}</strong>) are valid and active compliance IDs.</p>

<h3>3. CONFIDENTIALITY</h3>
<p>All project data, financial records, drawings, client briefs, and EBITDA metrics are strictly confidential.</p>

<h3>4. JURISDICTION</h3>
<p>This agreement is governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of Bangalore.</p>
  `.trim();

  const [msaTemplate, setMsaTemplate] = useState(() => localStorage.getItem('meaven_msa_template') || defaultMsaTemplate)

  useEffect(() => {
    localStorage.setItem('meaven_msa_template', msaTemplate)
  }, [msaTemplate])


  const handleNavigate = (newTab) => {
    if (newTab === activeTab) return
    setNavHistory(prev => [...prev, activeTab])
    setActiveTab(newTab)
  }

  const handleBack = () => {
    if (navHistory.length === 0) return
    const prevTab = navHistory[navHistory.length - 1]
    setNavHistory(prev => prev.slice(0, -1))
    setActiveTab(prevTab)
  }

  // --- VENDOR NORMALIZATION: Full root+data merge for VendorIQ compatibility ---
  const normalizeVendors = (rows) => {
    return rows
      .map(v => {
        // Merge root-level Supabase columns WITH nested data JSONB
        // This handles both hub vendors ({ id, name, data: {...} })
        // and VendorIQ vendors that may store fields at root level too
        const rootFields = { ...v }
        delete rootFields.data
        const dataFields = v.data || {}
        // data takes precedence over root for actual vendor fields
        const d = { ...rootFields, ...dataFields }

        // Filter out deleted vendors (VendorIQ sets status at root level)
        const deletedStatuses = ['delete', 'deleted']
        if (deletedStatuses.includes((v.status || '').toLowerCase())) return null
        if (deletedStatuses.includes((d.status || '').toLowerCase())) return null

        return {
          ...d,
          // Field aliases: ensure hub field names are always populated
          pan:     d.pan     || d.panNumber  || '',
          gst:     d.gst     || d.gstNumber  || '',
          phone:   d.phone   || d.mobile     || '',
          address: d.address || d.location   || '',
          contact: d.contact || d.email      || '',
          name:    d.name    || v.name       || 'Unnamed Vendor',
          // Capitalize and normalize status to prevent casing bugs
          status:  d.status ? (d.status.charAt(0).toUpperCase() + d.status.slice(1).toLowerCase()) : 'Vetting',
          // Capture and normalize vendor category/type from VendorIQ cased entries
          category: (() => {
              const rawType = (d.category || d.type || d.vendorType || d.vendor_type || 'Service').trim().toLowerCase();
              if (rawType.includes('service')) return 'Service';
              if (rawType.includes('material')) return 'Materials';
              if (rawType.includes('logistics')) return 'Logistics';
              
              // Smart backward-compatible legacy mappings
              const legacyMaterials = ['glass', 'aluminum', 'hardware', 'lighting'];
              const legacyServices = ['civil', 'electrical', 'plumbing', 'carpentry', 'other', 'general'];
              if (legacyMaterials.includes(rawType)) return 'Materials';
              if (legacyServices.includes(rawType)) return 'Service';
              
              return 'Service';
          })(),
          // Ensure hub-required arrays are always arrays (never undefined/object)
          contracts: Array.isArray(d.contracts) ? d.contracts : [],
          history:   Array.isArray(d.history)   ? d.history   : [],
          documents: Array.isArray(d.documents) ? d.documents : [],
          metrics: d.metrics || { price: 50, speed: 50, precision: 50, communication: 50 }
        }
      })
      .filter(Boolean)
  }

  // --- CLOUD SYNC ENGINE ---
  useEffect(() => {
    async function loadTacticalData() {
        if (!user && activeTab !== 'partner') {
            setIsSyncing(false)
            return
        }
        setIsSyncing(true)

        try {
            const { data: cloudProjects } = await supabase.from('projects').select('*')
            const { data: cloudVendors } = await supabase.from('vendors').select('*')
            const { data: cloudPortfolios } = await supabase.from('portfolios').select('*')
            const { data: cloudReadiness } = await supabase.from('readiness_data').select('*')

            // Migration Check: If cloud is empty, push local data
            if (!cloudProjects || cloudProjects.length === 0) {
                const localProjects = JSON.parse(localStorage.getItem('projects')) || []
                if (localProjects.length > 0) {
                    await Promise.all(localProjects.map(p => supabase.from('projects').upsert({ id: String(p.id), name: p.name, data: p })))
                    setProjects(localProjects)
                }
            } else {
                setProjects(cloudProjects.map(p => p.data).filter(Boolean))
            }

            if (!cloudVendors || cloudVendors.length === 0) {
                const localVendors = JSON.parse(localStorage.getItem('vendors')) || []
                if (localVendors.length > 0) {
                    await Promise.all(localVendors.map(v => supabase.from('vendors').upsert({ id: String(v.id), name: v.name, data: v })))
                    setVendors(localVendors)
                }
            } else {
                setVendors(normalizeVendors(cloudVendors))
            }

            if (!cloudPortfolios || cloudPortfolios.length === 0) {
                const localPortfolios = JSON.parse(localStorage.getItem('portfolios')) || []
                if (localPortfolios.length > 0) {
                    await Promise.all(localPortfolios.map(p => supabase.from('portfolios').upsert({ id: String(p.id), name: p.name, data: p })))
                    setPortfolios(localPortfolios)
                }
            } else {
                setPortfolios(cloudPortfolios.map(p => p.data).filter(Boolean))
            }

            if (cloudReadiness && cloudReadiness.length > 0) {
                const rData = {}
                cloudReadiness.forEach(r => rData[r.id] = r.data)
                setReadinessData(rData)
            } else {
                setReadinessData(JSON.parse(localStorage.getItem('readinessData')) || {})
            }

            setPlaybookProposals(JSON.parse(localStorage.getItem('playbookProposals')) || [])
        } catch (error) {
            console.error("Cloud Tactical Sync Failed:", error)
        } finally {
            setIsSyncing(false)
        }
    }
    loadTacticalData()

    // ✅ REAL-TIME SYNC: Subscribe to vendor table changes from VendorIQ
    const vendorSubscription = supabase
        .channel('vendors-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'vendors' }, (payload) => {
            if (payload.eventType === 'DELETE') {
                setVendors(prev => prev.filter(v => String(v.id) !== String(payload.old?.id)))
            } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                const newRow = payload.new
                const normalized = normalizeVendors([newRow])
                if (normalized.length === 0) {
                    // vendor was deleted/flagged — remove it
                    setVendors(prev => prev.filter(v => String(v.id) !== String(newRow.id)))
                    return
                }
                setVendors(prev => {
                    const exists = prev.find(v => String(v.id) === String(normalized[0].id))
                    if (exists) return prev.map(v => String(v.id) === String(normalized[0].id) ? normalized[0] : v)
                    return [...prev, normalized[0]]
                })
            }
        })
        .subscribe()

    return () => supabase.removeChannel(vendorSubscription)
  }, [user])

  // --- AUTO-PERSISTENCE (LOCAL + CLOUD) ---
  useEffect(() => { 
    localStorage.setItem('projects', JSON.stringify(projects))
    if (!isSyncing && projects.length > 0) {
        projects.forEach(p => supabase.from('projects').upsert({ id: String(p.id), name: p.name, data: p }).then(() => {}))
    }
  }, [projects, isSyncing])

  useEffect(() => { 
    localStorage.setItem('vendors', JSON.stringify(vendors)) 
    if (!isSyncing && vendors.length > 0) {
        // Only upsert hub-created vendors (those with contracts or hub-created history)
        // Skip VendorIQ-only registrations to prevent overwriting their cloud data
        vendors
            .filter(v => v._hubCreated || (v.contracts && v.contracts.length > 0))
            .forEach(v => supabase.from('vendors').upsert({ id: String(v.id), name: v.name, data: v }).then(() => {}))
    }
  }, [vendors, isSyncing])

  useEffect(() => { 
    localStorage.setItem('portfolios', JSON.stringify(portfolios)) 
    if (!isSyncing && portfolios.length > 0) {
        portfolios.forEach(p => supabase.from('portfolios').upsert({ id: String(p.id), name: p.name, data: p }).then(() => {}))
    }
  }, [portfolios, isSyncing])

  // --- SELF-HEALING PORTFOLIOS ENGINE ---
  // Automatically generate missing client portfolios for any existing projects
  useEffect(() => {
    if (isSyncing || !projects || projects.length === 0) return

    const uniqueClients = [...new Set(projects.map(p => p.client).filter(Boolean))]
    const missingPortfolios = uniqueClients.filter(clientName => {
        return !(portfolios || []).some(p => p.name === clientName)
    })

    if (missingPortfolios.length > 0) {
        const newPortfolios = missingPortfolios.map((clientName, index) => ({
            id: Date.now() + index,
            name: clientName,
            stakeholders: [],
            isPortalActive: false,
            clientPin: '2410',
            accessKey: Math.random().toString(36).substr(2, 8),
            pocName: 'TBD',
            pocEmail: `${clientName.toLowerCase().replace(/\s+/g, '')}@meaven.in`
        }))
        setPortfolios(prev => [...(prev || []), ...newPortfolios])
    }
  }, [projects, portfolios, isSyncing])

  // --- SELF-HEALING PROJECTS CASE-INSENSITIVE DEDUPLICATION ENGINE ---
  useEffect(() => {
    if (isSyncing || !projects || projects.length === 0) return

    // Group projects by lowercase name
    const grouped = {}
    projects.forEach(p => {
      if (!p || !p.name) return
      const lower = p.name.toLowerCase().trim()
      if (!grouped[lower]) grouped[lower] = []
      grouped[lower].push(p)
    })

    let hasChange = false
    const mergedProjects = []

    Object.keys(grouped).forEach(lower => {
      const list = grouped[lower]
      if (list.length === 1) {
        mergedProjects.push(list[0])
      } else {
        // We have duplicates! Let's merge them.
        hasChange = true
        // Sort: first by presence of clientFinancials (non-zero totalValue), then by ID (older first)
        list.sort((a, b) => {
          const aVal = a.clientFinancials?.totalValue || 0
          const bVal = b.clientFinancials?.totalValue || 0
          if (aVal !== bVal) return bVal - aVal
          return a.id - b.id
        })

        const canonical = { ...list[0] }
        
        // Merge the rest into canonical
        for (let i = 1; i < list.length; i++) {
          const dup = list[i]
          
          // Merge audit history
          const mergedAudits = [...(canonical.auditHistory || [])]
          ;(dup.auditHistory || []).forEach(aud => {
            if (!mergedAudits.some(a => a.auditId === aud.auditId)) {
              mergedAudits.push(aud)
            }
          })
          canonical.auditHistory = mergedAudits

          // Merge QC history
          const mergedQCs = [...(canonical.qcHistory || [])]
          ;(dup.qcHistory || []).forEach(qc => {
            if (!mergedQCs.some(q => q.qcId === qc.qcId)) {
              mergedQCs.push(qc)
            }
          })
          canonical.qcHistory = mergedQCs

          // Merge payouts
          const mergedPayouts = [...(canonical.payouts || [])]
          ;(dup.payouts || []).forEach(po => {
            if (!mergedPayouts.some(p => p.id === po.id || (p.ref === po.ref && p.amount === po.amount))) {
              mergedPayouts.push(po)
            }
          })
          canonical.payouts = mergedPayouts

          // Merge vendor updates
          const mergedUpdates = [...(canonical.vendorUpdates || [])]
          ;(dup.vendorUpdates || []).forEach(up => {
            if (!mergedUpdates.some(u => u.id === up.id)) {
              mergedUpdates.push(up)
            }
          })
          canonical.vendorUpdates = mergedUpdates

          // Merge history
          const mergedHistory = [...(canonical.history || [])]
          ;(dup.history || []).forEach(h => {
            if (!mergedHistory.some(x => x.id === h.id || (x.title === h.title && x.detail === h.detail))) {
              mergedHistory.push(h)
            }
          })
          canonical.history = mergedHistory

          // Merge clientFinancials
          const canonicalFin = canonical.clientFinancials || { totalValue: 0, requests: [], received: [] }
          const dupFin = dup.clientFinancials || { totalValue: 0, requests: [], received: [] }
          
          const mergedReceived = [...(canonicalFin.received || [])]
          ;(dupFin.received || []).forEach(rec => {
            if (!mergedReceived.some(r => r.id === rec.id || (r.ref === rec.ref && r.amount === rec.amount))) {
              mergedReceived.push(rec)
            }
          })

          const mergedRequests = [...(canonicalFin.requests || [])]
          ;(dupFin.requests || []).forEach(req => {
            if (!mergedRequests.some(r => r.id === req.id)) {
              mergedRequests.push(req)
            }
          })

          canonical.clientFinancials = {
            totalValue: Math.max(canonicalFin.totalValue || 0, dupFin.totalValue || 0),
            requests: mergedRequests,
            received: mergedReceived
          }

          if (!canonical.assignedVendor && dup.assignedVendor) {
            canonical.assignedVendor = dup.assignedVendor
          }

          if (!canonical.readiness && dup.readiness) {
            canonical.readiness = dup.readiness
          }
        }

        mergedProjects.push(canonical)

        // Delete duplicates from Supabase in the background
        list.slice(1).forEach(dup => {
          supabase.from('projects').delete().eq('id', String(dup.id)).then(({error}) => {
            if (error) console.error("Could not delete duplicate project in Supabase:", error)
          })
        })
      }
    })

    if (hasChange) {
      setProjects(mergedProjects)
    }
  }, [projects, isSyncing])

  useEffect(() => {
    localStorage.setItem('meaven_projects', JSON.stringify(projects))
    localStorage.setItem('meaven_vendors', JSON.stringify(vendors))
    localStorage.setItem('meaven_portfolios', JSON.stringify(portfolios))
    localStorage.setItem('meaven_readiness', JSON.stringify(readinessData))
  }, [projects, vendors, portfolios, readinessData])

  useEffect(() => {
    window.navigateToVendorBench = (vendorId) => {
        setSelectedVendorId(vendorId)
        setActiveTab('vendors')
    }

    // Listen for global navigation requests (e.g., from deep-link buttons)
    const handleGlobalNav = (e) => {
        if (e.detail) handleNavigate(e.detail)
    }
    window.addEventListener('navigate', handleGlobalNav)
    
    return () => {
        window.removeEventListener('navigate', handleGlobalNav)
    }
  }, [activeTab])

  // 🔄 GLOBAL FINANCIAL RECONCILIATION ENGINE
  // Optimized to run only when critical data changes to prevent lag
  useEffect(() => {
    if (projects.length === 0 || vendors.length === 0 || isSyncing) return;

    const timeoutId = setTimeout(() => {
        setVendors(prevVendors => {
            let hasChanges = false;
            const updatedVendors = prevVendors.map(vendor => {
                let vendorUpdated = false;
                const updatedContracts = (vendor.contracts || []).map(contract => {
                    // Find the project associated with this contract
                    const project = projects.find(p => p.name === contract.projectName);
                    if (!project || !project.payouts) return contract;

                    // Filter project payouts that belong to this vendor
                    const projectPayoutsForVendor = project.payouts.filter(p => String(p.vendorId) === String(vendor.id));
                    
                    // Check if any payout is missing from the vendor contract ledger
                    const missingPayouts = projectPayoutsForVendor.filter(pp => 
                        !(contract.payments || []).some(cp => cp.ref === pp.ref && cp.amount === pp.amount)
                    );

                    if (missingPayouts.length > 0) {
                        vendorUpdated = true;
                        hasChanges = true;
                        return {
                            ...contract,
                            payments: [...(contract.payments || []), ...missingPayouts.map(mp => ({
                                id: mp.id,
                                amount: mp.amount,
                                date: mp.date,
                                ref: mp.ref,
                                isLegacySync: true
                            }))]
                        };
                    }
                    return contract;
                });

                return vendorUpdated ? { ...vendor, contracts: updatedContracts } : vendor;
            });

            return hasChanges ? updatedVendors : prevVendors;
        });
    }, 1000); // Debounce to prevent 2G-like lag during heavy edits

    return () => clearTimeout(timeoutId);
  }, [projects.length, isSyncing]); // Run when project count changes or on mount

  useEffect(() => { localStorage.setItem('readinessData', JSON.stringify(readinessData)) }, [readinessData])
  useEffect(() => { localStorage.setItem('playbookProposals', JSON.stringify(playbookProposals)) }, [playbookProposals])

  useEffect(() => {
    if (user && projects.length > 0) {
      const loginKey = `login_logged_${user.email}_${new Date().toDateString()}`
      if (!sessionStorage.getItem(loginKey)) {
        setProjects(prev => prev.map(p => ({
          ...p,
          history: [
            ...(p.history || []),
            { 
              id: Date.now() + Math.random(), 
              type: 'info', 
              title: 'Tactical Access Authorized', 
              detail: `Operator ${user.name} initialized secure session`, 
              timestamp: new Date().toISOString() 
            }
          ]
        })))
        sessionStorage.setItem(loginKey, 'true')
      }
    }
  }, [user, isSyncing])

  if (activeTab === 'register') return (
    <div className="dashboard-app-root">
       <VendorPublicRegistration />
    </div>
  )

  const handleVendorUpdateSubmit = (projectId, update) => {
    setProjects(prev => prev.map(p => {
        if (Number(p.id) === Number(projectId)) {
            return {
                ...p,
                vendorUpdates: [
                    ...(p.vendorUpdates || []),
                    update
                ]
            }
        }
        return p
    }))
  }

  if (activeTab === 'partner') {
    if (isSyncing) {
        return (
            <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: 'var(--accent-color)', fontSize: '1.2rem', fontWeight: '800', letterSpacing: '0.1em' }}>SYNCING SECURE PROJECT DATA...</div>
            </div>
        )
    }
    return (
        <div className="dashboard-app-root">
           <ExecutionPartnerSystem projects={projects} onSubmitUpdate={handleVendorUpdateSubmit} />
        </div>
    )
  }

  if (!user) return (
    <div className="dashboard-app-root">
      <AccessGateway onLogin={login} onClientLogin={handleClientLogin} onVerifyMasterKey={verifyMasterKey} />
      <AiAssistant activeTab="dashboard" clientView={true} userName="Guest" />
    </div>
  )
  if (isFirstLogin) return (
    <div className="dashboard-app-root">
      <SecuritySetup onComplete={updateSecurity} />
      <AiAssistant activeTab="dashboard" clientView={false} userName={user?.name || 'Operator'} />
    </div>
  )

  const handlePinVerify = (pin) => {
    if (verifyPin(pin)) { setClientView(false); setShowPinModal(false); }
    else { alert("Invalid Security PIN"); }
  }

  const handleCreateProject = (newProject) => {
    if (newProject.isNewPortfolio) {
        const newPortfolio = { id: newProject.portfolioId, name: newProject.client, stakeholders: [] }
        setPortfolios(prev => [...(prev || []), newPortfolio])
    }
    const project = { 
        ...newProject, 
        id: Date.now(), 
        status: 'Active',
        startDate: new Date().toISOString().split('T')[0],
        endDate: null,
        vendorEndDate: null,
        milestones: { measurementDate: null, siteReadiness: null, completion: null }, 
        clientFinancials: { totalValue: 0, requests: [], received: [] }, 
        history: [{ id: 1, type: 'info', title: 'Project Initialized', detail: `Project loop set for ${newProject.name}`, timestamp: new Date().toISOString() }] 
    }
    setProjects([...(projects || []), project]); setActiveProjectId(project.id); setIsNewProjectModalOpen(false);
  }

  const handleCreatePortfolio = (newPortfolio) => {
    setPortfolios(prev => [...(prev || []), newPortfolio]); setSelectedClient(newPortfolio.name); setIsProjectSelected(true); setActiveTab('dashboard');
  }

  const handleLogPayment = (projectId, amount, ref, date, photos) => {
    setProjects(prev => prev.map(p => {
        if (Number(p.id) === Number(projectId)) {
            const financials = p.clientFinancials || { totalValue: 0, requests: [], received: [] }
            const newPayment = { 
                id: Date.now(), 
                amount: parseInt(amount), 
                ref, 
                date, 
                photo: Array.isArray(photos) ? (photos[0] || null) : (photos || null),
                photos: Array.isArray(photos) ? photos : (photos ? [photos] : [])
            }
            return { 
                ...p, 
                clientFinancials: { ...financials, received: [...(financials.received || []), newPayment] },
                history: [...(p.history || []), { 
                    id: Date.now() + 1, 
                    type: 'success', 
                    title: 'Payment Received', 
                    detail: `₹${parseInt(amount).toLocaleString()} credited. Ref: ${ref}`, 
                    timestamp: new Date().toISOString(),
                    isClientVisible: false
                }]
            }
        }
        return p
    }))
  }

  const handleLogPayout = (projectId, amount, ref, date, photos, vendorId) => {
    // 1. Update Project Ledger
    setProjects(prev => (prev || []).map(p => {
        if (Number(p.id) === Number(projectId)) {
            const newPayout = { 
                id: Date.now(), 
                amount: parseInt(amount), 
                ref, 
                date, 
                photo: Array.isArray(photos) ? (photos[0] || null) : (photos || null),
                photos: Array.isArray(photos) ? photos : (photos ? [photos] : []),
                vendorId 
            }
            return { 
                ...p, 
                payouts: [...(p.payouts || []), newPayout],
                history: [...(p.history || []), { 
                    id: Date.now() + 1, 
                    type: 'warning', 
                    title: 'Vendor Payout', 
                    detail: `₹${parseInt(amount).toLocaleString()} debited. Ref: ${ref}`, 
                    timestamp: new Date().toISOString(),
                    isClientVisible: false
                }]
            }
        }
        return p
    }))

    // 2. Synchronize to Vendor Bench (Specific Contract)
    if (vendorId) {
        setVendors(prev => (prev || []).map(v => {
            if (String(v.id) === String(vendorId)) {
                const projectName = projects.find(p => p.id === projectId)?.name
                return {
                    ...v,
                    contracts: (v.contracts || []).map(c => {
                        if (c.projectName === projectName) {
                            return {
                                ...c,
                                payments: [
                                    ...(c.payments || []),
                                    { id: Date.now(), amount: parseInt(amount), date, ref }
                                ]
                            }
                        }
                        return c
                    })
                }
            }
            return v
        }))
    }
  }

  const handleUpdateProjectMilestones = (projectId, milestones) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, milestones: { ...p.milestones, ...milestones } } : p))
  }

  const handleUpdateProject = (projectId, updates) => {
    setProjects(prev => (prev || []).map(p => Number(p.id) === Number(projectId) ? { ...p, ...updates } : p))
  }

  const handleProjectAddNote = (projectId, note) => {
    setProjects(prev => (prev || []).map(p => {
        if (Number(p.id) === Number(projectId)) {
            return {
                ...p,
                history: [
                    ...(p.history || []),
                    { 
                        id: Date.now(), 
                        type: 'note', 
                        title: 'Tactical Intel', 
                        detail: note, 
                        date: new Date().toISOString().split('T')[0],
                        isClientVisible: false
                    }
                ]
            }
        }
        return p
    }))
  }

  const handleToggleTimelineVisibility = (projectId, historyId) => {
    setProjects(prev => prev.map(p => {
        if (Number(p.id) === Number(projectId)) {
            return {
                ...p,
                history: (p.history || []).map(h => 
                    h.id === historyId ? { ...h, isClientVisible: !h.isClientVisible } : h
                )
            }
        }
        return p
    }))
  }

  const handleUpdateReadiness = (projectId, data) => {
    setReadinessData(prev => ({ ...prev, [projectId]: data }))
  }

  const handleExecutionAuditSubmit = (payload) => {
    const existingAudits = JSON.parse(localStorage.getItem('execution_audits')) || [];
    existingAudits.push(payload);
    localStorage.setItem('execution_audits', JSON.stringify(existingAudits));

    if (supabase) {
        supabase.from('site_audits').upsert([{ id: payload.auditId, data: payload }]).then(({error}) => {
            if (error) console.error("Cloud Sync Error for Audit:", error);
        });
    }

    const projectName = payload.projectInfo?.name;
    if (projectName) {
        const cleanName = projectName.trim().toLowerCase();
        const existingProject = projects.find(p => p.name.trim().toLowerCase() === cleanName);
        
        if (!existingProject) {
            // Create New Project based on Audit Data
            const newProject = {
                id: Date.now(),
                name: projectName,
                client: payload.projectInfo.client || 'Direct Site Entry',
                status: 'Active',
                readiness: payload.readinessScore,
                startDate: new Date().toISOString().split('T')[0],
                milestones: { measurementDate: null, siteReadiness: null, completion: null },
                clientFinancials: { totalValue: 0, requests: [], received: [] },
                auditHistory: [payload],
                history: [
                    { 
                        id: Date.now(), 
                        type: 'info', 
                        title: 'Project Initialized via Audit', 
                        detail: `Loop started via Technical Audit ${payload.auditId}`, 
                        timestamp: new Date().toISOString() 
                    },
                    {
                        id: Date.now() + 1,
                        type: 'success',
                        title: 'Technical Audit Transmitted',
                        detail: `Audit ${payload.auditId} (${payload.readinessScore}% Readiness) digitally transmitted to ${payload.projectInfo?.clientEmail || 'Client'}. Verification window: 48h.`,
                        timestamp: new Date().toISOString(),
                        isClientVisible: true
                    }
                ]
            };
            setProjects(prev => [...(prev || []), newProject]);
        } else {
            // Update Existing Project
            setProjects(prev => prev.map(p => {
                if (p.name.trim().toLowerCase() === cleanName) {
                    return {
                        ...p,
                        readiness: payload.readinessScore,
                        auditHistory: [...(p.auditHistory || []), payload],
                        history: [
                            ...(p.history || []),
                            {
                                id: Date.now(),
                                type: 'success',
                                title: 'Technical Audit Transmitted',
                                detail: `Audit ${payload.auditId} (${payload.readinessScore}% Readiness) digitally transmitted to ${payload.projectInfo?.clientEmail || 'Client'}. Verification window: 48h.`,
                                timestamp: new Date().toISOString(),
                                isClientVisible: true
                            }
                        ]
                    };
                }
                return p;
            }));
        }
    }
    setViewingAudit(payload); // Open the report after submission
  }

  const handleQCReportSubmit = (payload) => {
    const existingQCs = JSON.parse(localStorage.getItem('post_qcs')) || [];
    existingQCs.push(payload);
    localStorage.setItem('post_qcs', JSON.stringify(existingQCs));

    if (supabase) {
        supabase.from('qc_reports').upsert([{ id: payload.qcId, data: payload }]).then(({error}) => {
            if (error) console.error("Cloud Sync Error for QC Report:", error);
        });
    }

    const projectName = payload.projectInfo?.name;
    if (projectName) {
        const cleanName = projectName.trim().toLowerCase();
        setProjects(prev => prev.map(p => {
            if (p.name.trim().toLowerCase() === cleanName) {
                const qcHistory = [...(p.qcHistory || []), payload];
                
                let nextStage = p.stageIndex !== undefined ? p.stageIndex : 1;
                if (payload.overallStatus === 'Ready for Handover') {
                  nextStage = 8;
                } else if (payload.overallStatus === 'Ready with Minor Rectifications' || payload.overallStatus === 'Hold for Rectification') {
                  nextStage = 7;
                } else if (payload.overallStatus === 'Critical Rework Required') {
                  nextStage = 6;
                }

                return {
                    ...p,
                    qcHistory,
                    stageIndex: nextStage,
                    history: [
                        ...(p.history || []),
                        {
                            id: Date.now(),
                            type: payload.overallStatus.includes('Ready') ? 'success' : 'warning',
                            title: `QC Report Submitted: ${payload.qcId}`,
                            detail: `Overall Status: ${payload.overallStatus} • Readiness: ${payload.scores.readiness}% • Snags: ${payload.scores.severity}`,
                            timestamp: new Date().toISOString(),
                            isClientVisible: true
                        }
                    ]
                };
            }
            return p;
        }));
    }
  };

  const handleAddVendor = (newVendor) => {
    setVendors([...vendors, { ...newVendor, id: Date.now() }])
  }

  const handleLockLocation = (projectId, coords) => {
    setProjects(prev => prev.map(p => String(p.id) === String(projectId) ? { ...p, coordinates: coords, locationLocked: true } : p))
  }

  const handleUpdateVendor = (id, updates) => {
    setVendors(vendors.map(v => String(v.id) === String(id) ? { ...v, ...updates } : v))
  }

  const handleAddVendorPayment = (vendorId, contractId, payment) => {
    setVendors(vendors.map(v => String(v.id) === String(vendorId) ? { ...v, contracts: v.contracts.map(c => String(c.id) === String(contractId) ? { ...c, payments: [...(c.payments || []), { ...payment, id: Date.now() }] } : c) } : v))
  }

  const handleAddVendorContract = (vendorId, projectName, orderValue) => {
    const vendor = vendors.find(v => String(v.id) === String(vendorId))
    if (!vendor) return

    setVendors(vendors.map(v => String(v.id) === String(vendorId) ? { ...v, contracts: [...(v.contracts || []), { id: Date.now(), projectName, orderValue: parseInt(orderValue), status: 'Active', payments: [] }] } : v))
    
    // TWO-WAY SYNC: Also update the project record
    setProjects(prev => prev.map(p => {
        if (p.name === projectName) {
            return {
                ...p,
                assignedVendor: vendor.name,
                history: [
                    ...(p.history || []),
                    {
                        id: Date.now(),
                        type: 'system',
                        title: 'Partner Linked',
                        detail: `${vendor.name} linked as primary partner via Vendor Bench.`,
                        date: new Date().toISOString().split('T')[0]
                    }
                ]
            }
        }
        return p
    }))
  }

  const handleVendorAddNote = (vendorId, note) => {
    setVendors(prev => prev.map(v => {
        if (String(v.id) === String(vendorId)) {
            return {
                ...v,
                history: [
                    ...(v.history || []),
                    { 
                        id: Date.now(), 
                        type: 'note', 
                        title: 'Intelligence Update', 
                        detail: note, 
                        date: new Date().toISOString().split('T')[0] 
                    }
                ]
            }
        }
        return v
    }))
  }

  const handleAssignVendor = (projectId, vendorId, orderValue) => {
    const vendor = vendors.find(v => String(v.id) === String(vendorId))
    const project = projects.find(p => String(p.id) === String(projectId))

    if (!vendor || !project) return

    setProjects(prev => prev.map(p => {
        if (String(p.id) === String(projectId)) {
            return {
                ...p,
                assignedVendor: vendor.name,
                history: [
                    ...(p.history || []),
                    {
                        id: Date.now(),
                        type: 'system',
                        title: 'Partner Assigned',
                        detail: `${vendor.name} assigned as primary partner.`,
                        date: new Date().toISOString().split('T')[0]
                    }
                ]
            }
        }
        return p
    }))

    setVendors(prev => prev.map(v => {
        if (String(v.id) === String(vendorId)) {
            return {
                ...v,
                contracts: [
                    ...(v.contracts || []),
                    {
                        id: Date.now(),
                        projectName: project.name,
                        orderValue: parseInt(orderValue),
                        status: 'Active',
                        payments: []
                    }
                ]
            }
        }
        return v
    }))
  }

  const handleReassignProject = (projectId, oldVendorId, newVendorId, orderValue) => {
    const oldVendor = vendors.find(v => String(v.id) === String(oldVendorId))
    const newVendor = vendors.find(v => String(v.id) === String(newVendorId))
    const project = projects.find(p => String(p.id) === String(projectId))

    if (!newVendor || !project) return

    // 1. Update Project
    setProjects(prev => prev.map(p => {
        if (String(p.id) === String(projectId)) {
            return {
                ...p,
                assignedVendor: newVendor.name,
                history: [
                    ...(p.history || []),
                    {
                        id: Date.now(),
                        type: 'system',
                        title: 'Partner Orchestration',
                        detail: `Emergency Reassignment: ${oldVendor?.name || 'Previous Partner'} replaced by ${newVendor.name}.`,
                        date: new Date().toISOString().split('T')[0]
                    }
                ]
            }
        }
        return p
    }))

    // 2. Update Vendors (Terminate old, Add new)
    setVendors(prev => prev.map(v => {
        if (String(v.id) === String(oldVendorId)) {
            return {
                ...v,
                contracts: (v.contracts || []).map(c => 
                    c.projectName === project.name ? { ...c, status: 'Terminated' } : c
                )
            }
        }
        if (String(v.id) === String(newVendorId)) {
            return {
                ...v,
                contracts: [
                    ...(v.contracts || []),
                    {
                        id: Date.now(),
                        projectName: project.name,
                        orderValue: parseInt(orderValue),
                        status: 'Active',
                        payments: []
                    }
                ]
            }
        }
        return v
    }))
  }
  const handleFieldReport = (report) => {
    setProjects(prev => prev.map(p => {
        if (String(p.id) === String(report.projectId)) {
            return {
                ...p,
                history: [
                    ...(p.history || []),
                    {
                        id: Date.now(),
                        type: 'danger',
                        title: `FIELD SOS: ${report.issueType}`,
                        detail: report.details,
                        date: new Date().toISOString().split('T')[0],
                        isClientVisible: false
                    }
                ]
            }
        }
        return p
    }))
  }
  const handleRemoveProject = (id) => setProjects(prev => prev.filter(p => p.id !== id))
  const handleRemoveVendor = (id) => setVendors(prev => prev.filter(v => v.id !== id))
  const handleRemovePortfolio = (id) => setPortfolios(prev => prev.filter(p => p.id !== id))
  
  const handleExportData = () => {
    // 1. Define CSV Headers & Content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "CATEGORY,ID,NAME,CLIENT,STATUS,FINANCIALS/REMARKS\n";

    // 2. Map Portfolios
    (portfolios || []).forEach(p => {
        csvContent += `PORTFOLIO,${p.id},"${p.name}","${p.pocName || 'N/A'}","${p.isPortalActive ? 'LIVE' : 'OFFLINE'}","POC: ${p.pocEmail || 'N/A'}"\n`;
    });

    // 3. Map Projects
    (projects || []).forEach(p => {
        const margin = p.margin || 0;
        const financials = p.clientFinancials?.totalValue || 0;
        csvContent += `PROJECT,${p.id},"${p.name}","${p.client}","${p.status}","Value: ₹${financials} | EBITDA: ${margin}%"\n`;
    });

    // 4. Map Vendors
    (vendors || []).forEach(v => {
        csvContent += `VENDOR,${v.id},"${v.name}","${v.pocName || 'N/A'}","${v.category}","Email: ${v.pocEmail || 'N/A'}"\n`;
    });

    // 5. Trigger Download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MEAVEN_TACTICAL_BACKUP_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert("Tactical Ledger Exported Successfully. This file can be opened in Excel or Google Sheets.");
  }

  const handleHardReset = async () => {
    if (confirm("🚨 CRITICAL WARNING: This will permanently DELETE all projects, vendors, and portfolios from the CLOUD and this device. This cannot be undone. Proceed?")) {
        try {
            // 1. Wipe Cloud Data (Keeping Profiles/Users intact)
            await Promise.all([
                supabase.from('projects').delete().neq('id', '0'),
                supabase.from('vendors').delete().neq('id', '0'),
                supabase.from('portfolios').delete().neq('id', '0'),
                supabase.from('readiness_data').delete().neq('id', '0')
            ]);

            // 2. Clear Local State
            setProjects([])
            setVendors([])
            setPortfolios([])
            setReadinessData({})

            // 3. Clear Local Storage
            localStorage.clear()
            
            alert("Tactical Database Flushed Successfully.");
            window.location.reload()
        } catch (e) {
            console.error("Hard Reset Failed:", e);
            alert("Cloud wipe failed. Check console for details.");
        }
    }
  }

  const handleApprovePlaybookUpdate = (proposalId) => {
    setPlaybookProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status: 'approved' } : p))
  }
  return (
    <ErrorBoundary>
      <div className="app-wrapper">
        {!user ? (
          <div className="dashboard-app-root">
            <AccessGateway onLogin={login} onClientLogin={handleClientLogin} onVerifyMasterKey={verifyMasterKey} />
            <AiAssistant activeTab="dashboard" clientView={true} userName="Guest" />
          </div>
        ) : (
          <div className="dashboard-container">
            <aside className="sidebar">
              <div className="logo-container" style={{ marginBottom: '3rem', textAlign: 'left' }}>
                <img src="/images/logo.png" alt="Meaven Logo" style={{ height: '32px', marginBottom: '0.5rem', filter: 'var(--logo-filter)', transition: 'filter 0.5s ease' }} />
                <img src="/images/logo-dark.png" alt="Preload Dark Logo" style={{ display: 'none' }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', letterSpacing: '0.4em', fontWeight: '500', textTransform: 'uppercase', margin: 0 }}>INTELLIGENCE</p>
              </div>
              <nav className="sidebar-nav-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, paddingBottom: '1.5rem' }}>
                <SidebarGroupHeader label="Core Command" />
                {!clientView && <SidebarItem active={activeTab === 'controlTower'} onClick={() => handleNavigate('controlTower')} icon="🎛️" label="Founder Control Tower" />}
                <SidebarItem active={activeTab === 'dashboard'} onClick={() => handleNavigate('dashboard')} icon="📊" label={clientView ? "Experience Hub" : "Internal Dashboard"} />
                
                {!clientView && (
                  <>
                    <SidebarGroupHeader label="Site Execution" />
                    {(user?.role === 'SuperAdmin' || user?.role === 'Admin') && <SidebarItem active={activeTab === 'projects'} onClick={() => handleNavigate('projects')} icon="📁" label="Operations Hub" />}
                    <SidebarItem active={activeTab === 'audit'} onClick={() => handleNavigate('audit')} icon="📋" label="Execution Audit" />
                    <SidebarItem active={activeTab === 'postQC'} onClick={() => handleNavigate('postQC')} icon="🔍" label="Post-Install QC" />
                  </>
                )}

                {(user?.role === 'SuperAdmin' || user?.role === 'Admin') && !clientView && (
                  <>
                    <SidebarGroupHeader label="Platform Engines" />
                    <SidebarItem active={activeTab === 'vendors'} onClick={() => handleNavigate('vendors')} icon="🤝" label="Vendor Bench" />
                    <SidebarItem active={activeTab === 'calculator'} onClick={() => handleNavigate('calculator')} icon="🧮" label="Tech Calculator" />
                    <SidebarItem active={activeTab === 'executionOS'} onClick={() => handleNavigate('executionOS')} icon="🎛️" label="Execution OS" />
                  </>
                )}

                {(user?.role === 'SuperAdmin' || user?.role === 'Admin' || user?.email === 'ravi.bhargaw@meaven.in') && !clientView && (
                  <>
                    <SidebarGroupHeader label="Executive Suite" />
                    <SidebarItem active={activeTab === 'strategy'} onClick={() => handleNavigate('strategy')} icon="🧠" label="Executive Strategy" />
                    <SidebarItem active={activeTab === 'reports'} onClick={() => handleNavigate('reports')} icon="📈" label="Intelligence Reports" />
                    <SidebarItem active={activeTab === 'admin'} onClick={() => handleNavigate('admin')} icon="⚙️" label="Governance Console" />
                  </>
                )}
              </nav>
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* v8.3 STEALTH TOGGLE */}
                <div style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '0.8rem' }}>
                    <div 
                        onClick={toggleTheme} 
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <span style={{ fontSize: '1rem' }}>{theme === 'dark' ? '🌙' : '☀️'}</span>
                            <span style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                                {theme === 'dark' ? 'NIGHT MODE' : 'APPLE DAY MODE'}
                            </span>
                        </div>
                        <div style={{ width: '32px', height: '18px', background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'var(--accent-color)', borderRadius: '10px', position: 'relative', transition: 'all 0.3s ease' }}>
                            <div style={{ width: '14px', height: '14px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: theme === 'dark' ? '2px' : '16px', transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }} />
                        </div>
                    </div>
                </div>

                <div style={{ padding: '0.8rem', background: 'var(--bg-accent)', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                    <div 
                        onClick={() => { if (clientView) setShowPinModal(true); else { setClientView(true); setActiveTab('dashboard'); } }} 
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                    >
                        <span style={{ fontSize: '0.65rem', fontWeight: '900', letterSpacing: '0.1em', color: clientView ? 'var(--text-secondary)' : 'var(--accent-color)' }}>{clientView ? 'CLIENT' : 'INTERNAL'}</span>
                        <div style={{ width: '36px', height: '18px', background: clientView ? 'rgba(52, 199, 89, 0.2)' : 'rgba(102, 178, 194, 0.2)', borderRadius: '9px', position: 'relative', border: `1px solid ${clientView ? '#34c759' : 'var(--accent-color)'}` }}>
                            <div style={{ width: '12px', height: '12px', background: clientView ? '#34c759' : 'var(--accent-color)', borderRadius: '50%', position: 'absolute', top: '2px', left: clientView ? '2px' : '20px', transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)', boxShadow: `0 0 8px ${clientView ? '#34c759' : 'var(--accent-color)'}` }} />
                        </div>
                    </div>
                </div>
                {!clientView && <button onClick={() => setIsNewProjectModalOpen(true)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '0.8rem', fontWeight: '800' }}>+ INITIALIZE PROJECT LOOP</button>}
                {/* v8.5 IDENTITY & ROLE AUTH */}
                <div style={{ padding: '0.8rem', borderTop: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0, letterSpacing: '0.1em' }}>
                                {clientView ? 'CLIENT • LEVEL 1' : `${user.role || 'OPERATOR'} • ${user.email === 'ravi.bhargaw@meaven.in' ? 'ROOT' : 'LEVEL 1'}`}
                            </p>
                            <p style={{ fontSize: '0.75rem', fontWeight: '800', margin: 0 }}>{clientView ? (selectedClient || activeProject?.client || 'Client partner') : user.name}</p>
                        </div>
                        <button 
                            onClick={logout} 
                            style={{ background: 'rgba(255, 69, 58, 0.08)', border: 'none', color: '#ff453a', fontSize: '0.6rem', fontWeight: '900', cursor: 'pointer', padding: '0.2rem 0.6rem', borderRadius: '4px' }}
                        >
                            EXIT
                        </button>
                    </div>
                    {(user?.email === 'ravi.bhargaw@meaven.in' || user?.role === 'SuperAdmin') && !clientView && (
                        <button onClick={() => setActiveTab('admin')} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '0.6rem', marginTop: '0.6rem', cursor: 'pointer', padding: 0, fontWeight: '700', opacity: 0.9 }}>⚙️ OPEN GOVERNANCE CONSOLE</button>
                    )}
                    <button onClick={() => { setIsProjectSelected(false); setSelectedClient(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.6rem', marginTop: '0.4rem', cursor: 'pointer', padding: 0, fontWeight: '700', opacity: 0.5, display: 'block' }}>↩ RE-INITIALIZE SESSION</button>
                </div>
              </div>
            </aside>
            <main className="main-content">
              <header className="main-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {navHistory.length > 0 && (
                      <button 
                        onClick={handleBack}
                        style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', color: 'var(--accent-color)', padding: '0.4rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: '800' }}
                      >
                        ← BACK
                      </button>
                    )}
                    <h1 style={{ margin: 0, fontSize: 'clamp(1rem, 4vw, 1.4rem)' }}>
                      {activeTab === 'dashboard' 
                          ? (clientView ? `Experience: ${selectedClient || activeProject?.client || 'Meaven'}` : 'Tactical Command') 
                          : activeTab === 'controlTower' ? 'Founder Control Tower'
                          : activeTab === 'projects' ? 'Operations Hub' 
                          : activeTab === 'vendors' ? 'Partner Bench' 
                          : activeTab === 'calculator' ? 'Tech Calc' 
                          : activeTab === 'executionOS' ? 'Execution Infrastructure'
                          : activeTab === 'strategy' ? 'Executive Hub'
                          : activeTab === 'reports' ? 'Intel Reports'
                          : 'Admin'}
                    </h1>
                  </div>
                  <div className="desktop-only" style={{ padding: '0.4rem 1rem', background: clientView ? 'rgba(52, 215, 75, 0.1)' : 'rgba(102, 178, 194, 0.1)', border: `1px solid ${clientView ? '#34c759' : 'var(--accent-color)'}`, borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '6px', height: '6px', background: clientView ? '#34c759' : 'var(--accent-color)', borderRadius: '50%' }} />
                    <span style={{ fontSize: '0.65rem', fontWeight: '800', color: clientView ? '#34c759' : 'var(--accent-color)' }}>{clientView ? 'SECURE PORTFOLIO' : 'INTERNAL TACTICAL'}</span>
                  </div>
                </div>
                <div className="desktop-only" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: 'auto', lineHeight: 1.2 }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--accent-color)', letterSpacing: '0.05em', fontFamily: 'monospace' }}>
                        {currentTime.getHours().toString().padStart(2, '0')}:{currentTime.getMinutes().toString().padStart(2, '0')}:{currentTime.getSeconds().toString().padStart(2, '0')}
                    </div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                        {currentTime.getDate().toString().padStart(2, '0')}-{(currentTime.getMonth()+1).toString().padStart(2, '0')}-{currentTime.getFullYear()} | {currentTime.toLocaleDateString('en-US', { weekday: 'long' })}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                    <button onClick={() => { setIsProjectSelected(false); setSelectedClient(''); setIsClientAuthorized(false); }} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>⟳ Switch</button>
                </div>
              </header>

              <div className="tab-content-wrapper">
                {activeTab === 'dashboard' && (
                  clientView ? (
                    !isClientAuthorized ? (
                      <ClientPortalGate 
                        portfolio={portfolios.find(p => p.name === (selectedClient || activeProject?.client)) || { 
                          name: selectedClient || activeProject?.client, 
                          isPortalActive: true, 
                          clientPin: '2410' 
                        }} 
                        onAuthorize={() => setIsClientAuthorized(true)} 
                      />
                    ) : (
                      activeProjectId ? (
                        <div style={{ padding: '1rem 0' }}>
                          <SiteReadiness 
                            project={projects.find(p => p.id === activeProjectId)}
                            projects={projects}
                            data={readinessData[activeProjectId]}
                            isReadOnly={true}
                            clientView={true}
                            onBack={() => setActiveProjectId(null)}
                            onUpdateProject={handleUpdateProject}
                          />
                        </div>
                      ) : (
                        <ClientExperienceHub 
                          clientName={selectedClient || activeProject?.client} 
                          projects={projects.filter(p => p.client === (selectedClient || activeProject?.client))} 
                          vendors={vendors} 
                          onSelectProject={(id) => { setActiveProjectId(id); }} 
                        />
                      )
                    )
                  ) : (
                    <CommandCenter 
                      projects={projects} 
                      vendors={vendors}
                      onSelectProject={(id) => { setActiveProjectId(id); setActiveTab('projects'); }}
                      onUpdateProject={handleUpdateProject}
                      onSelectTab={setActiveTab}
                    />
                  )
                )}

                {activeTab === 'controlTower' && (
                  <FounderControlTower projects={projects} vendors={vendors} onNavigate={handleNavigate} />
                )}

                {activeTab === 'projects' && (
                  <ProjectDirectory 
                    projects={projects} 
                    vendors={vendors}
                    portfolios={portfolios}
                    activeProjectId={activeProjectId}
                    onSelectProject={(id) => setActiveProjectId(id)} 
                    onUpdateValue={handleUpdateProject}
                    onLogPayment={handleLogPayment}
                    onLogPayout={handleLogPayout}
                    onAddVendor={handleAddVendor}
                    onAssignPartner={handleAssignVendor}
                    onReassignPartner={handleReassignProject}
                    onAddNote={handleProjectAddNote}
                    onToggleVisibility={handleToggleTimelineVisibility}
                    userRole={user?.role}
                    onViewAudit={(audit) => { setViewingAudit(audit); setActiveTab('audit'); }}
                  />
                )}

                {activeTab === 'vendors' && (
                  <VendorScoring 
                    vendors={vendors} 
                    projects={projects} 
                    selectedVendorId={selectedVendorId}
                    msaTemplate={msaTemplate}
                    onSelectVendor={setSelectedVendorId}
                    onAddContract={handleAddVendorContract} 
                    onAddPayment={handleAddVendorPayment} 
                    onUpdateVendor={handleUpdateVendor}
                    onAddVendor={handleAddVendor}
                    onAddNote={handleVendorAddNote}
                    onAssignVendor={handleAssignVendor}
                    onReassign={handleReassignProject}
                    userRole={user?.role}
                    onDeleteVendor={handleRemoveVendor}
                  />
                )}

                {activeTab === 'readiness' && (
                  <SiteReadiness 
                    project={activeProject}
                    projects={projects}
                    data={readinessData[activeProjectId]} 
                    onSelectProject={setActiveProjectId}
                    onUpdate={(data) => handleUpdateReadiness(activeProjectId, data)} 
                    onUpdateProject={handleUpdateProject}
                  />
                )}
                {activeTab === 'audit' && (
                  <div className="card animate-fade-in" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', minHeight: '80vh' }}>
                      {viewingAudit && (
                          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--accent-color)' }}>{viewingAudit.auditId} | TECHNICAL REPORT</h2>
                              <button 
                                  onClick={() => { setViewingAudit(null); handleBack(); }}
                                  style={{ background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
                              >
                                  CLOSE REVIEW
                              </button>
                          </div>
                      )}
                      <SiteReadinessAudit 
                        projects={projects} 
                        onSubmitAudit={handleExecutionAuditSubmit} 
                        initialData={viewingAudit}
                        readOnly={!!viewingAudit}
                      />
                  </div>
                )}
                {activeTab === 'postQC' && (
                  <div className="card animate-fade-in" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', minHeight: '80vh' }}>
                      <PostInstallationQC projects={projects} onSubmitQC={handleQCReportSubmit} />
                  </div>
                )}
                {activeTab === 'executionOS' && <ExecutionOS />}
                {activeTab === 'calculator' && !clientView && ( <StrategicPricingEngine projects={projects} onAddNote={handleProjectAddNote} /> )}
                {activeTab === 'strategy' && ( <ExecutiveSummary projects={projects} vendors={vendors} onNavigate={(tab) => handleNavigate(tab)} /> )}
                {activeTab === 'reports' && ( <IntelligenceReports projects={projects} vendors={vendors} portfolios={portfolios} /> )}
                {activeTab === 'admin' && ( 
                  <AdminPanel 
                    users={users || []} 
                    proposals={playbookProposals || []} 
                    portfolios={portfolios || []}
                    msaTemplate={msaTemplate}
                    onUpdateMsa={setMsaTemplate}
                    onUpdatePortfolio={(id, data) => setPortfolios(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))}
                    onApproveProposal={handleApprovePlaybookUpdate} 
                    onAddUser={addUser} 
                    onRemoveUser={removeUser} 
                    onResetUser={resetUser} 
                    onBack={() => setActiveTab('dashboard')} 
                    onRemoveProject={handleRemoveProject}
                    onRemoveVendor={handleRemoveVendor}
                    onRemovePortfolio={handleRemovePortfolio}
                    onHardReset={handleHardReset}
                    onExportData={handleExportData}
                  /> 
                )}
              </div>
            </main>

            {/* Mobile Navigation Engine */}
            <nav className="bottom-nav mobile-only">
              <button className={`bottom-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleNavigate('dashboard')}>
                <span>📊</span>
                <span>Dashboard</span>
              </button>
              <button className={`bottom-nav-item ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => handleNavigate('projects')}>
                <span>📁</span>
                <span>Projects</span>
              </button>
              {!clientView && (
                <button className={`bottom-nav-item ${activeTab === 'vendors' ? 'active' : ''}`} onClick={() => handleNavigate('vendors')}>
                  <span>🤝</span>
                  <span>Vendors</span>
                </button>
              )}
              {(user?.role === 'SuperAdmin' || user?.role === 'Admin' || user?.email === 'ravi.bhargaw@meaven.in') && (
                <>
                  <button className={`bottom-nav-item ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => handleNavigate('admin')}>
                    <span>⚙️</span>
                    <span>Admin</span>
                  </button>
                  <button className={`bottom-nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => handleNavigate('reports')}>
                    <span>📈</span>
                    <span>Reports</span>
                  </button>
                </>
              )}
              <button className="bottom-nav-item" onClick={logout} style={{ color: 'var(--danger)' }}>
                <span>🚪</span>
                <span>Exit</span>
              </button>
            </nav>
          </div>
        )}
        {isFieldPortalActive && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: '#000' }}>
            <FieldPortal 
              projects={projects} 
              vendors={vendors} 
              onSubmitReport={handleFieldReport} 
              onExit={() => setIsFieldPortalActive(false)} 
            />
          </div>
        )}
        {isNewProjectModalOpen && (
            <NewProjectModal
                portfolios={portfolios}
                onCreateProject={handleCreateProject}
                onClose={() => setIsNewProjectModalOpen(false)}
            />
        )}
        {isNewPortfolioModalOpen && (
            <NewPortfolioModal
                onCreatePortfolio={handleCreatePortfolio}
                onClose={() => setIsNewPortfolioModalOpen(false)}
            />
        )}
        {showPinModal && (
            <PinModal
                onVerify={handlePinVerify}
                onClose={() => { setShowPinModal(false); setClientView(false); setActiveTab('dashboard'); }}
            />
        )}
        <AiAssistant 
          activeTab={activeTab} 
          clientView={clientView} 
          userName={user?.name || 'Operator'} 
          projects={projects}
          vendors={vendors}
        />
      </div>
    </ErrorBoundary>
  )
}

function SidebarGroupHeader({ label }) {
  return (
    <div className="sidebar-group-header" style={{ 
      fontSize: '0.62rem', 
      fontWeight: '700', 
      color: 'var(--text-secondary)', 
      letterSpacing: '0.15em', 
      textTransform: 'uppercase', 
      marginTop: '1.1rem', 
      marginBottom: '0.3rem', 
      paddingLeft: '1rem',
      opacity: 0.5,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    }}>
      <span className="sidebar-text">{label}</span>
      <hr className="sidebar-divider" style={{ display: 'none', border: 'none', borderTop: '1px solid var(--border-color)', margin: 0, width: '100%' }} />
    </div>
  )
}

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderRadius: '10px', color: active ? 'var(--accent-color)' : 'var(--text-secondary)', background: active ? 'rgba(102, 178, 194, 0.1)' : 'transparent', width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer' }}>
      <span style={{ fontSize: '1.2rem' }}>{icon}</span>
      <span className="sidebar-text" style={{ fontWeight: active ? '600' : '400' }}>{label}</span>
    </button>
  )
}

export default App
