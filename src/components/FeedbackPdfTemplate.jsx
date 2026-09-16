import React from 'react';

const FeedbackPdfTemplate = ({ handover, project }) => {
    if (!handover || !project || !handover.feedbackData) return null;

    const fb = handover.feedbackData || {};

    const renderStars = (score) => {
        const num = Number(score) || 5;
        return '★'.repeat(num) + '☆'.repeat(5 - num);
    };

    return (
        <div id="feedback-pdf-template" style={{
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
                <div style={{ height: '6px', background: 'linear-gradient(90deg, #16A34A 0%, #059669 100%)', width: '100%' }} />

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
                                MEAVEN INTELLIGENCE HUB • CUSTOMER EXPERIENCE INTELLIGENCE
                            </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.3px', lineHeight: '1.2' }}>
                                CUSTOMER FEEDBACK
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                PERFORMANCE REPORT
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', marginTop: '4px' }}>
                                REF ID: <strong>{handover.id || 'HO-2026-001'}-FB</strong>
                            </div>
                        </div>
                    </div>

                    {/* METADATA GRID */}
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
                            <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#64748B', fontWeight: '800', letterSpacing: '0.05em', marginBottom: '4px' }}>
                                Project Details
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '900', color: '#0F172A' }}>
                                {project.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#334155', marginTop: '3px' }}>
                                <strong style={{ color: '#64748B' }}>Project ID:</strong> {project.id}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#64748B', fontWeight: '800', letterSpacing: '0.05em', marginBottom: '4px' }}>
                                Customer / Respondent
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>
                                {handover.recipientName}
                            </div>
                            <div style={{ fontSize: '11px', color: '#334155', marginTop: '3px' }}>
                                <strong style={{ color: '#64748B' }}>Submitted:</strong> {fb.submittedAt ? new Date(fb.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                        </div>
                    </div>

                    {/* PERFORMANCE RATINGS GRID */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '900', color: '#16A34A', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px' }}>
                            Performance & Satisfaction Metrics
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <RatingCard label="Overall Experience" score={fb.overallScore} stars={renderStars(fb.overallScore)} />
                            <RatingCard label="Quality of Work & Finishing" score={fb.qualityScore} stars={renderStars(fb.qualityScore)} />
                            <RatingCard label="Installation & Execution" score={fb.installationScore} stars={renderStars(fb.installationScore)} />
                            <RatingCard label="Communication & Coordination" score={fb.communicationScore} stars={renderStars(fb.communicationScore)} />
                        </div>
                    </div>

                    {/* RECOMMENDATION STATUS */}
                    <div style={{
                        background: fb.wouldRecommend === 'Yes' ? '#ECFDF5' : '#FFFBEB',
                        border: '1.5px solid ' + (fb.wouldRecommend === 'Yes' ? '#10B981' : '#F59E0B'),
                        padding: '14px 18px',
                        borderRadius: '10px',
                        marginBottom: '20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <div style={{ fontSize: '9px', textTransform: 'uppercase', color: fb.wouldRecommend === 'Yes' ? '#047857' : '#B45309', fontWeight: '800', letterSpacing: '0.05em' }}>
                                Customer Net Recommendation Outcome
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '900', color: fb.wouldRecommend === 'Yes' ? '#065F46' : '#92400E', marginTop: '2px' }}>
                                Would Recommend Meaven: <strong>{fb.wouldRecommend || 'Yes'}</strong>
                            </div>
                        </div>
                        <div style={{ fontSize: '22px' }}>
                            {fb.wouldRecommend === 'Yes' ? '🤝' : '👍'}
                        </div>
                    </div>

                    {/* QUALITATIVE RESPONSES */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '900', color: '#16A34A', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px' }}>
                            Qualitative Feedback & Customer Notes
                        </div>

                        {fb.likedMostText && (
                            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
                                <div style={{ fontSize: '9px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: '3px' }}>
                                    What did you like most about working with Meaven?
                                </div>
                                <div style={{ fontSize: '11px', color: '#0F172A', fontStyle: 'italic', lineHeight: '1.4' }}>
                                    "{fb.likedMostText}"
                                </div>
                            </div>
                        )}

                        {fb.improvementText && (
                            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
                                <div style={{ fontSize: '9px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: '3px' }}>
                                    What could we have done better?
                                </div>
                                <div style={{ fontSize: '11px', color: '#0F172A', fontStyle: 'italic', lineHeight: '1.4' }}>
                                    "{fb.improvementText}"
                                </div>
                            </div>
                        )}

                        <div style={{
                            fontSize: '10.5px',
                            color: fb.allowTestimonial ? '#047857' : '#64748B',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginTop: '8px'
                        }}>
                            <span>{fb.allowTestimonial ? '✓' : '•'}</span>
                            <span>{fb.allowTestimonial ? 'Authorized Meaven to publish this feedback as an official customer testimonial.' : 'Testimonial publication permission not granted.'}</span>
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
                        Stored against Project: <strong>{project.name}</strong> ({project.id})
                    </div>
                    <div>
                        Meaven Experience Intelligence • Page 1 of 1
                    </div>
                </div>
            </div>
        </div>
    );
};

const RatingCard = ({ label, score, stars }) => (
    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '8px' }}>
        <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#64748B', fontWeight: '800' }}>{label}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <div style={{ color: '#F59E0B', fontSize: '15px', letterSpacing: '2px' }}>{stars}</div>
            <div style={{ fontSize: '12px', fontWeight: '900', color: '#0F172A' }}>{score || 5} / 5</div>
        </div>
    </div>
);

export default FeedbackPdfTemplate;
