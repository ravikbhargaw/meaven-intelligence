import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

const VendorIQPortal = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState('dashboard') // dashboard, browse, requests, history
    const [selectedVendorId, setSelectedVendorId] = useState(null)
    const [vendors, setVendors] = useState([])
    const [requests, setRequests] = useState([])
    const [stats, setStats] = useState({ totalVendors: 0, newThisMonth: 0, totalRequests: 0 })

    useEffect(() => {
        // Load VIQ Vendors & Requests
        const loadData = async () => {
            try {
                // Mock data if Supabase tables not ready
                const mockVendors = [
                    { id: 1, name: 'Precision Glass', city: 'Mumbai', categories: ['Glass'], rating: 4.5, reviewCount: 12, verified: true, leadTimeRealistic: '10-12 Days', deliveryType: 'Both', materials: '12mm Toughened, DGU', priceRange: '₹450 - ₹1200' },
                    { id: 2, name: 'ACP Masters', city: 'Delhi', categories: ['ACP', 'Facade'], rating: 4.2, reviewCount: 8, verified: true, leadTimeRealistic: '14-18 Days', deliveryType: 'Site', materials: 'Aludecor, Eurobond', priceRange: '₹280 - ₹650' },
                    { id: 3, name: 'Silent Walls', city: 'Bangalore', categories: ['Gypsum'], rating: 3.8, reviewCount: 5, verified: false, leadTimeRealistic: '7-10 Days', deliveryType: 'Ex-Factory', materials: 'Saint Gobain, Gyproc', priceRange: '₹95 - ₹180' }
                ]
                setVendors(mockVendors)
                setStats({ totalVendors: 142, newThisMonth: 18, totalRequests: 5 })
            } catch (e) {
                console.error("VIQ Data Load Failed:", e)
            }
        }
        loadData()
    }, [])

    const renderContent = () => {
        if (selectedVendorId) return <VendorProfile vendor={vendors.find(v => v.id === selectedVendorId)} onBack={() => setSelectedVendorId(null)} />

        switch (activeTab) {
            case 'dashboard': return <Dashboard user={user} stats={stats} vendors={vendors} onBrowse={() => setActiveTab('browse')} onNewRequest={() => setActiveTab('requests')} />
            case 'browse': return <VendorBrowse vendors={vendors} onView={setSelectedVendorId} />
            case 'requests': return <ShortlistRequestForm onSubmit={() => setActiveTab('history')} />
            case 'history': return <RequestHistory requests={requests} />
            default: return <Dashboard />
        }
    }

    return (
        <div style={layoutStyle}>
            <aside style={sidebarStyle}>
                <div style={{ padding: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <span style={{ fontSize: '1.4rem' }}>🧠</span>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>Vendor<span style={{ color: '#FFB800' }}>IQ</span></h2>
                    </div>
                </div>

                <nav style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <NavItem icon="📊" label="Command Center" active={activeTab === 'dashboard'} onClick={() => {setActiveTab('dashboard'); setSelectedVendorId(null);}} />
                    <NavItem icon="🔍" label="Intelligence Bench" active={activeTab === 'browse'} onClick={() => {setActiveTab('browse'); setSelectedVendorId(null);}} />
                    <NavItem icon="⚡" label="Shortlist Request" active={activeTab === 'requests'} onClick={() => {setActiveTab('requests'); setSelectedVendorId(null);}} />
                    <NavItem icon="📜" label="My Requests" active={activeTab === 'history'} onClick={() => {setActiveTab('history'); setSelectedVendorId(null);}} />
                </nav>

                <div style={{ marginTop: 'auto', padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Active Subscriber</p>
                        <p style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff', margin: '0.2rem 0' }}>{user.name}</p>
                        <p style={{ fontSize: '0.65rem', color: '#FFB800' }}>{user.company || 'Professional PM'}</p>
                    </div>
                    <button onClick={onLogout} style={logoutBtnStyle}>TERMINATE SESSION</button>
                </div>
            </aside>

            <main style={mainStyle}>
                <header style={headerStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {selectedVendorId && <button onClick={() => setSelectedVendorId(null)} style={backBtnStyle}>← BACK</button>}
                        <h2 style={{ fontSize: '1.2rem', fontWeight: '900', margin: 0 }}>
                            {selectedVendorId ? 'Vendor Intelligence Report' : activeTab.toUpperCase()}
                        </h2>
                    </div>
                    <div style={statusBadgeStyle}>
                        <span style={dotStyle} /> LIVE INTEL FEED
                    </div>
                </header>

                <div style={{ padding: '2.5rem' }}>
                    {renderContent()}
                </div>
            </main>
        </div>
    )
}

const NavItem = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} style={{
        ...navItemStyle,
        background: active ? 'rgba(255,184,0,0.1)' : 'transparent',
        color: active ? '#FFB800' : 'rgba(255,255,255,0.6)',
        borderLeft: active ? '3px solid #FFB800' : '3px solid transparent'
    }}>
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
        <span>{label}</span>
    </button>
)

const Dashboard = ({ user, stats, vendors, onBrowse, onNewRequest }) => (
    <div className="animate-fade-in">
        <h1 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '2.5rem' }}>Welcome back, {user.name.split(' ')[0]}.</h1>
        
        <div style={statsGridStyle}>
            <StatCard label="Live Database" value={stats.totalVendors} sub="Verified Vendors" />
            <StatCard label="New Additions" value={`+${stats.newThisMonth}`} sub="Added this month" color="#FFB800" />
            <StatCard label="Active Requests" value={stats.totalRequests} sub="In fulfillment" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2.5rem', marginTop: '3rem' }}>
            <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={sectionHeaderStyle}>Recent Additions</h3>
                    <button onClick={onBrowse} style={linkBtnStyle}>View All Bench →</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {vendors.slice(0, 5).map(v => (
                        <div key={v.id} style={miniCardStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '1rem' }}>{v.name}</h4>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {v.categories.map(c => <span key={c} style={pillStyle}>{c}</span>)}
                                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>• {v.city}</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: '#FFB800', fontSize: '0.8rem', fontWeight: '900' }}>★ {v.rating}</div>
                                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>{v.reviewCount} Reviews</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <aside>
                <div style={actionCardStyle}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Shortlist Required?</h3>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                        Tell us your site requirements and get 3 verified recommendations within 24 hours.
                    </p>
                    <button onClick={onNewRequest} className="viq-btn-primary" style={{ width: '100%' }}>NEW REQUEST</button>
                </div>
            </aside>
        </div>
    </div>
)

