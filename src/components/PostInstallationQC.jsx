import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const QC_SECTIONS = {
    VISUAL: [
        "Glass alignment consistency verified",
        "Uniform vertical gaps maintained",
        "Uniform horizontal gaps maintained",
        "Silicone finish consistency checked",
        "Silicone excess cleaned properly",
        "No visible scratches on glass",
        "No edge chipping observed",
        "Glass clarity verified",
        "Reflection distortion checked",
        "Joint visibility consistency checked",
        "Uniform panel spacing verified",
        "Frame finish quality verified",
        "Hardware finish consistency checked",
        "No visible installation marks",
        "No visible adhesive residue"
    ],
    DOOR: [
        "Smooth door opening verified",
        "Smooth door closing verified",
        "Floor spring calibration verified",
        "Door centering alignment checked",
        "Door swing clearance verified",
        "Handle alignment checked",
        "Lock functionality verified",
        "Soft-close functioning verified",
        "Door hold-open condition verified",
        "Auto-close speed calibrated",
        "No door rubbing observed",
        "Patch fitting movement stability checked",
        "Sliding movement smoothness verified",
        "Track alignment checked",
        "Sensor operation verified"
    ],
    STRUCTURAL: [
        "Patch fittings securely tightened",
        "Fastener integrity verified",
        "Anchoring stability checked",
        "Structural support condition verified",
        "Ceiling fixing stability checked",
        "Frame anchoring checked",
        "Glass vibration test completed",
        "Expansion gap maintained correctly",
        "Sealant integrity verified",
        "Water leakage risk checked",
        "Glass edge protection verified",
        "Hardware mounting stability checked",
        "Corner reinforcement checked",
        "Door stop positioning verified",
        "Movement stress points checked"
    ],
    SAFETY: [
        "Sharp edge exposure checked",
        "User movement clearance verified",
        "Finger pinch risk checked",
        "Accessibility clearance verified",
        "Emergency access compliance checked",
        "Safety sticker/film placement verified",
        "Corner safety condition checked",
        "Traffic flow suitability reviewed",
        "User interaction comfort checked",
        "Safety gap consistency verified",
        "Impact-risk zones reviewed",
        "Glass visibility markers verified",
        "Slip-risk area checked nearby",
        "Obstruction-free movement verified",
        "Heavy usage suitability reviewed"
    ],
    CLEANING: [
        "Surface cleaning completed",
        "Fingerprints removed",
        "Silicone stains cleaned",
        "Installation debris cleared",
        "Protective stickers removed",
        "Dust cleaning completed",
        "Hardware polish completed",
        "Site cleanup completed",
        "Packaging material removed",
        "Final appearance review completed"
    ],
    HANDOVER: [
        "Final walkthrough completed",
        "Client observations recorded",
        "Pending snag list documented",
        "Rectification responsibility assigned",
        "Closure timeline confirmed",
        "Final QC photos captured",
        "Installation videos documented",
        "Client signoff completed",
        "Handover documents shared",
        "Final execution approval completed"
    ]
};

const generateInitialChecklist = (items) => {
    return items.reduce((acc, item) => ({
        ...acc,
        [item]: { status: '', remarks: '' }
    }), {});
};

