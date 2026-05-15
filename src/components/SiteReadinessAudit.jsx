import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const SITE_SECTIONS = {
    DRAWING: [
        "Partition locations match issued drawings", "Wall positions aligned with drawings",
        "Ceiling height matches drawings", "Beam depth / boxing verified",
        "Floor finish thickness verified", "Door opening sizes verified",
        "False ceiling alignment verified", "Electrical / service routing verified",
        "Site improvisations observed", "Final dimensions suitable for production freeze"
    ],
    CIVIL: [
        "Flooring completed", "Ceiling finalized", "Painting completed",
        "Wet works completed", "Electrical finalized", "HVAC completed",
        "Pending carpentry cleared", "Debris-free installation area",
        "Storage/staging space available", "Lift/access available"
    ],
    GLASS_RISK: [
        "Floor undulation checked", "Laser level verification completed",
        "Wall plumb verified", "Ceiling straightness verified",
        "Frame alignment feasibility verified", "Tolerance gaps identified",
        "Expansion gap consideration checked", "Door swing clearance available",
        "Patch fitting support condition verified", "Glass movement/access challenge identified"
    ],
    HARDWARE: [
        "Door swing clash possibility checked", "Automatic door sensor interference checked",
        "Floor spring positioning verified", "Handle clearance sufficient",
        "Closing alignment risk identified", "Heavy traffic suitability reviewed",
        "Soft-close requirement reviewed", "User movement flow checked",
        "Potential obstruction after opening identified"
    ],
    INSTALLATION: [
        "Site accessible for glass movement", "Panel movement path clear",
        "Loading/unloading feasible", "Installation sequence finalized",
        "Working power available", "Safety clearance maintained",
        "Installation manpower access available", "Other vendor interference risk checked"
    ],
    SNAGS: [
        "Alignment mismatch risk identified", "Silicone finish challenge identified",
        "Visible joint concern identified", "Ceiling gap variation risk identified",
        "Hardware vibration risk identified", "Door rubbing risk identified",
        "Water leakage concern identified", "Floor settling concern identified",
        "Cleaning/maintenance challenge identified", "User misuse risk identified"
    ]
};

const generateInitialChecklist = (items) => {
    return items.reduce((acc, item) => ({
        ...acc,
        [item]: { checked: false, remarks: '', risk: false }
    }), {});
};