const VendorBrowse = ({ vendors, onView }) => {
    const [search, setSearch] = useState('')
    const filtered = vendors.filter(v => v.name.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="animate-fade-in">
            <div style={filterBarStyle}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>🔍</span>
                    <input 
                        style={searchFieldStyle} 
                        placeholder="Search bench by vendor name or category..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <select style={selectFilterStyle}><option>All Categories</option></select>
                <select style={selectFilterStyle}><option>All Cities</option></select>
            </div>

            <div style={vendorGridStyle}>
                {filtered.map(v => (
                    <div key={v.id} style={vendorCardStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            {v.verified && <span style={verifiedBadgeStyle}>✓ VERIFIED</span>}
                            <div style={{ color: '#FFB800', fontWeight: '900', fontSize: '0.9rem' }}>★ {v.rating}</div>
                        </div>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>{v.name}</h3>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginBottom: '1.2rem' }}>{v.city} • {v.deliveryType}</p>
                        
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={intelLabelStyle}>REALISTIC LEAD TIME</div>
                            <div style={intelValueStyle}>{v.leadTimeRealistic}</div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '2rem' }}>
                            {v.categories.map(c => <span key={c} style={pillStyle}>{c}</span>)}
                        </div>

                        <button onClick={() => onView(v.id)} style={profileBtnStyle}>VIEW FULL INTELLIGENCE</button>
                    </div>
                ))}
            </div>
        </div>
    )
}

