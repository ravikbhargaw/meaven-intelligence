import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import HandoverPdfTemplate from './HandoverPdfTemplate';
import FeedbackPdfTemplate from './FeedbackPdfTemplate';

const PublicHandoverPage = ({ token, projects = [], onUpdateHandoverStatus }) => {
    // Locate handover by token across projects
    let targetProject = null;
    let targetHandover = null;

    for (const p of projects) {
        const h = (p.handovers || []).find(ho => ho.token === token);
        if (h) {
            targetProject = p;
            targetHandover = h;
            break;
        }
    }

    const [handoverState, setHandoverState] = useState(targetHandover);
    const [projectState, setProjectState] = useState(targetProject);
    const [isLoading, setIsLoading] = useState(!targetHandover);
    const [step, setStep] = useState('review'); // 'review' | 'feedback' | 'completed'

    // Handover Decision & Written Remarks
    const [handoverDecision, setHandoverDecision] = useState('COMPLETED_WITH_SNAGS');
    const [recipientRemarks, setRecipientRemarks] = useState('');
    const [recipientPendingText, setRecipientPendingText] = useState('');

    // Confirmation Checkboxes (UNCHECKED BY DEFAULT)
    const [workInspected, setWorkInspected] = useState(false);
    const [completedWorkHandedOver, setCompletedWorkHandedOver] = useState(false);
    const [scopeMaterialsReceived, setScopeMaterialsReceived] = useState(false);
    const [installationQcCompleted, setInstallationQcCompleted] = useState(false);
    const [snagsRecorded, setSnagsRecorded] = useState(false);

    // Signatory Inputs
    const [signerName, setSignerName] = useState('');
    const [signerDesignation, setSignerDesignation] = useState('');
    const [signerCompany, setSignerCompany] = useState('');
    const [confirmAccuracy, setConfirmAccuracy] = useState(false);

    // HTML5 Signature Canvas Setup
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    // Feedback Inputs (if feedbackEnabled)
    const [overallScore, setOverallScore] = useState(5);
    const [qualityScore, setQualityScore] = useState(5);
    const [installationScore, setInstallationScore] = useState(5);
    const [communicationScore, setCommunicationScore] = useState(5);
    const [wouldRecommend, setWouldRecommend] = useState('Yes');
    const [likedMostText, setLikedMostText] = useState('');
    const [improvementText, setImprovementText] = useState('');
    const [allowTestimonial, setAllowTestimonial] = useState(true);

    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    useEffect(() => {
        if (targetHandover && targetProject) {
            setHandoverState(targetHandover);
            setProjectState(targetProject);
            setSignerName(targetHandover.recipientName || '');
            setSignerDesignation(targetHandover.recipientDesignation || '');
            setSignerCompany(targetHandover.recipientCompany || '');
            setRecipientRemarks(targetHandover.recipientRemarks || '');
            setRecipientPendingText(targetHandover.recipientPendingText || '');
            const snagsCount = [...(targetHandover.selectedSnags || []), ...(targetHandover.customObservations || [])].length;
            setHandoverDecision(targetHandover.handoverDecision || (snagsCount > 0 ? 'COMPLETED_WITH_SNAGS' : 'COMPLETED'));

            if (targetHandover.status === 'COMPLETED' || targetHandover.status === 'DEFERRED') {
                setStep('completed');
            }
            setIsLoading(false);
            return;
        }

        if (token) {
            setIsLoading(true);
            try {
                const storedProjects = JSON.parse(localStorage.getItem('projects') || localStorage.getItem('meaven_projects') || '[]');
                for (const p of storedProjects) {
                    const h = (p.handovers || []).find(ho => ho.token === token);
                    if (h) {
                        setProjectState(p);
                        setHandoverState(h);
                        setSignerName(h.recipientName || '');
                        setSignerDesignation(h.recipientDesignation || '');
                        setSignerCompany(h.recipientCompany || '');
                        setRecipientRemarks(h.recipientRemarks || '');
                        setRecipientPendingText(h.recipientPendingText || '');
                        const snagsCount = [...(h.selectedSnags || []), ...(h.customObservations || [])].length;
                        setHandoverDecision(h.handoverDecision || (snagsCount > 0 ? 'COMPLETED_WITH_SNAGS' : 'COMPLETED'));

                        if (h.status === 'COMPLETED' || h.status === 'DEFERRED') {
                            setStep('completed');
                        }
                        setIsLoading(false);
                        return;
                    }
                }
            } catch (lsErr) {
                console.warn('LocalStorage check error:', lsErr);
            }

            const apiUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
                ? `http://localhost:3001/api/handovers/${token}`
                : `/api/handovers/${token}`;

            fetch(apiUrl)
                .then(res => {
                    if (!res.ok) throw new Error('Not found');
                    return res.json();
                })
                .then(data => {
                    if (data && data.handover && data.project) {
                        setProjectState(data.project);
                        setHandoverState(data.handover);
                        setSignerName(data.handover.recipientName || '');
                        setSignerDesignation(data.handover.recipientDesignation || '');
                        setSignerCompany(data.handover.recipientCompany || '');
                        setRecipientRemarks(data.handover.recipientRemarks || '');
                        setRecipientPendingText(data.handover.recipientPendingText || '');
                        const snagsCount = [...(data.handover.selectedSnags || []), ...(data.handover.customObservations || [])].length;
                        setHandoverDecision(data.handover.handoverDecision || (snagsCount > 0 ? 'COMPLETED_WITH_SNAGS' : 'COMPLETED'));

                        if (data.handover.status === 'COMPLETED' || data.handover.status === 'DEFERRED') {
                            setStep('completed');
                        }
                    }
                })
                .catch(err => {
                    console.warn("Handover fetch error:", err);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            setIsLoading(false);
        }
    }, [token, targetHandover, targetProject]);

    // Canvas drawing handlers
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#0071E3';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, [step]);

    const getCanvasPos = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY;
        const scaleX = canvas.width / (rect.width || 1);
        const scaleY = canvas.height / (rect.height || 1);
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const startDrawing = (e) => {
        setIsDrawing(true);
        const pos = getCanvasPos(e);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
        }
    };

    const draw = (e) => {
        if (!isDrawing) return;
        if (e.cancelable) e.preventDefault();
        const pos = getCanvasPos(e);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            setHasSignature(true);
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
    };

    if (isLoading) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
                <div style={{ maxWidth: '400px' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⌛</div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>FETCHING HANDOVER CERTIFICATE...</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Securing encrypted project handover details. Please wait.
                    </p>
                </div>
            </div>
        );
    }

    if (!handoverState || !projectState) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
                <div style={{ maxWidth: '400px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--danger)' }}>INVALID OR EXPIRED HANDOVER LINK</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        This project closure link could not be found or has expired. Please contact Meaven Intelligence support.
                    </p>
                </div>
            </div>
        );
    }

    // Link Expiry Check (7 Days)
    const isExpired = handoverState.expiresAt && new Date(handoverState.expiresAt) < new Date();
    if (isExpired && handoverState.status !== 'COMPLETED' && handoverState.status !== 'DEFERRED') {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
                <div style={{ maxWidth: '400px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#FF9500' }}>HANDOVER LINK EXPIRED</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        This 7-day handover authorization link has expired. Please ask your Meaven project manager to regenerate the link.
                    </p>
                </div>
            </div>
        );
    }

    const allPending = [...(handoverState.selectedSnags || []), ...(handoverState.customObservations || [])];

    const handleCompleteHandover = async () => {
        if (!workInspected || !completedWorkHandedOver) {
            alert('Please check boxes 1 and 2 in the Handover Verification Checklist.');
            return;
        }

        if (!signerName.trim()) {
            alert('Please enter your full name in the Signer Full Name field.');
            return;
        }

        if (!hasSignature) {
            alert('Please draw your signature in the signature box.');
            return;
        }

        if (!confirmAccuracy) {
            alert('Please check the confirmation box verifying that the information provided is accurate.');
            return;
        }

        let signatureDataUrl = '';
        try {
            if (canvasRef.current) {
                signatureDataUrl = canvasRef.current.toDataURL('image/png');
            }
        } catch (canvasErr) {
            console.warn('Canvas data URL extraction warning:', canvasErr);
        }

        const signaturePayload = {
            signatureDataUrl,
            signerName: signerName.trim(),
            signerDesignation: signerDesignation.trim(),
            signerCompany: signerCompany.trim(),
            signedAt: new Date().toISOString()
        };

        const finalStatus = handoverDecision === 'DEFERRED' ? 'DEFERRED' : 'COMPLETED';

        const updatedHandover = {
            ...handoverState,
            status: finalStatus,
            handoverDecision,
            recipientRemarks: recipientRemarks.trim(),
            recipientPendingText: recipientPendingText.trim(),
            checklistResponses: {
                workInspected,
                completedWorkHandedOver,
                scopeMaterialsReceived,
                installationQcCompleted,
                snagsRecorded
            },
            signature: signaturePayload,
            completedAt: new Date().toISOString()
        };

        try {
            setHandoverState(updatedHandover);

            if (onUpdateHandoverStatus && projectState?.id) {
                onUpdateHandoverStatus(projectState.id, updatedHandover);
            }

            // Also persist directly into localStorage so changes are instant and offline-resilient
            try {
                const storedProjects = JSON.parse(localStorage.getItem('projects') || localStorage.getItem('meaven_projects') || '[]');
                const updatedProjs = storedProjects.map(p => {
                    if (String(p.id) === String(projectState.id)) {
                        const updatedHandovers = (p.handovers || []).map(h => h.id === updatedHandover.id ? updatedHandover : h);
                        return { ...p, handovers: updatedHandovers };
                    }
                    return p;
                });
                localStorage.setItem('projects', JSON.stringify(updatedProjs));
                localStorage.setItem('meaven_projects', JSON.stringify(updatedProjs));
            } catch (lsErr) {
                console.warn('LocalStorage save error:', lsErr);
            }

            // Trigger PDF generation in background
            setTimeout(() => {
                try {
                    generateHandoverPdf(updatedHandover, projectState);
                } catch (pdfErr) {
                    console.warn('Background PDF auto-generation error:', pdfErr);
                }
            }, 300);

            // Immediately switch step to feedback or completed
            if (updatedHandover.feedbackEnabled) {
                setStep('feedback');
            } else {
                setStep('completed');
            }
        } catch (err) {
            console.error('Error during handover completion process:', err);
            // Fallback step transition if any unexpected error occurs
            setStep('completed');
        }
    };

    const handleSubmitFeedback = async () => {
        const feedbackPayload = {
            overallScore,
            qualityScore,
            installationScore,
            communicationScore,
            wouldRecommend,
            likedMostText: likedMostText.trim(),
            improvementText: improvementText.trim(),
            allowTestimonial,
            submittedAt: new Date().toISOString()
        };

        const updatedHandover = {
            ...handoverState,
            feedbackData: feedbackPayload
        };

        setHandoverState(updatedHandover);

        if (onUpdateHandoverStatus) {
            onUpdateHandoverStatus(projectState.id, updatedHandover);
        }

        setStep('completed');
    };

    const generateHandoverPdf = async (handover, project) => {
        try {
            setIsGeneratingPdf(true);
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
                const pdfBase64 = pdf.output('datauristring');

                // Update handover with pdfBase64 for local viewing/downloading
                const finalHandover = { ...handover, pdfBase64 };
                setHandoverState(finalHandover);
                if (onUpdateHandoverStatus && project?.id) {
                    onUpdateHandoverStatus(project.id, finalHandover);
                }
            }
        } catch (e) {
            console.error('PDF Generation Error:', e);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handleDownloadPdf = async () => {
        try {
            setIsGeneratingPdf(true);
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
                const fileName = `${(projectState?.name || 'Project').replace(/[^a-zA-Z0-9_-]/g, '_')}_Handover_Certificate.pdf`;
                pdf.save(fileName);
            }
        } catch (e) {
            console.error('Download PDF Error:', e);
            alert('PDF generation error. Please try again.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#F8FAFC',
            color: '#0F172A',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            padding: '1.5rem 1rem',
            display: 'flex',
            justifyContent: 'center',
            boxSizing: 'border-box'
        }}>
            {/* Hidden Templates for html2canvas */}
            <HandoverPdfTemplate handover={handoverState} project={projectState} />
            <FeedbackPdfTemplate handover={handoverState} project={projectState} />

            <div style={{ width: '100%', maxWidth: '640px' }}>
                {/* BRAND HEADER */}
                <header style={{ textAlign: 'center', padding: '1rem 0 1.5rem 0', borderBottom: '1px solid #E2E8F0', marginBottom: '1.5rem' }}>
                    <img 
                        src="/images/For Email - Logo.png" 
                        alt="Meaven Logo" 
                        style={{ height: '52px', maxWidth: '80%', marginBottom: '0.5rem', objectFit: 'contain' }} 
                        onError={(e) => { e.target.onerror = null; e.target.src = '/images/logo.png'; }}
                    />
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#0071E3', fontWeight: '900' }}>
                        MEAVEN PROJECT HANDOVER & CLOSURE
                    </div>
                </header>

                {/* STEP 1: REVIEW & HANDOVER FORM */}
                {step === 'review' && (
                    <div className="animate-fade-in" style={{ padding: '0.5rem 0' }}>
                        {/* PROJECT SUMMARY CARD */}
                        <div style={{ background: '#FFFFFF', padding: '1.4rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px -2px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748B', fontWeight: '800', letterSpacing: '0.05em' }}>Project Overview</div>
                            <h2 style={{ margin: '0.3rem 0 0.8rem 0', fontSize: '1.3rem', fontWeight: '900', color: '#0F172A' }}>{projectState.name}</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.8rem', color: '#334155' }}>
                                <div><span style={{ color: '#64748B' }}>Project ID:</span> <strong>{projectState.id}</strong></div>
                                <div><span style={{ color: '#64748B' }}>Client Name:</span> <strong>{projectState.clientName || 'N/A'}</strong></div>
                                <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#64748B' }}>Site Address:</span> <strong>{projectState.address || 'N/A'}</strong></div>
                                <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#64748B' }}>Scope of Work:</span> <strong>{projectState.scope || projectState.description || 'Installation & Execution Works'}</strong></div>
                            </div>
                        </div>

                        {/* FORMAL DECLARATION */}
                        <div style={{ background: '#F0F9FF', borderLeft: '4px solid #0071E3', padding: '1.1rem', borderRadius: '0 8px 8px 0', marginBottom: '1.5rem', fontSize: '0.82rem', lineHeight: '1.5', color: '#0369A1', fontStyle: 'italic' }}>
                            "I/We acknowledge that the works covered under the stated scope have been inspected/reviewed and are being handed over. Any pending observations or items identified at the time of handover are recorded in this document."
                        </div>

                        {/* HANDOVER ACCEPTANCE CONDITION */}
                        <div style={{ background: '#FFFFFF', padding: '1.4rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px -2px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: '900', color: '#0071E3', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Handover Acceptance Condition *
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.8rem',
                                    padding: '0.9rem 1.1rem',
                                    borderRadius: '8px',
                                    border: '1px solid ' + (handoverDecision === 'COMPLETED' ? '#22C55E' : '#E2E8F0'),
                                    background: handoverDecision === 'COMPLETED' ? '#F0FDF4' : '#F8FAFC',
                                    color: handoverDecision === 'COMPLETED' ? '#15803D' : '#334155',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: '700'
                                }}>
                                    <input 
                                        type="radio" 
                                        name="handoverDecision" 
                                        value="COMPLETED" 
                                        checked={handoverDecision === 'COMPLETED'} 
                                        onChange={() => setHandoverDecision('COMPLETED')}
                                        style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                                    />
                                    <span>🟢 Handover Fully Accepted & Completed</span>
                                </label>

                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.8rem',
                                    padding: '0.9rem 1.1rem',
                                    borderRadius: '8px',
                                    border: '1px solid ' + (handoverDecision === 'COMPLETED_WITH_SNAGS' ? '#F59E0B' : '#E2E8F0'),
                                    background: handoverDecision === 'COMPLETED_WITH_SNAGS' ? '#FFFBEB' : '#F8FAFC',
                                    color: handoverDecision === 'COMPLETED_WITH_SNAGS' ? '#B45309' : '#334155',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: '700'
                                }}>
                                    <input 
                                        type="radio" 
                                        name="handoverDecision" 
                                        value="COMPLETED_WITH_SNAGS" 
                                        checked={handoverDecision === 'COMPLETED_WITH_SNAGS'} 
                                        onChange={() => setHandoverDecision('COMPLETED_WITH_SNAGS')}
                                        style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                                    />
                                    <span>🟡 Handover Accepted with Agreed Pending Items / Snags</span>
                                </label>

                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.8rem',
                                    padding: '0.9rem 1.1rem',
                                    borderRadius: '8px',
                                    border: '1px solid ' + (handoverDecision === 'DEFERRED' ? '#EF4444' : '#E2E8F0'),
                                    background: handoverDecision === 'DEFERRED' ? '#FEF2F2' : '#F8FAFC',
                                    color: handoverDecision === 'DEFERRED' ? '#B91C1C' : '#334155',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: '700'
                                }}>
                                    <input 
                                        type="radio" 
                                        name="handoverDecision" 
                                        value="DEFERRED" 
                                        checked={handoverDecision === 'DEFERRED'} 
                                        onChange={() => setHandoverDecision('DEFERRED')}
                                        style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                                    />
                                    <span>🔴 Handover Deferred (Rectification Required)</span>
                                </label>
                            </div>
                        </div>

                        {/* VERIFICATION CHECKBOXES */}
                        <div style={{ background: '#FFFFFF', padding: '1.4rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px -2px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: '900', color: '#0071E3', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Handover Verification Checklist
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                <CheckboxRow label="Work covered under agreed scope has been inspected & reviewed *" checked={workInspected} onChange={() => setWorkInspected(!workInspected)} />
                                <CheckboxRow label="Completed works accepted & handed over for review / use *" checked={completedWorkHandedOver} onChange={() => setCompletedWorkHandedOver(!completedWorkHandedOver)} />
                                <CheckboxRow label="Materials & items included in agreed scope received" checked={scopeMaterialsReceived} onChange={() => setScopeMaterialsReceived(!scopeMaterialsReceived)} />
                                <CheckboxRow label="Applicable installation & operational safety checks completed" checked={installationQcCompleted} onChange={() => setInstallationQcCompleted(!installationQcCompleted)} />
                                <CheckboxRow label="Pending observations / snag items documented below acknowledged" checked={snagsRecorded} onChange={() => setSnagsRecorded(!snagsRecorded)} />
                            </div>
                        </div>

                        {/* PENDING ITEMS / OBSERVATIONS */}
                        <div style={{
                            background: '#FFFFFF',
                            padding: '1.4rem',
                            borderRadius: '12px',
                            border: '1px solid ' + (
                                handoverDecision === 'DEFERRED' 
                                    ? '#EF4444' 
                                    : (handoverDecision === 'COMPLETED_WITH_SNAGS' ? '#F59E0B' : '#E2E8F0')
                            ),
                            boxShadow: '0 4px 12px -2px rgba(0,0,0,0.05)',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '900', textTransform: 'uppercase', color: '#0F172A' }}>
                                    Pending Items & Observations
                                </h3>
                                <span style={{
                                    fontSize: '0.68rem',
                                    fontWeight: '800',
                                    padding: '0.25rem 0.7rem',
                                    borderRadius: '12px',
                                    background: handoverDecision === 'DEFERRED' ? '#FEF2F2' : (handoverDecision === 'COMPLETED_WITH_SNAGS' ? '#FFFBEB' : '#F0FDF4'),
                                    color: handoverDecision === 'DEFERRED' ? '#B91C1C' : (handoverDecision === 'COMPLETED_WITH_SNAGS' ? '#B45309' : '#15803D')
                                }}>
                                    {handoverDecision === 'DEFERRED' ? '🔴 Blocking Rectifications' : (handoverDecision === 'COMPLETED_WITH_SNAGS' ? '🟡 Agreed Pending Items' : '🟢 Handover Clean')}
                                </span>
                            </div>

                            {/* PRE-RECORDED ADMIN SNAGS (IF ANY) */}
                            {allPending.length > 0 && (
                                <div style={{ marginBottom: '1.2rem' }}>
                                    <label style={{ fontSize: '0.7rem', color: '#64748B', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', fontWeight: '800' }}>
                                        Pre-recorded Site Snags (Admin Reference)
                                    </label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {allPending.map((item, idx) => (
                                            <div key={idx} style={{ background: '#F8FAFC', padding: '0.75rem 0.9rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.8rem', color: '#1E293B' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800' }}>
                                                    <span>📍 {item.location || item.type || 'General'}</span>
                                                    <span style={{ color: '#D97706', fontSize: '0.7rem' }}>{item.priority || item.severity || 'Medium'}</span>
                                                </div>
                                                <div style={{ color: '#475569', marginTop: '0.25rem' }}>{item.description}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* EDITABLE TEXT BOX FOR RECIPIENT TO ENTER PENDING ITEMS / OBSERVATIONS */}
                            <div>
                                <label style={{ fontSize: '0.7rem', color: '#64748B', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', fontWeight: '800' }}>
                                    Enter Your Pending Items & Observations (Editable)
                                </label>
                                <textarea 
                                    rows={4}
                                    value={recipientPendingText}
                                    onChange={(e) => setRecipientPendingText(e.target.value)}
                                    placeholder="Type any open snags, pending work, or observations you noticed during walkthrough (e.g. 1. Touchup paint on living room door, 2. Alignment check on master bedroom window)..."
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#FFFFFF', color: '#0F172A', border: '1px solid #CBD5E1', fontSize: '0.82rem', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.4', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>

                        {/* DIGITAL SIGNATURE & WRITTEN REMARKS */}
                        <div style={{ background: '#FFFFFF', padding: '1.4rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px -2px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: '900', color: '#0071E3', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Digital Signature & Written Remarks
                            </h3>

                            {/* RECIPIENT REMARKS / WRITTEN FEEDBACK TEXT AREA */}
                            <div style={{ marginBottom: '1.2rem' }}>
                                <label style={{ fontSize: '0.7rem', color: '#64748B', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', fontWeight: '800' }}>
                                    Recipient Comments / Written Remarks (Optional)
                                </label>
                                <textarea 
                                    rows={3}
                                    value={recipientRemarks} 
                                    onChange={(e) => setRecipientRemarks(e.target.value)}
                                    placeholder="Enter any specific observations, written comments, or instructions in your own words..."
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#FFFFFF', color: '#0F172A', border: '1px solid #CBD5E1', fontSize: '0.82rem', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                                />
                            </div>

                            {/* SIGNATURE CANVAS */}
                            <div style={{ marginBottom: '1.2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '700' }}>Draw signature with finger or mouse *</span>
                                    <button onClick={clearSignature} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '800' }}>Clear Signature</button>
                                </div>
                                <canvas 
                                    ref={canvasRef} 
                                    width={500} 
                                    height={150} 
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                    style={{
                                        width: '100%',
                                        height: '140px',
                                        background: '#FFFFFF',
                                        borderRadius: '8px',
                                        border: '1.5 solid #CBD5E1',
                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)',
                                        touchAction: 'none',
                                        cursor: 'crosshair'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', marginBottom: '0.2rem', fontWeight: '700' }}>Signer Full Name *</label>
                                    <input type="text" value={signerName} onChange={(e) => setSignerName(e.target.value)} style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', background: '#FFFFFF', color: '#0F172A', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', marginBottom: '0.2rem', fontWeight: '700' }}>Designation</label>
                                        <input type="text" value={signerDesignation} onChange={(e) => setSignerDesignation(e.target.value)} style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', background: '#FFFFFF', color: '#0F172A', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', marginBottom: '0.2rem', fontWeight: '700' }}>Company</label>
                                        <input type="text" value={signerCompany} onChange={(e) => setSignerCompany(e.target.value)} style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', background: '#FFFFFF', color: '#0F172A', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.4rem' }}>
                                    <input type="checkbox" checked={confirmAccuracy} onChange={(e) => setConfirmAccuracy(e.target.checked)} style={{ transform: 'scale(1.2)', cursor: 'pointer' }} />
                                    <span style={{ fontSize: '0.78rem', color: '#475569' }}>I confirm that the information provided above is accurate to the best of my knowledge.</span>
                                </div>
                            </div>
                        </div>

                        {/* COMPLETE HANDOVER BUTTON */}
                        <button 
                            onClick={handleCompleteHandover}
                            style={{
                                width: '100%',
                                padding: '1.1rem',
                                borderRadius: '10px',
                                fontSize: '1.05rem',
                                fontWeight: '900',
                                letterSpacing: '0.05em',
                                background: handoverDecision === 'DEFERRED' ? '#DC2626' : (handoverDecision === 'COMPLETED_WITH_SNAGS' ? '#D97706' : '#0071E3'),
                                border: 'none',
                                color: '#FFFFFF',
                                cursor: 'pointer',
                                boxShadow: '0 10px 20px -5px rgba(0,113,227,0.3)'
                            }}
                        >
                            {handoverDecision === 'DEFERRED' 
                                ? 'SUBMIT HANDOVER DEFERRAL' 
                                : (handoverDecision === 'COMPLETED_WITH_SNAGS' 
                                    ? 'COMPLETE HANDOVER WITH OPEN SNAGS' 
                                    : 'COMPLETE HANDOVER')}
                        </button>
                    </div>
                )}

                {/* STEP 2: FEEDBACK FORM (ONLY IF FEEDBACK ENABLED) */}
                {step === 'feedback' && (
                    <div className="animate-fade-in" style={{ padding: '1rem 0' }}>
                        <div style={{ background: '#FFFFFF', padding: '1.8rem', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px -2px rgba(0,0,0,0.05)' }}>
                            <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
                                <div style={{ fontSize: '2.5rem' }}>⭐</div>
                                <h2 style={{ margin: '0.4rem 0', fontSize: '1.3rem', fontWeight: '900', color: '#0F172A' }}>CUSTOMER EXPERIENCE FEEDBACK</h2>
                                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
                                    Help us maintain Meaven’s benchmark standards.
                                </p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
                                <StarRatingRow label="Overall Experience" score={overallScore} setScore={setOverallScore} />
                                <StarRatingRow label="Quality of Work & Finishing" score={qualityScore} setScore={setQualityScore} />
                                <StarRatingRow label="Installation & Execution" score={installationScore} setScore={setInstallationScore} />
                                <StarRatingRow label="Communication & Coordination" score={communicationScore} setScore={setCommunicationScore} />

                                <div>
                                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0F172A', display: 'block', marginBottom: '0.5rem' }}>Would you recommend Meaven?</label>
                                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                                        {['Yes', 'Maybe', 'No'].map(opt => (
                                            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>
                                                <input type="radio" name="recommend" value={opt} checked={wouldRecommend === opt} onChange={() => setWouldRecommend(opt)} />
                                                {opt}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.78rem', color: '#64748B', display: 'block', marginBottom: '0.3rem' }}>What did you like most about working with Meaven?</label>
                                    <textarea value={likedMostText} onChange={(e) => setLikedMostText(e.target.value)} rows={2} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', background: '#FFFFFF', color: '#0F172A', border: '1px solid #CBD5E1', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.78rem', color: '#64748B', display: 'block', marginBottom: '0.3rem' }}>What could we have done better?</label>
                                    <textarea value={improvementText} onChange={(e) => setImprovementText(e.target.value)} rows={2} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', background: '#FFFFFF', color: '#0F172A', border: '1px solid #CBD5E1', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <input type="checkbox" checked={allowTestimonial} onChange={(e) => setAllowTestimonial(e.target.checked)} style={{ transform: 'scale(1.2)', cursor: 'pointer' }} />
                                    <span style={{ fontSize: '0.78rem', color: '#475569' }}>You may use my feedback as a testimonial.</span>
                                </div>

                                <button onClick={handleSubmitFeedback} style={{ padding: '0.9rem', borderRadius: '8px', background: '#0071E3', color: '#FFFFFF', fontWeight: '900', border: 'none', fontSize: '0.95rem', cursor: 'pointer' }}>
                                    SUBMIT FEEDBACK
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: COMPLETED THANK-YOU SCREEN */}
                {step === 'completed' && (
                    <div className="animate-fade-in" style={{ padding: '2rem 0', textAlign: 'center' }}>
                        <div style={{ background: '#FFFFFF', padding: '2.5rem 1.8rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px -2px rgba(0,0,0,0.05)' }}>
                            <div style={{ fontSize: '3.8rem', marginBottom: '0.5rem', color: '#16A34A' }}>✓</div>
                            <h2 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#0F172A', margin: '0 0 0.5rem 0' }}>HANDOVER COMPLETED</h2>
                            <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1.8rem', lineHeight: '1.5' }}>
                                Thank you, <strong>{handoverState.recipientName}</strong>.<br />
                                Your project handover confirmation has been successfully recorded.
                            </p>

                            <button onClick={handleDownloadPdf} disabled={isGeneratingPdf} style={{ width: '100%', padding: '0.9rem', borderRadius: '8px', background: '#FFFFFF', color: '#0071E3', border: '1.5px solid #0071E3', fontSize: '0.95rem', fontWeight: '800', cursor: 'pointer', marginBottom: '1.5rem' }}>
                                {isGeneratingPdf ? 'Generating PDF...' : '📄 Download Handover Certificate PDF'}
                            </button>

                            {/* GOOGLE REVIEW PROMPT (IF GOOGLE REVIEW ENABLED) */}
                            {handoverState.googleReviewEnabled && (
                                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.8rem', marginTop: '1.2rem' }}>
                                    <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '1rem', fontWeight: '900', color: '#0F172A' }}>
                                        We'd love to hear about your experience on Google!
                                    </h4>
                                    <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '1.2rem' }}>
                                        Share your honest review with our community on Google Maps.
                                    </p>
                                    <button 
                                        onClick={() => window.open(handoverState.googleReviewUrl || 'https://g.page/r/meaven-review', '_blank')} 
                                        style={{ width: '100%', padding: '0.9rem', borderRadius: '8px', background: '#FFB800', border: 'none', color: '#000000', fontWeight: '900', fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,184,0,0.3)' }}
                                    >
                                        ⭐ LEAVE A GOOGLE REVIEW
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const CheckboxRow = ({ label, checked, onChange }) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.82rem', color: '#1E293B', cursor: 'pointer', background: '#F8FAFC', padding: '0.75rem 0.9rem', borderRadius: '8px', border: '1px solid ' + (checked ? '#0071E3' : '#E2E8F0'), fontWeight: checked ? '700' : '500' }}>
        <input type="checkbox" checked={checked} onChange={onChange} style={{ transform: 'scale(1.25)', cursor: 'pointer', accentColor: '#0071E3' }} />
        <span>{label}</span>
    </label>
);

const StarRatingRow = ({ label, score, setScore }) => (
    <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0F172A' }}>{label}</span>
            <span style={{ fontSize: '0.85rem', color: '#D97706', fontWeight: '900' }}>{score} / 5</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[1, 2, 3, 4, 5].map(star => (
                <button 
                    key={star} 
                    type="button"
                    onClick={() => setScore(star)}
                    style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: '1px solid ' + (star <= score ? '#F59E0B' : '#E2E8F0'),
                        background: star <= score ? '#FFFBEB' : '#F8FAFC',
                        color: star <= score ? '#D97706' : '#94A3B8',
                        fontSize: '1.25rem',
                        cursor: 'pointer'
                    }}
                >
                    ★
                </button>
            ))}
        </div>
    </div>
);

export default PublicHandoverPage;
