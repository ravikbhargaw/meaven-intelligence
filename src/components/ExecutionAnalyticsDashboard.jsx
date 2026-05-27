import React, { useMemo } from 'react';
import {
  calculateReadinessScore,
  calculateExecutionRisk,
  calculateVendorReliability,
  calculateSnagImpact,
  calculateTimelineReliability
} from '../utils/executionIntelligence';
import { parseMoney } from '../utils/financialUtils';

const ExecutionAnalyticsDashboard = ({ projects = [], vendors = [], onNavigate }) => {

  // --- 1. COMPILE ALL EXECUTION SIGNALS ---
  const compiledData = useMemo(() => {
    let totalReworkExposure = 0;
    let criticalBlockersCount = 0;
    let delayedSitesCount = 0;
    let snagCategoryMap = {};
    let delayAttributionMap = {
      'Client Delay': 0,
      'Vendor Delay': 0,
      'Internal Delay': 0,
      'Material Delay': 0
    };

    const projectAnalytics = projects.map(p => {
      const readiness = calculateReadinessScore(p);
      const risk = calculateExecutionRisk(p, vendors);
      const snags = calculateSnagImpact(p);
      const timeline = calculateTimelineReliability(p);

      // Accumulate totals
      totalReworkExposure += snags.potentialReworkExposure;
      criticalBlockersCount += readiness.blockers.length;
      if (timeline.timelineVariance > 0) {
        delayedSitesCount++;
      }

      // Snag categories aggregation
      (p.snags || []).forEach(s => {
        if (!s.resolved) {
          snagCategoryMap[s.type] = (snagCategoryMap[s.type] || 0) + (parseMoney(s.exposureCost) || 0);
        }
      });

      // Delay attribution aggregation
      if (p.primaryDelayReason && delayAttributionMap[p.primaryDelayReason] !== undefined) {
        delayAttributionMap[p.primaryDelayReason]++;
      }

      return {
        id: p.id,
        name: p.name,
        client: p.client,
        stageIndex: p.stageIndex !== undefined ? p.stageIndex : 1,
        assignedVendor: p.assignedVendor || 'Unassigned',
        readiness,
        risk,
        snags,
        timeline
      };
    });

    const vendorAnalytics = vendors.map(v => {
      const reliability = calculateVendorReliability(v, projects);
      return {
        id: v.id,
        name: v.name,
        category: v.category,
        reliability
      };
    }).sort((a, b) => b.reliability.reliabilityScore - a.reliability.reliabilityScore);

    return {
      projectAnalytics,
      vendorAnalytics,
      totalReworkExposure,
      criticalBlockersCount,
      delayedSitesCount,
      snagCategoryMap,
      delayAttributionMap
    };
  }, [projects, vendors]);

  // --- 2. DETERMINISTIC INSIGHT BRIEF GENERATION ---
  const founderInsights = useMemo(() => {
    const insights = [];
    const { snagCategoryMap, delayAttributionMap, projectAnalytics } = compiledData;

    // A. Leading rework category
    const topSnagCat = Object.entries(snagCategoryMap).sort((a, b) => b[1] - a[1])[0];
    if (topSnagCat && topSnagCat[1] > 0) {
      insights.push({
        icon: '⚠️',
        title: 'Leading Rework Margin Leakage',
        text: `The ${topSnagCat[0]} category accounts for the highest potential rework exposure at ₹${topSnagCat[1].toLocaleString('en-IN')}. Focus QA validation here.`
      });
    }

    // B. Critical blockers active
    const blockedSites = projectAnalytics.filter(pa => pa.readiness.blockers.length > 0);
    if (blockedSites.length > 0) {
      insights.push({
        icon: '🛑',
        title: 'Sites Blocked By Readiness Checks',
        text: `${blockedSites.length} project sites are stalled due to missing critical elements (Measurements, Materials, or Access). Check checklist details to resolve.`
      });
    }

    // C. Delay attribution driver
    const topDelayReason = Object.entries(delayAttributionMap).sort((a, b) => b[1] - a[1])[0];
    if (topDelayReason && topDelayReason[1] > 0) {
      insights.push({
        icon: '⏳',
        title: 'Timeline Variance Driver',
        text: `"${topDelayReason[0]}" is identified as your most frequent timeline delay trigger, currently impacting ${topDelayReason[1]} site loops.`
      });
    }

    // Default if clean operations
    if (insights.length === 0) {
      insights.push({
        icon: '☕',
        title: 'Operations Flow Nominal',
        text: 'All active project loops are operating within schedule, site readiness, and budget bounds. No risk adjustments recommended.'
      });
    }

    return insights;
  }, [compiledData]);

  const formatINR = (val) => `₹${Math.round(val).toLocaleString('en-IN')}`;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '5rem' }}>
      {/* Dashboard Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3.5rem', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 3.2rem)', fontWeight: '900', margin: 0, letterSpacing: '-0.04em' }}>Execution OS</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.8rem', letterSpacing: '0.25em', fontSize: '0.7rem', textTransform: 'uppercase' }}>Operational Moat & Site Intelligence Cockpit</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '0.5rem 1.2rem', fontSize: '0.75rem', fontWeight: '800', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span>Leakage Exposure:</span>
            <span style={{ color: compiledData.totalReworkExposure > 0 ? '#ff9500' : 'var(--success)' }}>
              {formatINR(compiledData.totalReworkExposure)}
            </span>
          </div>
        </div>
      </div>

      {/* 👔 UNIFIED FOUNDER EXECUTIVE BRIEFING SECTION */}
      <div className="card" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(102, 178, 194, 0.06) 0%, transparent 100%)', border: '1px solid var(--border-accent)', borderRadius: '16px', marginBottom: '3rem' }}>
        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '0.85rem', fontWeight: '850', letterSpacing: '0.15em', color: 'var(--accent-color)', textTransform: 'uppercase' }}>👔 Founder Executive Briefing (Deterministic Insights)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {founderInsights.map((ins, i) => (
            <div key={i} style={{ display: 'flex', gap: '1rem', background: 'var(--bg-secondary)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }} className="cinematic-hover">
              <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>{ins.icon}</span>
              <div>
                <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-primary)' }}>{ins.title}</h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{ins.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid containing Readiness Matrix & Timeline Variance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }} className="stack-on-mobile">
        
        {/* WIDGET 1: READINESS HEATMAP */}
        <div className="card" style={{ padding: '2rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', marginBottom: '1.5rem' }}>
            <span style={{ fontWeight: '850', fontSize: '0.8rem', letterSpacing: '0.1em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>1. Site Readiness Heatmap</span>
            <span style={{ fontSize: '0.65rem', background: 'rgba(102,178,194,0.08)', color: 'var(--accent-color)', padding: '0.2rem 0.5rem', borderRadius: '8px' }}>Critical vs Supp.</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1, overflowY: 'auto', maxHeight: '380px' }}>
            {compiledData.projectAnalytics.map(p => (
              <div key={p.id} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="cinematic-hover">
                <div>
                  <span style={{ fontWeight: '800', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{p.name}</span>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                    Readiness Score: <strong style={{ color: 'var(--text-primary)' }}>{p.readiness.readinessPercent}%</strong> 
                    {p.readiness.blockers.length > 0 && ` | Blocked: ${p.readiness.blockers.join(', ')}`}
                  </div>
                </div>
                
                <span style={{
                  padding: '0.2rem 0.6rem',
                  borderRadius: '4px',
                  fontSize: '0.58rem',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  background: p.readiness.readinessStatus === 'Ready' ? 'rgba(50,215,75,0.08)' :
                              p.readiness.readinessStatus === 'Partial Risk' ? 'rgba(255,149,0,0.08)' : 'rgba(255,69,58,0.08)',
                  color: p.readiness.readinessStatus === 'Ready' ? 'var(--success)' :
                         p.readiness.readinessStatus === 'Partial Risk' ? '#ff9500' : 'var(--danger)',
                  border: '1px solid ' + (
                         p.readiness.readinessStatus === 'Ready' ? 'rgba(50,215,75,0.2)' :
                         p.readiness.readinessStatus === 'Partial Risk' ? 'rgba(255,149,0,0.2)' : 'rgba(255,69,58,0.2)'
                  )
                }}>
                  {p.readiness.readinessStatus}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* WIDGET 2: TIMELINE VARIANCE & DELAY ATTRIBUTION */}
        <div className="card" style={{ padding: '2rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', marginBottom: '1.5rem' }}>
            <span style={{ fontWeight: '850', fontSize: '0.8rem', letterSpacing: '0.1em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>2. Timeline Variance & Delay Attribution</span>
            <span style={{ fontSize: '0.65rem', background: 'rgba(255, 69, 58, 0.08)', color: 'var(--danger)', padding: '0.2rem 0.5rem', borderRadius: '8px' }}>Schedule variance</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1, overflowY: 'auto', maxHeight: '380px' }}>
            {compiledData.projectAnalytics.map(p => (
              <div key={p.id} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="cinematic-hover">
                <div>
                  <span style={{ fontWeight: '800', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{p.name}</span>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                    Variance: <strong style={{ color: p.timeline.timelineVariance > 0 ? '#ff9500' : 'var(--success)' }}>
                      {p.timeline.timelineVariance > 0 ? `+${p.timeline.timelineVariance} days` : '0 days (On Schedule)'}
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  {p.timeline.timelineVariance > 0 && p.timeline.delayReasons[0] && (
                    <span style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                      {p.timeline.delayReasons[0]}
                    </span>
                  )}
                  <span style={{
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.58rem',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    background: p.timeline.reliabilityScore >= 85 ? 'rgba(50,215,75,0.08)' :
                                p.timeline.reliabilityScore >= 60 ? 'rgba(255,149,0,0.08)' : 'rgba(255,69,58,0.08)',
                    color: p.timeline.reliabilityScore >= 85 ? 'var(--success)' :
                           p.timeline.reliabilityScore >= 60 ? '#ff9500' : 'var(--danger)',
                    border: '1px solid ' + (
                           p.timeline.reliabilityScore >= 85 ? 'rgba(50,215,75,0.2)' :
                           p.timeline.reliabilityScore >= 60 ? 'rgba(255,149,0,0.2)' : 'rgba(255,69,58,0.2)'
                    )
                  }}>
                    {p.timeline.reliabilityScore}% Predictability
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Grid containing Vendor Reliability & Snag Exposure */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="stack-on-mobile">
        
        {/* WIDGET 3: VENDOR OPERATIONAL COMPLIANCE SIGNALS */}
        <div className="card" style={{ padding: '2rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', marginBottom: '1.5rem' }}>
            <span style={{ fontWeight: '850', fontSize: '0.8rem', letterSpacing: '0.1em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>3. Vendor Operational Standings (Meaven Signals)</span>
            <span style={{ fontSize: '0.65rem', background: 'rgba(102,178,194,0.08)', color: 'var(--accent-color)', padding: '0.2rem 0.5rem', borderRadius: '8px' }}>Auth: VendorIQ</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1, overflowY: 'auto', maxHeight: '380px' }}>
            {compiledData.vendorAnalytics.map(v => (
              <div key={v.id} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="cinematic-hover">
                <div>
                  <span style={{ fontWeight: '800', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{v.name}</span>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                    Trade: <strong style={{ color: 'var(--accent-color)' }}>{v.category}</strong> | Internal compliance score: <strong style={{ color: 'var(--text-primary)' }}>{v.reliability.reliabilityScore}/100</strong>
                  </div>
                </div>

                <span style={{
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.58rem',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  background: v.reliability.reliabilityLevel === 'High Reliability' ? 'rgba(50,215,75,0.08)' :
                              v.reliability.reliabilityLevel === 'Stable' ? 'rgba(255,255,255,0.05)' : 'rgba(255,69,58,0.08)',
                  color: v.reliability.reliabilityLevel === 'High Reliability' ? 'var(--success)' :
                         v.reliability.reliabilityLevel === 'Stable' ? 'var(--text-primary)' : 'var(--danger)',
                  border: '1px solid ' + (
                         v.reliability.reliabilityLevel === 'High Reliability' ? 'rgba(50,215,75,0.2)' :
                         v.reliability.reliabilityLevel === 'Stable' ? 'var(--border-color)' : 'rgba(255,69,58,0.2)'
                  )
                }}>
                  {v.reliability.reliabilityLevel}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* WIDGET 4: POTENTIAL REWORK EXPOSURE & SNAGS */}
        <div className="card" style={{ padding: '2rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', marginBottom: '1.5rem' }}>
            <span style={{ fontWeight: '850', fontSize: '0.8rem', letterSpacing: '0.1em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>4. Potential Rework Exposure & Snag metrics</span>
            <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', padding: '0.2rem 0.5rem', borderRadius: '8px' }}>Informational only</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1, overflowY: 'auto', maxHeight: '380px' }}>
            {compiledData.projectAnalytics.map(p => (
              <div key={p.id} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="cinematic-hover">
                <div>
                  <span style={{ fontWeight: '800', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{p.name}</span>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                    Active snags logged: <strong style={{ color: 'var(--text-primary)' }}>{p.snags.snagCount} issues</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {p.snags.criticalIssues > 0 && (
                    <span style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(255, 69, 58, 0.08)', color: 'var(--danger)', border: '1px solid rgba(255,69,58,0.2)', fontWeight: '800' }}>
                      {p.snags.criticalIssues} CRITICAL
                    </span>
                  )}
                  <span style={{
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.65rem',
                    fontWeight: '900',
                    background: p.snags.potentialReworkExposure > 0 ? 'rgba(255, 149, 0, 0.05)' : 'rgba(50,215,75,0.05)',
                    color: p.snags.potentialReworkExposure > 0 ? '#ff9500' : 'var(--success)',
                    border: '1px solid ' + (p.snags.potentialReworkExposure > 0 ? 'rgba(255, 149, 0, 0.15)' : 'rgba(50,215,75,0.15)')
                  }}>
                    {p.snags.potentialReworkExposure > 0 ? `Exposure: ${formatINR(p.snags.potentialReworkExposure)}` : 'No Rework'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ExecutionAnalyticsDashboard;