const VendorProfile = ({ vendor, onBack }) => (
    <div className="animate-fade-in">
        <div style={profileHeaderStyle}>
            <div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '900', margin: '0 0 0.5rem 0' }}>{vendor.name}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>{vendor.city}</span>
                    {vendor.verified && <span style={verifiedBadgeStyle}>✓ VERIFIED PARTNER</span>}
                </div>
            </div>
            <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#FFB800' }}>★ {vendor.rating}</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>FROM {vendor.reviewCount} PM REVIEWS</div>
            </div>
        </div>

        <div style={profileGridStyle}>
            <div style={cardStyle}>
                <h3 style={sectionHeaderStyle}>Technical Benchmarks</h3>
                <BenchmarkRow label="Materials Handled" value={vendor.materials} />
                <BenchmarkRow label="MOQ" value={vendor.moq} />
                <BenchmarkRow label="Lead Time (Quoted)" value="7-10 Days" />
                <BenchmarkRow label="Lead Time (Realistic)" value={vendor.leadTimeRealistic} highlight />
                <BenchmarkRow label="Delivery Capability" value={vendor.deliveryType} />
                <BenchmarkRow label="Price Benchmarks" value={vendor.priceRange} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={redFlagCardStyle}>
                    <h3 style={{ color: '#FF453A', fontSize: '0.8rem', fontWeight: '900', letterSpacing: '0.1em', marginBottom: '1rem' }}>⚠️ CRITICAL RED FLAGS</h3>
                    <p style={{ fontSize: '0.85rem', color: '#FF453A', margin: 0 }}>No critical flags identified for this partner.</p>
                </div>

                <div style={cardStyle}>
                    <h3 style={sectionHeaderStyle}>PM Community Intelligence</h3>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6' }}>
                        "Solid execution on high-spec retail. Don't push them on 24hr turnaround for DGU, quality drops slightly. Otherwise, very reliable." — Senior PM, Coworking Fitout
                    </div>
                </div>
            </div>
        </div>
    </div>
)

const BenchmarkRow = ({ label, value, highlight }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: '800' }}>{label}</span>
        <span style={{ fontSize: '0.95rem', fontWeight: '700', color: highlight ? '#FFB800' : '#fff' }}>{value}</span>
    </div>
)

const ShortlistRequestForm = ({ onSubmit }) => (
    <div className="animate-fade-in" style={{ maxWidth: '600px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '1rem' }}>Shortlist Request</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '3rem' }}>Response guaranteed within 24 hours.</p>

        <form onSubmit={e => {e.preventDefault(); onSubmit();}} style={cardStyle}>
            <div className="input-group" style={{ marginBottom: '2rem' }}>
                <label style={labelStyle}>Material / Category Needed</label>
                <input required style={inputStyle} placeholder="e.g. 12mm Frameless Glass Partition" />
            </div>
            <div className="input-group" style={{ marginBottom: '2rem' }}>
                <label style={labelStyle}>Site Location (City)</label>
                <input required style={inputStyle} placeholder="e.g. Bangalore" />
            </div>
            <div className="grid-responsive" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="input-group">
                    <label style={labelStyle}>Budget Range (Min - Max)</label>
                    <input style={inputStyle} placeholder="₹ from - to" />
                </div>
                <div className="input-group">
                    <label style={labelStyle}>Timeline Needed (Weeks)</label>
                    <input type="number" style={inputStyle} placeholder="e.g. 2" />
                </div>
            </div>
            <div className="input-group" style={{ marginBottom: '2rem' }}>
                <label style={labelStyle}>Special Requirements</label>
                <textarea style={{ ...inputStyle, minHeight: '100px' }} placeholder="Any specific technical constraints?" />
            </div>
            <button type="submit" className="viq-btn-primary" style={{ width: '100%', padding: '1.2rem' }}>SUBMIT REQUEST</button>
        </form>
    </div>
)

const RequestHistory = ({ requests }) => (
    <div className="animate-fade-in">
        <h1 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '2.5rem' }}>My Shortlist Requests</h1>
        <div style={cardStyle}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <th style={thStyle}>DATE</th>
                        <th style={thStyle}>CATEGORY</th>
                        <th style={thStyle}>CITY</th>
                        <th style={thStyle}>STATUS</th>
                        <th style={thStyle}>ACTION</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={tdStyle}>10-May-26</td>
                        <td style={tdStyle}>Toughened Glass</td>
                        <td style={tdStyle}>Mumbai</td>
                        <td style={tdStyle}><span style={{ color: '#FFB800' }}>PENDING</span></td>
                        <td style={tdStyle}>---</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
)

