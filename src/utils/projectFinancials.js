import { parseMoney } from './financialUtils';

/**
 * Calculate project revenue.
 * Falls back to totalValue if baseAmount is not present or 0.
 *
 * @param {Object} project
 * @returns {number}
 */
export const getProjectRevenue = (project) => {
  if (!project) return 0;
  const baseAmount = parseMoney(project.clientFinancials?.baseAmount);
  if (baseAmount > 0) return baseAmount;
  return parseMoney(project.clientFinancials?.totalValue);
};

/**
 * Calculate total collections/receipts for a project.
 *
 * @param {Object} project
 * @returns {number}
 */
export const getProjectCollections = (project) => {
  if (!project) return 0;
  const received = project.clientFinancials?.received || [];
  return received.reduce((sum, r) => sum + parseMoney(r.amount), 0);
};

/**
 * Calculate project outstanding.
 * Revenue minus collections.
 *
 * @param {Object} project
 * @returns {number}
 */
export const getProjectOutstanding = (project) => {
  if (!project) return 0;
  return getProjectRevenue(project) - getProjectCollections(project);
};

/**
 * Calculate project COGS from vendor contracts.
 * @param {Object}  project
 * @param {Array}   vendors
 * @param {boolean} includeInactive — default false (Active contracts only)
 *   Set true for historical reporting across all vendor contract statuses.
 */
export const getProjectCogs = (project, vendors, includeInactive = false) => {
  if (!project) return 0;
  const vendorList = vendors || [];
  return vendorList.reduce((sum, v) => {
    const projectContracts = (v.contracts || []).filter(c => {
      // 1. Lowercase & trimmed matching to prevent typo and spacing errors
      const nameMatch = c.projectName && project.name && c.projectName.toLowerCase().trim() === project.name.toLowerCase().trim();
      
      // 2. Future-safe Dual-Key projectId matching
      const idMatch = c.projectId && project.id && String(c.projectId) === String(project.id);
      
      if (!nameMatch && !idMatch) return false;
      
      if (includeInactive) return true;
      return c.status === 'Active' || !c.status;  // default: Active-only
    });
    
    const vendorProjectSum = projectContracts.reduce((vSum, c) => {
      const base = parseMoney(c.baseAmount) > 0
        ? parseMoney(c.baseAmount)
        : parseMoney(c.orderValue);
      return vSum + base;
    }, 0);
    
    return sum + vendorProjectSum;
  }, 0);
};

/**
 * Calculate project's direct expenses.
 *
 * @param {Object} project
 * @returns {number}
 */
export const getProjectExpenses = (project) => {
  if (!project) return 0;
  const expenses = project.expenses || [];
  return expenses.reduce((sum, e) => sum + parseMoney(e.amount), 0);
};

/**
 * Calculate net project profit (formerly EBITDA).
 * Revenue - COGS - Expenses.
 *
 * @param {Object} project
 * @param {Array} vendors
 * @returns {number}
 */
export const getProjectProfit = (project, vendors) => {
  if (!project) return 0;
  const revenue = getProjectRevenue(project);
  const cogs = getProjectCogs(project, vendors);
  const expenses = getProjectExpenses(project);
  return revenue - cogs - expenses;
};

/**
 * Calculate project margin percent.
 *
 * @param {Object} project
 * @param {Array} vendors
 * @returns {number}
 */
export const getProjectMargin = (project, vendors) => {
  if (!project) return 0;
  const revenue = getProjectRevenue(project);
  if (revenue <= 0) return 0;
  const profit = getProjectProfit(project, vendors);
  return (profit / revenue) * 100;
};
