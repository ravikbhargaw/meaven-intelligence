import { parseMoney } from './financialUtils';
import { getProjectMargin } from './projectFinancials';
import { getProjectInactivityStatus } from './cashFlowAndControl';

/**
 * 1. Site Readiness Engine
 * Evaluates 8 checklist keys split into Critical (3) and Supplemental (5).
 */
export const calculateReadinessScore = (project) => {
  if (!project) return { readinessPercent: 0, blockers: [], readyForExecution: false, readinessStatus: 'High Risk' };

  const checklist = project.readinessChecklist || {
    measurementsLocked: false,
    materialReady: false,
    accessAvailable: false,
    civil: false,
    electrical: false,
    ceiling: false,
    flooring: false,
    siteClearance: false
  };

  const criticalKeys = ['measurementsLocked', 'materialReady', 'accessAvailable'];
  const supplementalKeys = ['civil', 'electrical', 'ceiling', 'flooring', 'siteClearance'];
  const allKeys = [...criticalKeys, ...supplementalKeys];

  // 1. Calculate overall passed item count and percentage
  const passedCount = allKeys.filter(key => !!checklist[key]).length;
  const readinessPercent = Math.round((passedCount / allKeys.length) * 100);

  // 2. Identify critical blockers
  const blockers = criticalKeys
    .filter(key => !checklist[key])
    .map(key => key.replace(/([A-Z])/g, ' $1').trim());

  const criticalReady = criticalKeys.every(key => !!checklist[key]);

  // 3. Calm status assignment
  let readinessStatus = 'High Risk';
  if (readinessPercent >= 80 && criticalReady) {
    readinessStatus = 'Ready';
  } else if (readinessPercent >= 50) {
    readinessStatus = 'Partial Risk';
  }

  return {
    readinessPercent,
    blockers,
    readyForExecution: criticalReady && readinessPercent >= 80,
    readinessStatus
  };
};

/**
 * 2. Revised Softened Execution Risk Engine
 * Accumulates points up to 100, ensuring High Risk remains rare.
 */
export const calculateExecutionRisk = (project, vendors) => {
  if (!project) return { riskScore: 0, riskLevel: 'Low', topRiskFactors: [] };

  let riskScore = 0;
  const topRiskFactors = [];

  // A. Readiness Risk
  const { readinessPercent, blockers } = calculateReadinessScore(project);
  if (readinessPercent < 50) {
    riskScore += 15;
    topRiskFactors.push('Critical site readiness below 50%');
  } else if (readinessPercent < 80) {
    riskScore += 8;
    topRiskFactors.push('Supplemental readiness below 80%');
  }
  if (blockers.length > 0) {
    topRiskFactors.push(`Critical blockers active: ${blockers.join(', ')}`);
  }

  // B. Partner Assignment Risk (Stage > 1 and unassigned)
  const isUnassigned = !project.assignedVendor;
  const currentStage = project.stageIndex !== undefined ? project.stageIndex : 1;
  if (isUnassigned && currentStage > 1) {
    riskScore += 10;
    topRiskFactors.push('No execution partner assigned past Stage 1');
  }

  // C. Inactivity Risk
  const inactivity = getProjectInactivityStatus(project);
  const daysActive = inactivity.daysSinceLastActivity;
  if (daysActive > 30) {
    riskScore += 20;
    topRiskFactors.push(`Site operations stalled for over 30 days`);
  } else if (daysActive > 15) {
    riskScore += 10;
    topRiskFactors.push('Site inactive for over 15 days');
  }

  // D. Snag Risk
  const snags = project.snags || [];
  const unresolvedCriticalSnags = snags.filter(s => !s.resolved && (s.severity === 'Critical' || s.severity === 'High')).length;
  if (unresolvedCriticalSnags > 0) {
    riskScore += 10;
    topRiskFactors.push(`${unresolvedCriticalSnags} unresolved critical qc/snag items`);
  }

  // E. Material Readiness Incomplete (past production freeze Stage 3)
  const checklist = project.readinessChecklist || {};
  if (!checklist.materialReady && currentStage > 3) {
    riskScore += 10;
    topRiskFactors.push('Materials incomplete past production freeze stage');
  }

  // Cap risk score at 100
  riskScore = Math.min(100, riskScore);

  let riskLevel = 'Low';
  if (riskScore > 60) {
    riskLevel = 'High';
  } else if (riskScore > 30) {
    riskLevel = 'Moderate';
  }

  return {
    riskScore,
    riskLevel,
    topRiskFactors
  };
};

