import React from 'react';

const HandoverPdfTemplate = ({ handover, project }) => {
    if (!handover || !project) return null;

    const selectedSnags = handover.selectedSnags || [];
    const customObs = handover.customObservations || [];
    const allPending = [...selectedSnags, ...customObs];
    const signature = handover.signature || {};
    const responses = handover.checklistResponses || {};

    return (
        <div id="handover-pdf-template" style={{
            position: 'absolute',
            left: '-9999px',
            top: '-9999px',
            width: '800px',
            background: '#ffffff',
            color: '#111827',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            fontSize: '12px',
            lineHeight: '1.5',
            boxSizing: 'border-box'
        }}>
            {/* PAGE 1 */}
            <div className="pdf-page" style={{
                width: '800px',
                minHeight: '1122px',
                padding: '40px 50px',
                boxSizing: 'border-box',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: '#ffffff'
            }}>
                <div>
                    {/* HEADER */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '2px solid #0071E3',
                        paddingBottom: '16px',
                        marginBottom: '24px'
                    }}>
                        <div>
                            <img src="/images/For Email - Logo.png" alt="Meaven Logo" style={{ height: '40px', objectFit: 'contain' }} />
                            <div style={{ fontSize: '9px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px', fontWeight: '700' }}>
                                Meaven Intelligence Hub • Corporate Execution Record
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0071E3', letterSpacing: '0.5px' }}>
                                PROJECT HANDOVER & CLOSURE
                            </h1>
                            <div style={{ fontSize: '11px', color: '#374151', fontWeight: '700', marginTop: '2px' }}>
                                Ref ID: {handover.id || 'HO-2026-001'} | Version: v{handover.version || 1}.0
                            </div>
                        </div>
                    </div>

                    {/* PROJECT & HANDOVER METADATA GRID */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px',
                        background: '#F9FAFB',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid #E5E7EB',
                        marginBottom: '24px'
                    }}>
                        <div>
                            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#6B7280', fontWeight: '800', marginBottom: '6px' }}>
                                Project Details
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '800', color: '#111827', marginBottom: '4px' }}>
                                {project.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#4B5563', marginBottom: '2px' }}>
                                <strong>Project ID:</strong> {project.id}
                            </div>
                            <div style={{ fontSize: '11px', color: '#4B5563', marginBottom: '2px' }}>
                                <strong>Site Address:</strong> {project.address || 'N/A'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#4B5563' }}>
                                <strong>Scope Summary:</strong> {project.scope || project.description || 'Execution & Installation Works'}
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#6B7280', fontWeight: '800', marginBottom: '6px' }}>
                                Handover & Client Info
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827', marginBottom: '2px' }}>
                                <strong>Client Name:</strong> {project.clientName || 'N/A'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#4B5563', marginBottom: '2px' }}>
                                <strong>Recipient Name:</strong> {handover.recipientName} ({handover.recipientType})
                            </div>
                            {handover.recipientDesignation && (
                                <div style={{ fontSize: '11px', color: '#4B5563', marginBottom: '2px' }}>
                                    <strong>Designation:</strong> {handover.recipientDesignation}
                                </div>
                            )}
                            {handover.recipientCompany && (
                                <div style={{ fontSize: '11px', color: '#4B5563', marginBottom: '2px' }}>
                                    <strong>Company:</strong> {handover.recipientCompany}
                                </div>
                            )}
                            <div style={{ fontSize: '11px', color: '#4B5563' }}>
                                <strong>Actual Handover Date:</strong> {handover.completedAt ? new Date(handover.completedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                        </div>
                    </div>

                    {/* FORMAL HANDOVER DECLARATION */}
                    <div style={{
                        background: '#EFF6FF',
                        borderLeft: '4px solid #0071E3',
                        padding: '14px 18px',
                        borderRadius: '0 8px 8px 0',
                        marginBottom: '24px'
                    }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#1E40AF', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>
                            Formal Handover Declaration
                        </div>
                        <div style={{ fontSize: '12px', color: '#1E3A8A', fontStyle: 'italic', lineHeight: '1.6' }}>
                            "I/We acknowledge that the works covered under the stated scope have been inspected/reviewed and are being handed over. Any pending observations or items identified at the time of handover are recorded in this document."
                        </div>
                    </div>

                    {/* HANDOVER CONFIRMATION CHECKLIST */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#111827', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px', borderBottom: '1px solid #E5E7EB', paddingBottom: '6px' }}>
                            Handover Verification Checklist
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                            <CheckItem label="Work Covered Under Scope Has Been Inspected & Reviewed" checked={responses.workInspected !== false} />
                            <CheckItem label="Completed Works Accepted & Handed Over For Review / Use" checked={responses.completedWorkHandedOver !== false} />
                            <CheckItem label="Agreed Scope Materials & Components Received" checked={responses.scopeMaterialsReceived !== false} />
                            <CheckItem label="Applicable Installation & Operational Safety Checks Completed" checked={responses.installationQcCompleted !== false} />
                            <CheckItem label="Pending Observations / Snag Items Documented Below" checked={responses.snagsRecorded !== false} />
                        </div>
                    </div>

                    {/* PENDING ITEMS / OBSERVATIONS */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#111827', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px', borderBottom: '1px solid #E5E7EB', paddingBottom: '6px' }}>
                            Pending Items & Observations
                        </div>

                        {allPending.length === 0 ? (
                            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '12px 16px', borderRadius: '6px', color: '#065F46', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '14px' }}>✓</span> No Pending Items — Site Handed Over Clean.
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                                <thead>
                                    <tr style={{ background: '#F3F4F6', textTransform: 'uppercase', fontSize: '9px', color: '#4B5563', letterSpacing: '0.5px' }}>
                                        <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '2px solid #E5E7EB' }}>Item</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '2px solid #E5E7EB' }}>Location</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '2px solid #E5E7EB' }}>Description</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '2px solid #E5E7EB' }}>Priority</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '2px solid #E5E7EB' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allPending.map((item, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                                            <td style={{ padding: '8px 10px', fontWeight: '700' }}>#{idx + 1}</td>
                                            <td style={{ padding: '8px 10px' }}>{item.location || item.type || 'General'}</td>
                                            <td style={{ padding: '8px 10px' }}>{item.description}</td>
                                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '9px',
                                                    fontWeight: '800',
                                                    background: item.priority === 'High' || item.severity === 'Critical' ? '#FEE2E2' : '#FEF3C7',
                                                    color: item.priority === 'High' || item.severity === 'Critical' ? '#991B1B' : '#92400E'
                                                }}>
                                                    {item.priority || item.severity || 'Medium'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '8px 10px', textAlign: 'center', color: '#4B5563', fontWeight: '600' }}>
                                                Pending Rectification
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* RECIPIENT REMARKS (IF PROVIDED) */}
                    {handover.recipientRemarks && (
                        <div style={{ marginBottom: '16px', background: '#F0F9FF', borderLeft: '4px solid #0071E3', padding: '10px 14px', borderRadius: '0 6px 6px 0' }}>
                            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#0369A1', fontWeight: '800', marginBottom: '4px' }}>
                                Recipient Comments & Written Remarks
                            </div>
                            <div style={{ fontSize: '11px', color: '#1E293B', fontStyle: 'italic', lineHeight: '1.4' }}>
                                "{handover.recipientRemarks}"
                            </div>
                        </div>
                    )}

                    {/* RECIPIENT PENDING TEXT (IF PROVIDED) */}
                    {handover.recipientPendingText && (
                        <div style={{ marginBottom: '16px', background: '#FFFBEB', borderLeft: '4px solid #D97706', padding: '10px 14px', borderRadius: '0 6px 6px 0' }}>
                            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#B45309', fontWeight: '800', marginBottom: '4px' }}>
                                Recipient Recorded Pending Items & Observations
                            </div>
                            <div style={{ fontSize: '11px', color: '#1E293B', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                                {handover.recipientPendingText}
                            </div>
                        </div>
                    )}

                    {/* SIGNATORY & DIGITAL VERIFICATION */}
                    <div style={{
                        background: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        padding: '16px',
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 1fr',
                        gap: '20px',
                        alignItems: 'center'
                    }}>
                        <div>
                            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#6B7280', fontWeight: '800', marginBottom: '8px' }}>
                                Signatory Information
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: '900', color: '#111827', marginBottom: '2px' }}>
                                {signature.signerName || handover.recipientName}
                            </div>
                            <div style={{ fontSize: '11px', color: '#374151', marginBottom: '2px' }}>
                                <strong>Role:</strong> {handover.recipientType}
                            </div>
                            {signature.signerDesignation && (
                                <div style={{ fontSize: '11px', color: '#374151', marginBottom: '2px' }}>
                                    <strong>Designation:</strong> {signature.signerDesignation}
                                </div>
                            )}
                            {signature.signerCompany && (
                                <div style={{ fontSize: '11px', color: '#374151', marginBottom: '2px' }}>
                                    <strong>Company:</strong> {signature.signerCompany}
                                </div>
                            )}
                            <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '6px' }}>
                                <strong>Signed Timestamp:</strong> {signature.signedAt ? new Date(signature.signedAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')}
                            </div>
                        </div>

                        <div style={{ textAlign: 'center', borderLeft: '1px solid #E5E7EB', paddingLeft: '16px' }}>
                            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#6B7280', fontWeight: '800', marginBottom: '6px' }}>
                                Digital Signature
                            </div>
                            {signature.signatureDataUrl ? (
                                <img src={signature.signatureDataUrl} alt="Digital Signature" style={{ maxHeight: '60px', maxWidth: '100%', objectFit: 'contain' }} />
                            ) : (
                                <div style={{ height: '60px', border: '1px dashed #CBD5E1', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '10px' }}>
                                    Digitally Signed
                                </div>
                            )}
                            <div style={{ fontSize: '9px', color: '#9CA3AF', marginTop: '4px' }}>
                                Cryptographically Verified Token Signature
                            </div>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div style={{
                    borderTop: '1px solid #E5E7EB',
                    paddingTop: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '9px',
                    color: '#9CA3AF'
                }}>
                    <div>
                        This is an official digital record issued by <strong>Meaven Intelligence Hub</strong>.
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
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#374151' }}>
        <div style={{
            width: '14px',
            height: '14px',
            borderRadius: '3px',
            border: checked ? '1px solid #0071E3' : '1px solid #D1D5DB',
            background: checked ? '#0071E3' : '#ffffff',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: '900'
        }}>
            {checked ? '✓' : ''}
        </div>
        <span>{label}</span>
    </div>
);

export default HandoverPdfTemplate;
