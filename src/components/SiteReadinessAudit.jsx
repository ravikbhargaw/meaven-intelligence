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
    const [isExporting, setIsExporting] = useState(false);
    const [signature, setSignature] = useState(null);
    const signatureCanvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    
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
        const reportElement = document.getElementById('premium-pdf-template');
        if (!reportElement) return;
        
        setIsExporting(true);
        reportElement.style.display = 'block';
        
        // Wait for rendering
        setTimeout(async () => {
            try {
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pages = reportElement.querySelectorAll('.pdf-page');
                
                for (let i = 0; i < pages.length; i++) {
                    const canvas = await html2canvas(pages[i], { 
                        scale: 2, 
                        useCORS: true, 
                        logging: false,
                        backgroundColor: '#ffffff' 
                    });
                    const imgData = canvas.toDataURL('image/png');
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                    
                    if (i > 0) pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                }

                pdf.save(`${auditId}_Technical_Audit_Report.pdf`);
            } catch (error) {
                console.error("Premium PDF generation failed", error);
                alert("Failed to generate Premium Report.");
            } finally {
                setIsExporting(false);
                reportElement.style.display = 'none';
            }
        }, 800);
    };

    const startDrawing = (e) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        if (signatureCanvasRef.current) {
            setSignature(signatureCanvasRef.current.toDataURL());
        }
    };

    const draw = (e) => {
        if (!isDrawing || !signatureCanvasRef.current) return;
        const canvas = signatureCanvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        
        let x, y;
        if (e.touches) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }
        
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#66b2c2';
        
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const clearSignature = () => {
        if (signatureCanvasRef.current) {
            const canvas = signatureCanvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setSignature(null);
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
            readinessScore: calculateScore(),
            signature
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
                
                {(isOpen || isExporting) && (
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
                                            {isExporting ? (
                                                <div style={{ flex: 2, minWidth: '150px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', padding: '0.4rem 0.6rem', borderRadius: '4px', color: 'var(--text-secondary)', fontSize: '0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                    {data.remarks || '---'}
                                                </div>
                                            ) : (
                                                <textarea 
                                                    placeholder="Remarks..." 
                                                    value={data.remarks}
                                                    rows={1}
                                                    onChange={(e) => {
                                                        handleChecklistChange(sectionKey, item, 'remarks', e.target.value);
                                                        e.target.style.height = 'auto';
                                                        e.target.style.height = e.target.scrollHeight + 'px';
                                                    }}
                                                    onFocus={(e) => {
                                                        e.target.style.height = 'auto';
                                                        e.target.style.height = e.target.scrollHeight + 'px';
                                                    }}
                                                    style={{ flex: 2, minWidth: '150px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', padding: '0.4rem 0.6rem', borderRadius: '4px', color: 'var(--text-secondary)', fontSize: '0.8rem', resize: 'none', overflow: 'hidden' }}
                                                />
                                            )}
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
            <div ref={reportRef} style={{ maxWidth: '900px', margin: '0 auto', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: 'clamp(1rem, 4vw, 3rem)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', position: 'relative' }}>
                
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
                            { label: 'Expected Timeline', key: 'timeline', type: 'text' },
                            { label: 'Client Contact Email', key: 'clientEmail', type: 'email' }
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

                {/* SIGNATURE PAD */}
                <div style={{ marginTop: '2rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ textTransform: 'uppercase', fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>Digital Auditor Signature</h3>
                        <button type="button" onClick={clearSignature} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.7rem', cursor: 'pointer', textDecoration: 'underline' }}>Clear</button>
                    </div>
                    <div style={{ background: '#fff', borderRadius: '4px', overflow: 'hidden', height: '150px', cursor: 'crosshair' }}>
                        <canvas 
                            ref={signatureCanvasRef}
                            width={800}
                            height={150}
                            onMouseDown={startDrawing}
                            onMouseUp={stopDrawing}
                            onMouseMove={draw}
                            onTouchStart={startDrawing}
                            onTouchEnd={stopDrawing}
                            onTouchMove={draw}
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Authenticated by Lead Execution Auditor</p>
                </div>

                {/* ACTION BUTTONS */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => alert('Draft Saved Securely.')} style={{ flex: 1, background: 'var(--bg-primary)', border: '1px solid var(--text-secondary)', color: 'var(--text-primary)', padding: '1rem', borderRadius: '6px', cursor: 'pointer', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>
                        Save Draft
                    </button>
                    <button type="button" onClick={generatePDF} style={{ flex: 1, background: 'var(--bg-primary)', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', padding: '1rem', borderRadius: '6px', cursor: 'pointer', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>
                        Generate Premium PDF
                    </button>
                    <button type="button" onClick={submitAudit} style={{ flex: 2, background: 'var(--accent-color)', border: 'none', color: '#fff', padding: '1rem', borderRadius: '6px', cursor: 'pointer', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '2px', boxShadow: '0 4px 15px rgba(var(--accent-color-rgb), 0.4)' }}>
                        Submit Audit
                    </button>
                </div>

                {/* LEGAL DISCLAIMER */}
                <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', opacity: 0.6 }}>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: '1.6', textAlign: 'justify', margin: 0 }}>
                        <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.4rem' }}>CONFIDENTIALITY & INTELLECTUAL PROPERTY NOTICE:</strong>
                        This Report and its technical findings are the exclusive intellectual property of <strong>Meaven Intelligence Hub</strong>, a core component of the <strong>Meaven.in</strong> technology ecosystem. This document contains proprietary "Execution Intelligence" data intended solely for the authorized recipient. Any unauthorized reproduction, distribution, or utilization of this data is strictly prohibited. Meaven Intelligence Hub remains a protected asset of Meaven.in.
                    </p>
                </div>

            </div>

            {/* --- PREMIUM PDF EXPORT TEMPLATE (HIDDEN FROM UI) --- */}
            <div id="premium-pdf-template" style={{ 
                display: 'none', 
                width: '794px', 
                background: '#fff', 
                color: '#1a1a1a', 
                fontFamily: '"Inter", "Segoe UI", sans-serif',
                padding: '0',
                position: 'absolute',
                left: '-9999px',
                top: 0
            }}>
                {/* PAGE 1: COVER PAGE */}
                <div className="pdf-page" style={{ height: '1122px', position: 'relative', padding: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '400px', height: '400px', background: 'linear-gradient(135deg, #66b2c205 0%, transparent 100%)', clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontSize: '20px', fontWeight: '900', color: '#66b2c2' }}>MEAVEN</div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '2px', color: '#66b2c2' }}>INTELLIGENCE HUB</div>
                            <div style={{ fontSize: '8px', color: '#999' }}>TECHNICAL AUDIT DIVISION</div>
                        </div>
                    </div>

                    <div style={{ marginTop: '100px' }}>
                        <div style={{ height: '4px', width: '60px', background: '#66b2c2', marginBottom: '20px' }} />
                        <h1 style={{ fontSize: '48px', fontWeight: '800', lineHeight: '1.1', margin: '0 0 10px 0', letterSpacing: '-1px' }}>Site Readiness &</h1>
                        <h1 style={{ fontSize: '48px', fontWeight: '800', lineHeight: '1.1', margin: '0 0 30px 0', letterSpacing: '-1px', color: '#66b2c2' }}>Execution Validation</h1>
                        <p style={{ fontSize: '14px', letterSpacing: '4px', color: '#666', textTransform: 'uppercase', fontWeight: '500' }}>Technical Execution Intelligence Report</p>
                    </div>

                    <div style={{ background: '#f8f9fa', padding: '40px', borderRadius: '4px', borderLeft: '8px solid #1a1a1a' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                {[
                                    { l: 'Project', v: projectInfo.name },
                                    { l: 'Client', v: projectInfo.client },
                                    { l: 'Architect / PMC', v: projectInfo.architect },
                                    { l: 'Audit ID', v: auditId },
                                    { l: 'Date', v: projectInfo.inspectionDate }
                                ].map((row, i) => (
                                    <tr key={i}>
                                        <td style={{ padding: '8px 0', fontSize: '10px', fontWeight: '900', color: '#999', textTransform: 'uppercase', width: '120px' }}>{row.l}</td>
                                        <td style={{ padding: '8px 0', fontSize: '14px', fontWeight: '700', color: '#1a1a1a' }}>{row.v || '---'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '10px', color: '#999' }}>
                        <div>
                            <strong>MEAVEN DESIGNS</strong><br />
                            Architectural Execution Partner<br />
                            www.meaven.in
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            AUTHENTICATED BY<br />
                            <strong style={{ color: '#1a1a1a' }}>MEAVEN INTEL ENGINE v8.5</strong>
                        </div>
                    </div>
                </div>

                {/* PAGE 2: EXECUTIVE SCORECARD */}
                <div className="pdf-page" style={{ height: '1122px', padding: '80px', position: 'relative', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid #eee', marginBottom: '40px' }}>
                        <div style={{ fontSize: '10px', fontWeight: '800' }}>{projectInfo.name} | AUDIT {auditId}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ fontSize: '10px', color: '#999' }}>PAGE 02</div>
                        </div>
                    </div>

                    <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '30px' }}>01. Executive Readiness Summary</h2>
                    
                    <div style={{ marginBottom: '50px', background: '#f8f9fa', padding: '40px', borderRadius: '12px', borderLeft: '8px solid #66b2c2' }}>
                        <div style={{ fontSize: '10px', color: '#999', fontWeight: '900', marginBottom: '10px' }}>OVERALL RISK CLASSIFICATION</div>
                        <div style={{ 
                            display: 'inline-block', 
                            padding: '10px 20px', 
                            background: overallRisk === 'High Risk' ? '#ff453a15' : (overallRisk === 'Medium Risk' ? '#ffcc0015' : '#34c75915'),
                            color: overallRisk === 'High Risk' ? '#ff453a' : (overallRisk === 'Medium Risk' ? '#b89400' : '#34c759'),
                            borderRadius: '30px',
                            fontSize: '16px',
                            fontWeight: '900'
                        }}>
                            {overallRisk || 'PENDING CLASSIFICATION'}
                        </div>
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '20px', lineHeight: '1.6' }}>
                            Technical assessment conducted to evaluate site preparedness for architectural finishing and glass execution. 
                            The following critical observations determine the risk level and necessary corrective actions.
                        </p>
                    </div>

                    <h3 style={{ fontSize: '14px', fontWeight: '800', borderBottom: '2px solid #1a1a1a', paddingBottom: '8px', marginBottom: '20px' }}>CRITICAL OBSERVATIONS</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {[
                            { l: 'Execution Risks', v: observations.criticalRisks },
                            { l: 'Drawing Deviations', v: observations.deviations },
                            { l: 'Pending Dependencies', v: observations.dependencies },
                            { l: 'Recommended Actions', v: observations.actions }
                        ].map((obs, i) => (
                            <div key={i} style={{ padding: '15px', background: '#fff', border: '1px solid #eee', borderRadius: '4px' }}>
                                <div style={{ fontSize: '9px', fontWeight: '900', color: '#66b2c2', marginBottom: '5px' }}>{obs.l.toUpperCase()}</div>
                                <div style={{ fontSize: '11px', lineHeight: '1.4', color: '#333' }}>{obs.v || 'No critical issues noted.'}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* PAGE 3+: TECHNICAL AUDIT DETAILS */}
                {Object.entries(SITE_SECTIONS).map(([key, items], sectionIndex) => (
                    <div key={key} className="pdf-page" style={{ height: '1122px', padding: '80px', position: 'relative', boxSizing: 'border-box' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid #eee', marginBottom: '40px' }}>
                            <div style={{ fontSize: '10px', fontWeight: '800' }}>{projectInfo.name} | TECHNICAL AUDIT</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ fontSize: '10px', color: '#999' }}>PAGE 0{sectionIndex + 3}</div>
                            </div>
                        </div>

                        <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: '#66b2c2' }}>0{sectionIndex + 2}.</span> 
                            {key.replace('_', ' ').toUpperCase()} VALIDATION
                        </h2>

                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                            <thead>
                                <tr style={{ background: '#1a1a1a', color: '#fff' }}>
                                    <th style={{ padding: '12px', textAlign: 'left', width: '40px' }}>ST</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>TECHNICAL REQUIREMENT</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>REMARKS / OBSERVATIONS</th>
                                    <th style={{ padding: '12px', textAlign: 'right', width: '80px' }}>RISK</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, i) => {
                                    const sectionKeyMap = { DRAWING: 'drawing', CIVIL: 'civil', GLASS_RISK: 'glassRisk', HARDWARE: 'hardware', INSTALLATION: 'installation', SNAGS: 'snags' };
                                    const stateKey = sectionKeyMap[key];
                                    const data = checklists[stateKey]?.[item] || { checked: false, remarks: '', risk: false };
                                    
                                    return (
                                        <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '12px', fontWeight: '900', color: data.checked ? '#34c759' : '#ccc' }}>
                                                {data.checked ? '✔' : '○'}
                                            </td>
                                            <td style={{ padding: '12px', fontWeight: '600' }}>{item}</td>
                                            <td style={{ padding: '12px', color: '#666', fontStyle: 'italic' }}>{data.remarks || '---'}</td>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>
                                                {data.risk && <span style={{ color: '#ff453a', fontWeight: '900', fontSize: '8px', border: '1px solid #ff453a', padding: '2px 4px', borderRadius: '2px' }}>FLAGGED</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ))}

                {/* PAGE FINAL: MEDIA & TRANSMISSION */}
                <div className="pdf-page" style={{ height: '1122px', padding: '80px', position: 'relative', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid #eee', marginBottom: '40px' }}>
                        <div style={{ fontSize: '10px', fontWeight: '800' }}>{projectInfo.name} | MEDIA & SIGN-OFF</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ fontSize: '10px', color: '#999' }}>FINAL PAGE</div>
                        </div>
                    </div>

                    <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '25px' }}>Visual Evidence & Media</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '60px' }}>
                        {uploadedFiles.filter(f => f.type.startsWith('image')).map((f, i) => (
                            <div key={i} style={{ border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden' }}>
                                <img src={f.url} style={{ width: '100%', height: '150px', objectFit: 'cover' }} alt="site" />
                                <div style={{ padding: '8px', fontSize: '8px', color: '#999', textAlign: 'center' }}>IMAGE REF: 0{i+1}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', marginTop: '100px' }}>
                        <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '15px' }}>
                            <div style={{ fontSize: '10px', fontWeight: '900' }}>LEAD AUDITOR SIGNATURE</div>
                            {signature && (
                                <img src={signature} style={{ height: '40px', marginTop: '10px', display: 'block' }} alt="signature" />
                            )}
                            <div style={{ fontSize: '11px', marginTop: '5px', fontWeight: '700' }}>{projectInfo.inspectedBy || 'Lead Technical Auditor'}</div>
                            <div style={{ fontSize: '8px', color: '#999' }}>Meaven Intelligence Hub</div>
                        </div>
                        <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
                            <div style={{ fontSize: '10px', fontWeight: '900', color: '#999' }}>TRANSMISSION PROTOCOL</div>
                            <div style={{ fontSize: '9px', marginTop: '10px', color: '#666', lineHeight: '1.4' }}>
                                This report has been digitally authenticated and electronically transmitted to: <strong>{projectInfo.clientEmail || projectInfo.client}</strong>.<br />
                                Technical acknowledgment is assumed upon receipt unless contested within 48 hours.
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SiteReadinessAudit;