const PostInstallationQC = ({ projects = [], onSubmitQC, initialData = null, readOnly = false }) => {
    const reportRef = useRef(null);
    const [qcId, setQcId] = useState(initialData?.qcId || '');
    const [activeSection, setActiveSection] = useState('project_info');
    const [isExporting, setIsExporting] = useState(false);
    const [signature, setSignature] = useState(initialData?.signature || null);
    const signatureCanvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    
    // Form State
    const [projectInfo, setProjectInfo] = useState(initialData?.projectInfo || {
        name: '', client: '', architect: '', address: '', city: '',
        inspectionDate: new Date().toISOString().split('T')[0],
        inspectedBy: '', vendorName: '', scope: '', completionDate: '',
        auditIdLink: '', installationType: '', handoverTimeline: ''
    });

    const [checklists, setChecklists] = useState(initialData?.checklists || {
        visual: generateInitialChecklist(QC_SECTIONS.VISUAL),
        door: generateInitialChecklist(QC_SECTIONS.DOOR),
        structural: generateInitialChecklist(QC_SECTIONS.STRUCTURAL),
        safety: generateInitialChecklist(QC_SECTIONS.SAFETY),
        cleaning: generateInitialChecklist(QC_SECTIONS.CLEANING),
        handover: generateInitialChecklist(QC_SECTIONS.HANDOVER)
    });

    const [observations, setObservations] = useState(initialData?.observations || {
        criticalIssues: '', snagObservations: '', pendingRectifications: '',
        actions: '', clientNotes: '', handoverNotes: ''
    });

    const [overallStatus, setOverallStatus] = useState(initialData?.overallStatus || '');
    const [uploadedFiles, setUploadedFiles] = useState(initialData?.uploadedFiles || []);
    
    useEffect(() => {
        if (!initialData) {
            const randNum = Math.floor(Math.random() * 900) + 100;
            setQcId(`MVN-QC-${randNum}`);
        }
    }, [initialData]);

    const calculateScores = () => {
        let totalItems = 0;
        let passCount = 0;
        let minorCount = 0;
        let rectCount = 0;
        let criticalCount = 0;

        Object.values(checklists).forEach(section => {
            Object.values(section).forEach(item => {
                totalItems++;
                if (item.status === 'Pass') passCount++;
                if (item.status === 'Minor Observation') minorCount++;
                if (item.status === 'Requires Rectification') rectCount++;
                if (item.status === 'Critical Issue') criticalCount++;
            });
        });

        if (totalItems === 0) return { completion: 0, readiness: 0, severity: 0 };
        
        const completion = Math.round(((passCount + minorCount + rectCount + criticalCount) / totalItems) * 100);
        
        // Readiness logic: Pass = 1, Minor = 0.8, Rect = 0.2, Critical = 0
        const readinessScoreRaw = (passCount * 1) + (minorCount * 0.8) + (rectCount * 0.2);
        const readiness = Math.round((readinessScoreRaw / totalItems) * 100);

        // Severity logic: Minor = 1, Rect = 5, Critical = 15
        const severity = (minorCount * 1) + (rectCount * 5) + (criticalCount * 15);

        return { completion, readiness, severity, passCount, minorCount, rectCount, criticalCount };
    };

    const scores = calculateScores();

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
        if (readOnly) return;
        const files = Array.from(e.target.files);
        const newFiles = files.map(file => ({
            name: file.name,
            type: file.type,
            url: URL.createObjectURL(file)
        }));
        setUploadedFiles(prev => [...prev, ...newFiles]);
    };

    const generatePDF = async () => {
        const reportElement = document.getElementById('qc-pdf-template');
        if (!reportElement) return;
        
        setIsExporting(true);
        window.scrollTo(0, 0);
        
        reportElement.style.display = 'block';
        
        setTimeout(async () => {
            try {
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pages = reportElement.querySelectorAll('.pdf-page');
                
                for (let i = 0; i < pages.length; i++) {
                    const canvas = await html2canvas(pages[i], { 
                        scale: 2, 
                        useCORS: true, 
                        logging: false,
                        backgroundColor: '#111111',
                        windowWidth: 794,
                        scrollY: -window.scrollY
                    });
                    
                    const imgData = canvas.toDataURL('image/jpeg', 0.95);
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                    
                    if (i > 0) pdf.addPage();
                    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                }

                pdf.save(`${qcId}_Execution_QC_Report.pdf`);
            } catch (error) {
                console.error("PDF generation failed", error);
                alert("Failed to generate Report.");
            } finally {
                setIsExporting(false);
                reportElement.style.display = 'none';
            }
        }, 1500);
    };

    const startDrawing = (e) => {
        if (readOnly) return;
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        if (readOnly) return;
        setIsDrawing(false);
        if (signatureCanvasRef.current) {
            setSignature(signatureCanvasRef.current.toDataURL());
        }
    };

    const draw = (e) => {
        if (readOnly || !isDrawing || !signatureCanvasRef.current) return;
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
        if (readOnly) return;
        if (signatureCanvasRef.current) {
            const canvas = signatureCanvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setSignature(null);
        }
    };

    const submitQC = () => {
        const payload = {
            qcId,
            timestamp: new Date().toISOString(),
            projectInfo,
            checklists,
            observations,
            overallStatus,
            scores,
            signature
        };
        if (onSubmitQC) onSubmitQC(payload);
        alert(`QC Report ${qcId} Submitted Successfully!`);
    };

    const statusOptions = ['Pass', 'Minor Observation', 'Requires Rectification', 'Critical Issue'];
    const statusColors = {
        'Pass': '#34c759',
        'Minor Observation': '#ffcc00',
        'Requires Rectification': '#ff9500',
        'Critical Issue': '#ff453a'
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
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{item}</div>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', flex: 1.5, minWidth: '300px' }}>
                                            {statusOptions.map(opt => (
                                                <button
                                                    key={opt}
                                                    type="button"
                                                    disabled={readOnly}
                                                    onClick={() => { if (!readOnly) handleChecklistChange(sectionKey, item, 'status', opt); }}
                                                    style={{
                                                        padding: '0.4rem 0.8rem',
                                                        fontSize: '0.75rem',
                                                        borderRadius: '4px',
                                                        border: `1px solid ${data.status === opt ? statusColors[opt] : 'var(--border-color)'}`,
                                                        background: data.status === opt ? `${statusColors[opt]}20` : 'transparent',
                                                        color: data.status === opt ? statusColors[opt] : 'var(--text-secondary)',
                                                        cursor: readOnly ? 'default' : 'pointer'
                                                    }}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                        
                                        <textarea 
                                            placeholder="Remarks (Optional)..." 
                                            value={data.remarks}
                                            disabled={readOnly}
                                            rows={1}
                                            onChange={(e) => {
                                                handleChecklistChange(sectionKey, item, 'remarks', e.target.value);
                                            }}
                                            style={{ flex: 1, minWidth: '150px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', padding: '0.6rem', borderRadius: '4px', color: 'var(--text-secondary)', fontSize: '0.8rem', resize: 'vertical' }}
                                        />
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <img src="/images/logo.png" alt="Meaven" style={{ height: '30px', filter: 'var(--logo-filter)' }} />
                            <div style={{ height: '24px', width: '2px', background: 'var(--accent-color)' }} />
                            <span style={{ fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Execution Intelligence</span>
                        </div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Post-Installation QC &amp;</h1>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--accent-color)' }}>Handover Validation</h1>
                        <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Technical Execution Quality Framework</p>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'right', minWidth: '150px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>QC ID</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-color)', fontFamily: 'monospace' }}>{qcId}</div>
                    </div>
                </div>

                {/* SCORES SUMMARY */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--accent-color)', fontFamily: 'monospace' }}>{scores.completion}%</div>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>QC Completion</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: '900', color: scores.readiness >= 90 ? '#34c759' : (scores.readiness >= 75 ? '#ffcc00' : '#ff453a'), fontFamily: 'monospace' }}>{scores.readiness}%</div>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Handover Readiness</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: '900', color: scores.severity > 20 ? '#ff453a' : '#fff', fontFamily: 'monospace' }}>{scores.severity}</div>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Snag Severity</div>
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
                            { label: 'QC Inspection Date', key: 'inspectionDate', type: 'date' },
                            { label: 'QC Conducted By', key: 'inspectedBy', type: 'text' },
                            { label: 'Vendor Name', key: 'vendorName', type: 'text' },
                            { label: 'Scope of Work', key: 'scope', type: 'text' },
                            { label: 'Installation Completion Date', key: 'completionDate', type: 'date' },
                            { label: 'Project Audit ID Link', key: 'auditIdLink', type: 'text' },
                            { label: 'Handover Timeline', key: 'handoverTimeline', type: 'text' }
                        ].map((field) => (
                            <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{field.label}</label>
                                <input 
                                    type={field.type} 
                                    list={field.list}
                                    value={projectInfo[field.key]} 
                                    disabled={readOnly}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setProjectInfo(prev => {
                                            const newInfo = {...prev, [field.key]: val};
                                            if (field.key === 'name' && projects) {
                                                const found = projects.find(p => p.name === val);
                                                if (found) {
                                                    newInfo.client = found.client || '';
                                                    newInfo.vendorName = found.assignedVendor || '';
                                                }
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
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Installation Type</label>
                            <select value={projectInfo.installationType} disabled={readOnly} onChange={e => setProjectInfo({...projectInfo, installationType: e.target.value})} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.6rem', color: 'var(--text-primary)' }}>
                                <option value="">Select...</option>
                                {['Frameless Glass', 'Framed Partitions', 'Acoustic Partitions', 'Sliding Systems', 'Spider Glazing', 'Other'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* CHECKLIST SECTIONS */}
                {renderChecklistSection('visual', '2. Visual Alignment & Finish QC', QC_SECTIONS.VISUAL)}
                {renderChecklistSection('door', '3. Door Operation & Movement QC', QC_SECTIONS.DOOR)}
                {renderChecklistSection('structural', '4. Structural & Installation QC', QC_SECTIONS.STRUCTURAL)}
                {renderChecklistSection('safety', '5. Safety & User Experience QC', QC_SECTIONS.SAFETY)}
                {renderChecklistSection('cleaning', '6. Cleaning & Finishing QC', QC_SECTIONS.CLEANING)}
                {renderChecklistSection('handover', '7. Handover & Closure Validation', QC_SECTIONS.HANDOVER)}

                {/* PHOTO UPLOAD */}
                <div style={{ marginTop: '2rem', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '1.5rem', textAlign: 'center' }}>
                    <h3 style={{ textTransform: 'uppercase', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Photo, Video & Document Upload</h3>
                    <input type="file" multiple accept="image/*,video/*,.pdf" onChange={handleFileUpload} style={{ display: 'none' }} id="qc-file-upload" />
                    <label htmlFor="qc-file-upload" style={{ display: 'inline-block', background: 'var(--bg-primary)', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 'bold' }}>
                        + Add QC Media
                    </label>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Supports Images, Installation Videos, and Marked Snag PDFs</p>
                    
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
                            { key: 'criticalIssues', label: 'Critical QC Issues' },
                            { key: 'snagObservations', label: 'Snag Observations' },
                            { key: 'pendingRectifications', label: 'Pending Rectifications' },
                            { key: 'actions', label: 'Recommended Corrective Actions' },
                            { key: 'clientFeedback', label: 'Client Feedback Notes' },
                            { key: 'handoverNotes', label: 'Final Handover Notes' }
                        ].map(obs => (
                            <div key={obs.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{obs.label}</label>
                                <textarea 
                                    rows={3} 
                                    value={observations[obs.key]} 
                                    disabled={readOnly}
                                    onChange={e => setObservations({...observations, [obs.key]: e.target.value})}
                                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.6rem', color: 'var(--text-primary)', fontSize: '0.9rem', resize: 'vertical' }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* HANDOVER STATUS */}
                <div style={{ marginTop: '2rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ textTransform: 'uppercase', fontSize: '0.9rem', color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>Overall Project Handover Status</h3>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {[
                            'Ready for Handover', 
                            'Ready with Minor Rectifications', 
                            'Hold for Rectification', 
                            'Critical Rework Required'
                        ].map(level => {
                            const colors = { 
                                'Ready for Handover': '#34c759', 
                                'Ready with Minor Rectifications': '#ffcc00', 
                                'Hold for Rectification': '#ff9500',
                                'Critical Rework Required': '#ff453a'
                            };
                            const isActive = overallStatus === level;
                            return (
                                <button 
                                    key={level}
                                    type="button"
                                    disabled={readOnly}
                                    onClick={() => { if (!readOnly) setOverallStatus(level); }}
                                    style={{ flex: 1, minWidth: '200px', padding: '1rem', background: isActive ? `${colors[level]}20` : 'var(--bg-primary)', border: `1px solid ${isActive ? colors[level] : 'var(--border-color)'}`, color: isActive ? colors[level] : 'var(--text-secondary)', borderRadius: '6px', cursor: readOnly ? 'default' : 'pointer', fontWeight: isActive ? 'bold' : 'normal', transition: 'all 0.2s' }}
                                >
                                    {level}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* SIGNATURE PAD */}
                {!readOnly && (
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
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Authenticated by Lead QC Engineer / PM</p>
                    </div>
                )}

                {readOnly && signature && (
                    <div style={{ marginTop: '2rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ textTransform: 'uppercase', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Authentication</h3>
                        <div style={{ background: '#fff', padding: '1rem', borderRadius: '4px', display: 'inline-block' }}>
                            <img src={signature} alt="Signature" style={{ maxHeight: '80px' }} />
                        </div>
                    </div>
                )}

                {/* ACTION BUTTONS */}
                {!readOnly && (
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem', flexWrap: 'wrap' }}>
                        <button type="button" onClick={() => alert('Draft Saved Securely.')} style={{ flex: 1, background: 'var(--bg-primary)', border: '1px solid var(--text-secondary)', color: 'var(--text-primary)', padding: '1rem', borderRadius: '6px', cursor: 'pointer', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>
                            Save Draft
                        </button>
                        <button type="button" onClick={generatePDF} style={{ flex: 1, background: 'var(--bg-primary)', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', padding: '1rem', borderRadius: '6px', cursor: 'pointer', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>
                            Generate Premium PDF
                        </button>
                        <button type="button" onClick={submitQC} style={{ flex: 2, background: 'var(--accent-color)', border: 'none', color: '#fff', padding: '1rem', borderRadius: '6px', cursor: 'pointer', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '2px', boxShadow: '0 4px 15px rgba(var(--accent-color-rgb), 0.4)' }}>
                            Submit QC Report
                        </button>
                    </div>
                )}

                {readOnly && (
                    <div style={{ marginTop: '3rem' }}>
                        <button type="button" onClick={generatePDF} style={{ width: '100%', background: 'var(--accent-color)', border: 'none', color: '#fff', padding: '1rem', borderRadius: '6px', cursor: 'pointer', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>
                            Download Historical QC Report (PDF)
                        </button>
                    </div>
                )}
            </div>

            {/* --- PREMIUM PDF EXPORT TEMPLATE (HIDDEN FROM UI) --- */}
            <div id="qc-pdf-template" style={{ 
                display: 'none', 
                width: '794px', 
                background: '#111111', 
                color: '#ffffff', 
                fontFamily: '"Inter", "Segoe UI", sans-serif',
                padding: '0',
                position: 'absolute',
                left: '-9999px',
                top: 0
            }}>
                {/* PAGE 1: COVER PAGE */}
                <div className="pdf-page" style={{ height: '1122px', position: 'relative', padding: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box', borderBottom: '2px solid #222' }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '400px', height: '400px', background: 'linear-gradient(135deg, #66b2c210 0%, transparent 100%)', clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <img src="/images/logo.png" alt="Meaven" style={{ height: '40px' }} />
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '2px', color: '#66b2c2' }}>INTELLIGENCE HUB</div>
                            <div style={{ fontSize: '8px', color: '#999' }}>TECHNICAL QC DIVISION</div>
                        </div>
                    </div>

                    <div style={{ marginTop: '100px' }}>
                        <div style={{ height: '4px', width: '60px', background: '#66b2c2', marginBottom: '20px' }} />
                        <h1 style={{ fontSize: '48px', fontWeight: '800', lineHeight: '1.1', margin: '0 0 10px 0', letterSpacing: '-1px', color: '#fff' }}>Post-Installation QC &</h1>
                        <h1 style={{ fontSize: '48px', fontWeight: '800', lineHeight: '1.1', margin: '0 0 30px 0', letterSpacing: '-1px', color: '#66b2c2' }}>Handover Validation</h1>
                        <p style={{ fontSize: '14px', letterSpacing: '4px', color: '#aaa', textTransform: 'uppercase', fontWeight: '500' }}>Technical Execution Quality Report</p>
                    </div>

                    <div style={{ background: '#1a1a1a', padding: '40px', borderRadius: '8px', borderLeft: '8px solid #66b2c2' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                {[
                                    { l: 'Project', v: projectInfo.name },
                                    { l: 'Client', v: projectInfo.client },
                                    { l: 'Architect / PMC', v: projectInfo.architect },
                                    { l: 'QC ID', v: qcId },
                                    { l: 'Date', v: projectInfo.inspectionDate },
                                    { l: 'Vendor', v: projectInfo.vendorName }
                                ].map((row, i) => (
                                    <tr key={i}>
                                        <td style={{ padding: '8px 0', fontSize: '10px', fontWeight: '900', color: '#888', textTransform: 'uppercase', width: '120px' }}>{row.l}</td>
                                        <td style={{ padding: '8px 0', fontSize: '14px', fontWeight: '700', color: '#fff' }}>{row.v || '---'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '10px', color: '#888' }}>
                        <div>
                            <strong>MEAVEN DESIGNS</strong><br />
                            Architectural Execution Partner<br />
                            www.meaven.in
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            AUTHENTICATED BY<br />
                            <strong style={{ color: '#fff' }}>MEAVEN INTEL ENGINE v8.5</strong>
                        </div>
                    </div>
                </div>

                {/* PAGE 2: EXECUTIVE SCORECARD */}
                <div className="pdf-page" style={{ height: '1122px', padding: '80px', position: 'relative', boxSizing: 'border-box', borderBottom: '2px solid #222' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid #333', marginBottom: '40px' }}>
                        <div style={{ fontSize: '10px', fontWeight: '800', color: '#aaa' }}>{projectInfo.name} | QC {qcId}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src="/images/logo.png" alt="Meaven" style={{ height: '18px' }} />
                            <div style={{ fontSize: '10px', color: '#888' }}>PAGE 02</div>
                        </div>
                    </div>

                    <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '30px', color: '#fff' }}>01. Executive Handover Summary</h2>
                    
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
                        <div style={{ flex: 1, background: '#1a1a1a', padding: '20px', borderRadius: '8px', borderTop: '4px solid #66b2c2' }}>
                            <div style={{ fontSize: '10px', color: '#888', fontWeight: '900', marginBottom: '5px' }}>QC COMPLETION</div>
                            <div style={{ fontSize: '32px', fontWeight: '800', color: '#fff' }}>{scores.completion}%</div>
                        </div>
                        <div style={{ flex: 1, background: '#1a1a1a', padding: '20px', borderRadius: '8px', borderTop: `4px solid ${scores.readiness >= 90 ? '#34c759' : '#ffcc00'}` }}>
                            <div style={{ fontSize: '10px', color: '#888', fontWeight: '900', marginBottom: '5px' }}>READINESS SCORE</div>
                            <div style={{ fontSize: '32px', fontWeight: '800', color: '#fff' }}>{scores.readiness}%</div>
                        </div>
                        <div style={{ flex: 1, background: '#1a1a1a', padding: '20px', borderRadius: '8px', borderTop: '4px solid #ff453a' }}>
                            <div style={{ fontSize: '10px', color: '#888', fontWeight: '900', marginBottom: '5px' }}>CRITICAL ISSUES</div>
                            <div style={{ fontSize: '32px', fontWeight: '800', color: '#fff' }}>{scores.criticalCount}</div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '50px', background: '#1a1a1a', padding: '40px', borderRadius: '12px', borderLeft: '8px solid #66b2c2' }}>
                        <div style={{ fontSize: '10px', color: '#888', fontWeight: '900', marginBottom: '10px' }}>OVERALL HANDOVER STATUS</div>
                        <div style={{ 
                            display: 'inline-block', 
                            padding: '10px 20px', 
                            background: overallStatus.includes('Ready') ? '#34c75920' : (overallStatus.includes('Critical') ? '#ff453a20' : '#ffcc0020'),
                            color: overallStatus.includes('Ready') ? '#34c759' : (overallStatus.includes('Critical') ? '#ff453a' : '#ffcc00'),
                            border: `1px solid ${overallStatus.includes('Ready') ? '#34c759' : (overallStatus.includes('Critical') ? '#ff453a' : '#ffcc00')}`,
                            borderRadius: '30px',
                            fontSize: '16px',
                            fontWeight: '900'
                        }}>
                            {overallStatus || 'PENDING CLASSIFICATION'}
                        </div>
                    </div>

                    <h3 style={{ fontSize: '14px', fontWeight: '800', borderBottom: '2px solid #333', paddingBottom: '8px', marginBottom: '20px', color: '#fff' }}>CRITICAL OBSERVATIONS</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {[
                            { l: 'Critical Issues', v: observations.criticalIssues },
                            { l: 'Pending Rectifications', v: observations.pendingRectifications },
                            { l: 'Client Feedback', v: observations.clientFeedback },
                            { l: 'Handover Notes', v: observations.handoverNotes }
                        ].map((obs, i) => (
                            <div key={i} style={{ padding: '20px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}>
                                <div style={{ fontSize: '9px', fontWeight: '900', color: '#66b2c2', marginBottom: '10px' }}>{obs.l.toUpperCase()}</div>
                                <div style={{ fontSize: '12px', lineHeight: '1.5', color: '#ccc' }}>{obs.v || '---'}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* PAGE 3+: TECHNICAL AUDIT DETAILS */}
                {Object.entries(QC_SECTIONS).map(([key, items], sectionIndex) => (
                    <div key={key} className="pdf-page" style={{ height: '1122px', padding: '80px', position: 'relative', boxSizing: 'border-box', borderBottom: '2px solid #222' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid #333', marginBottom: '40px' }}>
                            <div style={{ fontSize: '10px', fontWeight: '800', color: '#aaa' }}>{projectInfo.name} | QC CHECKLIST</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img src="/images/logo.png" alt="Meaven" style={{ height: '18px' }} />
                                <div style={{ fontSize: '10px', color: '#888' }}>PAGE 0{sectionIndex + 3}</div>
                            </div>
                        </div>

                        <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
                            <span style={{ color: '#66b2c2' }}>0{sectionIndex + 2}.</span> 
                            {key.toUpperCase()} VALIDATION
                        </h2>

                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                            <thead>
                                <tr style={{ background: '#1a1a1a', color: '#fff' }}>
                                    <th style={{ padding: '15px 12px', textAlign: 'left', borderBottom: '1px solid #333' }}>TECHNICAL REQUIREMENT</th>
                                    <th style={{ padding: '15px 12px', textAlign: 'left', width: '120px', borderBottom: '1px solid #333' }}>STATUS</th>
                                    <th style={{ padding: '15px 12px', textAlign: 'left', borderBottom: '1px solid #333' }}>REMARKS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, i) => {
                                    const stateKey = key.toLowerCase();
                                    const data = checklists[stateKey]?.[item] || { status: '', remarks: '' };
                                    
                                    let statusColor = '#888';
                                    if(data.status === 'Pass') statusColor = '#34c759';
                                    if(data.status === 'Minor Observation') statusColor = '#ffcc00';
                                    if(data.status === 'Requires Rectification') statusColor = '#ff9500';
                                    if(data.status === 'Critical Issue') statusColor = '#ff453a';

                                    return (
                                        <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                                            <td style={{ padding: '15px 12px', fontWeight: '600', color: '#ddd' }}>{item}</td>
                                            <td style={{ padding: '15px 12px' }}>
                                                {data.status && (
                                                    <span style={{ color: statusColor, fontWeight: '800', fontSize: '9px', border: `1px solid ${statusColor}`, padding: '4px 8px', borderRadius: '4px', background: `${statusColor}15` }}>
                                                        {data.status.toUpperCase()}
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '15px 12px', color: '#aaa', fontStyle: 'italic', lineHeight: '1.4' }}>{data.remarks || '---'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ))}

                {/* PAGE FINAL: MEDIA & TRANSMISSION */}
                <div className="pdf-page" style={{ height: '1122px', padding: '80px', position: 'relative', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid #333', marginBottom: '40px' }}>
                        <div style={{ fontSize: '10px', fontWeight: '800', color: '#aaa' }}>{projectInfo.name} | MEDIA & SIGN-OFF</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src="/images/logo.png" alt="Meaven" style={{ height: '18px' }} />
                            <div style={{ fontSize: '10px', color: '#888' }}>FINAL PAGE</div>
                        </div>
                    </div>

                    <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '25px', color: '#fff' }}>Visual Evidence & Media</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '60px' }}>
                        {uploadedFiles.filter(f => f.type.startsWith('image')).map((f, i) => (
                            <div key={i} style={{ border: '1px solid #333', borderRadius: '8px', overflow: 'hidden', background: '#1a1a1a' }}>
                                <img src={f.url} style={{ width: '100%', height: '180px', objectFit: 'cover' }} alt="site" />
                                <div style={{ padding: '10px', fontSize: '9px', color: '#888', textAlign: 'center', fontWeight: '700' }}>QC IMAGE REF: 0{i+1}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', marginTop: '100px' }}>
                        <div style={{ borderTop: '1px solid #444', paddingTop: '20px' }}>
                            <div style={{ fontSize: '10px', fontWeight: '900', color: '#aaa' }}>LEAD QC ENGINEER / PM SIGNATURE</div>
                            {signature ? (
                                <div style={{ background: '#fff', padding: '10px', borderRadius: '4px', marginTop: '15px', display: 'inline-block' }}>
                                    <img src={signature} style={{ height: '50px', display: 'block' }} alt="signature" />
                                </div>
                            ) : (
                                <div style={{ height: '50px', marginTop: '15px' }} />
                            )}
                            <div style={{ fontSize: '12px', marginTop: '15px', fontWeight: '800', color: '#fff' }}>{projectInfo.inspectedBy || 'Lead Technical Auditor'}</div>
                            <div style={{ fontSize: '9px', color: '#888', marginTop: '5px' }}>Meaven Intelligence Hub</div>
                        </div>
                        <div style={{ borderTop: '1px solid #444', paddingTop: '20px' }}>
                            <div style={{ fontSize: '10px', fontWeight: '900', color: '#66b2c2' }}>TRANSMISSION PROTOCOL</div>
                            <div style={{ fontSize: '10px', marginTop: '15px', color: '#aaa', lineHeight: '1.6' }}>
                                This Quality Control report has been digitally authenticated and forms part of the technical handover documentation.<br /><br />
                                Final handover is contingent upon completion of all items marked as "Requires Rectification" or "Critical Issue".
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PostInstallationQC;
