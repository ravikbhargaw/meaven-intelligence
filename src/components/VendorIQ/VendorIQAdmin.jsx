import { useState, useEffect } from 'react'

const VendorIQAdmin = ({ vendors = [], registrations = [], subscribers = [], requests = [], reviews = [] }) => {
    const [subSection, setSubSection] = useState('overview') // overview, vendors, subscribers, requests, reviews, registrations

    const renderSubSection = () => {
        switch (subSection) {
            case 'overview': return <AdminOverview stats={{ totalVendors: 142, verified: 98, pending: 44, activeSubscribers: 25, renewalMonth: 4, pendingRequests: 3, pendingReviews: 8 }} />
            case 'vendors': return <VendorManager vendors={vendors} />
            case 'subscribers': return <SubscriberManager subscribers={subscribers} />
            case 'requests': return <RequestQueue requests={requests} />
            case 'reviews': return <ReviewQueue reviews={reviews} />
            case 'registrations': return <RegistrationInbox registrations={registrations} />
            default: return <AdminOverview />
        }
    }

    return (
        <div className="viq-admin-container animate-fade-in">
            <header style={headerStyle}>
                <div style={tabGroupStyle}>
                    <AdminTab label="Intel Overview" active={subSection === 'overview'} onClick={() => setSubSection('overview')} />
                    <AdminTab label="Vendor Cards" active={subSection === 'vendors'} onClick={() => setSubSection('vendors')} />
                    <AdminTab label="Subscribers" active={subSection === 'subscribers'} onClick={() => setSubSection('subscribers')} />
                    <AdminTab label="Shortlist Queue" active={subSection === 'requests'} badge={3} onClick={() => setSubSection('requests')} />
                    <AdminTab label="Review Queue" active={subSection === 'reviews'} badge={8} onClick={() => setSubSection('reviews')} />
                    <AdminTab label="Reg Inbox" active={subSection === 'registrations'} badge={12} onClick={() => setSubSection('registrations')} />
                </div>
            </header>

            <div style={{ marginTop: '2rem' }}>
                {renderSubSection()}
            </div>
        </div>
    )
}

const AdminTab = ({ label, active, onClick, badge }) => (
    <button onClick={onClick} style={{
        ...adminTabStyle,
        color: active ? '#FFB800' : 'rgba(255,255,255,0.4)',
        borderBottom: active ? '2px solid #FFB800' : '2px solid transparent'
    }}>
        {label}
        {badge > 0 && <span style={badgeStyle}>{badge}</span>}
    </button>
)

const AdminOverview = ({ stats }) => (
    <div className="grid-responsive" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <StatCard label="Total Intelligence Units" value={stats.totalVendors} sub="Verified: 98 | Pending: 44" />
        <StatCard label="Active PM Members" value={stats.activeSubscribers} sub={`${stats.renewalMonth} Renewals this month`} color="#FFB800" />
        <StatCard label="Shortlist Load" value={stats.pendingRequests} sub="Pending fulfillment" color="#34C759" />
        <StatCard label="Approval Pipeline" value={stats.pendingReviews} sub="Reviews pending approval" color="#FF9500" />
    </div>
)

const VendorManager = ({ vendors }) => (
    <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <h3 style={sectionTitleStyle}>Bench Management</h3>
            <button className="viq-btn-primary" style={{ fontSize: '0.7rem', padding: '0.6rem 1.2rem' }}>+ ADD NEW CARD</button>
        </div>
        <table style={tableStyle}>
            <thead>
                <tr style={thRowStyle}>
                    <th style={thStyle}>VENDOR NAME</th>
                    <th style={thStyle}>CATEGORY</th>
                    <th style={thStyle}>CITY</th>
                    <th style={thStyle}>STATUS</th>
                    <th style={thStyle}>RATING</th>
                    <th style={thStyle}>ACTIONS</th>
                </tr>
            </thead>
            <tbody>
                {/* Rows mapping */}
                <tr style={trStyle}>
                    <td style={tdStyle}>Precision Glass Works</td>
                    <td style={tdStyle}><span style={pillStyle}>Glass</span></td>
                    <td style={tdStyle}>Mumbai</td>
                    <td style={tdStyle}><span style={{ color: '#34C759', fontWeight: '900' }}>● VERIFIED</span></td>
                    <td style={tdStyle}>★ 4.5</td>
                    <td style={tdStyle}>
                        <button style={actionBtnStyle}>Edit</button>
                        <button style={actionBtnStyle}>View</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
)

const SubscriberManager = ({ subscribers }) => (
    <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <h3 style={sectionTitleStyle}>Member Directory</h3>
            <button className="viq-btn-primary" style={{ fontSize: '0.7rem', padding: '0.6rem 1.2rem' }}>+ NEW SUBSCRIBER</button>
        </div>
        <table style={tableStyle}>
            <thead>
                <tr style={thRowStyle}>
                    <th style={thStyle}>MEMBER</th>
                    <th style={thStyle}>COMPANY</th>
                    <th style={thStyle}>JOIN DATE</th>
                    <th style={thStyle}>RENEWAL</th>
                    <th style={thStyle}>REQUESTS</th>
                    <th style={thStyle}>STATUS</th>
                </tr>
            </thead>
            <tbody>
                <tr style={trStyle}>
                    <td style={tdStyle}>John PM</td>
                    <td style={tdStyle}>Build-IT Fitouts</td>
                    <td style={tdStyle}>01-May-26</td>
                    <td style={tdStyle}>01-Jun-26</td>
                    <td style={tdStyle}>3</td>
                    <td style={tdStyle}><span style={{ color: '#34C759', fontWeight: '900' }}>ACTIVE</span></td>
                </tr>
            </tbody>
        </table>
    </div>
)

