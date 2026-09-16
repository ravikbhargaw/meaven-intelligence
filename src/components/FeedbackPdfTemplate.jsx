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
            color: '#111827',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            fontSize: '12px',
            lineHeight: '1.5',
            boxSizing: 'border-box'
        }}>
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
                        borderBottom: '2px solid #32D74B',
                        paddingBottom: '16px',
                        marginBottom: '24px'
                    }}>
                        <div>
                            <img src="/images/For Email - Logo.png" alt="Meaven Logo" style={{ height: '40px', objectFit: 'contain' }} />
                            <div style={{ fontSize: '9px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px', fontWeight: '700' }}>
                                Meaven Intelligence Hub • Customer Experience Intelligence
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#16A34A', letterSpacing: '0.5px' }}>
                                CUSTOMER FEEDBACK REPORT
                            </h1>
                            <div style={{ fontSize: '11px', color: '#374151', fontWeight: '700', marginTop: '2px' }}>
                                Ref ID: {handover.id || 'HO-2026-001'}-FB
                            </div>
                        </div>
                    </div>

                    {/* METADATA GRID */}
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
                            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#6B7280', fontWeight: '800', marginBottom: '4px' }}>
                                Project Name
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '800', color: '#111827' }}>
                                {project.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#4B5563', marginTop: '2px' }}>
                                Project ID: {project.id}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#6B7280', fontWeight: '800', marginBottom: '4px' }}>
                                Customer / Signer
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>
                                {handover.recipientName}
                            </div>
                            <div style={{ fontSize: '11px', color: '#4B5563', marginTop: '2px' }}>
                                Date: {fb.submittedAt ? new Date(fb.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                        </div>
                    </div>

                    {/* PERFORMANCE RATINGS GRID */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#111827', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px', borderBottom: '1px solid #E5E7EB', paddingBottom: '6px' }}>
                            Performance & Satisfaction Ratings
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
                        border: '1px solid ' + (fb.wouldRecommend === 'Yes' ? '#A7F3D0' : '#FDE68A'),
                        padding: '14px 18px',
                        borderRadius: '8px',
                        marginBottom: '24px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: fb.wouldRecommend === 'Yes' ? '#047857' : '#B45309', fontWeight: '800' }}>
                                Customer Recommendation Outcome
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '900', color: fb.wouldRecommend === 'Yes' ? '#065F46' : '#92400E', marginTop: '2px' }}>
                                Would Recommend Meaven: {fb.wouldRecommend || 'Yes'}
                            </div>
                        </div>
                        <div style={{ fontSize: '20px' }}>
                            {fb.wouldRecommend === 'Yes' ? '🤝' : '👍'}
                        </div>
                    </div>

                    {/* QUALITATIVE RESPONSES */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#111827', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px', borderBottom: '1px solid #E5E7EB', paddingBottom: '6px' }}>
                            Qualitative Feedback & Comments
                        </div>

                        {fb.likedMostText && (
                            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '12px', marginBottom: '12px' }}>
                                <div style={{ fontSize: '10px', fontWeight: '800', color: '#4B5563', textTransform: 'uppercase', marginBottom: '4px' }}>
                                    What did you like most about working with Meaven?
                                </div>
                                <div style={{ fontSize: '11px', color: '#111827', fontStyle: 'italic' }}>
                                    "{fb.likedMostText}"
                                </div>
                            </div>
                        )}

                        {fb.improvementText && (
                            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '12px', marginBottom: '12px' }}>
                                <div style={{ fontSize: '10px', fontWeight: '800', color: '#4B5563', textTransform: 'uppercase', marginBottom: '4px' }}>
                                    What could we have done better?
                                </div>
                                <div style={{ fontSize: '11px', color: '#111827', fontStyle: 'italic' }}>
                                    "{fb.improvementText}"
                                </div>
                            </div>
                        )}

                        <div style={{
                            fontSize: '11px',
                            color: fb.allowTestimonial ? '#047857' : '#6B7280',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginTop: '8px'
                        }}>
                            <span>{fb.allowTestimonial ? '✓' : '•'}</span>
                            <span>{fb.allowTestimonial ? 'Authorized Meaven to use this feedback as a customer testimonial.' : 'Testimonial permission not granted.'}</span>
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
                        Stored against Project: {project.name} ({project.id})
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
    <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '12px', borderRadius: '6px' }}>
        <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#6B7280', fontWeight: '800' }}>{label}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <div style={{ color: '#F59E0B', fontSize: '14px', letterSpacing: '2px' }}>{stars}</div>
            <div style={{ fontSize: '12px', fontWeight: '900', color: '#111827' }}>{score || 5} / 5</div>
        </div>
    </div>
);

export default FeedbackPdfTemplate;
