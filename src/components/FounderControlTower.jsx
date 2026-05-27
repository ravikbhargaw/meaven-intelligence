import React, { useState, useMemo } from 'react';
import { getCollectionHealth, getVendorLiability, getProjectCashPosition, getProjectInactivityStatus } from '../utils/cashFlowAndControl';
import { getProjectMargin } from '../utils/projectFinancials';

const FounderControlTower = ({ projects = [], vendors = [], onNavigate }) => {
    
    const cockpitAlerts = useMemo(() => {
        let criticalCollections = [];
        let vendorOverdues = [];
        let negativeCashFlows = [];
        let lowMargins = [];
        let highRisks = [];

        projects.forEach(p => {
            const margin = getProjectMargin(p, vendors);
            const collection = getCollectionHealth(p);
            const vendorLia = getVendorLiability(p, vendors);
            const cash = getProjectCashPosition(p);
            const inactivity = getProjectInactivityStatus(p);

            // 1. Critical Collections
            if (collection.outstanding > 0 && collection.agingBucket !== 'Healthy') {
                criticalCollections.push({
                    id: p.id,
                    name: p.name,
                    outstanding: collection.outstanding,
                    daysOutstanding: collection.daysOutstanding,
                    bucket: collection.agingBucket
                });
            }

            // 2. Vendor Overdue Liabilities
            if (vendorLia.outstanding > 0 && vendorLia.agingBucket !== 'Healthy') {
                vendorOverdues.push({
                    id: p.id,
                    name: p.name,
                    outstanding: vendorLia.outstanding,
                    bucket: vendorLia.agingBucket
                });
            }

            // 3. Negative Cash Flow Loops
            if (cash.netCashPosition < 0) {
                negativeCashFlows.push({
                    id: p.id,
                    name: p.name,
                    netCash: cash.netCashPosition,
                    inflows: cash.collections,
                    outflows: cash.payouts + cash.expenses
                });
            }

            // 4. Low Margin Warnings
            if (margin < 20 && margin > -999) {
                lowMargins.push({
                    id: p.id,
                    name: p.name,
                    margin: margin
                });
            }

            // 5. High-Risk Projects
            const isUnassigned = !p.assignedVendor;
            const isInactive = inactivity.inactivityStatus === 'Stalled' || inactivity.inactivityStatus === 'Critical';
            if (isUnassigned || isInactive) {
                highRisks.push({
                    id: p.id,
                    name: p.name,
                    reason: isUnassigned ? 'No Execution Partner' : `Stalled (${inactivity.daysSinceLastActivity} days inactive)`,
                    status: inactivity.inactivityStatus
                });
            }
        });

        return { criticalCollections, vendorOverdues, negativeCashFlows, lowMargins, highRisks };
    }, [projects, vendors]);

    const formatINR = (val) => {
        return `₹${Math.round(val).toLocaleString('en-IN')}`;
    };

    const totalAlertCount = useMemo(() => {
        return Object.values(cockpitAlerts).reduce((sum, list) => sum + list.length, 0);
    }, [cockpitAlerts]);

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '5rem' }}>
            {/* Control Tower Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3.5rem', flexWrap: 'wrap', gap: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 3.2rem)', fontWeight: '900', margin: 0, letterSpacing: '-0.04em' }}>Founder Control Cockpit</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.8rem', letterSpacing: '0.25em', fontSize: '0.7rem', textTransform: 'uppercase' }}>V2 Operational Intelligence System</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        background: totalAlertCount > 0 ? 'rgba(255, 149, 0, 0.08)' : 'rgba(50, 215, 75, 0.08)',
                        border: totalAlertCount > 0 ? '1px solid rgba(255, 149, 0, 0.2)' : '1px solid rgba(50, 215, 75, 0.2)',
                        padding: '0.5rem 1.2rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        color: totalAlertCount > 0 ? '#ff9500' : 'var(--success)'
                    }}>
                        {totalAlertCount > 0 ? `🚨 ${totalAlertCount} ACTIVE WARNING LOOPS` : '✓ OPERATIONS NOMINAL'}
                    </div>
                </div>
            </div>

            {/* Quick Summary Grid */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                gap: '1rem', 
                marginBottom: '3rem' 
            }}>
                <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '800' }}>Critical Collections</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '900', color: cockpitAlerts.criticalCollections.length > 0 ? '#ff9500' : 'var(--text-secondary)' }}>{cockpitAlerts.criticalCollections.length}</span>
                </div>
                <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '800' }}>Overdue Liabilities</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '900', color: cockpitAlerts.vendorOverdues.length > 0 ? '#ff9500' : 'var(--text-secondary)' }}>{cockpitAlerts.vendorOverdues.length}</span>
                </div>
                <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '800' }}>Negative Cash Loops</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '900', color: cockpitAlerts.negativeCashFlows.length > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>{cockpitAlerts.negativeCashFlows.length}</span>
                </div>
                <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '800' }}>Low-Margin warnings</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '900', color: cockpitAlerts.lowMargins.length > 0 ? '#ff9500' : 'var(--text-secondary)' }}>{cockpitAlerts.lowMargins.length}</span>
                </div>
                <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '800' }}>Stalled / Unassigned</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '900', color: cockpitAlerts.highRisks.length > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>{cockpitAlerts.highRisks.length}</span>
                </div>
            </div>

            {/* Main alerts queue */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* 1. CRITICAL COLLECTIONS WIDGET */}
                <div className="card" style={{ padding: '2rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>📅</span>
                            <span style={{ fontWeight: '850', fontSize: '0.85rem', letterSpacing: '0.1em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>1. Critical Billing Collections</span>
                        </div>
                        <span style={{ fontSize: '0.65rem', background: 'rgba(255, 149, 0, 0.08)', color: '#ff9500', padding: '0.2rem 0.6rem', borderRadius: '12px', border: '1px solid rgba(255, 149, 0, 0.2)' }}>
                            {cockpitAlerts.criticalCollections.length} loops
                        </span>
                    </div>

                    {cockpitAlerts.criticalCollections.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>All billing collections within healthy timelines.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {cockpitAlerts.criticalCollections.map(item => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
                                    <div>
                                        <span style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item.name}</span>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                                            Exposure: <strong style={{ color: 'var(--text-primary)' }}>{formatINR(item.outstanding)}</strong> outstanding | {item.daysOutstanding > 0 ? `${item.daysOutstanding} days outstanding` : 'Due date not recorded'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            fontWeight: '900',
                                            textTransform: 'uppercase',
                                            background: item.bucket === 'Unspecified' ? 'rgba(255,255,255,0.05)' : 'rgba(255, 69, 58, 0.08)',
                                            color: item.bucket === 'Unspecified' ? 'var(--text-secondary)' : 'var(--danger)',
                                            border: '1px solid ' + (item.bucket === 'Unspecified' ? 'var(--border-color)' : 'rgba(255,69,58,0.2)')
                                        }}>
                                            {item.bucket}
                                        </span>
                                        <button onClick={() => onNavigate('projects')} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem' }}>Triage</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 2. VENDOR OVERDUE LIABILITIES WIDGET */}
                <div className="card" style={{ padding: '2rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>🤝</span>
                            <span style={{ fontWeight: '850', fontSize: '0.85rem', letterSpacing: '0.1em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>2. Vendor Overdue Liabilities</span>
                        </div>
                        <span style={{ fontSize: '0.65rem', background: 'rgba(255, 149, 0, 0.08)', color: '#ff9500', padding: '0.2rem 0.6rem', borderRadius: '12px', border: '1px solid rgba(255, 149, 0, 0.2)' }}>
                            {cockpitAlerts.vendorOverdues.length} items
                        </span>
                    </div>

                    {cockpitAlerts.vendorOverdues.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>No overdue vendor payments detected.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {cockpitAlerts.vendorOverdues.map(item => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
                                    <div>
                                        <span style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item.name}</span>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                                            Unpaid Liability: <strong style={{ color: 'var(--text-primary)' }}>{formatINR(item.outstanding)}</strong> committed on bench contracts
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            fontWeight: '900',
                                            textTransform: 'uppercase',
                                            background: 'rgba(255, 149, 0, 0.08)',
                                            color: '#ff9500',
                                            border: '1px solid rgba(255, 149, 0, 0.2)'
                                        }}>
                                            {item.bucket}
                                        </span>
                                        <button onClick={() => onNavigate('projects')} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem' }}>Triage</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 3. NEGATIVE CASH FLOW LOOPS WIDGET */}
                <div className="card" style={{ padding: '2rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>💳</span>
                            <span style={{ fontWeight: '850', fontSize: '0.85rem', letterSpacing: '0.1em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>3. Negative Cash Flow Loops</span>
                        </div>
                        <span style={{ fontSize: '0.65rem', background: 'rgba(255, 69, 58, 0.08)', color: 'var(--danger)', padding: '0.2rem 0.6rem', borderRadius: '12px', border: '1px solid rgba(255, 69, 58, 0.2)' }}>
                            {cockpitAlerts.negativeCashFlows.length} projects
                        </span>
                    </div>

                    {cockpitAlerts.negativeCashFlows.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>All sites maintaining positive cash balance dynamics.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {cockpitAlerts.negativeCashFlows.map(item => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
                                    <div>
                                        <span style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item.name}</span>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                                            Cash Deficit: <strong style={{ color: 'var(--danger)' }}>{formatINR(item.netCash)}</strong> | Received: {formatINR(item.inflows)} vs Outflow: {formatINR(item.outflows)}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            fontWeight: '900',
                                            textTransform: 'uppercase',
                                            background: 'rgba(255, 69, 58, 0.08)',
                                            color: 'var(--danger)',
                                            border: '1px solid rgba(255, 69, 58, 0.2)'
                                        }}>
                                            Deficit
                                        </span>
                                        <button onClick={() => onNavigate('projects')} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem' }}>Triage</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 4. LOW-MARGIN WARNING WIDGET */}
                <div className="card" style={{ padding: '2rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>📈</span>
                            <span style={{ fontWeight: '850', fontSize: '0.85rem', letterSpacing: '0.1em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>4. Low-Margin Warning Indicators</span>
                        </div>
                        <span style={{ fontSize: '0.65rem', background: 'rgba(255, 149, 0, 0.08)', color: '#ff9500', padding: '0.2rem 0.6rem', borderRadius: '12px', border: '1px solid rgba(255, 149, 0, 0.2)' }}>
                            {cockpitAlerts.lowMargins.length} alerts
                        </span>
                    </div>

                    {cockpitAlerts.lowMargins.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>All active projects maintain margins above the 20% safety threshold.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {cockpitAlerts.lowMargins.map(item => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
                                    <div>
                                        <span style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item.name}</span>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                                            EBITDA Margin is currently at <strong style={{ color: item.margin < 0 ? 'var(--danger)' : '#ff9500' }}>{item.margin.toFixed(1)}%</strong> (Threshold: 20%)
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            fontWeight: '900',
                                            textTransform: 'uppercase',
                                            background: 'rgba(255, 149, 0, 0.08)',
                                            color: '#ff9500',
                                            border: '1px solid rgba(255, 149, 0, 0.2)'
                                        }}>
                                            Low Margin
                                        </span>
                                        <button onClick={() => onNavigate('projects')} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem' }}>Triage</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 5. HIGH-RISK PROJECTS (UNASSIGNED / INACTIVE) */}
                <div className="card" style={{ padding: '2rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>🛰 Honor Stalls</span>
                            <span style={{ fontWeight: '850', fontSize: '0.85rem', letterSpacing: '0.1em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>5. High-Risk / Stalled Projects</span>
                        </div>
                        <span style={{ fontSize: '0.65rem', background: 'rgba(255, 69, 58, 0.08)', color: 'var(--danger)', padding: '0.2rem 0.6rem', borderRadius: '12px', border: '1px solid rgba(255, 69, 58, 0.2)' }}>
                            {cockpitAlerts.highRisks.length} loops
                        </span>
                    </div>

                    {cockpitAlerts.highRisks.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>All sites are operationally active and assigned to deployment partners.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {cockpitAlerts.highRisks.map(item => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
                                    <div>
                                        <span style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item.name}</span>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                                            State: <strong style={{ color: 'var(--danger)' }}>{item.reason}</strong>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            fontWeight: '900',
                                            textTransform: 'uppercase',
                                            background: 'rgba(255, 69, 58, 0.08)',
                                            color: 'var(--danger)',
                                            border: '1px solid rgba(255, 69, 58, 0.2)'
                                        }}>
                                            Critical Alert
                                        </span>
                                        <button onClick={() => onNavigate('projects')} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem' }}>Triage</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default FounderControlTower;
