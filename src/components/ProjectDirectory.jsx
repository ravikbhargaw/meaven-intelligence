import { useState, useEffect } from 'react'
import SiteReadiness from './SiteReadiness'
import { supabase } from '../supabaseClient'
import { parseMoney } from '../utils/financialUtils'
import {
  getProjectRevenue,
  getProjectCollections,
  getProjectOutstanding,
  getProjectCogs,
  getProjectExpenses,
  getProjectProfit,
  getProjectMargin
} from '../utils/projectFinancials'
import { getCollectionHealth, getVendorLiability, getProjectCashPosition, getProjectInactivityStatus } from '../utils/cashFlowAndControl'
import { getAllocatedProjectOverhead, getTrueProjectProfit, getTrueProjectMargin } from '../utils/overheadAllocation'
import {
  calculateReadinessScore,
  calculateExecutionRisk,
  calculateVendorReliability,
  calculateSnagImpact,
  calculateTimelineReliability
} from '../utils/executionIntelligence'
import ProjectHandoverAdmin from './ProjectHandoverAdmin'
import HandoverPdfTemplate from './HandoverPdfTemplate'
import FeedbackPdfTemplate from './FeedbackPdfTemplate'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'


// MOVE OUTSIDE to prevent re-mounting on every state change (which causes focus loss)
const ModalOverlay = ({ children }) => (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'var(--bg-glass-heavy)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
        {children}
    </div>
)

// Execution stage labels — shared with ExecutionPartnerSystem
const STAGES = [
    'Project Assigned',
    'Site Verification Pending',
    'Site Audit Submitted',
    'Readiness Approved',
    'Production Freeze',
    'Installation In Progress',
    'QC Pending',
    'Snag Closure Pending',
    'Handover Completed',
    'Closure Approved'
]

const compressImage = (base64Str, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            const compressed = canvas.toDataURL('image/jpeg', quality);
            resolve(compressed);
        };
        img.onerror = () => {
            resolve(base64Str);
        };
    });
};

const isPdf = (base64Str) => typeof base64Str === 'string' && base64Str.startsWith('data:application/pdf');