/**
 * 3. Vendor Operational Reliability Engine (Meaven Signal)
 * Primary identity and certifications remain on VendorIQ.
 */
export const calculateVendorReliability = (vendor, projects = []) => {
  if (!vendor) return { reliabilityScore: 100, reliabilityLevel: 'Stable', riskFlags: [] };

  let score = 100;
  const riskFlags = [];

  // A. Delay Frequency
  const activeContracts = vendor.contracts || [];
  const delayedContracts = activeContracts.filter(c => c.status === 'Delayed').length;
  if (delayedContracts > 0) {
    score -= delayedContracts * 15;
    riskFlags.push(`${delayedContracts} delayed milestone commitments`);
  }

  // B. Rework / Snag Frequency
  let snagCount = 0;
  projects.forEach(p => {
    // Count active snags logged against this vendor or their specific category trade
    const vendorSnags = (p.snags || []).filter(s => !s.resolved && (
      String(s.responsibleVendorId) === String(vendor.id) ||
      (vendor.category === 'Woodwork' && s.type === 'Woodwork') ||
      (vendor.category === 'Service' && s.type === 'Finishes')
    ));
    snagCount += vendorSnags.length;
  });

  if (snagCount > 0) {
    score -= snagCount * 15;
    riskFlags.push(`${snagCount} active rework snags logged against trade`);
  }

  score = Math.max(0, Math.min(100, score));

  let reliabilityLevel = 'Stable';
  if (score >= 85) {
    reliabilityLevel = 'High Reliability';
  } else if (score < 60) {
    reliabilityLevel = 'Watchlist';
  }

  return {
    reliabilityScore: score,
    reliabilityLevel,
    riskFlags
  };
};

/**
 * 4. Snag & Rework Margin Leakage Engine
 * Purely informational. Unresolved snag values aggregated under Potential Rework Exposure.
 */
export const calculateSnagImpact = (project) => {
  if (!project) return { snagCount: 0, potentialReworkExposure: 0, criticalIssues: 0, repeatIssuePatterns: [] };

  const snags = project.snags || [];
  const unresolved = snags.filter(s => !s.resolved);

  const potentialReworkExposure = unresolved.reduce((sum, s) => sum + (parseMoney(s.exposureCost) || 0), 0);
  const criticalIssues = unresolved.filter(s => s.severity === 'Critical' || s.severity === 'High').length;

  // Identify pattern frequencies
  const typeMap = {};
  unresolved.forEach(s => {
    typeMap[s.type] = (typeMap[s.type] || 0) + 1;
  });

  const repeatIssuePatterns = Object.entries(typeMap)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `${type}: ${count} unresolved issues`);

  return {
    snagCount: snags.length,
    potentialReworkExposure,
    criticalIssues,
    repeatIssuePatterns
  };
};

/**
 * 5. Timeline Variance & Delay Attribution Engine
 */
export const calculateTimelineReliability = (project) => {
  if (!project) return { timelineVariance: 0, reliabilityScore: 100, delayReasons: [] };

  let timelineVariance = 0;
  const delayReasons = [];

  const plannedStart = project.startDate ? new Date(project.startDate) : null;
  const actualStart = project.actualStartDate ? new Date(project.actualStartDate) : null;
  const plannedEnd = project.endDate ? new Date(project.endDate) : null;
  const actualEnd = project.actualCompletionDate ? new Date(project.actualCompletionDate) : null;

  if (plannedEnd) {
    const baselineDuration = plannedStart ? Math.round((plannedEnd - plannedStart) / (1000 * 60 * 60 * 24)) : 0;
    
    let currentDuration = 0;
    if (actualEnd && actualStart) {
      currentDuration = Math.round((actualEnd - actualStart) / (1000 * 60 * 60 * 24));
    } else if (actualStart) {
      currentDuration = Math.round((new Date() - actualStart) / (1000 * 60 * 60 * 24));
    }

    timelineVariance = Math.max(0, currentDuration - baselineDuration);
  }

  // Deduce timeline reliability score
  let reliabilityScore = Math.max(0, 100 - (timelineVariance * 2));

  if (project.primaryDelayReason) {
    delayReasons.push(project.primaryDelayReason);
  }

  return {
    timelineVariance,
    reliabilityScore,
    delayReasons
  };
};