const StatCard = ({ label, value, sub, color }) => (
    <div style={cardStyle}>
        <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '900', margin: 0 }}>{label}</p>
        <div style={{ fontSize: '2.5rem', fontWeight: '900', color: color || '#fff', margin: '0.5rem 0' }}>{value}</div>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{sub}</p>
    </div>
)

// Shared Styles
const layoutStyle = { display: 'flex', height: '100vh', background: '#0A0E14', color: '#fff' }
const sidebarStyle = { width: '280px', background: '#121820', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }
const mainStyle = { flex: 1, overflowY: 'auto' }
const headerStyle = { padding: '1.5rem 2.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0D1219' }
const navItemStyle = { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700', transition: 'all 0.3s ease', width: '100%', textAlign: 'left' }
const logoutBtnStyle = { width: '100%', background: 'rgba(255,69,58,0.08)', border: 'none', color: '#ff453a', padding: '0.8rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '900', cursor: 'pointer' }
const cardStyle = { background: '#121820', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '2rem' }
const statsGridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }
const sectionHeaderStyle = { fontSize: '0.7rem', color: '#FFB800', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: '900', margin: 0 }
const linkBtnStyle = { background: 'none', border: 'none', color: '#FFB800', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '800' }
const miniCardStyle = { background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }
const actionCardStyle = { background: 'rgba(255,184,0,0.05)', border: '1px solid rgba(255,184,0,0.1)', padding: '2rem', borderRadius: '16px' }
const pillStyle = { background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '800', color: 'rgba(255,255,255,0.6)' }
const filterBarStyle = { display: 'flex', gap: '1rem', marginBottom: '2.5rem' }
const searchFieldStyle = { width: '100%', background: '#121820', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.1rem 1.1rem 1.1rem 3rem', color: '#fff', outline: 'none' }
const selectFilterStyle = { background: '#121820', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0 1.5rem', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }
const vendorGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }
const vendorCardStyle = { background: '#121820', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '2rem', transition: 'transform 0.3s ease', cursor: 'pointer' }
const verifiedBadgeStyle = { background: 'rgba(52, 199, 89, 0.1)', color: '#34c759', padding: '0.3rem 0.7rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '900' }
const intelLabelStyle = { fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '900', marginBottom: '0.4rem' }
const intelValueStyle = { fontSize: '1rem', fontWeight: '900', color: '#FFB800' }
const profileBtnStyle = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.9rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '900', cursor: 'pointer' }
const profileHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', paddingBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }
const profileGridStyle = { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '3rem' }
const redFlagCardStyle = { background: 'rgba(255,69,58,0.05)', border: '1px solid rgba(255,69,58,0.1)', padding: '2rem', borderRadius: '16px' }
const backBtnStyle = { background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800', cursor: 'pointer' }
const statusBadgeStyle = { fontSize: '0.65rem', color: '#34c759', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '0.5rem' }
const dotStyle = { width: '6px', height: '6px', background: '#34c759', borderRadius: '50%' }
const thStyle = { padding: '1.2rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }
const tdStyle = { padding: '1.2rem', fontSize: '0.9rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.02)' }
const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.9rem 1rem', color: '#fff', fontSize: '0.95rem', outline: 'none' }
const labelStyle = { fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '800', marginBottom: '0.8rem', display: 'block' }

export default VendorIQPortal