const RequestQueue = ({ requests }) => (
    <div style={cardStyle}>
        <h3 style={sectionTitleStyle}>Shortlist Fulfillment Queue</h3>
        <table style={tableStyle}>
            <thead>
                <tr style={thRowStyle}>
                    <th style={thStyle}>RECEIVED</th>
                    <th style={thStyle}>PM NAME</th>
                    <th style={thStyle}>MATERIAL</th>
                    <th style={thStyle}>CITY</th>
                    <th style={thStyle}>STATUS</th>
                    <th style={thStyle}>FULFILL</th>
                </tr>
            </thead>
            <tbody>
                <tr style={trStyle}>
                    <td style={tdStyle}>10-May-26</td>
                    <td style={tdStyle}>John PM</td>
                    <td style={tdStyle}>Acoustic Glass</td>
                    <td style={tdStyle}>Mumbai</td>
                    <td style={tdStyle}><span style={{ color: '#FFB800' }}>PENDING</span></td>
                    <td style={tdStyle}><button className="viq-btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.65rem' }}>RECOMMEND 3</button></td>
                </tr>
            </tbody>
        </table>
    </div>
)

const ReviewQueue = ({ reviews }) => (
    <div style={cardStyle}>
        <h3 style={sectionTitleStyle}>Approval Engine</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
            <div style={reviewCardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div>
                        <span style={{ fontSize: '0.85rem', fontWeight: '800' }}>John PM</span>
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginLeft: '0.5rem' }}>reviewed</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: '800', marginLeft: '0.5rem' }}>Precision Glass Works</span>
                    </div>
                    <div style={{ color: '#FFB800', fontWeight: '900' }}>★ 5.0</div>
                </div>
                <p style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.7)', margin: '0 0 1.5rem 0' }}>
                    "Extremely precise cutting. Handled the 12mm toughened partition for our retail project without a single rejection."
                </p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button style={approveBtnStyle}>APPROVE REVIEW</button>
                    <button style={rejectBtnStyle}>REJECT</button>
                </div>
            </div>
        </div>
    </div>
)

const RegistrationInbox = ({ registrations }) => (
    <div style={cardStyle}>
        <h3 style={sectionTitleStyle}>Vendor Registration Inbox</h3>
        <table style={tableStyle}>
            <thead>
                <tr style={thRowStyle}>
                    <th style={thStyle}>DATE</th>
                    <th style={thStyle}>BUSINESS</th>
                    <th style={thStyle}>CATEGORY</th>
                    <th style={thStyle}>CITY</th>
                    <th style={thStyle}>GSTN</th>
                    <th style={thStyle}>ACTION</th>
                </tr>
            </thead>
            <tbody>
                <tr style={trStyle}>
                    <td style={tdStyle}>11-May-26</td>
                    <td style={tdStyle}>ACP Masters</td>
                    <td style={tdStyle}>Facade</td>
                    <td style={tdStyle}>Delhi</td>
                    <td style={tdStyle}>22AAAA...</td>
                    <td style={tdStyle}><button className="viq-btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.65rem' }}>CREATE CARD</button></td>
                </tr>
            </tbody>
        </table>
    </div>
)

const StatCard = ({ label, value, sub, color }) => (
    <div style={cardStyle}>
        <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '900', margin: 0 }}>{label}</p>
        <div style={{ fontSize: '2.2rem', fontWeight: '900', color: color || '#fff', margin: '0.5rem 0' }}>{value}</div>
        <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{sub}</p>
    </div>
)

// Styles
const headerStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
const tabGroupStyle = { display: 'flex', gap: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', width: '100%' }
const adminTabStyle = { background: 'none', border: 'none', padding: '1rem 0.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: '0.6rem' }
const badgeStyle = { background: '#FFB800', color: '#000', fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: '10px', fontWeight: '900' }
const cardStyle = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '2rem' }
const sectionTitleStyle = { fontSize: '0.8rem', color: '#FFB800', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: '900', margin: 0 }
const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }
const thRowStyle = { textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }
const thStyle = { padding: '1.2rem', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }
const trStyle = { borderBottom: '1px solid rgba(255,255,255,0.02)' }
const tdStyle = { padding: '1.2rem', fontSize: '0.85rem' }
const actionBtnStyle = { background: 'none', border: 'none', color: '#FFB800', cursor: 'pointer', fontSize: '0.7rem', fontWeight: '800', marginRight: '1rem' }
const pillStyle = { background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '800', color: 'rgba(255,255,255,0.6)' }
const reviewCardStyle = { background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px' }
const approveBtnStyle = { background: 'rgba(52, 199, 89, 0.1)', border: '1px solid #34C759', color: '#34C759', padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '900', cursor: 'pointer' }
const rejectBtnStyle = { background: 'none', border: '1px solid rgba(255,69,58,0.3)', color: '#ff453a', padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '900', cursor: 'pointer' }

export default VendorIQAdmin
