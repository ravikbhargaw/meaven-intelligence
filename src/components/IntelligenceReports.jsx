import React, { useState, useMemo } from 'react'
import { parseMoney } from '../utils/financialUtils'
import {
    getProjectRevenue,
    getProjectCollections,
    getProjectOutstanding,
    getProjectCogs,
    getProjectMargin
} from '../utils/projectFinancials'

const IntelligenceReports = ({ projects = [], vendors = [], portfolios = [] }) => {
    const [reportType, setReportType] = useState('Master') // Master, Vendor, Project, Financial
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('All')

    // Load business expenses from local storage for spend analytics
    const businessExpenses = useMemo(() => {
        const cached = localStorage.getItem('meaven_business_expenses')
        if (cached) {
            try {
                return JSON.parse(cached)
            } catch (e) {
                console.error('Error parsing business expenses inside IntelligenceReports:', e)
            }
        }
        return []
    }, [])

    // --- DATA AGGREGATION ENGINE ---
    const reportsData = useMemo(() => {
        // 1. MASTER VIEW (Unified)
        const master = projects.map(p => {
            // STRATEGY: Prioritize explicit assignment (assignedVendor) over contract search
            const currentVendor = vendors.find(v => v.name === p.assignedVendor)
            const backupVendor = vendors.find(v => (v.contracts || []).some(c => c.projectName === p.name))
            const v = currentVendor || backupVendor || {}
            
            const pfo = portfolios.find(pfo => pfo.name === p.client) || {}
            
            const revenue = getProjectRevenue(p)
            const collected = getProjectCollections(p)
            const outstanding = getProjectOutstanding(p)
            
            const payoutEntries = p.payouts || []
            const totalPaid = payoutEntries.reduce((s, pay) => s + parseMoney(pay.amount), 0)
            
            // Partner Evolution Logic
            const allInvolvedVendors = vendors.filter(vend => 
                (vend.contracts || []).some(c => c.projectName === p.name)
            )
            const currentPartnerName = p.assignedVendor || v.name || 'Unassigned'
            const historicalPartners = allInvolvedVendors
                .map(vend => vend.name)
                .filter(name => name !== currentPartnerName)
                .join(', ')

            // COGS & Margin (Aggregated across all vendors)
            const totalProjectCogs = getProjectCogs(p, vendors)
            const margin = getProjectMargin(p, vendors).toFixed(1)
            
            // SOS Count
            const sosCount = (p.history || []).filter(h => h.title?.includes('SOS') || h.detail?.includes('SOS')).length

            return {
                // Identity
                id: p.id,
                name: p.name,
                client: p.client,
                location: p.location || 'Bangalore',
                status: p.status,
                startDate: p.startDate,
                endDate: p.endDate,
                pmEmail: p.pmEmail || 'N/A',
                // Partner Intel
                vendor: currentPartnerName,
                historicalPartners: historicalPartners || 'None',
                vendorStatus: v.status || 'N/A',
                vendorCategory: v.category || 'N/A',
                vendorContact: v.contact || 'N/A',
                vendorPhone: v.vendorPhone || v.phone || 'N/A',
                bankName: v.bankName || 'N/A',
                accountNumber: v.accountNumber || 'N/A',
                ifscCode: v.ifscCode || 'N/A',
                miScore: v.miScore || 0,
                // Financials
                revenue,
                collected,
                outstanding,
                cogs: totalProjectCogs,
                margin,
                totalPaid,
                vendorBalance: totalProjectCogs - totalPaid,
                // Health
                readiness: p.readiness || 0,
                sosCount,
                lastUpdate: p.history?.length > 0 ? p.history[p.history.length - 1].date : p.startDate
            }
        })

        // 2. VENDOR AUDIT
        const vendorReport = vendors.map(v => {
            const activeContracts = (v.contracts || []).filter(c => c.status === 'Active' || !c.status).length
            const totalVolume = (v.contracts || []).reduce((s, c) => s + parseMoney(c.orderValue), 0)
            return {
                name: v.name,
                category: v.category,
                status: v.status || 'Vetted',
                contact: v.pocName || v.contact || 'N/A',
                phone: v.phone || 'N/A',
                email: v.pocEmail || 'N/A',
                activeContracts,
                totalVolume,
                score: v.miScore || 0,
                bankName: v.bankName || 'N/A',
                accountNumber: v.accountNumber || 'N/A',
                ifscCode: v.ifscCode || 'N/A'
            }
        })

        // 3. PROJECT LIFECYCLE
        const projectReport = projects.map(p => ({
            name: p.name,
            client: p.client,
            vendor: p.assignedVendor || 'N/A',
            startDate: p.startDate,
            endDate: p.endDate,
            vendorDeadline: p.vendorEndDate,
            status: p.status,
            readiness: p.readiness,
            location: p.location || 'Bangalore'
        }))

        // 4. FINANCIAL LEDGER (Transaction Level)
        const financials = []
        projects.forEach(p => {
            // Log Receipts
            (p.clientFinancials?.received || []).forEach(r => {
                financials.push({
                    date: r.date,
                    type: 'RECEIPT (IN)',
                    project: p.name,
                    client: p.client,
                    vendor: '---',
                    amount: r.amount,
                    ref: r.ref
                })
            });
            // Log Payouts
            (p.payouts || []).forEach(pay => {
                const v = vendors.find(v => String(v.id) === String(pay.vendorId))
                financials.push({
                    date: pay.date,
                    type: 'PAYOUT (OUT)',
                    project: p.name,
                    client: p.client,
                    vendor: v?.name || 'Unknown',
                    amount: pay.amount,
                    ref: pay.ref
                })
            })
        })
        const sortedFinancials = financials.sort((a, b) => new Date(b.date) - new Date(a.date))

        return { master, vendorReport, projectReport, financials: sortedFinancials }
    }, [projects, vendors, portfolios])

    // --- TRANSACTION SPEND ANALYTICS (EXCLUDING GST COMPLIANTLY) ---
    const spendAnalytics = useMemo(() => {
        let labour = 0
        let transport = 0
        let founder = 0
        let officeBurn = 0

        // 1. Scan direct project expenses
        projects.forEach(p => {
            (p.expenses || []).forEach(e => {
                const amt = parseMoney(e.amount)
                if (e.type === 'Labour') labour += amt
                else if (e.type === 'Transport') transport += amt
            });
            // Also vendor payouts if typed
            (p.payouts || []).forEach(pay => {
                const amt = parseMoney(pay.amount)
                if (pay.type === 'Labour') labour += amt
                else if (pay.type === 'Transport') transport += amt
            })
        })

        // 2. Scan business expenses (strictly excluding GST entries)
        businessExpenses.forEach(e => {
            const amt = parseMoney(e.amount)
            if (e.type === 'GST' || e.category === 'Taxes/Compliance') {
                return // Exclude GST analytics per Phase 2 guidelines
            }
            if (e.type === 'Salary' || e.category === 'Personnel' || e.type === 'Labour') {
                labour += amt
            } else if (e.type === 'Fuel' || e.type === 'Transport') {
                transport += amt
            } else if (e.type === 'Founder Expense') {
                founder += amt
            } else {
                officeBurn += amt
            }
        })

        return { labour, transport, founder, officeBurn }
    }, [projects, businessExpenses])

    const handleExport = () => {
        let headers = []
        let rows = []
        let filename = `MEAVEN_${reportType.toUpperCase()}_REPORT_${new Date().toISOString().split('T')[0]}`

        if (reportType === 'Master') {
            headers = [
                "PROJECT ID", "PROJECT NAME", "CLIENT", "LOCATION", "STATUS", "START DATE", "DEADLINE", "PM EMAIL",
                "CURRENT PARTNER", "HISTORICAL PARTNERS (CHURN)", "VENDOR STATUS", "VENDOR CATEGORY", "VND CONTACT", "VND PHONE", "BANK NAME", "A/C NUMBER", "IFSC", "MI SCORE",
                "REVENUE (TOTAL)", "COLLECTED", "OUTSTANDING", "TOTAL PROJECT COGS", "MARGIN %", "TOTAL PAID (ALL VENDORS)", "TOTAL VENDOR DUE",
                "READINESS %", "SOS COUNT", "LAST ACTIVITY"
            ]
            rows = reportsData.master.map(d => [
                d.id, d.name, d.client, d.location, d.status, d.startDate, d.endDate, d.pmEmail,
                d.vendor, d.historicalPartners, d.vendorStatus, d.vendorCategory, d.vendorContact, d.vendorPhone, d.bankName, d.accountNumber, d.ifscCode, d.miScore,
                d.revenue, d.collected, d.outstanding, d.cogs, d.margin, d.totalPaid, d.vendorBalance,
                d.readiness, d.sosCount, d.lastUpdate
            ])
        } else if (reportType === 'Vendor') {
            headers = ["Vendor Name", "Category", "Status", "POC", "Phone", "Email", "Active Sites", "Total Volume", "MI Score", "Bank Name", "A/C Number", "IFSC"]
            rows = reportsData.vendorReport.map(d => [d.name, d.category, d.status, d.contact, d.phone, d.email, d.activeContracts, d.totalVolume, d.score, d.bankName, d.accountNumber, d.ifscCode])
        } else if (reportType === 'Project') {
            headers = ["Project Name", "Client", "Vendor Assigned", "Start Date", "Client Deadline", "Vendor Deadline", "Status", "Readiness %", "Location"]
            rows = reportsData.projectReport.map(d => [d.name, d.client, d.vendor, d.startDate, d.endDate, d.vendorDeadline, d.status, d.readiness, d.location])
        } else if (reportType === 'Financial') {
            headers = ["Date", "Type", "Project", "Client", "Vendor", "Amount", "Reference"]
            rows = reportsData.financials.map(d => [d.date, d.type, d.project, d.client, d.vendor, d.amount, d.ref])
        }

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join("\n")
        const link = document.createElement("a")
        link.setAttribute("href", encodeURI(csvContent))
        link.setAttribute("download", `${filename}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)

    return (
        <div className="intelligence-reports animate-fade-in" style={{ padding: '0.5rem 0' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '900', margin: 0 }}>Intelligence Reports</h2>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Tactical Data Export Engine</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                        <select 
                            value={reportType} 
                            onChange={(e) => setReportType(e.target.value)}
                            style={{ padding: '0.8rem 2.5rem 0.8rem 1.2rem', background: 'var(--bg-accent)', border: '1px solid var(--accent-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: '700', appearance: 'none', cursor: 'pointer' }}
                        >
                            <option value="Master">Master Unified Report</option>
                            <option value="Vendor">Vendor Certification Audit</option>
                            <option value="Project">Project Lifecycle Report</option>
                            <option value="Financial">Financial Ledger (In/Out)</option>
                        </select>
                        <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.6rem', color: 'var(--accent-color)' }}>▼</span>
                    </div>
                    <button onClick={handleExport} className="btn btn-primary" style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <span>📥</span> DOWNLOAD {reportType.toUpperCase()}
                    </button>
                </div>
            </header>

            {/* 💳 TRANSACTION SPEND ANALYTICS HUD */}
            <div className="card" style={{ padding: '2rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>💳</span>
                        <span style={{ fontWeight: '850', fontSize: '0.85rem', letterSpacing: '0.1em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>Transaction Spend Analytics (Excl. GST)</span>
                    </div>
                    <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'rgba(102, 178, 194, 0.08)', color: 'var(--accent-color)', border: '1px solid var(--border-accent)', fontWeight: '750' }}>
                        PHASE 2 COMPLIANT
                    </span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                    <div className="card cinematic-hover" style={{ padding: '1.2rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '800' }}>👷 Labour Spend</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--text-primary)', marginTop: '0.5rem' }}>{formatCurrency(spendAnalytics.labour)}</div>
                        <div style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>Direct labor payouts + Personnel expense pools</div>
                    </div>
                    <div className="card cinematic-hover" style={{ padding: '1.2rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '800' }}>🚚 Transport Spend</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--text-primary)', marginTop: '0.5rem' }}>{formatCurrency(spendAnalytics.transport)}</div>
                        <div style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>Project freight + Fuel dispatch accounts</div>
                    </div>
                    <div className="card cinematic-hover" style={{ padding: '1.2rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '800' }}>👔 Founder Expenses</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--text-primary)', marginTop: '0.5rem' }}>{formatCurrency(spendAnalytics.founder)}</div>
                        <div style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>Founder travel, logistics, and capital outflows</div>
                    </div>
                    <div className="card cinematic-hover" style={{ padding: '1.2rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '800' }}>🏢 Office Burn</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--text-primary)', marginTop: '0.5rem' }}>{formatCurrency(spendAnalytics.officeBurn)}</div>
                        <div style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>Office rent, SaaS tools, and administrative utilities</div>
                    </div>
                </div>
            </div>

            {/* PREVIEW GRID */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div style={{ padding: '1rem 1.5rem', background: 'rgba(102, 178, 194, 0.05)', borderBottom: '1px solid rgba(102, 178, 194, 0.1)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--accent-color)', letterSpacing: '0.1em' }}>LIVE PREVIEW: {reportType.toUpperCase()} DATASET</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Showing {
                        reportType === 'Master' ? reportsData.master.length :
                        reportType === 'Vendor' ? reportsData.vendorReport.length :
                        reportType === 'Project' ? reportsData.projectReport.length :
                        reportsData.financials.length
                    } records</span>
                </div>
                
                <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-accent)', zIndex: 2 }}>
                            <tr>
                                {reportType === 'Master' && <>
                                    <th style={{ padding: '1rem' }}>Project</th>
                                    <th style={{ padding: '1rem' }}>Partner</th>
                                    <th style={{ padding: '1rem' }}>Revenue</th>
                                    <th style={{ padding: '1rem' }}>Payouts</th>
                                    <th style={{ padding: '1rem' }}>Readiness</th>
                                </>}
                                {reportType === 'Vendor' && <>
                                    <th style={{ padding: '1rem' }}>Vendor Name</th>
                                    <th style={{ padding: '1rem' }}>Category</th>
                                    <th style={{ padding: '1rem' }}>Status</th>
                                    <th style={{ padding: '1rem' }}>Active Sites</th>
                                    <th style={{ padding: '1rem' }}>Volume</th>
                                </>}
                                {reportType === 'Project' && <>
                                    <th style={{ padding: '1rem' }}>Project Name</th>
                                    <th style={{ padding: '1rem' }}>Partner</th>
                                    <th style={{ padding: '1rem' }}>Start</th>
                                    <th style={{ padding: '1rem' }}>End</th>
                                    <th style={{ padding: '1rem' }}>Status</th>
                                </>}
                                {reportType === 'Financial' && <>
                                    <th style={{ padding: '1rem' }}>Date</th>
                                    <th style={{ padding: '1rem' }}>Type</th>
                                    <th style={{ padding: '1rem' }}>Project</th>
                                    <th style={{ padding: '1rem' }}>Vendor</th>
                                    <th style={{ padding: '1rem' }}>Amount</th>
                                </>}
                            </tr>
                        </thead>
                        <tbody>
                            {reportType === 'Master' && reportsData.master.map(d => (
                                <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color)' }} className="cinematic-hover">
                                    <td style={{ padding: '1rem' }}>{d.name}</td>
                                    <td style={{ padding: '1rem' }}>{d.vendor}</td>
                                    <td style={{ padding: '1rem', color: 'var(--success)' }}>{formatCurrency(d.revenue)}</td>
                                    <td style={{ padding: '1rem', color: 'var(--danger)' }}>{formatCurrency(d.totalPaid)}</td>
                                    <td style={{ padding: '1rem' }}>{d.readiness}%</td>
                                </tr>
                            ))}
                            {reportType === 'Vendor' && reportsData.vendorReport.map((d, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }} className="cinematic-hover">
                                    <td style={{ padding: '1rem' }}>{d.name}</td>
                                    <td style={{ padding: '1rem' }}>{d.category}</td>
                                    <td style={{ padding: '1rem', color: 'var(--accent-color)' }}>{d.status}</td>
                                    <td style={{ padding: '1rem' }}>{d.activeContracts}</td>
                                    <td style={{ padding: '1rem' }}>{formatCurrency(d.totalVolume)}</td>
                                </tr>
                            ))}
                            {reportType === 'Project' && reportsData.projectReport.map((d, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }} className="cinematic-hover">
                                    <td style={{ padding: '1rem' }}>{d.name}</td>
                                    <td style={{ padding: '1rem' }}>{d.vendor}</td>
                                    <td style={{ padding: '1rem' }}>{d.startDate}</td>
                                    <td style={{ padding: '1rem' }}>{d.endDate}</td>
                                    <td style={{ padding: '1rem' }}>{d.status}</td>
                                </tr>
                            ))}
                            {reportType === 'Financial' && reportsData.financials.map((d, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }} className="cinematic-hover">
                                    <td style={{ padding: '1rem' }}>{d.date}</td>
                                    <td style={{ padding: '1rem', color: d.type.includes('IN') ? 'var(--success)' : 'var(--danger)' }}>{d.type}</td>
                                    <td style={{ padding: '1rem' }}>{d.project}</td>
                                    <td style={{ padding: '1rem' }}>{d.vendor}</td>
                                    <td style={{ padding: '1rem', fontWeight: '800' }}>{formatCurrency(d.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default IntelligenceReports
