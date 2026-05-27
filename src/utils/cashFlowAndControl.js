import { parseMoney } from './financialUtils';
import { getProjectRevenue, getProjectCollections, getProjectExpenses } from './projectFinancials';

/**
 * Step 1: Collection Aging Engine
 * Buckets: Healthy (0-15), Watch (16-30), Risk (31-60), Critical (60+), Unspecified (missing due date with active balance)
 */
export const getCollectionHealth = (project) => {
  if (!project) return { outstanding: 0, daysOutstanding: 0, agingBucket: 'Healthy', collectionRisk: 'Low' };
  
  const revenue = getProjectRevenue(project);
  const collected = getProjectCollections(project);
  const outstanding = Math.max(0, revenue - collected);
  
  const dueDateStr = project.clientFinancials?.dueDate;
  
  // Refinement 2: outstanding balance exists but no dueDate is recorded -> Unspecified
  if (outstanding > 0 && !dueDateStr) {
    return { outstanding, daysOutstanding: 0, agingBucket: 'Unspecified', collectionRisk: 'Medium' };
  }
  
  if (!dueDateStr || outstanding <= 0) {
    return { outstanding, daysOutstanding: 0, agingBucket: 'Healthy', collectionRisk: 'Low' };
  }
  
  const today = new Date();
  const dueDate = new Date(dueDateStr);
  const diffTime = today - dueDate;
  const daysOutstanding = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  
  let agingBucket = 'Healthy';
  let collectionRisk = 'Low';
  
  if (daysOutstanding > 60) {
    agingBucket = 'Critical';
    collectionRisk = 'High';
  } else if (daysOutstanding > 30) {
    agingBucket = 'Risk';
    collectionRisk = 'High';
  } else if (daysOutstanding > 15) {
    agingBucket = 'Watch';
    collectionRisk = 'Medium';
  }
  
  return { outstanding, daysOutstanding, agingBucket, collectionRisk };
};

/**
 * Step 2: Vendor Liability Engine (Dual-Key matching: Prefer projectId -> Fallback to projectName)
 */
export const getVendorLiability = (project, vendors) => {
  if (!project) return { committed: 0, paid: 0, outstanding: 0, agingBucket: 'Healthy' };
  
  const vendorList = vendors || [];
  let committed = 0;
  let paid = 0;
  let daysOverdue = 0;
  
  vendorList.forEach(v => {
    (v.contracts || []).forEach(c => {
      // DUAL KEY MATCHING LOGIC (Refinement 1)
      const isMatch = c.projectId 
        ? String(c.projectId) === String(project.id)
        : c.projectName === project.name;
        
      if (isMatch && (c.status === 'Active' || !c.status)) {
        committed += parseMoney(c.baseAmount) > 0 ? parseMoney(c.baseAmount) : parseMoney(c.orderValue);
        
        // Accumulate payouts matching this contract
        const contractPaid = (c.payments || []).reduce((sum, p) => sum + parseMoney(p.amount), 0);
        paid += contractPaid;
        
        if (c.dueDate) {
          const today = new Date();
          const dueDate = new Date(c.dueDate);
          const diff = today - dueDate;
          const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
          if (diffDays > daysOverdue) daysOverdue = diffDays;
        }
      }
    });
  });
  
  const outstanding = Math.max(0, committed - paid);
  let agingBucket = 'Healthy';
  if (outstanding > 0 && daysOverdue > 0) {
    if (daysOverdue > 60) agingBucket = 'Critical';
    else if (daysOverdue > 30) agingBucket = 'Risk';
    else if (daysOverdue > 15) agingBucket = 'Watch';
  }
  
  return { committed, paid, outstanding, agingBucket };
};

/**
 * Step 3: Project Cash Flow Engine (Double-Counting Proof)
 * Formula: Collections - Vendor Payouts - Direct Project Expenses
 */
export const getProjectCashPosition = (project) => {
  if (!project) return { collections: 0, payouts: 0, expenses: 0, netCashPosition: 0 };
  
  const collections = getProjectCollections(project);
  
  // 1. Vendor payouts sum
  const payouts = (project.payouts || []).reduce((sum, p) => sum + parseMoney(p.amount), 0);
  
  // 2. Direct project expenses (Labour, Material, etc. summed once)
  // Double-counting proof: project.expenses represents direct site disbursements.
  // We aggregate it as one single pool without separate labourPaid/projectExpenses splits.
  const expenses = getProjectExpenses(project);
  
  const netCashPosition = collections - payouts - expenses;
  return { collections, payouts, expenses, netCashPosition };
};

/**
 * Refinement 4: Inactivity Detection Utility
 * Buckets: 0-7 days (Active), 8-15 days (Slow), 16-30 (Stalled), 30+ (Critical)
 */
export const getProjectInactivityStatus = (project) => {
  if (!project) return { daysSinceLastActivity: 0, inactivityStatus: 'Active' };
  
  // Fallback chain: lastActivityAt -> created_at -> startDate -> today
  const lastActiveStr = project.lastActivityAt || project.created_at || project.startDate || new Date().toISOString();
  const today = new Date();
  const lastActive = new Date(lastActiveStr);
  const diffTime = today - lastActive;
  const daysSinceLastActivity = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  
  let inactivityStatus = 'Active';
  if (daysSinceLastActivity > 30) inactivityStatus = 'Critical';
  else if (daysSinceLastActivity > 15) inactivityStatus = 'Stalled';
  else if (daysSinceLastActivity > 7) inactivityStatus = 'Slow';
  
  return { daysSinceLastActivity, inactivityStatus };
};