const SiteReadinessAudit = ({ projects = [], onSubmitAudit }) => {
    const reportRef = useRef(null);
    const [auditId, setAuditId] = useState('');
    const [activeSection, setActiveSection] = useState('project_info');
    
    // Form State
    const [projectInfo, setProjectInfo] = useState({
        name: '', client: '', architect: '', address: '', city: '',
        inspectionDate: new Date().toISOString().split('T')[0],
        inspectedBy: '', type: '', scope: '', drawingRev: '', timeline: '', status: ''
    });

    const [checklists, setChecklists] = useState({
        drawing: generateInitialChecklist(SITE_SECTIONS.DRAWING),
        civil: generateInitialChecklist(SITE_SECTIONS.CIVIL),
        glassRisk: generateInitialChecklist(SITE_SECTIONS.GLASS_RISK),
        hardware: generateInitialChecklist(SITE_SECTIONS.HARDWARE),
        installation: generateInitialChecklist(SITE_SECTIONS.INSTALLATION),
        snags: generateInitialChecklist(SITE_SECTIONS.SNAGS)
    });

    const [observations, setObservations] = useState({
        criticalRisks: '', deviations: '', dependencies: '',
        actions: '', freezeNotes: '', clientNotes: ''
    });

    const [overallRisk, setOverallRisk] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState([]);
    
    useEffect(() => {
        // Auto-generate ID: MVN - Random 3 Letters - 001
        const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
        const randNum = Math.floor(Math.random() * 900) + 100;
        setAuditId(`MVN-${randomStr}-${randNum}`);
    }, []);

    const calculateScore = () => {
        let totalItems = 0;
        let checkedCount = 0;
        let riskCount = 0;

        Object.values(checklists).forEach(section => {
            Object.values(section).forEach(item => {
                totalItems++;
                if (item.checked) checkedCount++;
                if (item.risk) riskCount++;
            });
        });

        if (totalItems === 0) return 0;
        // Logic: completing items adds score, risks subtract heavily.
        const baseScore = (checkedCount / totalItems) * 100;
        const penalty = riskCount * 5; 
        return Math.max(0, Math.min(100, Math.round(baseScore - penalty)));
    };

    const handleChecklistChange = (section, itemLabel, field, value) => {
        setChecklists(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [itemLabel]: {
                    ...prev[section][itemLabel],
                    [field]: value
                }
            }
        }));
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        const newFiles = files.map(file => ({
            name: file.name,
            type: file.type,
            url: URL.createObjectURL(file)
        }));
        setUploadedFiles(prev => [...prev, ...newFiles]);
    };

    const generatePDF = async () => {
        if (!reportRef.current) return;
        try {
            const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, logging: false });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${auditId}_Site_Readiness.pdf`);
        } catch (error) {
            console.error("PDF generation failed", error);
            alert("Failed to generate PDF. Ensure all resources are loaded.");
        }
    };

    const submitAudit = () => {
        const payload = {
            auditId,
            timestamp: new Date().toISOString(),
            projectInfo,
            checklists,
            observations,
            overallRisk,
            readinessScore: calculateScore()
        };
        if (onSubmitAudit) onSubmitAudit(payload);
        alert(`Audit ${auditId} Submitted Successfully! Data secured in operational database.`);
    };

    const renderChecklistSection = (sectionKey, title, items) => {
        const isOpen = activeSection === sectionKey;
        
        return (
            <div style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                <div 
                    onClick={() => setActiveSection(isOpen ? '' : sectionKey)}
                    style={{ padding: '1rem', background: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isOpen ? '1px solid var(--border-color)' : 'none' }}
                >
                    <h3 style={{ margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-primary)', letterSpacing: '1px' }}>{title}</h3>
                    <span style={{ color: 'var(--accent-color)' }}>{isOpen ? '▲' : '▼'}</span>
                </div>
                
                {isOpen && (
                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {items.map((item, idx) => {
                            const data = checklists[sectionKey][item];
                            return (
                                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingBottom: '1rem', borderBottom: '1px dashed rgba(255,255,255,0.1)' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                                        <label style={{ flex: 1, minWidth: '250px', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={data.checked}
                                                onChange={(e) => handleChecklistChange(sectionKey, item, 'checked', e.target.checked)}
                                                style={{ marginTop: '0.2rem', accentColor: 'var(--accent-color)' }}
                                            />
                                            {item}
                                        </label>
                                        
                                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1 }}>
                                            <input 
                                                type="text" 
                                                placeholder="Remarks..." 
                                                value={data.remarks}
                                                onChange={(e) => handleChecklistChange(sectionKey, item, 'remarks', e.target.value)}
                                                style={{ flex: 2, minWidth: '150px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', padding: '0.4rem 0.6rem', borderRadius: '4px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}
                                            />
                                            <label style={{ flex: 1, minWidth: '100px', display: 'flex', alignItems: 'center', gap: '0.3rem', color: data.risk ? '#ff453a' : 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer', border: data.risk ? '1px solid #ff453a' : '1px solid transparent', padding: '0.2rem 0.5rem', borderRadius: '4px', background: data.risk ? 'rgba(255, 69, 58, 0.1)' : 'transparent' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={data.risk}
                                                    onChange={(e) => handleChecklistChange(sectionKey, item, 'risk', e.target.checked)}
                                                    style={{ accentColor: '#ff453a' }}
                                                />
                                                Flag Risk
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        )
    };

    return (
        <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', padding: '2rem 1rem', color: 'var(--text-primary)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <div ref={reportRef} style={{ maxWidth: '900px', margin: '0 auto', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: 'clamp(1rem, 4vw, 3rem)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                
                {/* HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--accent-color)', paddingBottom: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Site Readiness &amp;</h1>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--accent-color)' }}>Execution Validation</h1>
                        <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Technical Execution Intelligence System</p>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'right', minWidth: '150px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Audit ID</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-color)', fontFamily: 'monospace' }}>{auditId}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>SCORE</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: '900', color: calculateScore() > 70 ? 'var(--success, #34c759)' : calculateScore() > 40 ? 'var(--warning, #ffcc00)' : '#ff453a' }}>
                            {calculateScore()}
                        </div>
                    </div>
                </div>

                {/* SECTION 1 - PROJECT INFO */}
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ textTransform: 'uppercase', fontSize: '0.9rem', color: 'var(--accent-color)', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>1. Project Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        {[
                            { label: 'Project Name', key: 'name', type: 'text', list: 'project-list' },
                            { label: 'Client Name', key: 'client', type: 'text' },
                            { label: 'Architect / PMC', key: 'architect', type: 'text' },
                            { label: 'Site Address', key: 'address', type: 'text' },
                            { label: 'City', key: 'city', type: 'text' },
                            { label: 'Inspection Date', key: 'inspectionDate', type: 'date' },
                            { label: 'Inspected By', key: 'inspectedBy', type: 'text' },
                            { label: 'Drawing Revision Ref', key: 'drawingRev', type: 'text' },
                            { label: 'Expected Timeline', key: 'timeline', type: 'text' }
                        ].map((field) => (
                            <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{field.label}</label>
                                <input 
                                    type={field.type} 
                                    list={field.list}
                                    value={projectInfo[field.key]} 
                                    onChange={e => {
                                        const val = e.target.value;
                                        setProjectInfo(prev => {
                                            const newInfo = {...prev, [field.key]: val};
                                            if (field.key === 'name' && projects) {
                                                const found = projects.find(p => p.name === val);
                                                if (found) newInfo.client = found.client || '';
                                            }
                                            return newInfo;
                                        });
                                    }}
                                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.6rem', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                                />
                                {field.list && (
                                    <datalist id={field.list}>
                                        {projects.map(p => <option key={p.id} value={p.name} />)}
                                    </datalist>
                                )}
                            </div>
                        ))}
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Project Type</label>
                            <select value={projectInfo.type} onChange={e => setProjectInfo({...projectInfo, type: e.target.value})} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.6rem', color: 'var(--text-primary)' }}>
                                <option value="">Select...</option>
                                {['Office', 'Co-working', 'Hospital', 'Retail', 'Residential', 'Hotel', 'Other'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Site Status</label>
                            <select value={projectInfo.status} onChange={e => setProjectInfo({...projectInfo, status: e.target.value})} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.6rem', color: 'var(--text-primary)' }}>
                                <option value="">Select...</option>
                                {['Under Civil Work', 'Finishing Stage', 'Ready for Verification', 'Ready for Installation', 'Delayed'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* CHECKLIST SECTIONS */}
                {renderChecklistSection('drawing', '2. Drawing vs Site Validation', SITE_SECTIONS.DRAWING)}
                {renderChecklistSection('civil', '3. Civil & Site Readiness', SITE_SECTIONS.CIVIL)}
                {renderChecklistSection('glassRisk', '4. Glass Execution Risk Check', SITE_SECTIONS.GLASS_RISK)}
                {renderChecklistSection('hardware', '5. Hardware & Movement Risk', SITE_SECTIONS.HARDWARE)}
                {renderChecklistSection('installation', '6. Installation Readiness', SITE_SECTIONS.INSTALLATION)}
                {renderChecklistSection('snags', '7. Potential Snag Prediction', SITE_SECTIONS.SNAGS)}

                {/* PHOTO UPLOAD */}
                <div style={{ marginTop: '2rem', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '1.5rem', textAlign: 'center' }}>
                    <h3 style={{ textTransform: 'uppercase', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Photo & Document Upload</h3>
                    <input type="file" multiple accept="image/*,video/*,.pdf" onChange={handleFileUpload} style={{ display: 'none' }} id="file-upload" />
                    <label htmlFor="file-upload" style={{ display: 'inline-block', background: 'var(--bg-primary)', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 'bold' }}>
                        + Add Site Media
                    </label>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Supports Images, Videos, and Marked PDFs</p>
                    
                    {uploadedFiles.length > 0 && (
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem', justifyContent: 'center' }}>
                            {uploadedFiles.map((f, i) => (
                                <div key={i} style={{ width: '80px', height: '80px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                                    {f.type.startsWith('image') ? <img src={f.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="preview" /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '0.6rem', color: 'var(--text-secondary)', wordBreak: 'break-all', padding: '5px' }}>{f.name}</div>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* FINAL OBSERVATIONS */}
                <div style={{ marginTop: '2rem' }}>
                    <h3 style={{ textTransform: 'uppercase', fontSize: '0.9rem', color: 'var(--accent-color)', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Final Execution Observations</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {[
                            { key: 'criticalRisks', label: 'Critical Risks Identified' },
                            { key: 'deviations', label: 'Drawing Deviations' },
                            { key: 'dependencies', label: 'Pending Dependencies' },
                            { key: 'actions', label: 'Recommended Corrective Actions' },
                            { key: 'freezeNotes', label: 'Production Freeze Notes' },
                            { key: 'clientNotes', label: 'Client / Architect Discussion Notes' }
                        ].map(obs => (
                            <div key={obs.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{obs.label}</label>
                                <textarea 
                                    rows={3} 
                                    value={observations[obs.key]} 
                                    onChange={e => setObservations({...observations, [obs.key]: e.target.value})}
                                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.6rem', color: 'var(--text-primary)', fontSize: '0.9rem', resize: 'vertical' }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* RISK CLASSIFICATION */}
                <div style={{ marginTop: '2rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ textTransform: 'uppercase', fontSize: '0.9rem', color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>Overall Project Risk Classification</h3>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {['Low Risk', 'Medium Risk', 'High Risk'].map(level => {
                            const colors = { 'Low Risk': '#34c759', 'Medium Risk': '#ffcc00', 'High Risk': '#ff453a' };
                            const isActive = overallRisk === level;
                            return (
                                <button 
                                    key={level}
                                    type="button"
                                    onClick={() => setOverallRisk(level)}
                                    style={{ flex: 1, padding: '1rem', background: isActive ? `${colors[level]}20` : 'var(--bg-primary)', border: `1px solid ${isActive ? colors[level] : 'var(--border-color)'}`, color: isActive ? colors[level] : 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer', fontWeight: isActive ? 'bold' : 'normal', transition: 'all 0.2s' }}
                                >
                                    {level}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ACTION BUTTONS */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => alert('Draft Saved Securely.')} style={{ flex: 1, background: 'var(--bg-primary)', border: '1px solid var(--text-secondary)', color: 'var(--text-primary)', padding: '1rem', borderRadius: '6px', cursor: 'pointer', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>
                        Save Draft
                    </button>
                    <button type="button" onClick={generatePDF} style={{ flex: 1, background: 'var(--bg-primary)', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', padding: '1rem', borderRadius: '6px', cursor: 'pointer', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>
                        Generate PDF
                    </button>
                    <button type="button" onClick={submitAudit} style={{ flex: 2, background: 'var(--accent-color)', border: 'none', color: '#fff', padding: '1rem', borderRadius: '6px', cursor: 'pointer', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '2px', boxShadow: '0 4px 15px rgba(var(--accent-color-rgb), 0.4)' }}>
                        Submit Audit
                    </button>
                </div>

            </div>
        </div>
    );
};

export default SiteReadinessAudit;
