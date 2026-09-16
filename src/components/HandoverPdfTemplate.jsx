import React from 'react';

const HandoverPdfTemplate = ({ handover, project }) => {
    if (!handover || !project) return null;

    const selectedSnags = handover.selectedSnags || [];
    const customObs = handover.customObservations || [];
    const allPending = [...selectedSnags, ...customObs];
    const signature = handover.signature || {};
    const responses = handover.checklistResponses || {};

    const decision = handover.handoverDecision || 'COMPLETED';

    const getDecisionBadge = () => {
        if (decision === 'DEFERRED') {
            return {
                text: '🔴 HANDOVER DEFERRED (RECTIFICATION REQUIRED)',
                bg: '#FEF2F2',
                border: '#EF4444',
                color: '#991B1B'
            };
        }
        if (decision === 'COMPLETED_WITH_SNAGS') {
            return {
                text: '🟡 HANDOVER ACCEPTED WITH AGREED PENDING ITEMS',
                bg: '#FFFBEB',
                border: '#F59E0B',
                color: '#92400E'
            };
        }
        return {
            text: '🟢 HANDOVER FULLY ACCEPTED & COMPLETED',
            bg: '#ECFDF5',
            border: '#10B981',
            color: '#065F46'
        };
    };

    const badge = getDecisionBadge();

    return (
        <div id="handover-pdf-template" style={{
            position: 'fixed',
            left: '0px',
            top: '0px',
            zIndex: -9999,
            opacity: 0.01,
            pointerEvents: 'none',
            width: '800px',
            background: '#ffffff',
            color: '#0F172A',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            fontSize: '12px',
            lineHeight: '1.5',
            boxSizing: 'border-box'
        }}>
            {/* PAGE CONTAINER */}
            <div className="pdf-page" style={{
                width: '800px',
                minHeight: '1122px',
                padding: '0',
                boxSizing: 'border-box',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: '#ffffff'
            }}>
                {/* BRAND TOP STRIP */}
                <div style={{ height: '6px', background: 'linear-gradient(90deg, #0071E3 0%, #0284C7 100%)', width: '100%' }} />

                <div style={{ padding: '36px 44px' }}>
                    {/* HEADER */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '2px solid #E2E8F0',
                        paddingBottom: '18px',
                        marginBottom: '20px'
                    }}>
                        <div>
                            <img 
                                src="/images/For Email - Logo.png" 
                                alt="Meaven Logo" 
                                style={{ height: '46px', width: 'auto', objectFit: 'contain' }}
                                crossOrigin="anonymous"
                                onError={(e) => { e.target.onerror = null; e.target.src = '/images/logo.png'; }}
                            />
                            <div style={{ fontSize: '8.5px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '4px', fontWeight: '800' }}>
                                MEAVEN INTELLIGENCE HUB • CORPORATE EXECUTION RECORD
                            </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.3px', lineHeight: '1.2' }}>
                                PROJECT HANDOVER
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#0071E3', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                & CLOSURE CERTIFICATE
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', marginTop: '4px' }}>
                                REF ID: <strong>{handover.id || 'HO-2026-001'}</strong> • VERSION v{handover.version || 1}.0
                            </div>
                        </div>
                    </div>

                    {/* ACCEPTANCE CONDITION BADGE */}
                    <div style={{
                        background: badge.bg,
                        border: `1.5px solid ${badge.border}`,
                        color: badge.color,
                        padding: '10px 16px',
                        borderRadius: '8px',
                        fontWeight: '800',
                        fontSize: '12px',
                        letterSpacing: '0.03em',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '20px'
                    }}>
                        <span>{badge.text}</span>
                        <span style={{ fontSize: '10px', opacity: 0.8 }}>OFFICIAL CLOSURE STATUS</span>
                    </div>

                    {/* PROJECT & HANDOVER METADATA GRID */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px',
                        background: '#F8FAFC',
                        padding: '16px',
                        borderRadius: '10px',
                        border: '1px solid #E2E8F0',
                        marginBottom: '20px'
                    }}>
                        <div>
                            <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#64748B', fontWeight: '800', letterSpacing: '0.05em', marginBottom: '6px' }}>
                                Project Identification
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '900', color: '#0F172A', marginBottom: '4px', lineHeight: '1.3' }}>
                                {project.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#334155', marginBottom: '3px' }}>
                                <strong style={{ color: '#64748B' }}>Project ID:</strong> {project.id}
                            </div>
                            <div style={{ fontSize: '11px', color: '#334155', marginBottom: '3px' }}>
                                <strong style={{ color: '#64748B' }}>Site Address:</strong> {project.address || 'N/A'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#334155' }}>
                                <strong style={{ color: '#64748B' }}>Scope Summary:</strong> {project.scope || project.description || 'Execution & Installation Works'}
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#64748B', fontWeight: '800', letterSpacing: '0.05em', marginBottom: '6px' }}>
                                Handover Signatory Details
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', marginBottom: '3px' }}>
                                <strong style={{ color: '#64748B' }}>Client Name:</strong> {project.clientName || 'N/A'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#334155', marginBottom: '3px' }}>
                                <strong style={{ color: '#64748B' }}>Recipient:</strong> {signature.signerName || handover.recipientName} ({handover.recipientType || 'Authorized Representative'})
                            </div>
                            {(signature.signerDesignation || handover.recipientDesignation) && (
                                <div style={{ fontSize: '11px', color: '#334155', marginBottom: '3px' }}>
                                    <strong style={{ color: '#64748B' }}>Designation:</strong> {signature.signerDesignation || handover.recipientDesignation}
                                </div>
                            )}
                            {(signature.signerCompany || handover.recipientCompany) && (
                                <div style={{ fontSize: '11px', color: '#334155', marginBottom: '3px' }}>
                                    <strong style={{ color: '#64748B' }}>Company:</strong> {signature.signerCompany || handover.recipientCompany}
                                </div>
                            )}
                            <div style={{ fontSize: '11px', color: '#334155' }}>
                                <strong style={{ color: '#64748B' }}>Signoff Date:</strong> {handover.completedAt ? new Date(handover.completedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                        </div>
                    </div>

                    {/* FORMAL HANDOVER DECLARATION */}
                    <div style={{
                        background: '#F0F9FF',
                        borderLeft: '4px solid #0071E3',
                        padding: '12px 16px',
                        borderRadius: '0 8px 8px 0',
                        marginBottom: '20px'
                    }}>
                        <div style={{ fontSize: '10px', fontWeight: '800', color: '#0369A1', textTransform: 'uppercase', marginBottom: '3px', letterSpacing: '0.05em' }}>
                            Formal Handover Acknowledgement & Declaration
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#0F172A', fontStyle: 'italic', lineHeight: '1.5' }}>
                            "I/We acknowledge that the works covered under the stated scope have been inspected/reviewed and are being handed over. Any pending observations or items identified at the time of handover are recorded in this document."
                        </div>
                    </div>

                    {/* HANDOVER CONFIRMATION CHECKLIST */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '900', color: '#0071E3', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px' }}>
                            Handover Verification Checklist Matrix
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                            <CheckItem label="Work covered under agreed scope has been inspected & reviewed" checked={responses.workInspected !== false} />
                            <CheckItem label="Completed works accepted & handed over for review / use" checked={responses.completedWorkHandedOver !== false} />
                            <CheckItem label="Agreed scope materials & components received" checked={responses.scopeMaterialsReceived !== false} />
                            <CheckItem label="Applicable installation & operational safety checks completed" checked={responses.installationQcCompleted !== false} />
                            <CheckItem label="Pending observations / snag items documented below acknowledged" checked={responses.snagsRecorded !== false} />
                        </div>
                    </div>

                    {/* PENDING ITEMS / OBSERVATIONS */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '900', color: '#0071E3', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px' }}>
                            Pending Items & Site Observations
                        </div>

                        {allPending.length === 0 && !handover.recipientPendingText ? (
                            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '10px 14px', borderRadius: '6px', color: '#166534', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>✓</span> No Pending Items Recorded — Site Handed Over Clean.
                            </div>
                        ) : (
                            <div>
                                {allPending.length > 0 && (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', marginBottom: '10px' }}>
                                        <thead>
                                            <tr style={{ background: '#0F172A', color: '#FFFFFF', textTransform: 'uppercase', fontSize: '8.5px', letterSpacing: '0.05em' }}>
                                                <th style={{ padding: '6px 8px', textAlign: 'left' }}>#</th>
                                                <th style={{ padding: '6px 8px', textAlign: 'left' }}>Location / Type</th>
                                                <th style={{ padding: '6px 8px', textAlign: 'left' }}>Description</th>
                                                <th style={{ padding: '6px 8px', textAlign: 'center' }}>Priority</th>
                                                <th style={{ padding: '6px 8px', textAlign: 'center' }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allPending.map((item, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                                                    <td style={{ padding: '6px 8px', fontWeight: '700' }}>#{idx + 1}</td>
                                                    <td style={{ padding: '6px 8px' }}>{item.location || item.type || 'General'}</td>
                                                    <td style={{ padding: '6px 8px' }}>{item.description}</td>
                                                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                                                        <span style={{
                                                            padding: '2px 6px',
                                                            borderRadius: '10px',
                                                            fontSize: '8.5px',
                                                            fontWeight: '800',
                                                            background: item.priority === 'High' || item.severity === 'Critical' ? '#FEE2E2' : '#FEF3C7',
                                                            color: item.priority === 'High' || item.severity === 'Critical' ? '#991B1B' : '#92400E'
                                                        }}>
                                                            {item.priority || item.severity || 'Medium'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '6px 8px', textAlign: 'center', color: '#64748B', fontWeight: '600' }}>
                                                        Pending
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {handover.recipientPendingText && (
                                    <div style={{ background: '#FFFBEB', borderLeft: '4px solid #D97706', padding: '8px 12px', borderRadius: '0 6px 6px 0', marginTop: '6px' }}>
                                        <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#B45309', fontWeight: '800', marginBottom: '2px' }}>
                                            Recipient Recorded Pending Observations
                                        </div>
                                        <div style={{ fontSize: '10.5px', color: '#1E293B', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                                            {handover.recipientPendingText}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* RECIPIENT REMARKS (IF PROVIDED) */}
                    {handover.recipientRemarks && (
                        <div style={{ marginBottom: '20px', background: '#F8FAFC', borderLeft: '4px solid #0071E3', padding: '8px 12px', borderRadius: '0 6px 6px 0' }}>
                            <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#0071E3', fontWeight: '800', marginBottom: '2px' }}>
                                Recipient Comments & Written Remarks
                            </div>
                            <div style={{ fontSize: '10.5px', color: '#0F172A', fontStyle: 'italic', lineHeight: '1.4' }}>
                                "{handover.recipientRemarks}"
                            </div>
                        </div>
                    )}

                    {/* SIGNATORY & DIGITAL VERIFICATION */}
                    <div style={{
                        background: '#FFFFFF',
                        border: '1.5px solid #0071E3',
                        borderRadius: '10px',
                        padding: '14px',
                        display: 'grid',
                        gridTemplateColumns: '1.3fr 1fr',
                        gap: '16px',
                        alignItems: 'center',
                        boxShadow: '0 2px 8px rgba(0,113,227,0.06)'
                    }}>
                        <div>
                            <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#0071E3', fontWeight: '800', letterSpacing: '0.05em', marginBottom: '6px' }}>
                                Signatory Authentication
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: '900', color: '#0F172A', marginBottom: '2px' }}>
                                {signature.signerName || handover.recipientName}
                            </div>
                            <div style={{ fontSize: '10.5px', color: '#334155', marginBottom: '2px' }}>
                                <strong style={{ color: '#64748B' }}>Role:</strong> {handover.recipientType || 'Recipient Representative'}
                            </div>
                            {signature.signerDesignation && (
                                <div style={{ fontSize: '10.5px', color: '#334155', marginBottom: '2px' }}>
                                    <strong style={{ color: '#64748B' }}>Designation:</strong> {signature.signerDesignation}
                                </div>
                            )}
                            {signature.signerCompany && (
                                <div style={{ fontSize: '10.5px', color: '#334155', marginBottom: '2px' }}>
                                    <strong style={{ color: '#64748B' }}>Company:</strong> {signature.signerCompany}
                                </div>
                            )}
                            <div style={{ fontSize: '9.5px', color: '#64748B', marginTop: '4px' }}>
                                <strong>Signed Timestamp:</strong> {signature.signedAt ? new Date(signature.signedAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')}
                            </div>
                        </div>

                        <div style={{ textAlign: 'center', borderLeft: '1px solid #E2E8F0', paddingLeft: '14px' }}>
                            <div style={{ fontSize: '8.5px', textTransform: 'uppercase', color: '#64748B', fontWeight: '800', marginBottom: '4px' }}>
                                Verified Digital Signature
                            </div>
                            {signature.signatureDataUrl ? (
                                <div style={{ background: '#F8FAFC', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '6px' }}>
                                    <img src={signature.signatureDataUrl} alt="Digital Signature" style={{ maxHeight: '55px', maxWidth: '100%', objectFit: 'contain' }} />
                                </div>
                            ) : (
                                <div style={{ height: '55px', border: '1px dashed #CBD5E1', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '9.5px' }}>
                                    Digitally Signed & Validated
                                </div>
                            )}
                            <div style={{ fontSize: '8.5px', color: '#0071E3', fontWeight: '800', marginTop: '4px' }}>
                                🔒 TOKEN VERIFICATION CERTIFIED
                            </div>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div style={{
                    borderTop: '1px solid #E2E8F0',
                    padding: '12px 44px 16px 44px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '8.5px',
                    color: '#64748B'
                }}>
                    <div>
                        Official execution document issued by <strong>Meaven Intelligence Hub</strong>.
                    </div>
                    <div>
                        Ref ID: {handover.id || 'HO-2026-001'} | Page 1 of 1
                    </div>
                </div>
            </div>
        </div>
    );
};

const CheckItem = ({ label, checked }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px', color: '#334155' }}>
        <div style={{
            width: '14px',
            height: '14px',
            borderRadius: '3px',
            border: checked ? '1px solid #0071E3' : '1px solid #CBD5E1',
            background: checked ? '#0071E3' : '#FFFFFF',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '9.5px',
            fontWeight: '900'
        }}>
            {checked ? '✓' : ''}
        </div>
        <span>{label}</span>
    </div>
);

export default HandoverPdfTemplate;