const processFile = (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result;
            if (file.type === 'application/pdf') {
                resolve(result);
            } else {
                compressImage(result).then(resolve);
            }
        };
        reader.readAsDataURL(file);
    });
};

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
            </html>
        `);
        newTab.document.close();
    }
};

const ProjectExecutionTab = ({ selectedProject, vendors, assignedVendors, onUpdateValue, formatDate }) => {
    const { readinessPercent, blockers, readyForExecution, readinessStatus } = calculateReadinessScore(selectedProject);
    const { riskScore, riskLevel, topRiskFactors } = calculateExecutionRisk(selectedProject, vendors);
    const { snagCount, potentialReworkExposure, criticalIssues, repeatIssuePatterns } = calculateSnagImpact(selectedProject);
    const { timelineVariance, reliabilityScore, delayReasons } = calculateTimelineReliability(selectedProject);

    const [snagType, setSnagType] = useState('Woodwork');
    const [snagSeverity, setSnagSeverity] = useState('Medium');
    const [snagDescription, setSnagDescription] = useState('');
    const [snagExposureCost, setSnagExposureCost] = useState('');
    const [responsibleVendorId, setResponsibleVendorId] = useState('');

    const checklist = selectedProject?.readinessChecklist || {
        measurementsLocked: false,
        materialReady: false,
        accessAvailable: false,
        civil: false,
        electrical: false,
        ceiling: false,
        flooring: false,
        siteClearance: false
    };

    const handleCheckboxChange = (key) => {
        const newChecklist = {
            ...checklist,
            [key]: !checklist[key]
        };
        onUpdateValue(selectedProject.id, {
            readinessChecklist: newChecklist,
            lastActivityAt: new Date().toISOString()
        });
    };

    const handleLogSnag = (e) => {
        e.preventDefault();
        if (!snagDescription.trim()) return;

        const newSnag = {
            id: Date.now(),
            type: snagType,
            severity: snagSeverity,
            description: snagDescription,
            exposureCost: Number(snagExposureCost) || 0,
            responsibleVendorId: responsibleVendorId || null,
            resolved: false,
            createdAt: new Date().toISOString()
        };

        const newSnags = [...(selectedProject.snags || []), newSnag];
        onUpdateValue(selectedProject.id, {
            snags: newSnags,
            lastActivityAt: new Date().toISOString()
        });

        setSnagDescription('');
        setSnagExposureCost('');
        setResponsibleVendorId('');
    };

    const handleToggleResolve = (snagId) => {
        const newSnags = (selectedProject.snags || []).map(s => 
            s.id === snagId ? { ...s, resolved: !s.resolved } : s
        );
        onUpdateValue(selectedProject.id, {
            snags: newSnags,
            lastActivityAt: new Date().toISOString()
        });
    };

    const handleRemoveSnag = (snagId) => {
        if (!window.confirm("Are you sure you want to permanently delete this snag?")) return;
        const newSnags = (selectedProject.snags || []).filter(s => s.id !== snagId);
        onUpdateValue(selectedProject.id, {
            snags: newSnags,
            lastActivityAt: new Date().toISOString()
        });
    };

    const criticalCheckpoints = [
        { key: 'measurementsLocked', label: 'Measurements Locked' },
        { key: 'materialReady', label: 'Materials Ready' },
        { key: 'accessAvailable', label: 'Site Access Available' }
    ];

    const supplementalCheckpoints = [
        { key: 'civil', label: 'Civil Readiness' },
        { key: 'electrical', label: 'Electrical Readiness' },
        { key: 'ceiling', label: 'Ceiling/Gypsum Readiness' },
        { key: 'flooring', label: 'Flooring Readiness' },
        { key: 'siteClearance', label: 'Site Clearance / Debris Removed' }
    ];

    return (
         <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem' }}>
                  <div className="card cinematic-hover" style={{ padding: '1.2rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.6rem' }}>
                      <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: '800', letterSpacing: '0.1em', textTransform: 'uppercase' }}>🛰️ Site Readiness</span>
                              <span style={{
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '4px',
                                  fontSize: '0.55rem',
                                  fontWeight: '900',
                                  background: readinessStatus === 'Ready' ? 'rgba(102, 178, 194, 0.1)' : readinessStatus === 'Partial Risk' ? 'rgba(255, 149, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                  color: readinessStatus === 'Ready' ? 'var(--accent-color)' : readinessStatus === 'Partial Risk' ? '#ff9500' : 'var(--text-secondary)',
                                  border: '1px solid ' + (readinessStatus === 'Ready' ? 'var(--accent-color)' : readinessStatus === 'Partial Risk' ? 'rgba(255, 149, 0, 0.3)' : 'var(--border-color)')
                              }}>
                                  {readinessStatus.toUpperCase()}
                              </span>
                          </div>
                          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-primary)', marginTop: '0.4rem' }}>
                              {readinessPercent}%
                          </div>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem' }}>
                          {blockers.length > 0 ? (
                              <span style={{ color: '#ff9500' }}>⚠️ Blocked: {blockers.join(', ')}</span>
                          ) : (
                              <span style={{ color: 'var(--accent-color)' }}>✓ All Critical Blockers Clear</span>
                          )}
                      </div>
                  </div>

                  <div className="card cinematic-hover" style={{ padding: '1.2rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.6rem' }}>
                      <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: '800', letterSpacing: '0.1em', textTransform: 'uppercase' }}>⚡ Execution Risk</span>
                              <span style={{
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '4px',
                                  fontSize: '0.55rem',
                                  fontWeight: '900',
                                  background: riskLevel === 'High' ? 'rgba(255, 255, 255, 0.08)' : riskLevel === 'Moderate' ? 'rgba(255, 149, 0, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                                  color: riskLevel === 'High' ? 'var(--danger)' : riskLevel === 'Moderate' ? '#ff9500' : 'var(--text-secondary)',
                                  border: '1px solid ' + (riskLevel === 'High' ? 'var(--danger)' : riskLevel === 'Moderate' ? 'rgba(255, 149, 0, 0.2)' : 'var(--border-color)')
                              }}>
                                  {riskLevel.toUpperCase()}
                              </span>
                          </div>
                          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-primary)', marginTop: '0.4rem' }}>
                              {riskScore}/100
                          </div>
                      </div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={topRiskFactors.length > 0 ? topRiskFactors.join(' | ') : 'No high-risk factors detected'}>
                          {topRiskFactors.length > 0 ? topRiskFactors[0] : 'Operational signals stable'}
                      </div>
                  </div>

                  <div className="card cinematic-hover" style={{ padding: '1.2rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.6rem' }}>
                      <div>
                          <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: '800', letterSpacing: '0.1em', textTransform: 'uppercase' }}>🛠️ Rework Exposure</span>
                          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: potentialReworkExposure > 0 ? 'var(--danger)' : 'var(--text-primary)', marginTop: '0.4rem' }}>
                              ₹{potentialReworkExposure.toLocaleString('en-IN')}
                          </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem' }}>
                          <span>{snagCount} Total Snags Logged</span>
                          {criticalIssues > 0 && <span style={{ color: 'var(--danger)', fontWeight: '700' }}>{criticalIssues} Critical</span>}
                      </div>
                  </div>

                  <div className="card cinematic-hover" style={{ padding: '1.2rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.6rem' }}>
                      <div>
                          <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: '800', letterSpacing: '0.1em', textTransform: 'uppercase' }}>📅 Timeline Predictability</span>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.4rem' }}>
                              <span style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                                  {timelineVariance > 0 ? `+${timelineVariance}d` : 'Nominal'}
                              </span>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Score: {reliabilityScore}%</span>
                          </div>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem' }}>
                          Delay: <strong style={{ color: 'var(--text-primary)' }}>{selectedProject.primaryDelayReason || 'None'}</strong>
                      </div>
                  </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="stack-on-mobile">
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div>
                          <h4 style={{ margin: 0, color: 'var(--accent-color)', fontSize: '0.9rem', letterSpacing: '0.05em', fontWeight: '800' }}>🛰️ SITE READINESS ENGINE</h4>
                          <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Verifies critical structural gates before releasing materials and partners.</p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                          <h5 style={{ margin: 0, fontSize: '0.7rem', color: 'var(--danger)', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: '750' }}>⚠️ CRITICAL BLOCKER GATES (Must Pass)</h5>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                              {criticalCheckpoints.map(item => {
                                  const isChecked = !!checklist[item.key];
                                  return (
                                      <label key={item.key} style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.8rem',
                                          padding: '0.8rem',
                                          background: isChecked ? 'rgba(102, 178, 194, 0.05)' : 'var(--bg-accent)',
                                          border: isChecked ? '1px solid rgba(102, 178, 194, 0.2)' : '1px solid var(--border-color)',
                                          borderRadius: '8px',
                                          cursor: 'pointer',
                                          transition: 'all 0.2s ease'
                                      }} className="cinematic-hover">
                                          <input
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={() => handleCheckboxChange(item.key)}
                                              style={{
                                                  accentColor: 'var(--accent-color)',
                                                  width: '16px',
                                                  height: '16px',
                                                  cursor: 'pointer'
                                              }}
                                          />
                                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                                              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{item.label}</span>
                                              <span style={{ fontSize: '0.55rem', color: isChecked ? 'var(--accent-color)' : 'var(--text-secondary)' }}>
                                                  {isChecked ? 'Gate Passed' : 'Active Blocker'}
                                              </span>
                                          </div>
                                      </label>
                                  );
                              })}
                          </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.2rem' }}>
                          <h5 style={{ margin: 0, fontSize: '0.7rem', color: 'var(--accent-color)', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: '750' }}>✓ SUPPLEMENTAL PRE-REQUISITES (Score Weight)</h5>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                              {supplementalCheckpoints.map(item => {
                                  const isChecked = !!checklist[item.key];
                                  return (
                                      <label key={item.key} style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.8rem',
                                          padding: '0.8rem',
                                          background: isChecked ? 'rgba(102, 178, 194, 0.03)' : 'var(--bg-accent)',
                                          border: isChecked ? '1px solid rgba(102, 178, 194, 0.1)' : '1px solid var(--border-color)',
                                          borderRadius: '8px',
                                          cursor: 'pointer',
                                          transition: 'all 0.2s ease'
                                      }} className="cinematic-hover">
                                          <input
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={() => handleCheckboxChange(item.key)}
                                              style={{
                                                  accentColor: 'var(--accent-color)',
                                                  width: '16px',
                                                  height: '16px',
                                                  cursor: 'pointer'
                                              }}
                                          />
                                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                                              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{item.label}</span>
                                              <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)' }}>
                                                  {isChecked ? 'Ready' : 'Pending Verification'}
                                              </span>
                                          </div>
                                      </label>
                                  );
                              })}
                          </div>
                      </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                          <div>
                              <h4 style={{ margin: 0, color: 'var(--accent-color)', fontSize: '0.9rem', letterSpacing: '0.05em', fontWeight: '800' }}>🛠️ FRICTIONLESS SNAG LOGGER</h4>
                              <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Track execution snags and potential rework leakage without affecting true profits.</p>
                          </div>

                          <form onSubmit={handleLogSnag} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', background: 'var(--bg-accent)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                  <div>
                                      <label style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Snag Type</label>
                                      <select
                                          value={snagType}
                                          onChange={(e) => setSnagType(e.target.value)}
                                          style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.4rem', color: 'var(--text-primary)', fontSize: '0.75rem' }}
                                      >
                                          <option value="Woodwork">Woodwork</option>
                                          <option value="Finishes">Finishes</option>
                                          <option value="Electrical">Electrical</option>
                                          <option value="Plumbing">Plumbing</option>
                                          <option value="Other">Other</option>
                                      </select>
                                  </div>
                                  <div>
                                      <label style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Severity</label>
                                      <select
                                          value={snagSeverity}
                                          onChange={(e) => setSnagSeverity(e.target.value)}
                                          style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.4rem', color: 'var(--text-primary)', fontSize: '0.75rem' }}
                                      >
                                          <option value="Low">Low</option>
                                          <option value="Medium">Medium</option>
                                          <option value="High">High</option>
                                          <option value="Critical">Critical</option>
                                      </select>
                                  </div>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.8rem' }}>
                                  <div>
                                      <label style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Rework Exposure Cost (₹)</label>
                                      <input
                                          type="number"
                                          value={snagExposureCost}
                                          onChange={(e) => setSnagExposureCost(e.target.value)}
                                          placeholder="Ex: 12000"
                                          style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.4rem', color: 'var(--text-primary)', fontSize: '0.75rem' }}
                                      />
                                  </div>
                                  <div>
                                      <label style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Attribution Partner</label>
                                      <select
                                          value={responsibleVendorId}
                                          onChange={(e) => setResponsibleVendorId(e.target.value)}
                                          style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.4rem', color: 'var(--text-primary)', fontSize: '0.75rem' }}
                                      >
                                          <option value="">General Site / None</option>
                                          {assignedVendors.map((v, idx) => (
                                              <option key={v.id || idx} value={v.id}>{v.name}</option>
                                          ))}
                                      </select>
                                  </div>
                              </div>

                              <div>
                                  <label style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Issue Description</label>
                                  <input
                                      type="text"
                                      value={snagDescription}
                                      onChange={(e) => setSnagDescription(e.target.value)}
                                      placeholder="Ex: Laminate bubbling on wardrobe panel..."
                                      required
                                      style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.4rem', color: 'var(--text-primary)', fontSize: '0.75rem' }}
                                  />
                              </div>

                              <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: '800', marginTop: '0.4rem' }}>
                                  + LOG TACTICAL SNAG
                              </button>
                          </form>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '250px', overflowY: 'auto' }}>
                              {(selectedProject.snags || []).length > 0 ? (
                                  [...(selectedProject.snags || [])].reverse().map(snag => {
                                      const vendor = vendors.find(v => String(v.id) === String(snag.responsibleVendorId));
                                      return (
                                          <div key={snag.id} style={{
                                              background: snag.resolved ? 'rgba(255,255,255,0.01)' : 'var(--bg-accent)',
                                              border: '1px solid var(--border-color)',
                                              borderRadius: '8px',
                                              padding: '0.8rem',
                                              display: 'flex',
                                              justifyContent: 'space-between',
                                              alignItems: 'center',
                                              opacity: snag.resolved ? 0.6 : 1,
                                              transition: 'all 0.2s ease'
                                          }}>
                                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1, marginRight: '1rem' }}>
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                      <span style={{
                                                          fontSize: '0.55rem',
                                                          background: 'var(--bg-secondary)',
                                                          color: 'var(--accent-color)',
                                                          padding: '0.1rem 0.4rem',
                                                          borderRadius: '4px',
                                                          fontWeight: '800'
                                                      }}>{snag.type.toUpperCase()}</span>
                                                      <span style={{
                                                          fontSize: '0.55rem',
                                                          background: snag.severity === 'Critical' ? 'rgba(255,69,58,0.1)' : snag.severity === 'High' ? 'rgba(255,149,0,0.1)' : 'var(--bg-secondary)',
                                                          color: snag.severity === 'Critical' ? 'var(--danger)' : snag.severity === 'High' ? '#ff9500' : 'var(--text-secondary)',
                                                          padding: '0.1rem 0.4rem',
                                                          borderRadius: '4px',
                                                          fontWeight: '800'
                                                      }}>{snag.severity}</span>
                                                      {snag.exposureCost > 0 && (
                                                          <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                                                              ₹{snag.exposureCost.toLocaleString('en-IN')}
                                                          </span>
                                                      )}
                                                  </div>
                                                  <p style={{ margin: 0, fontSize: '0.75rem', color: snag.resolved ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: snag.resolved ? 'line-through' : 'none' }}>
                                                      {snag.description}
                                                  </p>
                                                  <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)' }}>
                                                      {vendor ? `Attributed to: ${vendor.name}` : 'General Site Issue'} • {formatDate(snag.createdAt || snag.id)}
                                                  </span>
                                              </div>
                                              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                  <button
                                                      onClick={() => handleToggleResolve(snag.id)}
                                                      style={{
                                                          background: snag.resolved ? 'rgba(255,255,255,0.05)' : 'rgba(102,178,194,0.1)',
                                                          border: snag.resolved ? '1px solid var(--border-color)' : '1px solid var(--accent-color)',
                                                          color: snag.resolved ? 'var(--text-secondary)' : 'var(--accent-color)',
                                                          padding: '0.3rem 0.6rem',
                                                          borderRadius: '4px',
                                                          fontSize: '0.6rem',
                                                          fontWeight: '800',
                                                          cursor: 'pointer'
                                                      }}
                                                  >
                                                      {snag.resolved ? 'UNRESOLVE' : 'RESOLVE'}
                                                  </button>
                                                  <button
                                                      onClick={() => handleRemoveSnag(snag.id)}
                                                      style={{
                                                          background: 'none',
                                                          border: 'none',
                                                          color: 'var(--danger)',
                                                          fontSize: '0.9rem',
                                                          cursor: 'pointer',
                                                          padding: '0.2rem'
                                                      }}
                                                      title="Delete Snag"
                                                  >
                                                      ×
                                                  </button>
                                              </div>
                                          </div>
                                      );
                                  })
                              ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.7rem', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                                      <span>✓</span>
                                      <p style={{ margin: '0.3rem 0 0 0', fontWeight: '700' }}>NO SNAGS REPORTED</p>
                                      <p style={{ margin: 0, fontSize: '0.6rem' }}>This project has zero active execution or quality defects.</p>
                                  </div>
                              )}
                          </div>
                      </div>

                      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                          <div>
                              <h4 style={{ margin: 0, color: 'var(--accent-color)', fontSize: '0.9rem', letterSpacing: '0.05em', fontWeight: '800' }}>📅 TIMELINE & DELAY ATTRIBUTION</h4>
                              <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Log planning milestones and track deterministic delay liabilities.</p>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                              <div>
                                  <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Planned Start Date</label>
                                  <input
                                      type="date"
                                      value={selectedProject.startDate ? selectedProject.startDate.split('T')[0] : ''}
                                      onChange={(e) => onUpdateValue(selectedProject.id, { startDate: e.target.value, lastActivityAt: new Date().toISOString() })}
                                      style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.6rem', color: '#fff', fontSize: '0.75rem' }}
                                  />
                              </div>
                              <div>
                                  <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Actual Start Date</label>
                                  <input
                                      type="date"
                                      value={selectedProject.actualStartDate ? selectedProject.actualStartDate.split('T')[0] : ''}
                                      onChange={(e) => onUpdateValue(selectedProject.id, { actualStartDate: e.target.value, lastActivityAt: new Date().toISOString() })}
                                      style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.6rem', color: '#fff', fontSize: '0.75rem' }}
                                  />
                              </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                              <div>
                                  <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Planned Completion</label>
                                  <input
                                      type="date"
                                      value={selectedProject.endDate ? selectedProject.endDate.split('T')[0] : ''}
                                      onChange={(e) => onUpdateValue(selectedProject.id, { endDate: e.target.value, lastActivityAt: new Date().toISOString() })}
                                      style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.6rem', color: '#fff', fontSize: '0.75rem' }}
                                  />
                              </div>
                              <div>
                                  <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Actual Completion</label>
                                  <input
                                      type="date"
                                      value={selectedProject.actualCompletionDate ? selectedProject.actualCompletionDate.split('T')[0] : ''}
                                      onChange={(e) => onUpdateValue(selectedProject.id, { actualCompletionDate: e.target.value, lastActivityAt: new Date().toISOString() })}
                                      style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.6rem', color: '#fff', fontSize: '0.75rem' }}
                                  />
                              </div>
                          </div>

                          <div>
                              <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Primary Delay Attribution</label>
                              <select
                                  value={selectedProject.primaryDelayReason || 'None'}
                                  onChange={(e) => onUpdateValue(selectedProject.id, { primaryDelayReason: e.target.value === 'None' ? null : e.target.value, lastActivityAt: new Date().toISOString() })}
                                  style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.6rem', color: '#fff', fontSize: '0.75rem' }}
                              >
                                  <option value="None">None / On Schedule</option>
                                  <option value="Client Delay">Client Delay</option>
                                  <option value="Vendor Delay">Vendor Delay</option>
                                  <option value="Internal Delay">Internal Delay</option>
                                  <option value="Material Delay">Material Delay</option>
                              </select>
                              <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', marginTop: '0.3rem', display: 'block' }}>
                                  Attributing delay triggers timeline variances displayed on Execution OS automatically.
                              </span>
                          </div>
                      </div>
                  </div>
              </div>
         </div>
    );
};

const ProjectDirectory = ({ projects = [], vendors = [], portfolios = [], activeProjectId, onSelectProject, onAddExpense, onUpdateValue, onLogPayment, onLogPayout, onAddVendor, onAssignPartner, onReassignPartner, onAddNote, onToggleVisibility, userRole, onRemoveProject, onViewAudit, overheadConfig, overheadMethod, onInitializeProject, onUpdateContractValue }) => {
  const isReadOnly = userRole === 'Client';
  const formatDate = (dateStr) => {
    if (!dateStr) return '---';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  }

  // Formats ISO timestamp or date string as dd-mm-yyyy HH:MM
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '---';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${d}-${m}-${y} ${hh}:${mm}`;
  }
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeSubTab, setActiveSubTab] = useState('overview') 
  const [isInitiatingHandover, setIsInitiatingHandover] = useState(false)
  const [currentHandoverForPdf, setCurrentHandoverForPdf] = useState(null)

  const handleSaveHandover = (newHandover) => {
    if (!selectedProject) return;
    const existingHandovers = selectedProject.handovers || [];
    const updatedHandovers = [newHandover, ...existingHandovers.filter(h => h.id !== newHandover.id)];
    const updatePayload = { 
        handovers: updatedHandovers,
        lastActivityAt: new Date().toISOString()
    };
    if (newHandover.clientName) updatePayload.clientName = newHandover.clientName;
    if (newHandover.siteAddress) updatePayload.address = newHandover.siteAddress;
    
    onUpdateValue(selectedProject.id, updatePayload);
    setIsInitiatingHandover(false);
  };

  const handleRegenerateLink = (handover) => {
    if (!selectedProject) return;
    const newToken = 'ho_sec_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    const updatedHandover = {
        ...handover,
        token: newToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        sentAt: new Date().toISOString()
    };
    handleSaveHandover(updatedHandover);
    alert('Link regenerated successfully! The old link has been invalidated.');
  };

  const handleVoidAndIssueNew = (handover) => {
    if (!selectedProject) return;
    if (!window.confirm('Are you sure you want to void this signed handover and issue a new draft version? The signed PDF will remain archived in history.')) return;
    
    const voidedHandover = {
        ...handover,
        status: 'VOIDED',
        active: false,
        voidedAt: new Date().toISOString()
    };
    const existingHandovers = selectedProject.handovers || [];
    const updatedHandovers = existingHandovers.map(h => h.id === handover.id ? voidedHandover : h);
    
    onUpdateValue(selectedProject.id, { handovers: updatedHandovers });
    setIsInitiatingHandover(true);
  };

  const handleDeleteHandover = (handover) => {
    if (!selectedProject) return;
    if (!window.confirm(`Are you sure you want to delete and deactivate handover link (${handover.id})? Recipient will no longer be able to open or submit this link.`)) return;

    const voidedHandover = {
        ...handover,
        status: 'VOIDED',
        active: false,
        voidedAt: new Date().toISOString()
    };
    const existingHandovers = selectedProject.handovers || [];
    const updatedHandovers = existingHandovers.map(h => h.id === handover.id ? voidedHandover : h);
    
    onUpdateValue(selectedProject.id, { handovers: updatedHandovers });

    if (supabase && selectedProject.id) {
        supabase.from('projects').select('*').eq('id', String(selectedProject.id)).maybeSingle().then(({ data: cloudProj }) => {
            if (cloudProj) {
                const pData = cloudProj.data || cloudProj;
                const cloudUpdatedHandovers = (pData.handovers || []).map(h => h.id === handover.id ? voidedHandover : h);
                supabase.from('projects').upsert({ id: String(selectedProject.id), name: selectedProject.name, data: { ...pData, handovers: cloudUpdatedHandovers } }).then(() => {}).catch(() => {});
            }
        }).catch(() => {});
    }
  };

  const handleDeleteAndCreateNew = (handover) => {
    if (!selectedProject) return;
    if (!window.confirm(`Deactivate existing link (${handover.id}) and immediately create a new handover link?`)) return;

    const voidedHandover = {
        ...handover,
        status: 'VOIDED',
        active: false,
        voidedAt: new Date().toISOString()
    };
    const existingHandovers = selectedProject.handovers || [];
    const updatedHandovers = existingHandovers.map(h => h.id === handover.id ? voidedHandover : h);
    
    onUpdateValue(selectedProject.id, { handovers: updatedHandovers });

    if (supabase && selectedProject.id) {
        supabase.from('projects').select('*').eq('id', String(selectedProject.id)).maybeSingle().then(({ data: cloudProj }) => {
            if (cloudProj) {
                const pData = cloudProj.data || cloudProj;
                const cloudUpdatedHandovers = (pData.handovers || []).map(h => h.id === handover.id ? voidedHandover : h);
                supabase.from('projects').upsert({ id: String(selectedProject.id), name: selectedProject.name, data: { ...pData, handovers: cloudUpdatedHandovers } }).then(() => {}).catch(() => {});
            }
        }).catch(() => {});
    }

    setIsInitiatingHandover(true);
  };

  const handleDownloadHandoverPdf = async (handover) => {
    setCurrentHandoverForPdf(handover);
    setTimeout(async () => {
        try {
            const templateEl = document.getElementById('handover-pdf-template');
            if (templateEl) {
                const canvas = await html2canvas(templateEl, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    onclone: (clonedDoc) => {
                        const el = clonedDoc.getElementById('handover-pdf-template');
                        if (el) {
                            el.style.position = 'relative';
                            el.style.left = '0';
                            el.style.top = '0';
                            el.style.zIndex = '99999';
                            el.style.opacity = '1';
                            el.style.visibility = 'visible';
                            el.style.display = 'block';
                        }
                    }
                });
                const pdf = new jsPDF('p', 'mm', 'a4');
                const imgData = canvas.toDataURL('image/jpeg', 0.98);
                pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
                const fileName = `${(selectedProject?.name || 'Project').replace(/[^a-zA-Z0-9_-]/g, '_')}_v${handover.version || 1}_Handover_Certificate.pdf`;
                pdf.save(fileName);
            }
        } catch (e) {
            console.error('Download PDF error:', e);
        }
    }, 300);
  };

  const handleDownloadFeedbackPdf = async (handover) => {
    setCurrentHandoverForPdf(handover);
    setTimeout(async () => {
        try {
            const templateEl = document.getElementById('feedback-pdf-template');
            if (templateEl) {
                const canvas = await html2canvas(templateEl, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    onclone: (clonedDoc) => {
                        const el = clonedDoc.getElementById('feedback-pdf-template');
                        if (el) {
                            el.style.position = 'relative';
                            el.style.left = '0';
                            el.style.top = '0';
                            el.style.zIndex = '99999';
                            el.style.opacity = '1';
                            el.style.visibility = 'visible';
                            el.style.display = 'block';
                        }
                    }
                });
                const pdf = new jsPDF('p', 'mm', 'a4');
                const imgData = canvas.toDataURL('image/jpeg', 0.98);
                pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
                const fileName = `${(selectedProject?.name || 'Project').replace(/[^a-zA-Z0-9_-]/g, '_')}_Customer_Feedback_Report.pdf`;
                pdf.save(fileName);
            }
        } catch (e) {
            console.error('Download Feedback PDF error:', e);
        }
    }, 300);
  };

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false)
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [isEditingValue, setIsEditingValue] = useState(false)
  const [editBaseAmount, setEditBaseAmount] = useState(0)
  const [editGstRate, setEditGstRate] = useState(18)
  const [paymentBase, setPaymentBase] = useState(0)
  const [paymentGst, setPaymentGst] = useState(0)
  const [receiptAmountReceived, setReceiptAmountReceived] = useState(0)
  const [receiptGstRate, setReceiptGstRate] = useState(18)
  const [payoutBase, setPayoutBase] = useState(0)
  const [payoutGst, setPayoutGst] = useState(0)
  const [isRegisteringNew, setIsRegisteringNew] = useState(false)
  const [noteText, setNoteText] = useState('')
  
  // Form States for robustness
  const [selectedVendorId, setSelectedVendorId] = useState('')
  const [assignOrderValue, setAssignOrderValue] = useState('')
  const [isSignOffModalOpen, setIsSignOffModalOpen] = useState(false)
  const [signOffEmail, setSignOffEmail] = useState({ subject: '', body: '', to: '' })
  const [showAllHistory, setShowAllHistory] = useState(false)
  const [paymentScreenshots, setPaymentScreenshots] = useState([])
  const [payoutScreenshots, setPayoutScreenshots] = useState([])
  const [globalAudits, setGlobalAudits] = useState([])
  const [isLinkAuditModalOpen, setIsLinkAuditModalOpen] = useState(false)
  const [auditSearchQuery, setAuditSearchQuery] = useState('')
  const [serviceOnlyAssign, setServiceOnlyAssign] = useState(false)
  const [editingContractId, setEditingContractId] = useState(null)
  const [editContractVal, setEditContractVal] = useState('')
  
  useEffect(() => {
    if (activeProjectId) {
        setSelectedProjectId(activeProjectId)
    }
  }, [activeProjectId])

  useEffect(() => {
    if (isPaymentModalOpen) {
      setPaymentBase(0)
      setPaymentGst(0)
      setReceiptAmountReceived(0)
      setReceiptGstRate(18)
    }
  }, [isPaymentModalOpen])

  useEffect(() => {
    if (isPayoutModalOpen) {
      setPayoutBase(0)
      setPayoutGst(0)
    }
  }, [isPayoutModalOpen])

  useEffect(() => {
    if (isLinkAuditModalOpen) {
        // 1. Load from localstorage
        const localAudits = JSON.parse(localStorage.getItem('execution_audits')) || [];
        setGlobalAudits(localAudits);

        // 2. Load from Supabase in background
        if (supabase) {
            supabase.from('site_audits').select('*').then(({ data, error }) => {
                if (data && !error) {
                    const cloudAudits = data.map(r => r.data).filter(Boolean);
                    // Merge and deduplicate by auditId
                    setGlobalAudits(prev => {
                        const merged = [...prev];
                        cloudAudits.forEach(ca => {
                            if (!merged.some(ma => ma.auditId === ca.auditId)) {
                                merged.push(ca);
                            }
                        });
                        return merged;
                    });
                }
            });
        }
    }
  }, [isLinkAuditModalOpen]);

  const handleStatusChange = (newStatus) => {
    if (newStatus === 'Completed') {
        const confirmHandover = window.confirm("Site reaching 100% completion. Initialize Formal Handover Sequence & Client Email Loop?");
        if (confirmHandover) {
            // Prepare Sign-Off Email
            const clientTimeline = (selectedProject.history || [])
                .filter(h => h.isClientVisible)
                .map(h => `- ${h.date || h.timestamp?.split('T')[0]}: ${h.title} (${h.detail})`)
                .join('\n');
            
            setSignOffEmail({
                to: selectedProject.stakeholders?.join(', ') || 'project.manager@meaven.co',
                subject: `Final Sign-off Request: ${selectedProject.name}`,
                body: `Dear Team,\n\nPlease review and provide the final sign-off for ${selectedProject.name}.\n\nAUTHORISED SITE TIMELINE:\n${clientTimeline || 'No entries pushed to client view yet.'}\n\nRegards,\nMeaven Intelligence Hub`
            });
            
            setIsSignOffModalOpen(true);

            onUpdateValue(selectedProject.id, { 
                status: 'Completed',
                isSignOffRequested: true,
                isHandoverPending: true 
            });
        }
    } else {
        onUpdateValue(selectedProject.id, { status: newStatus });
    }
  }

  useEffect(() => {
    if (selectedProjectId) {
        const p = projects.find(proj => Number(proj.id) === Number(selectedProjectId));
        if (p) window.lastActiveProject = p;
    }
  }, [selectedProjectId, projects]);

  const filteredProjects = (projects || []).filter(p => 
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.client || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedProject = (projects || []).find(p => p.id === selectedProjectId)

  // Find linked vendor (Active only)
  // Find linked vendor (Robust detection)
  const linkedVendor = (vendors || []).find(v => 
    v && (
      v.name === selectedProject?.assignedVendor || 
      (v.contracts || []).some(c => 
          (c.projectName || '').toLowerCase().trim() === (selectedProject?.name || '').toLowerCase().trim() && 
          (c.status === 'Active' || !c.status)
      )
    )
  )

  // Find all assigned vendors for this project (Active contracts or assignedVendor name match)
  const assignedVendors = (vendors || []).filter(v => 
    v && (
      v.name === selectedProject?.assignedVendor || 
      (v.contracts || []).some(c => 
          (c.projectName || '').toLowerCase().trim() === (selectedProject?.name || '').toLowerCase().trim() && 
          (c.status === 'Active' || !c.status)
      )
    )
  )

  // INTELLIGENCE ENGINE: Recommend Top 3 Best Fit Vendors
  const getRecommendations = () => {
    if (!selectedProject || (vendors || []).length === 0) return []
    
    return [...vendors]
        .filter(v => v.id !== linkedVendor?.id) 
        .sort((a, b) => (b.miScore || 0) - (a.miScore || 0))
        .slice(0, 3) 
        .map((top, index) => {
            let reason = `Top-tier reliability based on past Meaven site audits.`
            if (top.scores?.quality > 95) reason = `Exceptional quality standards; zero defects reported on recent projects.`
            else if (top.scores?.timeline > 90) reason = `Fast-track specialist; 90% accuracy in hitting site-readiness dates.`
            
            return { ...top, reason, rank: index + 1 }
        })
  }

  const recommendations = getRecommendations()

  const handleQuickAssign = (vendorId) => {
    setSelectedVendorId(vendorId ? vendorId.toString() : '')
    setIsAssignModalOpen(true)
  }

  const submitAssignment = (e) => {
    e.preventDefault()
    if (!selectedProject || !selectedVendorId || !assignOrderValue) {
        alert('Please select a vendor and enter a contract value.')
        return
    }
    
    onAssignPartner(selectedProject.id, selectedVendorId, assignOrderValue)
    
    // Reset and Close
    setIsAssignModalOpen(false)
    setSelectedVendorId('')
    setAssignOrderValue('')
  }

  if (selectedProject) {
    const pl = {
      revenue: getProjectRevenue(selectedProject),
      cogs: getProjectCogs(selectedProject, vendors),
      expenses: getProjectExpenses(selectedProject),
      profit: getProjectProfit(selectedProject, vendors),
      margin: getProjectMargin(selectedProject, vendors)
    }
    
    // Phase 2 Operational & Cash Flow Calculations
    const trueOverhead = getAllocatedProjectOverhead(selectedProject, overheadConfig, overheadMethod, projects)
    const trueProfit = getTrueProjectProfit(selectedProject, vendors, overheadConfig, overheadMethod, projects)
    const trueMargin = getTrueProjectMargin(selectedProject, vendors, overheadConfig, overheadMethod, projects)
    const cashFlow = getProjectCashPosition(selectedProject)
    const collectionHealth = getCollectionHealth(selectedProject)
    const vendorLiability = getVendorLiability(selectedProject, vendors)
    const inactivity = getProjectInactivityStatus(selectedProject)
    
    const financials = selectedProject.clientFinancials || { totalValue: 0, requests: [], received: [] }
    const totalReceived = getProjectCollections(selectedProject)
    const outstanding = getProjectOutstanding(selectedProject)
    const linkedVendor = (vendors || []).find(v => v && (v.contracts || []).some(c => c.projectName === selectedProject.name && (c.status === 'Active' || !c.status)));

    return (
      <div className="project-detail-view animate-fade-in" style={{ paddingBottom: '5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button 
                    onClick={() => { setSelectedProjectId(null); setActiveSubTab('overview'); setIsEditingValue(false); }} 
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-color)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '800' }}
                >
                    ← BACK
                </button>
                <div style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.55rem', fontWeight: '900', letterSpacing: '0.15em' }}>
                    💎 FINANCIAL DEEP-DIVE
                </div>
            </div>
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '0.4rem', borderRadius: '12px', gap: '0.4rem', border: '1px solid var(--border-color)', width: '100%', maxWidth: '500px' }}>
                <button 
                    onClick={() => setActiveSubTab('overview')}
                    style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: 'none', background: activeSubTab === 'overview' ? 'var(--accent-color)' : 'none', color: activeSubTab === 'overview' ? '#fff' : 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                >Overview</button>
                <button 
                    onClick={() => setActiveSubTab('financials')}
                    style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: 'none', background: activeSubTab === 'financials' ? 'var(--accent-color)' : 'none', color: activeSubTab === 'financials' ? '#fff' : 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                >P&L Intel</button>
                <button 
                    onClick={() => setActiveSubTab('execution')}
                    style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: 'none', background: activeSubTab === 'execution' ? 'var(--accent-color)' : 'none', color: activeSubTab === 'execution' ? '#fff' : 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                >Readiness & Snags</button>
                <button 
                    onClick={() => setActiveSubTab('handover')}
                    style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: 'none', background: activeSubTab === 'handover' ? 'var(--accent-color)' : 'none', color: activeSubTab === 'handover' ? '#fff' : 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                >📜 Handover & Closure</button>
                <button 
                    onClick={() => { window.location.hash = '#calculator'; window.dispatchEvent(new CustomEvent('navigate', { detail: 'calculator' })); }}
                    style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--accent-color)', background: 'none', color: 'var(--accent-color)', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                >🧮 TECH CALC</button>

            </div>
        </div>

        <div className="stack-on-mobile" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem', gap: '2rem' }}>
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: '900' }}>{selectedProject.name}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <select 
                            value={selectedProject.status || 'Active'}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            style={{ 
                                background: (selectedProject.status === 'Completed' ? 'var(--success)' : (selectedProject.status === 'On Hold' ? 'var(--danger)' : (selectedProject.status === 'Final Closure' ? '#7b61ff' : 'var(--accent-color)'))),
                                color: '#000', border: 'none', borderRadius: '20px', padding: '0.4rem 1rem', fontSize: '0.65rem', fontWeight: '900', cursor: 'pointer'
                            }}
                        >
                            <option value="Active">ACTIVE</option>
                            <option value="Completed">COMPLETED</option>
                            <option value="On Hold">ON HOLD</option>
                            <option value="Final Closure">FINAL CLOSURE</option>
                        </select>
                        <select 
                            value={selectedProject.stageIndex !== undefined ? selectedProject.stageIndex : 1}
                            onChange={(e) => onUpdateValue(selectedProject.id, { stageIndex: parseInt(e.target.value) })}
                            style={{ 
                                background: 'var(--bg-accent)',
                                color: 'var(--accent-color)', border: '1px solid var(--border-accent)', borderRadius: '20px', padding: '0.4rem 1rem', fontSize: '0.65rem', fontWeight: '800', cursor: 'pointer'
                            }}
                        >
                            <option value={0}>STAGE 0: Project Assigned</option>
                            <option value={1}>STAGE 1: Site Verification Pending</option>
                            <option value={2}>STAGE 2: Site Audit Submitted</option>
                            <option value={3}>STAGE 3: Readiness Approved</option>
                            <option value={4}>STAGE 4: Production Freeze</option>
                            <option value={5}>STAGE 5: Installation In Progress</option>
                            <option value={6}>STAGE 6: QC Pending</option>
                            <option value={7}>STAGE 7: Snag Closure Pending</option>
                            <option value={8}>STAGE 8: Handover Completed</option>
                            <option value={9}>STAGE 9: Closure Approved</option>
                        </select>
                        {selectedProject.isSignOffRequested && !selectedProject.managerSignOff && (
                            <span style={{ fontSize: '0.55rem', color: '#FF9500', fontWeight: '900', letterSpacing: '0.05em' }}>(AWAITING SIGN-OFF)</span>
                        )}
                    </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: '500' }}>CLIENT PORTFOLIO: {selectedProject.client}</p>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1.2rem', flexWrap: 'wrap' }}>
                    <button 
                        onClick={() => {
                            const link = `${window.location.origin}/?view=partner&projectId=${selectedProject.id}`;
                            navigator.clipboard.writeText(link);
                            alert('Vendor Execution Link copied to clipboard:\n' + link);
                        }} 
                        style={{ background: 'var(--accent-color)', border: 'none', color: '#000', fontSize: '0.7rem', padding: '0.6rem 1rem', borderRadius: '20px', cursor: 'pointer', fontWeight: '800' }}
                    >
                        📋 Copy Vendor Execution Link
                    </button>
                    {userRole === 'SuperAdmin' && (
                        <button 
                            onClick={() => { if(confirm(`Flush Project ${selectedProject.name}?`)) { onRemoveProject(selectedProject.id); setSelectedProjectId(null); } }} 
                            style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.6rem', cursor: 'pointer', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: '900' }}
                        >
                            🗑️ Flush Individual Loop
                        </button>
                    )}
                </div>
            </div>
            <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', fontWeight: '900', color: pl.margin > 30 ? 'var(--success)' : 'var(--accent-color)', lineHeight: 1 }}>
                    {pl.margin.toFixed(1)}%
                </div>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: '800' }}>Net Project Profit</span>
            </div>
        </div>

        {activeSubTab === 'overview' ? (
            <div className="animate-fade-in">
                {/* 🚀 PHASE 2: OPERATIONAL & CASH INTELLIGENCE COCKPIT */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', marginBottom: '2.5rem' }}>
                    
                    {/* WIDGET 1: Financial Truths */}
                    <div className="card cinematic-hover" style={{ padding: '1.2rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: '800', letterSpacing: '0.1em', textTransform: 'uppercase' }}>💼 Net vs True Profitability</span>
                            <button 
                                onClick={() => setIsAdjustModalOpen(true)}
                                style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '0.6rem', fontWeight: '800', cursor: 'pointer', padding: 0 }}
                            >
                                [ Adjust Costs ]
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Net Profit (EBITDA):</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-primary)' }}>₹{pl.profit.toLocaleString('en-IN')} ({pl.margin.toFixed(1)}%)</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Allocated Overhead:</span>
                                <span style={{ fontSize: '0.72rem', fontWeight: '750', color: 'var(--danger)' }}>- ₹{Math.round(trueOverhead).toLocaleString('en-IN')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: '0.3rem', marginTop: '0.2rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: '750', color: 'var(--accent-color)' }}>True Project Profit:</span>
                                <span style={{ fontSize: '0.8rem', fontWeight: '900', color: trueProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>₹{Math.round(trueProfit).toLocaleString('en-IN')} ({trueMargin.toFixed(1)}%)</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Allocation Method: <strong style={{ color: 'var(--accent-color)' }}>{overheadMethod === 'weighted' ? 'Revenue Weighted Proportional' : 'Equal Share'}</strong></div>
                            {selectedProject.financialAdjustments && (
                                (selectedProject.financialAdjustments.manualVendorCost && Number(selectedProject.financialAdjustments.manualVendorCost) !== 0) ||
                                (selectedProject.financialAdjustments.manualDirectExpense && Number(selectedProject.financialAdjustments.manualDirectExpense) !== 0)
                            ) && (
                                <div style={{ fontSize: '0.55rem', color: '#ff9500', fontWeight: '750', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.1rem' }}>
                                    * Includes manual adjustments
                                </div>
                            )}
                        </div>
                    </div>

                    {/* WIDGET 2: Cash Flow Engine */}
                    <div className="card cinematic-hover" style={{ padding: '1.2rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: '800', letterSpacing: '0.1em', textTransform: 'uppercase' }}>💳 Cash Position Engine</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Collections Received:</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--success)' }}>+ ₹{cashFlow.collections.toLocaleString('en-IN')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Vendor Payouts:</span>
                                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--danger)' }}>- ₹{cashFlow.payouts.toLocaleString('en-IN')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Direct Site Expenses:</span>
                                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--danger)' }}>- ₹{cashFlow.expenses.toLocaleString('en-IN')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: '0.3rem', marginTop: '0.2rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: '750', color: 'var(--accent-color)' }}>Net Cash Position:</span>
                                <span style={{ fontSize: '0.8rem', fontWeight: '900', color: cashFlow.netCashPosition >= 0 ? 'var(--success)' : 'var(--danger)' }}>₹{cashFlow.netCashPosition.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>

                    {/* WIDGET 3: Collection Due Aging */}
                    <div className="card cinematic-hover" style={{ padding: '1.2rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.6rem' }}>
                        <div>
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: '800', letterSpacing: '0.1em', textTransform: 'uppercase' }}>📅 Collection Due Aging</span>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.4rem' }}>
                                <span style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--text-primary)' }}>₹{collectionHealth.outstanding.toLocaleString('en-IN')}</span>
                                <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Outstanding</span>
                            </div>
                            {selectedProject.clientFinancials?.dueDate && (
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                    Due: <strong style={{ color: 'var(--text-primary)' }}>{formatDate(selectedProject.clientFinancials.dueDate)}</strong> ({collectionHealth.daysOutstanding} days outstanding)
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem' }}>
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>RISK INDEX</span>
                            <span style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.55rem',
                                fontWeight: '900',
                                background: collectionHealth.agingBucket === 'Unspecified' ? 'rgba(255,255,255,0.05)' :
                                            collectionHealth.agingBucket === 'Healthy' ? 'rgba(50,215,75,0.08)' :
                                            collectionHealth.agingBucket === 'Watch' ? 'rgba(255,149,0,0.08)' : 'rgba(255,69,58,0.08)',
                                color: collectionHealth.agingBucket === 'Unspecified' ? 'var(--text-secondary)' :
                                       collectionHealth.agingBucket === 'Healthy' ? 'var(--success)' :
                                       collectionHealth.agingBucket === 'Watch' ? '#ff9500' : 'var(--danger)',
                                border: '1px solid ' + (
                                       collectionHealth.agingBucket === 'Unspecified' ? 'var(--border-color)' :
                                       collectionHealth.agingBucket === 'Healthy' ? 'rgba(50,215,75,0.2)' :
                                       collectionHealth.agingBucket === 'Watch' ? 'rgba(255,149,0,0.2)' : 'rgba(255,69,58,0.2)'
                                )
                            }}>
                                {collectionHealth.agingBucket.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    {/* WIDGET 4: Vendor Liability */}
                    <div className="card cinematic-hover" style={{ padding: '1.2rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.6rem' }}>
                        <div>
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: '800', letterSpacing: '0.1em', textTransform: 'uppercase' }}>🤝 Vendor Dues Aging</span>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.4rem' }}>
                                <span style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--text-primary)' }}>₹{vendorLiability.outstanding.toLocaleString('en-IN')}</span>
                                <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Unpaid liability</span>
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                Committed: ₹{vendorLiability.committed.toLocaleString('en-IN')} | Paid: ₹{vendorLiability.paid.toLocaleString('en-IN')}
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem' }}>
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>LIABILITY STATE</span>
                            <span style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.55rem',
                                fontWeight: '900',
                                background: vendorLiability.agingBucket === 'Healthy' ? 'rgba(50,215,75,0.08)' :
                                            vendorLiability.agingBucket === 'Watch' ? 'rgba(255,149,0,0.08)' : 'rgba(255,69,58,0.08)',
                                color: vendorLiability.agingBucket === 'Healthy' ? 'var(--success)' :
                                       vendorLiability.agingBucket === 'Watch' ? '#ff9500' : 'var(--danger)',
                                border: '1px solid ' + (
                                       vendorLiability.agingBucket === 'Healthy' ? 'rgba(50,215,75,0.2)' :
                                       vendorLiability.agingBucket === 'Watch' ? 'rgba(255,149,0,0.2)' : 'rgba(255,69,58,0.2)'
                                )
                            }}>
                                {vendorLiability.agingBucket.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    {/* WIDGET 5: Operational Activity Pulse */}
                    <div className="card cinematic-hover" style={{ padding: '1.2rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.6rem' }}>
                        <div>
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: '800', letterSpacing: '0.1em', textTransform: 'uppercase' }}>🛰️ Operational Activity Pulse</span>
                            <div style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--text-primary)', marginTop: '0.4rem' }}>
                                {inactivity.daysSinceLastActivity === 0 ? 'Active Today' : `${inactivity.daysSinceLastActivity} days ago`}
                            </div>
                            <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                Last transaction: <strong style={{ color: 'var(--text-primary)' }}>{selectedProject.lastActivityAt ? formatDateTime(selectedProject.lastActivityAt) : 'No transactions logged'}</strong>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem' }}>
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>PULSE STATUS</span>
                            <span style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.55rem',
                                fontWeight: '900',
                                background: inactivity.inactivityStatus === 'Active' ? 'rgba(50,215,75,0.08)' :
                                            inactivity.inactivityStatus === 'Slow' ? 'rgba(255,149,0,0.08)' : 'rgba(255,69,58,0.08)',
                                color: inactivity.inactivityStatus === 'Active' ? 'var(--success)' :
                                       inactivity.inactivityStatus === 'Slow' ? '#ff9500' : 'var(--danger)',
                                border: '1px solid ' + (
                                       inactivity.inactivityStatus === 'Active' ? 'rgba(50,215,75,0.2)' :
                                       inactivity.inactivityStatus === 'Slow' ? 'rgba(255,149,0,0.2)' : 'rgba(255,69,58,0.2)'
                                )
                            }}>
                                {inactivity.inactivityStatus.toUpperCase()}
                            </span>
                        </div>
                    </div>

                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '2rem', marginBottom: '2.5rem' }} className="stack-on-mobile">
                    {/* Left Card: Consolidated Dashboard */}
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
                            <h4 style={{ margin: 0, color: 'var(--accent-color)', fontSize: '0.9rem', letterSpacing: '0.05em', fontWeight: '800' }}>📊 OPERATIONAL & FINANCIAL INTELLIGENCE</h4>
                            <span style={{ fontSize: '0.65rem', background: 'rgba(102,178,194,0.1)', color: 'var(--accent-color)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontWeight: '800' }}>CONSOLIDATED SUMMARY</span>
                        </div>
                        
                        {/* Financial Metrics Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            {/* Contract Value */}
                            <div style={{ background: 'var(--bg-accent)', padding: '0.8rem', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>Contract Value</p>
                                {isEditingValue ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
                                        <div>
                                            <label style={{ fontSize: '0.5rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.1rem' }}>BASE VALUE (INR)</label>
                                            <input 
                                                autoFocus
                                                type="number" 
                                                value={editBaseAmount || ''} 
                                                onChange={(e) => setEditBaseAmount(parseMoney(e.target.value))}
                                                placeholder="Base Amount"
                                                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.3rem', color: 'var(--text-primary)', fontSize: '0.75rem', width: '100%' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.5rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.1rem' }}>GST RATE</label>
                                            <select 
                                                value={editGstRate} 
                                                onChange={(e) => setEditGstRate(Number(e.target.value))}
                                                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.3rem', color: 'var(--text-primary)', fontSize: '0.75rem', width: '100%' }}
                                            >
                                                <option value={5}>5%</option>
                                                <option value={18}>18%</option>
                                                <option value={28}>28%</option>
                                            </select>
                                        </div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--accent-color)', fontWeight: '800', marginTop: '0.2rem' }}>
                                            Final Value: ₹{Math.round(editBaseAmount + (editBaseAmount * editGstRate / 100)).toLocaleString('en-IN')}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.2rem' }}>
                                            <button 
                                                type="button" 
                                                onClick={() => setIsEditingValue(false)} 
                                                style={{ flex: 1, background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0.25rem', borderRadius: '4px', fontSize: '0.6rem', cursor: 'pointer' }}
                                            >Cancel</button>
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    onUpdateValue(selectedProject.id, { 
                                                        clientFinancials: { 
                                                            ...(selectedProject.clientFinancials || {}), 
                                                            baseAmount: editBaseAmount,
                                                            gstRate: editGstRate,
                                                            totalValue: Math.round(editBaseAmount + (editBaseAmount * editGstRate / 100)) 
                                                        } 
                                                    }); 
                                                    setIsEditingValue(false); 
                                                }}
                                                style={{ flex: 1, background: 'var(--accent-color)', border: 'none', color: '#000', padding: '0.25rem', borderRadius: '4px', fontSize: '0.6rem', fontWeight: '800', cursor: 'pointer' }}
                                            >Save</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.3rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Base:</span>
                                            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-primary)' }}>₹{selectedProject.clientFinancials?.baseAmount ? selectedProject.clientFinancials.baseAmount.toLocaleString('en-IN') : (selectedProject.clientFinancials?.totalValue ? selectedProject.clientFinancials.totalValue.toLocaleString('en-IN') : '0')}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>GST Rate:</span>
                                            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-primary)' }}>{selectedProject.clientFinancials?.gstRate || 18}%</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: '0.25rem', marginTop: '0.1rem' }}>
                                            <span style={{ fontSize: '0.65rem', color: 'var(--accent-color)', fontWeight: '850' }}>Final:</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-primary)' }}>₹{pl.revenue ? pl.revenue.toLocaleString('en-IN') : '0'}</span>
                                                {(pl.revenue === 0 || userRole === 'SuperAdmin') ? (
                                                    <button 
                                                        onClick={() => {
                                                            setEditBaseAmount(selectedProject.clientFinancials?.baseAmount || selectedProject.clientFinancials?.totalValue || 0);
                                                            setEditGstRate(selectedProject.clientFinancials?.gstRate || 18);
                                                            setIsEditingValue(true);
                                                        }} 
                                                        title={pl.revenue > 0 ? "Super Admin Override" : "Set Contract Value"}
                                                        style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}
                                                    >✎</button>
                                                ) : (
                                                    <span title="Locked by Institutional Protocol. Only Super Admin can modify." style={{ fontSize: '0.7rem', opacity: 0.5, cursor: 'help' }}>🔒</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Collected */}
                            <div style={{ background: 'rgba(50, 215, 75, 0.03)', padding: '0.8rem', borderRadius: '10px', border: '1px solid rgba(50, 215, 75, 0.15)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
                                    <p style={{ fontSize: '0.6rem', color: 'var(--success)', textTransform: 'uppercase', margin: 0 }}>Collected</p>
                                    <button onClick={() => setIsPaymentModalOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer', fontSize: '0.55rem', fontWeight: '700', padding: 0 }}>+ Log</button>
                                </div>
                                <p style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>₹{(totalReceived / 100000).toFixed(2)}L</p>
                            </div>
                            
                            {/* Outstanding */}
                            <div style={{ background: 'rgba(255, 69, 58, 0.03)', padding: '0.8rem', borderRadius: '10px', border: '1px solid rgba(255, 69, 58, 0.15)' }}>
                                <p style={{ fontSize: '0.6rem', color: 'var(--danger)', textTransform: 'uppercase', marginBottom: '0.3rem', margin: 0 }}>Outstanding</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>₹{(outstanding / 100000).toFixed(2)}L</p>
                            </div>
                        </div>
                        
                        {/* 📅 CLIENT BILLING & AGING CONFIGURATION PANEL */}
                        <div style={{ background: 'var(--bg-accent)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0, fontWeight: '800', letterSpacing: '0.05em' }}>📅 Client Billing Rules & Aging Control</p>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Collection Status</label>
                                    <select 
                                        value={selectedProject.clientFinancials?.collectionStatus || 'Unspecified'}
                                        onChange={(e) => {
                                            onUpdateValue(selectedProject.id, {
                                                clientFinancials: {
                                                    ...(selectedProject.clientFinancials || {}),
                                                    collectionStatus: e.target.value
                                                }
                                            });
                                        }}
                                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.4rem', color: '#fff', fontSize: '0.75rem', width: '100%' }}
                                    >
                                        <option value="Unspecified">Unspecified</option>
                                        <option value="Healthy">Healthy</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Overdue">Overdue</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Payment Terms</label>
                                    <select 
                                        value={selectedProject.clientFinancials?.paymentTerms || ''}
                                        onChange={(e) => {
                                            onUpdateValue(selectedProject.id, {
                                                clientFinancials: {
                                                    ...(selectedProject.clientFinancials || {}),
                                                    paymentTerms: e.target.value
                                                }
                                            });
                                        }}
                                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.4rem', color: '#fff', fontSize: '0.75rem', width: '100%' }}
                                    >
                                        <option value="">Select Terms</option>
                                        <option value="NET 15">NET 15</option>
                                        <option value="NET 30">NET 30</option>
                                        <option value="NET 45">NET 45</option>
                                        <option value="NET 60">NET 60</option>
                                        <option value="Immediate">Immediate</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Collection Due Date</label>
                                    <input 
                                        type="date"
                                        value={selectedProject.clientFinancials?.dueDate || ''}
                                        onChange={(e) => {
                                            onUpdateValue(selectedProject.id, {
                                                clientFinancials: {
                                                    ...(selectedProject.clientFinancials || {}),
                                                    dueDate: e.target.value
                                                }
                                            });
                                        }}
                                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.4rem', color: '#fff', fontSize: '0.75rem', width: '100%', outline: 'none' }}
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {/* Active Partner Row */}
                        <div style={{ background: 'var(--bg-accent)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0, fontWeight: '800' }}>Assigned Execution Partners</p>
                                <button onClick={() => { setSelectedVendorId(''); setIsAssignModalOpen(true); }} style={{ background: 'var(--accent-color)', border: 'none', color: '#000', cursor: 'pointer', fontSize: '0.5rem', fontWeight: '800', padding: '0.25rem 0.6rem', borderRadius: '4px' }}>+ ASSIGN PARTNER</button>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                {assignedVendors.length > 0 ? assignedVendors.map(vendor => {
                                    const contract = (vendor.contracts || []).find(c => c && (Number(c.projectId) === Number(selectedProject.id) || c.projectName === selectedProject.name));
                                    const isEditing = contract && editingContractId === contract.id;
                                    
                                    return (
                                        <div key={vendor.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                            <div 
                                                onClick={() => { window.navigateToVendorBench?.(vendor.id); }}
                                                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                            >
                                                <span style={{ fontSize: '1rem' }}>🤝</span>
                                                <div>
                                                    <p style={{ fontSize: '0.8rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>{vendor.name}</p>
                                                    <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                                                        <span>Category: <span style={{ color: 'var(--accent-color)', fontWeight: '700' }}>{vendor.category}</span> • MI SCORE: {vendor.miScore || vendor.score || 85}%</span>
                                                        {contract && (
                                                            <>
                                                                <span>•</span>
                                                                {isEditing ? (
                                                                    <span style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                                                                        <input 
                                                                            type="number"
                                                                            value={editContractVal}
                                                                            onChange={(e) => setEditContractVal(e.target.value)}
                                                                            style={{ background: 'var(--bg-accent)', border: '1px solid var(--accent-color)', borderRadius: '4px', color: '#fff', fontSize: '0.65rem', padding: '0.1rem 0.2rem', width: '70px' }}
                                                                        />
                                                                        <button 
                                                                            onClick={() => {
                                                                                if (onUpdateContractValue) {
                                                                                    onUpdateContractValue(vendor.id, contract.id, editContractVal);
                                                                                }
                                                                                setEditingContractId(null);
                                                                            }}
                                                                            style={{ background: 'var(--success)', border: 'none', borderRadius: '4px', color: '#000', padding: '0.1rem 0.3rem', fontSize: '0.55rem', cursor: 'pointer', fontWeight: '800' }}
                                                                        >
                                                                            ✓
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => setEditingContractId(null)}
                                                                            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', color: '#fff', padding: '0.1rem 0.3rem', fontSize: '0.55rem', cursor: 'pointer' }}
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                    </span>
                                                                ) : (
                                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                                        <span>CONTRACT: <span style={{ color: '#fff', fontWeight: '800' }}>₹{(contract.orderValue / 100000).toFixed(2)}L</span></span>
                                                                        {!isReadOnly && (
                                                                            <span 
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setEditContractVal(contract.orderValue || '');
                                                                                    setEditingContractId(contract.id);
                                                                                }}
                                                                                style={{ color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.55rem', fontWeight: '800', marginLeft: '0.2rem' }}
                                                                            >
                                                                                ✏️ Edit
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => { 
                                                    window.oldVendorIdToReplace = vendor.id;
                                                    setIsReassignModalOpen(true); 
                                                }} 
                                                style={{ background: 'rgba(255, 69, 58, 0.08)', border: '1px solid var(--danger)', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.5rem', fontWeight: '800', padding: '0.2rem 0.5rem', borderRadius: '4px' }}
                                            >
                                                REPLACE PARTNER
                                            </button>
                                        </div>
                                    );
                                })
                            : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
                                    <span style={{ fontSize: '1.2rem', color: 'var(--danger)' }}>⚠️</span>
                                    <p style={{ fontSize: '0.85rem', fontWeight: '800', margin: 0, color: 'var(--danger)' }}>UNASSIGNED</p>
                                </div>
                            )}
                        </div>

                            {/* MATERIAL-ONLY WARNING */}
                            {(() => {
                                const hasMaterials = assignedVendors.some(v => v.category === 'Materials');
                                const hasService = assignedVendors.some(v => v.category === 'Service');
                                if (hasMaterials && !hasService) {
                                    return (
                                        <div style={{ background: 'rgba(255, 69, 58, 0.05)', border: '1px solid var(--danger)', padding: '0.6rem 0.8rem', borderRadius: '8px', color: 'var(--danger)', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                                            <span>⚠️</span>
                                            <span><strong>Material-Only Assigned:</strong> A Service division partner is strictly required to execute and complete this project site.</span>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                        
                        {/* Timeline Health Row */}
                        <div style={{ background: 'var(--bg-accent)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0, letterSpacing: '0.05em', fontWeight: '800' }}>🛰️ TIMELINE HEALTH STATUS</p>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ background: 'var(--bg-primary)', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>Vendor → Meaven</label>
                                        <input 
                                            type="date" 
                                            value={selectedProject.vendorEndDate || ''}
                                            onChange={(e) => onUpdateValue(selectedProject.id, { vendorEndDate: e.target.value })}
                                            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.75rem', width: '100%', outline: 'none' }}
                                        />
                                    </div>
                                    {selectedProject.vendorEndDate && (
                                        <div style={{ fontSize: '0.65rem', fontWeight: '800', color: (new Date(selectedProject.vendorEndDate) - new Date()) > 0 ? 'var(--success)' : 'var(--danger)', marginLeft: '0.5rem', background: (new Date(selectedProject.vendorEndDate) - new Date()) > 0 ? 'rgba(50,215,75,0.1)' : 'rgba(255,69,58,0.1)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                                            {(() => {
                                                const diff = new Date(selectedProject.vendorEndDate) - new Date();
                                                const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                                                return days > 0 ? `${days}d` : (days === 0 ? 'Due' : `${Math.abs(days)}d!`);
                                            })()}
                                        </div>
                                    )}
                                </div>

                                <div style={{ background: 'var(--bg-primary)', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>Meaven → Client</label>
                                        <input 
                                            type="date" 
                                            value={selectedProject.endDate || ''}
                                            onChange={(e) => onUpdateValue(selectedProject.id, { endDate: e.target.value })}
                                            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.75rem', width: '100%', outline: 'none' }}
                                        />
                                    </div>
                                    {selectedProject.endDate && (
                                        <div style={{ fontSize: '0.65rem', fontWeight: '800', color: (new Date(selectedProject.endDate) - new Date()) > 0 ? 'var(--accent-color)' : 'var(--danger)', marginLeft: '0.5rem', background: (new Date(selectedProject.endDate) - new Date()) > 0 ? 'rgba(102,178,194,0.1)' : 'rgba(255,69,58,0.1)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                                            {(() => {
                                                const diff = new Date(selectedProject.endDate) - new Date();
                                                const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                                                return days > 0 ? `${days}d` : (days === 0 ? 'Due' : `${Math.abs(days)}d!`);
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Card: Pending Action Items & Vendor Updates */}
                    {(() => {
                        const pendingUpdates = (selectedProject.vendorUpdates || []).filter(u => u.status === 'pending_approval');
                        return (
                            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '1rem' }}>⚠️</span>
                                        <h4 style={{ margin: 0, color: 'var(--accent-color)', fontSize: '0.9rem', letterSpacing: '0.05em', fontWeight: '800' }}>PENDING ACTION ITEMS</h4>
                                    </div>
                                    <span style={{ fontSize: '0.65rem', background: pendingUpdates.length > 0 ? 'rgba(255,69,58,0.1)' : 'rgba(50,215,75,0.1)', color: pendingUpdates.length > 0 ? 'var(--danger)' : 'var(--success)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontWeight: '800' }}>
                                        {pendingUpdates.length} ITEMS REQUIRING APPROVAL
                                    </span>
                                </div>
                                
                                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '380px' }}>
                                    {pendingUpdates.length > 0 ? (
                                        pendingUpdates.map(upd => (
                                            <div key={upd.id} style={{ background: 'var(--bg-accent)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '0.7rem', color: upd.severity !== 'Low' ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                                                        {upd.type === 'risk' ? `RISK FLAG: ${upd.severity}` : 'FIELD UPDATE'}
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                                                        {upd.note || "⚠️ [No description provided]"}
                                                    </div>
                                                    {upd.media && upd.media.length > 0 && (
                                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem', flexWrap: 'wrap' }}>
                                                            {upd.media.map((img, idx) => (
                                                                <img 
                                                                    key={idx} 
                                                                    src={img} 
                                                                    style={{ width: '60px', height: '60px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border-color)' }} 
                                                                    alt="pending-vendor-media" 
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>{new Date(upd.date).toLocaleString()}</div>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
                                                    <button onClick={() => {
                                                        const newUpdates = selectedProject.vendorUpdates.map(u => u.id === upd.id ? { ...u, status: 'approved' } : u);
                                                        const newHistory = [
                                                            ...(selectedProject.history || []),
                                                            {
                                                                id: Date.now(),
                                                                type: upd.type === 'risk' ? 'warning' : 'success',
                                                                title: upd.type === 'risk' ? `Approved Vendor Risk: ${upd.severity}` : 'Approved Site Update',
                                                                detail: `${upd.note}${upd.media && upd.media.length > 0 ? ` (Attached ${upd.media.length} photos)` : ''}`,
                                                                timestamp: new Date().toISOString(),
                                                                isClientVisible: true
                                                            }
                                                        ];
                                                        const currentStage = selectedProject.stageIndex !== undefined ? selectedProject.stageIndex : 1;
                                                        const nextStage = Math.min(9, currentStage + 1);
                                                        onUpdateValue(selectedProject.id, { 
                                                            vendorUpdates: newUpdates,
                                                            history: newHistory,
                                                            stageIndex: nextStage
                                                        });
                                                    }} style={{ background: 'var(--accent-color)', border: 'none', color: '#000', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800', cursor: 'pointer' }}>Approve</button>
                                                    
                                                    <button onClick={() => {
                                                        const newUpdates = selectedProject.vendorUpdates.map(u => u.id === upd.id ? { ...u, status: 'rejected' } : u);
                                                        const newHistory = [
                                                            ...(selectedProject.history || []),
                                                            {
                                                                id: Date.now(),
                                                                type: 'danger',
                                                                title: 'Rejected Vendor Submission',
                                                                detail: `Rejected update: "${upd.note}"`,
                                                                timestamp: new Date().toISOString(),
                                                                isClientVisible: false
                                                            }
                                                        ];
                                                        onUpdateValue(selectedProject.id, { 
                                                            vendorUpdates: newUpdates,
                                                            history: newHistory
                                                        });
                                                    }} style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', color: 'var(--danger)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer' }}>Reject</button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                                            <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</span>
                                            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>ALL UPDATES NOMINAL</p>
                                            <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>No outstanding updates require physical approval or risk triage.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* SECTION 2: Technical Audit Vault (Left) & AI Site Intelligence & Bench Suggestions (Right) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }} className="stack-on-mobile">
                    {/* Left Card: Technical Audit Vault */}
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>📑</span>
                                <h4 style={{ margin: 0, color: 'var(--accent-color)', fontSize: '0.9rem', letterSpacing: '0.1em' }}>TECHNICAL AUDIT VAULT</h4>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', background: 'var(--bg-accent)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                                    {(selectedProject.auditHistory || []).length} SECURED
                                </span>
                                <button 
                                    onClick={() => setIsLinkAuditModalOpen(true)}
                                    style={{ background: 'rgba(102, 178, 194, 0.1)', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.6rem', fontWeight: '800', cursor: 'pointer' }}
                                >
                                    🔗 LINK PAST AUDIT
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto', maxHeight: '350px' }}>
                            {(selectedProject.auditHistory || []).length > 0 ? (
                                selectedProject.auditHistory.map(audit => (
                                    <div key={audit.auditId} style={{ background: 'var(--bg-accent)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>{audit.auditId}</div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                                {formatDate(audit.timestamp)} • {audit.readinessScore}% READINESS
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => onViewAudit?.(audit)}
                                            style={{ background: 'var(--accent-color)', border: 'none', borderRadius: '4px', padding: '0.4rem 0.8rem', fontSize: '0.65rem', fontWeight: '800', cursor: 'pointer', color: '#000' }}
                                        >
                                            REVIEW REPORT
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', color: 'var(--text-secondary)', fontSize: '0.75rem', fontStyle: 'italic', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                                    <span>📭</span>
                                    <p style={{ margin: '0.5rem 0 0 0' }}>No technical audits have been submitted for this project yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Card: AI Site Intelligence & Bench Suggestions */}
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1rem' }}>🧠</span>
                                <h4 style={{ margin: 0, color: 'var(--accent-color)', fontSize: '0.9rem', letterSpacing: '0.05em', fontWeight: '800' }}>AI SITE INTELLIGENCE & SUGGESTIONS</h4>
                            </div>
                        </div>
                        
                        {/* AI Risk Prediction & Insights */}
                        <div style={{ background: 'rgba(102, 178, 194, 0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-accent)' }}>
                            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: '1.5rem' }}>🤖</span>
                                <div>
                                    <p style={{ fontSize: '0.75rem', fontWeight: '800', margin: 0, color: 'var(--accent-color)' }}>SITE DIAGNOSTIC MATRIX</p>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '0.3rem 0 0 0', lineHeight: '1.4' }}>
                                        {linkedVendor ? (
                                            `Execution is currently at Stage ${selectedProject.stageIndex !== undefined ? selectedProject.stageIndex : 1} (${STAGES[selectedProject.stageIndex !== undefined ? selectedProject.stageIndex : 1] || 'Verification'}). AI predicts a 94% timeline delivery score. Site Readiness checks are nominal.`
                                        ) : (
                                            "No execution partner is currently assigned. Critical path is compromised. Please authorize and assign a recommended technical deployment partner from the bench suggestions below."
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Vendor Bench Suggestions / Partner Performance */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            {!linkedVendor ? (
                                <div>
                                    <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '0.8rem' }}>💡 Recommended Partners (Bench Rank)</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                        {recommendations.slice(0, 2).map(rec => (
                                            <div key={rec.id} style={{ background: 'var(--bg-accent)', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <p style={{ margin: 0, fontWeight: '800', fontSize: '0.75rem' }}>{rec.name}</p>
                                                        <span style={{ fontSize: '0.55rem', background: 'var(--accent-color)', color: '#000', padding: '0.1rem 0.3rem', borderRadius: '3px', fontWeight: '900' }}>{rec.miScore}%</span>
                                                    </div>
                                                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.6rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{rec.reason}"</p>
                                                </div>
                                                <button 
                                                    onClick={() => handleQuickAssign(rec.id)}
                                                    style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid var(--accent-color)', background: 'none', color: 'var(--accent-color)', fontSize: '0.65rem', fontWeight: '700', cursor: 'pointer' }}
                                                >
                                                    Assign
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '0.8rem' }}>⚡ Active Partner Performance Index</p>
                                    <div style={{ background: 'var(--bg-accent)', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: '800', fontSize: '0.8rem' }}>{linkedVendor.name}</p>
                                            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Compliance: 100% Valid MSA • Payout Triage: Nominal</p>
                                        </div>
                                        <span style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--success)', background: 'rgba(50,215,75,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>NOMINAL</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* SECTION 3: Project Intelligence Timeline (Left) & AI Financial Strategy (Right) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', marginBottom: '2.5rem' }} className="stack-on-mobile">
                    {/* Left Card: Project Intelligence Timeline */}
                    <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '16px' }}>
                        <h4 style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>🔍 Project Intelligence Timeline</h4>
                        
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
                            <textarea 
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Add a tactical note, site update, or risk warning..."
                                style={{ flex: 1, background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem', color: 'var(--text-primary)', fontSize: '0.85rem', minHeight: '80px' }}
                            />
                            <button 
                                disabled={!noteText.trim()}
                                onClick={() => { onAddNote(selectedProject.id, noteText); setNoteText(''); }}
                                className="btn btn-primary" 
                                style={{ height: 'fit-content', padding: '0.8rem 1.5rem', fontSize: '0.8rem' }}
                            >Post</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '100px' }}>
                            {(() => {
                                const history = (selectedProject.history || []).slice().reverse();
                                const visibleHistory = showAllHistory ? history : history.slice(0, 5);
                                return (
                                    <>
                                        {visibleHistory.map((h, i) => (
                                            <div key={h.id} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: h.type === 'success' ? 'var(--success)' : (h.type === 'warning' || h.type === 'danger' ? 'var(--danger)' : (h.type === 'info' ? 'var(--accent-color)' : (h.type === 'note' ? 'var(--text-primary)' : 'var(--text-secondary)'))), marginTop: '4px', zIndex: 2 }} />
                                                {i < visibleHistory.length - 1 && <div style={{ position: 'absolute', left: '4px', top: '15px', bottom: '-20px', width: '2px', background: 'var(--border-color)' }} />}
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                            <p style={{ margin: 0, fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{h.title}</p>
                                                            {['note', 'success', 'warning', 'danger'].includes(h.type) && (
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); onToggleVisibility(selectedProject.id, h.id); }}
                                                                    title={h.isClientVisible ? "Visible to Client" : "Internal Only"}
                                                                    style={{ 
                                                                        background: h.isClientVisible ? 'rgba(50, 215, 75, 0.1)' : 'var(--bg-accent)', 
                                                                        border: `1px solid ${h.isClientVisible ? 'var(--success)' : 'var(--border-color)'}`,
                                                                        borderRadius: '4px', padding: '0.1rem 0.3rem', fontSize: '0.6rem', color: h.isClientVisible ? 'var(--success)' : 'var(--text-secondary)', cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    {h.isClientVisible ? '👁️ PUSHED' : '👁️ PUSH'}
                                                                </button>
                                                            )}
                                                        </div>
                                                        <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>{formatDateTime(h.timestamp || h.date)}</span>
                                                    </div>
                                                    <p style={{ margin: '0.2rem 0', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{h.detail}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {history.length > 5 && (
                                            <button 
                                                onClick={() => setShowAllHistory(!showAllHistory)}
                                                style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '0.7rem', fontWeight: '800', cursor: 'pointer', alignSelf: 'center', padding: '1rem' }}
                                            >
                                                {showAllHistory ? 'SEE LESS ↑' : `SEE ALL ${history.length} ENTRIES ↓`}
                                            </button>
                                        )}
                                    </>
                                )
                            })()}
                        </div>
                    </div>

                    {/* Right Card: AI Financial Strategy */}
                    <div className="card" style={{ background: 'linear-gradient(135deg, rgba(102, 178, 194, 0.08) 0%, transparent 100%)', border: '1px solid var(--accent-color)', padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.2rem', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>🤖</span>
                            <h4 style={{ margin: 0, fontSize: '0.75rem', color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>AI Financial Strategy</h4>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            This project maintains a robust health-margin of <strong>{pl.margin.toFixed(1)}%</strong>. 
                            AI identified <b>₹{(pl.cogs * 0.05 / 100000).toFixed(2)}L</b> in potential COGS optimization opportunities via specialized partner triage.
                        </p>
                    </div>
                </div>
                {/* PROJECT SIGN-OFF WORKFLOW */}
            </div>
        ) : activeSubTab === 'financials' ? (
            <div className="animate-fade-in">
                <div className="grid-responsive" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginBottom: '2rem' }}>
                    <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', gridColumn: '1 / -1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Project Financial Ledger</h3>
                            <div style={{ padding: '0.3rem 0.8rem', background: 'rgba(50, 215, 75, 0.1)', borderRadius: '20px', color: 'var(--success)', fontSize: '0.6rem', fontWeight: '800' }}>AUDIT READY</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.2rem' }}>
                            <div style={{ borderLeft: '3px solid var(--accent-color)', paddingLeft: '1rem' }}>
                                <p style={{ margin: 0, fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Project Value</p>
                                <p style={{ margin: '0.2rem 0 0 0', fontSize: '1.2rem', fontWeight: '800' }}>₹{(pl.revenue / 100000).toFixed(2)}L</p>
                            </div>
                            <div style={{ borderLeft: '3px solid var(--danger)', paddingLeft: '1rem' }}>
                                <p style={{ margin: 0, fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>COGS</p>
                                <p style={{ margin: '0.2rem 0 0 0', fontSize: '1.2rem', fontWeight: '800', color: 'var(--danger)' }}>₹{(pl.cogs / 100000).toFixed(2)}L</p>
                            </div>
                            <div style={{ borderLeft: '3px solid var(--text-secondary)', paddingLeft: '1rem' }}>
                                <p style={{ margin: 0, fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Expenses</p>
                                <p style={{ margin: '0.2rem 0 0 0', fontSize: '1.2rem', fontWeight: '800' }}>₹{(pl.expenses / 100000).toFixed(2)}L</p>
                            </div>
                            <div style={{ borderLeft: '3px solid var(--success)', paddingLeft: '1rem' }}>
                                <p style={{ margin: 0, fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Net Project Profit</p>
                                <p style={{ margin: '0.2rem 0 0 0', fontSize: '1.2rem', fontWeight: '800', color: 'var(--success)' }}>₹{(pl.profit / 100000).toFixed(2)}L</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 1: Client Payment Tracking */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: 0, color: 'var(--success)', fontSize: '0.9rem' }}>📥 Receipts</h4>
                            <button onClick={() => setIsPaymentModalOpen(true)} style={{ background: 'var(--success)', color: '#000', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', fontSize: '0.65rem', fontWeight: '800', cursor: 'pointer' }}>+ Log</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {(selectedProject.clientFinancials?.received || []).map(p => (
                                <div key={p.id} style={{ padding: '0.8rem', background: 'var(--bg-accent)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                        <span style={{ fontWeight: '800', color: 'var(--success)', fontSize: '0.85rem' }}>+ ₹{p.amount.toLocaleString('en-IN')}</span>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{formatDate(p.date)}</span>
                                    </div>
                                    {(p.gstAmount > 0 || (p.baseAmount && p.baseAmount !== p.amount)) && (
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'flex', gap: '0.5rem', opacity: 0.85 }}>
                                            <span>Base: <span style={{ color: 'var(--success)', fontWeight: '600' }}>₹{Math.round(p.baseAmount).toLocaleString('en-IN')}</span></span>
                                            <span>•</span>
                                            <span>GST: <span style={{ color: 'var(--accent-color)', fontWeight: '600' }}>₹{Math.round(p.gstAmount).toLocaleString('en-IN')}</span></span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Ref: {p.ref}</span>
                                        {((Array.isArray(p.photos) && p.photos.length > 0) || p.photo) && (
                                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                {p.photo && (!Array.isArray(p.photos) || p.photos.length === 0) && (
                                                    <button 
                                                        onClick={() => isPdf(p.photo) ? openAttachmentWindow(p.photo) : openImageWindow(p.photo)} 
                                                        style={{ background: isPdf(p.photo) ? 'rgba(255,149,0,0.1)' : 'rgba(102,178,194,0.1)', border: '1px solid ' + (isPdf(p.photo) ? 'rgba(255,149,0,0.6)' : 'var(--accent-color)'), borderRadius: '4px', color: isPdf(p.photo) ? '#ff9500' : 'var(--accent-color)', padding: '0.2rem 0.5rem', fontSize: '0.6rem', cursor: 'pointer', fontWeight: '800' }}
                                                    >
                                                        {isPdf(p.photo) ? '📄 PDF' : 'Evidence 📎'}
                                                    </button>
                                                )}
                                                {(Array.isArray(p.photos) ? p.photos : []).map((att, idx) => (
                                                    <button 
                                                        key={idx}
                                                        onClick={() => isPdf(att) ? openAttachmentWindow(att) : openImageWindow(att)} 
                                                        style={{ background: isPdf(att) ? 'rgba(255,149,0,0.1)' : 'rgba(102,178,194,0.1)', border: '1px solid ' + (isPdf(att) ? 'rgba(255,149,0,0.6)' : 'var(--accent-color)'), borderRadius: '4px', color: isPdf(att) ? '#ff9500' : 'var(--accent-color)', padding: '0.2rem 0.5rem', fontSize: '0.6rem', cursor: 'pointer', fontWeight: '800' }}
                                                    >
                                                        {isPdf(att) ? `📄 PDF ${idx + 1}` : `📎 Img ${idx + 1}`}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 2: Vendor Payout Tracking */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: 0, color: 'var(--danger)', fontSize: '0.9rem' }}>📤 Payouts</h4>
                            <button onClick={() => setIsPayoutModalOpen(true)} style={{ background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', fontSize: '0.65rem', fontWeight: '800', cursor: 'pointer' }}>+ Log</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {(selectedProject.payouts || []).map(p => {
                                const vendor = vendors.find(v => String(v.id) === String(p.vendorId))
                                return (
                                    <div key={p.id} style={{ padding: '0.8rem', background: 'var(--bg-accent)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                            <span style={{ fontWeight: '800', color: 'var(--danger)', fontSize: '0.85rem' }}>- ₹{p.amount.toLocaleString('en-IN')}</span>
                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{formatDate(p.date)}</span>
                                        </div>
                                        {(p.gstAmount > 0 || (p.baseAmount && p.baseAmount !== p.amount)) && (
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'flex', gap: '0.5rem', opacity: 0.85 }}>
                                                <span>Base: <span style={{ color: 'var(--success)', fontWeight: '600' }}>₹{Math.round(p.baseAmount).toLocaleString('en-IN')}</span></span>
                                                <span>•</span>
                                                <span>GST: <span style={{ color: 'var(--accent-color)', fontWeight: '600' }}>₹{Math.round(p.gstAmount).toLocaleString('en-IN')}</span></span>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            {vendor ? (
                                                <div 
                                                    onClick={() => { window.navigateToVendorBench?.(vendor.id); }}
                                                    style={{ fontSize: '0.85rem', color: 'var(--accent-color)', cursor: 'pointer', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                                >
                                                    <span>To: {vendor.name}</span>
                                                    <span style={{ fontSize: '0.6rem' }}>↗</span>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>To: Unknown Partner</span>
                                            )}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
                                                <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', opacity: 0.6 }}>Transaction Ref: {p.ref}</span>
                                                {((Array.isArray(p.photos) && p.photos.length > 0) || p.photo) && (
                                                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                        {p.photo && (!Array.isArray(p.photos) || p.photos.length === 0) && (
                                                            <button 
                                                                onClick={() => isPdf(p.photo) ? openAttachmentWindow(p.photo) : openImageWindow(p.photo)} 
                                                                style={{ background: isPdf(p.photo) ? 'rgba(255,149,0,0.1)' : 'rgba(102,178,194,0.1)', border: '1px solid ' + (isPdf(p.photo) ? 'rgba(255,149,0,0.6)' : 'var(--accent-color)'), borderRadius: '4px', color: isPdf(p.photo) ? '#ff9500' : 'var(--accent-color)', padding: '0.2rem 0.5rem', fontSize: '0.6rem', cursor: 'pointer', fontWeight: '800' }}
                                                            >
                                                                {isPdf(p.photo) ? '📄 PDF' : 'Evidence 📎'}
                                                            </button>
                                                        )}
                                                        {(Array.isArray(p.photos) ? p.photos : []).map((att, idx) => (
                                                            <button 
                                                                key={idx}
                                                                onClick={() => isPdf(att) ? openAttachmentWindow(att) : openImageWindow(att)} 
                                                                style={{ background: isPdf(att) ? 'rgba(255,149,0,0.1)' : 'rgba(102,178,194,0.1)', border: '1px solid ' + (isPdf(att) ? 'rgba(255,149,0,0.6)' : 'var(--accent-color)'), borderRadius: '4px', color: isPdf(att) ? '#ff9500' : 'var(--accent-color)', padding: '0.2rem 0.5rem', fontSize: '0.6rem', cursor: 'pointer', fontWeight: '800' }}
                                                            >
                                                                {isPdf(att) ? `📄 PDF ${idx + 1}` : `📎 Img ${idx + 1}`}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        ) : activeSubTab === 'handover' ? (
            <div className="animate-fade-in">
                {/* Hidden PDF Templates */}
                <HandoverPdfTemplate handover={currentHandoverForPdf} project={selectedProject} />
                <FeedbackPdfTemplate handover={currentHandoverForPdf} project={selectedProject} />

                {/* TOP CONTROL BAR */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900' }}>Project Handover & Closure Engine</h3>
                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Manage digital project closure, recipient links, signatures, and closure archive.
                        </p>
                    </div>
                    <button 
                        onClick={() => setIsInitiatingHandover(true)}
                        className="btn btn-primary"
                        style={{ padding: '0.6rem 1.2rem', fontSize: '0.8rem', fontWeight: '800' }}
                    >
                        ➕ INITIATE NEW HANDOVER
                    </button>
                </div>

                {/* ACTIVE / LATEST HANDOVER CARD */}
                {(() => {
                    const handovers = selectedProject.handovers || [];
                    const activeHandover = handovers.find(h => h.status !== 'VOIDED') || handovers[0];
                    if (!activeHandover) {
                        return (
                            <div className="card" style={{ background: 'var(--bg-secondary)', padding: '2rem', textAlign: 'center', borderRadius: '12px', border: '1px dashed var(--border-color)', marginBottom: '2rem' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📜</div>
                                <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '1rem', fontWeight: '800' }}>No Active Handover Initialized</h4>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>
                                    Initiate a digital handover to generate a secure recipient link and capture closure signatures.
                                </p>
                                <button onClick={() => setIsInitiatingHandover(true)} className="btn btn-primary" style={{ fontSize: '0.8rem' }}>
                                    ➕ Create Handover Link
                                </button>
                            </div>
                        );
                    }

                    const payloadObj = {
                        h: activeHandover,
                        p: {
                            id: String(selectedProject.id),
                            name: selectedProject.name,
                            clientName: selectedProject.clientName || 'N/A',
                            address: selectedProject.address || 'N/A',
                            scope: selectedProject.scope || selectedProject.description || 'Execution & Installation Works'
                        }
                    };
                    let b64Data = '';
                    try { b64Data = btoa(encodeURIComponent(JSON.stringify(payloadObj))); } catch (e) {}

                    const base = (window.location.origin + window.location.pathname).replace(/\/$/, '');
                    const magicLink = b64Data 
                        ? `${base}?view=handover&token=${activeHandover.token}&d=${b64Data}`
                        : `${base}?view=handover&token=${activeHandover.token}`;
                    const isCompleted = activeHandover.status === 'COMPLETED';
                    const isVoided = activeHandover.status === 'VOIDED';

                    return (
                        <div className="card" style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.2rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.4rem' }}>
                                        <span style={{
                                            padding: '0.2rem 0.8rem',
                                            borderRadius: '20px',
                                            fontSize: '0.65rem',
                                            fontWeight: '900',
                                            background: isCompleted ? 'rgba(50,215,75,0.15)' : (isVoided ? 'rgba(255,69,58,0.15)' : 'rgba(102,178,194,0.15)'),
                                            color: isCompleted ? 'var(--success)' : (isVoided ? 'var(--danger)' : 'var(--accent-color)'),
                                            border: '1px solid ' + (isCompleted ? 'rgba(50,215,75,0.3)' : (isVoided ? 'rgba(255,69,58,0.3)' : 'rgba(102,178,194,0.3)'))
                                        }}>
                                            STATUS: {activeHandover.status} (v{activeHandover.version || 1}.0)
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {activeHandover.id}</span>
                                    </div>
                                    <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>
                                        Recipient: {activeHandover.recipientName} ({activeHandover.recipientType})
                                    </h4>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                        Phone: {activeHandover.recipientPhone || 'N/A'} | Email: {activeHandover.recipientEmail || 'N/A'}
                                    </div>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Created On</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '800' }}>{new Date(activeHandover.createdAt).toLocaleDateString('en-IN')}</div>
                                </div>
                            </div>

                            {/* TOGGLES & STATUS STRIP */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem', background: 'var(--bg-accent)', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.2rem', fontSize: '0.75rem' }}>
                                <div><span style={{ color: 'var(--text-secondary)' }}>Feedback Mode:</span> <strong>{activeHandover.feedbackEnabled ? '⭐ ON' : 'OFF'}</strong></div>
                                <div><span style={{ color: 'var(--text-secondary)' }}>Google Review:</span> <strong>{activeHandover.googleReviewEnabled ? '🌐 ON' : 'OFF'}</strong></div>
                                <div><span style={{ color: 'var(--text-secondary)' }}>Rating Captured:</span> <strong>{activeHandover.feedbackData ? `${activeHandover.feedbackData.overallScore} / 5 Stars` : 'N/A'}</strong></div>
                            </div>

                            {/* ACTIONS STRIP */}
                            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                                {isCompleted ? (
                                    <>
                                        <button onClick={() => handleDownloadHandoverPdf(activeHandover)} className="btn btn-primary" style={{ fontSize: '0.75rem' }}>
                                            📄 Download Handover Certificate PDF
                                        </button>
                                        {activeHandover.feedbackData && (
                                            <button onClick={() => handleDownloadFeedbackPdf(activeHandover)} className="btn btn-outline" style={{ fontSize: '0.75rem' }}>
                                                ⭐ Download Feedback Report PDF
                                            </button>
                                        )}
                                        <button onClick={() => handleDeleteAndCreateNew(activeHandover)} className="btn btn-outline" style={{ fontSize: '0.75rem', color: 'var(--accent-color)', borderColor: 'var(--accent-color)' }}>
                                            🔄 Delete & Create New Link
                                        </button>
                                        <button onClick={() => handleDeleteHandover(activeHandover)} className="btn btn-outline" style={{ fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'rgba(255,69,58,0.4)' }}>
                                            🔴 Void / Deactivate Link
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => { navigator.clipboard.writeText(magicLink); alert('Link copied to clipboard!'); }} className="btn btn-outline" style={{ fontSize: '0.75rem' }}>
                                            📋 Copy Secure Link
                                        </button>
                                        <button onClick={() => {
                                            const text = `Hi ${activeHandover.recipientName}!\n\nThe handover process for project *${selectedProject.name}* is ready.\n\nPlease complete here:\n${magicLink}`;
                                            window.open(`https://wa.me/${(activeHandover.recipientPhone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
                                        }} className="btn btn-primary" style={{ fontSize: '0.75rem', background: '#25D366', borderColor: '#25D366', color: '#000' }}>
                                            📱 Send via WhatsApp
                                        </button>
                                        <button onClick={() => handleRegenerateLink(activeHandover)} className="btn btn-outline" style={{ fontSize: '0.75rem' }}>
                                            ⏳ Regenerate Link (7 Days)
                                        </button>
                                        <button onClick={() => handleDeleteAndCreateNew(activeHandover)} className="btn btn-outline" style={{ fontSize: '0.75rem', color: 'var(--accent-color)', borderColor: 'var(--accent-color)' }}>
                                            🔄 Delete & Create New Link
                                        </button>
                                        <button onClick={() => handleDeleteHandover(activeHandover)} className="btn btn-outline" style={{ fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'rgba(255,69,58,0.4)' }}>
                                            🗑️ Delete Link
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {/* CLOSURE HISTORY ARCHIVE */}
                <div className="card" style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '800', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
                        📜 Project Closure History Archive
                    </h4>

                    {(selectedProject.handovers || []).length === 0 ? (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            No closure history logged for this project yet.
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-accent)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                    <th style={{ padding: '0.6rem', textAlign: 'left' }}>Ver</th>
                                    <th style={{ padding: '0.6rem', textAlign: 'left' }}>Date</th>
                                    <th style={{ padding: '0.6rem', textAlign: 'left' }}>Signer Name</th>
                                    <th style={{ padding: '0.6rem', textAlign: 'left' }}>Role</th>
                                    <th style={{ padding: '0.6rem', textAlign: 'center' }}>Status</th>
                                    <th style={{ padding: '0.6rem', textAlign: 'center' }}>Rating</th>
                                    <th style={{ padding: '0.6rem', textAlign: 'right' }}>Document Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(selectedProject.handovers || []).map((ho, i) => (
                                    <tr key={ho.id || i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '0.6rem', fontWeight: '800' }}>v{ho.version || 1}.0</td>
                                        <td style={{ padding: '0.6rem' }}>{new Date(ho.createdAt).toLocaleDateString('en-IN')}</td>
                                        <td style={{ padding: '0.6rem', fontWeight: '700' }}>{ho.recipientName}</td>
                                        <td style={{ padding: '0.6rem' }}>{ho.recipientType}</td>
                                        <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '0.1rem 0.5rem',
                                                borderRadius: '10px',
                                                fontSize: '0.6rem',
                                                fontWeight: '800',
                                                background: ho.status === 'COMPLETED' ? 'rgba(50,215,75,0.15)' : (ho.status === 'VOIDED' ? 'rgba(255,69,58,0.15)' : 'rgba(102,178,194,0.15)'),
                                                color: ho.status === 'COMPLETED' ? 'var(--success)' : (ho.status === 'VOIDED' ? 'var(--danger)' : 'var(--accent-color)')
                                            }}>
                                                {ho.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                                            {ho.feedbackData ? `⭐ ${ho.feedbackData.overallScore}/5` : '-'}
                                        </td>
                                        <td style={{ padding: '0.6rem', textAlign: 'right', display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleDownloadHandoverPdf(ho)} className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem' }}>
                                                📄 Download PDF
                                            </button>
                                            {ho.status !== 'VOIDED' && (
                                                <button onClick={() => handleDeleteHandover(ho)} className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', color: 'var(--danger)', borderColor: 'rgba(255,69,58,0.4)' }}>
                                                    🗑️ Void
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

            </div>
        ) : (
            <ProjectExecutionTab
                selectedProject={selectedProject}
                vendors={vendors}
                assignedVendors={assignedVendors}
                onUpdateValue={onUpdateValue}
                formatDate={formatDate}
            />
        )}


        {/* MODALS */}
        {isInitiatingHandover && (
            <ProjectHandoverAdmin 
                project={selectedProject}
                onSaveHandover={handleSaveHandover}
                onClose={() => setIsInitiatingHandover(false)}
            />
        )}
        {isAssignModalOpen && (

            <ModalOverlay>
                <div className="card animate-fade-in" style={{ width: 'clamp(300px, 95%, 450px)', padding: 'clamp(1.5rem, 5vw, 2.5rem)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Assign Partner</h3>
                        <button 
                            onClick={() => setIsRegisteringNew(!isRegisteringNew)}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '0.65rem', fontWeight: '800', cursor: 'pointer' }}
                        >
                            {isRegisteringNew ? '← Bench' : '+ New'}
                        </button>
                    </div>
                    <form onSubmit={(e) => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        let assignedCat = '';
                        let assignedName = '';

                        if (isRegisteringNew) {
                            const newId = Date.now()
                            assignedCat = formData.get('newCategory')
                            assignedName = formData.get('newName')
                            onAddVendor({
                                id: newId,
                                name: assignedName,
                                category: assignedCat,
                                contact: formData.get('newContact'),
                                phone: formData.get('newPhone'),
                                status: 'Vetting',
                                metrics: { price: 50, speed: 50, precision: 50, communication: 50 },
                                contracts: []
                            })
                            onAssignPartner(selectedProject.id, newId, formData.get('orderValue'))
                        } else {
                            const vendor = vendors.find(v => String(v.id) === String(selectedVendorId))
                            assignedCat = vendor?.category || ''
                            assignedName = vendor?.name || ''
                            onAssignPartner(selectedProject.id, selectedVendorId, formData.get('orderValue'))
                        }
                        
                        setIsAssignModalOpen(false)
                        setIsRegisteringNew(false)
                        setSelectedVendorId('')
                        setAssignOrderValue('')

                        // Post-assignment: Check if project lacks Service partner after assigning Materials
                        const currentAssigned = (vendors || []).filter(v => 
                            v && (
                                v.name === selectedProject?.assignedVendor || 
                                (v.contracts || []).some(c => 
                                    (c.projectName || '').toLowerCase().trim() === (selectedProject?.name || '').toLowerCase().trim() && 
                                    (c.status === 'Active' || !c.status)
                                )
                            )
                        )
                        const hasService = currentAssigned.some(v => v.category === 'Service') || (assignedCat === 'Service')
                        const isMaterialsOnly = (assignedCat === 'Materials') && !hasService
                        
                        if (isMaterialsOnly) {
                            setTimeout(() => {
                                const wantsService = window.confirm(
                                    `Warning: You have assigned a Material partner (${assignedName}).\n\nWithout a Service category partner, this project cannot be completed.\n\nWould you like to assign a Service partner from the bench now?`
                                );
                                if (wantsService) {
                                    setServiceOnlyAssign(true)
                                    setIsAssignModalOpen(true)
                                }
                            }, 300);
                        } else {
                            setServiceOnlyAssign(false)
                        }
                    }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {!isRegisteringNew ? (
                            <div>
                                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                                    {serviceOnlyAssign ? "⚠️ SELECT SERVICE PARTNER (STRICTLY REQUIRED)" : "SELECT PARTNER"}
                                </label>
                                <select 
                                    value={selectedVendorId}
                                    onChange={(e) => setSelectedVendorId(e.target.value)}
                                    required
                                    style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: 'var(--text-primary)' }}
                                >
                                    <option value="" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>Choose from bench...</option>
                                    {vendors
                                        .filter(v => v && (!serviceOnlyAssign || v.category === 'Service'))
                                        .map((v, idx) => v && (
                                            <option key={v.id || idx} value={v.id ? v.id.toString() : ''} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                                                {v.name || 'Unnamed Partner'} ({v.category || 'General'})
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>
                        ) : (
                            <>
                                <input name="newName" required placeholder="Company Name" style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                    <select name="newCategory" style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }}>
                                        <option value="Service">Service</option>
                                        <option value="Materials">Materials</option>
                                        <option value="Logistics">Logistics</option>
                                    </select>
                                    <input name="newPhone" required placeholder="Phone" style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }} />
                                </div>
                            </>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Contract Value (INR)</label>
                            <input name="orderValue" type="number" required placeholder="Ex: 1500000" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.8rem' }}>
                            <button type="button" onClick={() => { setIsAssignModalOpen(false); setIsRegisteringNew(false); }} className="btn btn-outline" style={{ flex: 1, fontSize: '0.75rem' }}>Cancel</button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1, fontSize: '0.75rem' }}>Confirm</button>
                        </div>
                    </form>
                </div>
            </ModalOverlay>
        )}

        {isAdjustModalOpen && (
            <ModalOverlay>
                <div className="card animate-fade-in" style={{ width: 'clamp(300px, 95%, 450px)', padding: 'clamp(1.5rem, 5vw, 2.5rem)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '1.1rem' }}>Adjust Operational Costs</h3>
                    <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                        Temporary operational override for missing or incomplete vendor mappings and expenses.
                    </p>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const manualVendorCost = parseMoney(formData.get('manualVendorCost'));
                        const manualDirectExpense = parseMoney(formData.get('manualDirectExpense'));
                        const adjustmentNote = formData.get('adjustmentNote').trim();

                        onUpdateValue(selectedProject.id, {
                            financialAdjustments: {
                                manualVendorCost,
                                manualDirectExpense,
                                adjustmentNote,
                                adjustedBy: userRole || 'Executive Operator',
                                adjustedAt: new Date().toISOString()
                            },
                            lastActivityAt: new Date().toISOString()
                        });
                        setIsAdjustModalOpen(false);
                    }} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div>
                            <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                                Manual Vendor Cost Adjustment (INR)
                            </label>
                            <input 
                                name="manualVendorCost" 
                                type="number" 
                                defaultValue={selectedProject.financialAdjustments?.manualVendorCost || ''} 
                                placeholder="e.g. 50000 or -25000"
                                style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff', fontSize: '0.85rem' }} 
                            />
                            <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'block' }}>
                                Sums directly to calculated vendor COGS. Use negative to offset.
                            </span>
                        </div>

                        <div>
                            <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                                Manual Direct Expense Adjustment (INR)
                            </label>
                            <input 
                                name="manualDirectExpense" 
                                type="number" 
                                defaultValue={selectedProject.financialAdjustments?.manualDirectExpense || ''} 
                                placeholder="e.g. 15000 or -10000"
                                style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff', fontSize: '0.85rem' }} 
                            />
                            <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'block' }}>
                                Sums directly to direct site expenses. Use negative to offset.
                            </span>
                        </div>

                        <div>
                            <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                                Adjustment Note / Rationale
                            </label>
                            <textarea 
                                name="adjustmentNote" 
                                required
                                placeholder="Provide operational reason for auditing trail..."
                                defaultValue={selectedProject.financialAdjustments?.adjustmentNote || ''}
                                style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff', fontSize: '0.85rem', minHeight: '80px', fontFamily: 'inherit' }}
                            />
                        </div>

                        {selectedProject.financialAdjustments?.adjustedBy && (
                            <div style={{ background: 'var(--bg-accent)', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.6rem', color: 'var(--text-secondary)' }}>
                                Last Adjusted By: <strong style={{ color: 'var(--accent-color)' }}>{selectedProject.financialAdjustments.adjustedBy}</strong><br/>
                                Last Adjusted At: <strong>{new Date(selectedProject.financialAdjustments.adjustedAt).toLocaleString()}</strong>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                            <button type="button" onClick={() => setIsAdjustModalOpen(false)} className="btn btn-outline" style={{ flex: 1, fontSize: '0.75rem' }}>Cancel</button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1, fontSize: '0.75rem', fontWeight: '800' }}>Save Adjustment</button>
                        </div>
                    </form>
                </div>
            </ModalOverlay>
        )}

        {isReassignModalOpen && (
            <ModalOverlay>
                <div className="card animate-fade-in" style={{ width: 'clamp(300px, 95%, 450px)', padding: 'clamp(1.5rem, 5vw, 2.5rem)', border: '1px solid var(--danger)' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--danger)', fontSize: '1.1rem' }}>Replace Partner</h3>
                    <form onSubmit={(e) => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        onReassignPartner(selectedProject.id, window.oldVendorIdToReplace || linkedVendor?.id, formData.get('vendorId'), formData.get('orderValue'))
                        setIsReassignModalOpen(false)
                    }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <select name="vendorId" required style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }}>
                            <option value="">Select Replacement...</option>
                            {vendors.filter(v => v && v.id !== (window.oldVendorIdToReplace || linkedVendor?.id)).map((v, idx) => (
                                <option key={v.id || idx} value={v.id ? v.id.toString() : ''}>
                                    {v.name || 'Unnamed Partner'}
                                </option>
                            ))}
                        </select>
                        <input name="orderValue" type="number" required placeholder="New Contract Value" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }} />
                        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.8rem' }}>
                            <button type="button" onClick={() => setIsReassignModalOpen(false)} className="btn btn-outline" style={{ flex: 1, fontSize: '0.75rem' }}>Cancel</button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1, background: 'var(--danger)', color: '#fff', fontSize: '0.75rem' }}>Replace</button>
                        </div>
                    </form>
                </div>
            </ModalOverlay>
        )}

        {isExpenseModalOpen && (
            <ModalOverlay>
                <div className="card animate-fade-in" style={{ width: 'clamp(300px, 95%, 400px)', padding: 'clamp(1.5rem, 5vw, 2.5rem)' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Log Expense</h3>
                    <form onSubmit={(e) => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        onAddExpense(selectedProject.id, {
                            description: formData.get('description'),
                            amount: parseMoney(formData.get('amount')),
                            date: formData.get('date'),
                            type: formData.get('type')
                        })
                        setIsExpenseModalOpen(false)
                    }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input name="description" required placeholder="Description" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }} />
                        <input name="amount" type="number" required placeholder="Amount (INR)" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }} />
                        <select name="type" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }}>
                            <option value="">Select Type (Optional)</option>
                            <option value="Material">Material</option>
                            <option value="Labour">Labour</option>
                            <option value="Transport">Transport</option>
                            <option value="Miscellaneous">Miscellaneous</option>
                            <option value="Refund">Refund</option>
                        </select>
                        <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }} />
                        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
                            <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="btn btn-outline" style={{ flex: 1, fontSize: '0.75rem' }}>Cancel</button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1, fontSize: '0.75rem' }}>Log</button>
                        </div>
                    </form>
                </div>
            </ModalOverlay>
        )}

        {isLinkAuditModalOpen && (
            <ModalOverlay>
                <div className="card animate-fade-in" style={{ width: 'clamp(320px, 95%, 550px)', padding: '2rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--accent-color)' }}>🔗 Link Global Audit Report</h3>
                        <button onClick={() => { setIsLinkAuditModalOpen(false); setAuditSearchQuery(''); }} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                    </div>

                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.2rem', lineHeight: '1.4' }}>
                        Search from all technical audit reports secured across the Meaven Intelligence network and link them to <strong>{selectedProject.name}</strong>.
                    </p>

                    <input 
                        type="text" 
                        placeholder="Search by Audit ID, Project, Client, or Location..."
                        value={auditSearchQuery}
                        onChange={(e) => setAuditSearchQuery(e.target.value)}
                        style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff', fontSize: '0.85rem', marginBottom: '1.5rem', outline: 'none' }}
                    />

                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '300px', paddingRight: '0.2rem' }}>
                        {(() => {
                            const query = auditSearchQuery.toLowerCase().trim();
                            const filtered = globalAudits.filter(aud => {
                                if (!aud) return false;
                                return (
                                    (aud.auditId || '').toLowerCase().includes(query) ||
                                    (aud.projectInfo?.name || '').toLowerCase().includes(query) ||
                                    (aud.projectInfo?.client || '').toLowerCase().includes(query) ||
                                    (aud.projectInfo?.location || '').toLowerCase().includes(query)
                                );
                            });

                            if (filtered.length === 0) {
                                return (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                        No audit reports match your search query.
                                    </div>
                                );
                            }

                            return filtered.map(aud => {
                                const isAlreadyLinked = (selectedProject.auditHistory || []).some(a => a.auditId === aud.auditId);
                                return (
                                    <div key={aud.auditId} style={{ background: 'var(--bg-accent)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>{aud.auditId}</span>
                                                <span style={{ fontSize: '0.6rem', color: 'var(--accent-color)', background: 'rgba(102,178,194,0.1)', padding: '0.1rem 0.3rem', borderRadius: '3px', fontWeight: '700' }}>{aud.readinessScore}% READINESS</span>
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                                                Project: {aud.projectInfo?.name} • Client: {aud.projectInfo?.client}
                                            </div>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                                                Location: {aud.projectInfo?.location} • Date: {new Date(aud.timestamp).toLocaleDateString()}
                                            </div>
                                        </div>
                                        {isAlreadyLinked ? (
                                            <span style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: '800', background: 'rgba(50,215,75,0.1)', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>LINKED ✓</span>
                                        ) : (
                                            <button 
                                                onClick={() => {
                                                    const updatedAudits = [...(selectedProject.auditHistory || []), aud];
                                                    onUpdateValue(selectedProject.id, { 
                                                        auditHistory: updatedAudits,
                                                        history: [
                                                            ...(selectedProject.history || []),
                                                            {
                                                                id: Date.now(),
                                                                type: 'success',
                                                                title: 'Audit Linked Manually',
                                                                detail: `Technical Audit ${aud.auditId} associated with this project site manually.`,
                                                                timestamp: new Date().toISOString(),
                                                                isClientVisible: true
                                                            }
                                                        ]
                                                    });
                                                    setIsLinkAuditModalOpen(false);
                                                    setAuditSearchQuery('');
                                                    alert(`Audit ${aud.auditId} successfully linked to ${selectedProject.name}!`);
                                                }}
                                                style={{ background: 'var(--accent-color)', border: 'none', borderRadius: '4px', padding: '0.4rem 0.8rem', fontSize: '0.65rem', fontWeight: '800', cursor: 'pointer', color: '#000', flexShrink: 0 }}
                                            >
                                                LINK REPORT
                                            </button>
                                        )}
                                    </div>
                                );
                            });
                        })()}
                    </div>
                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setIsLinkAuditModalOpen(false); setAuditSearchQuery(''); }} className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.5rem 1.5rem' }}>Close</button>
                    </div>
                </div>
            </ModalOverlay>
        )}

        {isPaymentModalOpen && (
            <ModalOverlay>
                <div className="card animate-fade-in" style={{ width: 'clamp(300px, 95%, 450px)', padding: 'clamp(1.5rem, 5vw, 2.5rem)' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem' }}>Log Receipt</h3>
                    <form onSubmit={(e) => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        const baseCalculated = receiptGstRate === 0 ? receiptAmountReceived : (receiptAmountReceived / (1 + receiptGstRate / 100))
                        const gstCalculated = receiptAmountReceived - baseCalculated
                        onLogPayment(selectedProject.id, receiptAmountReceived, formData.get('ref'), formData.get('date'), paymentScreenshots, formData.get('type'), baseCalculated, gstCalculated)
                        setPaymentScreenshots([])
                        setIsPaymentModalOpen(false)
                    }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem', fontWeight: '600' }}>GST INCLUDED (DROPDOWN)</label>
                            <select 
                                value={receiptGstRate} 
                                onChange={(e) => setReceiptGstRate(Number(e.target.value))}
                                style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }}
                            >
                                <option value={0}>0%</option>
                                <option value={5}>5%</option>
                                <option value={18}>18%</option>
                                <option value={28}>28%</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem', fontWeight: '600' }}>AMOUNT RECEIVED</label>
                            <input 
                                type="number" 
                                step="any" 
                                required 
                                placeholder="Amount Received" 
                                value={receiptAmountReceived || ''} 
                                onChange={(e) => setReceiptAmountReceived(parseMoney(e.target.value))} 
                                style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }} 
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', background: 'rgba(52, 199, 89, 0.1)', border: '1px solid rgba(52, 199, 89, 0.2)', padding: '0.8rem', borderRadius: '8px', marginTop: '0.2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>GST AMOUNT (amount received / {(1 + receiptGstRate / 100).toFixed(2)})</span>
                                <span style={{ fontSize: '0.9rem', color: 'var(--success)', fontWeight: '800' }}>
                                    ₹{(receiptGstRate === 0 ? receiptAmountReceived : (receiptAmountReceived / (1 + receiptGstRate / 100))).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.4rem' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>TAX PORTION (Calculated)</span>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '700' }}>
                                    ₹{(receiptAmountReceived - (receiptGstRate === 0 ? receiptAmountReceived : (receiptAmountReceived / (1 + receiptGstRate / 100)))).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                        <select name="type" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }}>
                            <option value="">Select Type (Optional)</option>
                            <option value="Advance">Advance</option>
                            <option value="Milestone">Milestone</option>
                            <option value="Final">Final</option>
                            <option value="Miscellaneous">Miscellaneous</option>
                        </select>
                        <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }} />
                        <input name="ref" required placeholder="Transaction Ref" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }} />
                        <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>ATTACHMENTS (UP TO 5 — IMAGES OR PDFs, OPTIONAL)</label>
                            <input 
                                type="file" 
                                accept="image/*,application/pdf" 
                                multiple
                                onChange={(e) => {
                                    const files = Array.from(e.target.files).slice(0, 5);
                                    if (files.length === 0) { setPaymentScreenshots([]); return; }
                                    Promise.all(files.map(processFile)).then(results => {
                                        setPaymentScreenshots(results);
                                    });
                                }} 
                                style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }} 
                            />
                            {paymentScreenshots.length > 0 && (
                                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                    {paymentScreenshots.map((scr, idx) => (
                                        <div key={idx} style={{ position: 'relative', borderRadius: '4px', border: '1px solid var(--border-color)', overflow: 'hidden', flexShrink: 0 }}>
                                            {isPdf(scr) ? (
                                                <div style={{ width: '50px', height: '50px', background: 'rgba(255,149,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                                    <span style={{ fontSize: '1.2rem' }}>📄</span>
                                                    <span style={{ fontSize: '0.4rem', color: '#ff9500', fontWeight: '800' }}>PDF</span>
                                                </div>
                                            ) : (
                                                <img src={scr} style={{ width: '50px', height: '50px', objectFit: 'cover', display: 'block' }} />
                                            )}
                                            <button 
                                                type="button" 
                                                onClick={() => setPaymentScreenshots(prev => prev.filter((_, i) => i !== idx))}
                                                style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(255,69,58,0.8)', border: 'none', color: '#fff', fontSize: '0.5rem', borderRadius: '50%', width: '14px', height: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
                            <button type="button" onClick={() => { setIsPaymentModalOpen(false); setPaymentScreenshots([]); }} className="btn btn-outline" style={{ flex: 1, fontSize: '0.75rem' }}>Cancel</button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1, background: 'var(--success)', color: '#000', fontSize: '0.75rem' }}>Confirm</button>
                        </div>
                    </form>
                </div>
            </ModalOverlay>
        )}

        {isPayoutModalOpen && (
            <ModalOverlay>
                <div className="card animate-fade-in" style={{ width: 'clamp(300px, 95%, 450px)', padding: 'clamp(1.5rem, 5vw, 2.5rem)' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem' }}>Log Payout</h3>
                    <form onSubmit={(e) => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        const finalAmount = payoutBase + payoutGst
                        onLogPayout(selectedProject.id, finalAmount, formData.get('ref'), formData.get('date'), payoutScreenshots, formData.get('vendorId'), formData.get('type'), payoutBase, payoutGst)
                        setPayoutScreenshots([])
                        setIsPayoutModalOpen(false)
                    }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <select name="vendorId" required style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }}>
                            <option value="">Select Assigned Vendor...</option>
                            {assignedVendors.map(v => (
                                <option key={v.id} value={v.id}>{v.name} ({v.category})</option>
                            ))}
                            {assignedVendors.length === 0 && (
                                <option value="" disabled>⚠️ No partners assigned to this project yet</option>
                            )}
                        </select>
                        <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem', fontWeight: '600' }}>BASE AMOUNT PAID</label>
                            <input 
                                type="number" 
                                step="any" 
                                required 
                                placeholder="Base Amount Paid (INR)" 
                                value={payoutBase || ''} 
                                onChange={(e) => setPayoutBase(parseMoney(e.target.value))} 
                                style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }} 
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem', fontWeight: '600' }}>GST AMOUNT PAID</label>
                            <input 
                                type="number" 
                                step="any" 
                                required 
                                placeholder="GST Amount Paid (INR)" 
                                value={payoutGst || ''} 
                                onChange={(e) => setPayoutGst(parseMoney(e.target.value))} 
                                style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }} 
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 69, 58, 0.1)', border: '1px solid rgba(255, 69, 58, 0.2)', padding: '0.8rem', borderRadius: '8px', marginTop: '0.2rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>FINAL AMOUNT PAID (AUTO)</span>
                            <span style={{ fontSize: '0.95rem', color: 'var(--danger)', fontWeight: '800' }}>
                                ₹{(payoutBase + payoutGst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <select name="type" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }}>
                            <option value="">Select Type (Optional)</option>
                            <option value="Vendor Advance">Vendor Advance</option>
                            <option value="Material">Material</option>
                            <option value="Labour">Labour</option>
                            <option value="Transport">Transport</option>
                            <option value="Miscellaneous">Miscellaneous</option>
                        </select>
                        <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }} />
                        <input name="ref" required placeholder="Reference" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }} />
                        <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>ATTACHMENTS (UP TO 5 — IMAGES OR PDFs, OPTIONAL)</label>
                            <input 
                                type="file" 
                                accept="image/*,application/pdf" 
                                multiple
                                onChange={(e) => {
                                    const files = Array.from(e.target.files).slice(0, 5);
                                    if (files.length === 0) { setPayoutScreenshots([]); return; }
                                    Promise.all(files.map(processFile)).then(results => {
                                        setPayoutScreenshots(results);
                                    });
                                }} 
                                style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }} 
                            />
                            {payoutScreenshots.length > 0 && (
                                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                    {payoutScreenshots.map((scr, idx) => (
                                        <div key={idx} style={{ position: 'relative', borderRadius: '4px', border: '1px solid var(--border-color)', overflow: 'hidden', flexShrink: 0 }}>
                                            {isPdf(scr) ? (
                                                <div style={{ width: '50px', height: '50px', background: 'rgba(255,149,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                                    <span style={{ fontSize: '1.2rem' }}>📄</span>
                                                    <span style={{ fontSize: '0.4rem', color: '#ff9500', fontWeight: '800' }}>PDF</span>
                                                </div>
                                            ) : (
                                                <img src={scr} style={{ width: '50px', height: '50px', objectFit: 'cover', display: 'block' }} />
                                            )}
                                            <button 
                                                type="button" 
                                                onClick={() => setPayoutScreenshots(prev => prev.filter((_, i) => i !== idx))}
                                                style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(255,69,58,0.8)', border: 'none', color: '#fff', fontSize: '0.5rem', borderRadius: '50%', width: '14px', height: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
                            <button type="button" onClick={() => { setIsPayoutModalOpen(false); setPayoutScreenshots([]); }} className="btn btn-outline" style={{ flex: 1, fontSize: '0.75rem' }}>Cancel</button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1, background: 'var(--danger)', color: '#fff', fontSize: '0.75rem' }}>Confirm</button>
                        </div>
                    </form>
                </div>
            </ModalOverlay>
        )}

        {/* SIGN-OFF EMAIL MODAL */}
        {isSignOffModalOpen && (
            <ModalOverlay>
                <div className="card animate-fade-in" style={{ width: 'clamp(300px, 95%, 600px)', padding: '2.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-color)' }}>Draft Sign-off Authorization</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Recipients</label>
                            <input 
                                value={signOffEmail.to}
                                onChange={(e) => setSignOffEmail({ ...signOffEmail, to: e.target.value })}
                                style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Subject</label>
                            <input 
                                value={signOffEmail.subject}
                                onChange={(e) => setSignOffEmail({ ...signOffEmail, subject: e.target.value })}
                                style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Email Body</span>
                                <span style={{ color: 'var(--success)' }}>📎 Timeline Attached</span>
                            </label>
                            <textarea 
                                value={signOffEmail.body}
                                onChange={(e) => setSignOffEmail({ ...signOffEmail, body: e.target.value })}
                                style={{ width: '100%', height: '250px', padding: '1rem', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', lineHeight: '1.6' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setIsSignOffModalOpen(false)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                            <button 
                                onClick={() => {
                                    onAddNote(selectedProject.id, `Sign-off email sent to: ${signOffEmail.to}`);
                                    alert("Email Sent! (Reminder 1: Awaiting for final sign off - scheduled in 6 hours)");
                                    setIsSignOffModalOpen(false);
                                }}
                                className="btn btn-primary" 
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                🚀 Send Authorization Email
                            </button>
                        </div>
                    </div>
                </div>
            </ModalOverlay>
        )}
      </div>
    )
  }

  return (
    <div className="project-directory-module animate-fade-in">
      <div className="stack-on-mobile" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: 'clamp(1.2rem, 5vw, 1.8rem)', fontWeight: '900', marginBottom: '0.5rem' }}>Execution Financial Hub</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Full lifecycle P&L visibility of all active Meaven sites.</p>
        </div>
        <div style={{ padding: '0.5rem 1.2rem', borderRadius: '20px', background: 'rgba(102, 178, 194, 0.1)', border: '1px solid var(--border-color)', color: 'var(--accent-color)', fontSize: '0.6rem', fontWeight: '900', letterSpacing: '0.15em' }}>
            🏦 STRATEGIC PORTFOLIO HUB
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <input 
          type="text" 
          placeholder="Search by project name or client..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff' }}
        />
        {onInitializeProject && userRole !== 'Client' && (
          <button 
            onClick={onInitializeProject} 
            className="btn btn-primary" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              fontSize: '0.8rem', 
              padding: '0.75rem 1.5rem', 
              fontWeight: '800',
              borderRadius: '8px',
              background: 'var(--accent-color)',
              color: '#000',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            ➕ INITIALIZE PROJECT LOOP
          </button>
        )}
      </div>
      <div className="grid-responsive" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {(filteredProjects || []).map(p => {
          const pl = {
            revenue: getProjectRevenue(p),
            cogs: getProjectCogs(p, vendors),
            expenses: getProjectExpenses(p),
            profit: getProjectProfit(p, vendors),
            margin: getProjectMargin(p, vendors)
          }
          return (
            <div key={p.id} className="card project-card" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem' }} onClick={() => setSelectedProjectId(p.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{p.name || 'Unnamed Project'}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Client: {p.client || 'TBD'}</p>
                    {(p.auditHistory || []).length > 0 && (
                        <span style={{ fontSize: '0.5rem', background: 'rgba(102, 178, 194, 0.15)', color: 'var(--accent-color)', padding: '0.1rem 0.3rem', borderRadius: '4px', fontWeight: '900' }}>
                            {p.auditHistory.length} AUDITS
                        </span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-color)' }}>{pl.margin.toFixed(0)}%</div>
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Margin</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <div>
                    <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Project Revenue</p>
                    <p style={{ margin: 0, fontWeight: '700' }}>₹{(pl.revenue / 100000).toFixed(2)}L</p>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)' }}>View Intelligence →</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProjectDirectory
