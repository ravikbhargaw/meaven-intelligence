import { getProjectRevenue, getProjectProfit } from './projectFinancials';

/**
 * Step 4: Overhead Allocation Engine (Correction 1: Initialized to Zeroes)
 */
export const DEFAULT_OVERHEAD = {
  salaries: 0,
  officeRent: 0,
  software: 0,
  fuel: 0,
  internet: 0,
  admin: 0,
  misc: 0
};

export const getOverheadPoolSum = (config) => {
  const c = config || DEFAULT_OVERHEAD;
  return Object.values(c).reduce((sum, val) => sum + Number(val || 0), 0);
};

export const getAllocatedProjectOverhead = (project, config, method, projects) => {
  if (!project || !projects || projects.length === 0) return 0;
  
  const poolSum = getOverheadPoolSum(config);
  if (poolSum <= 0) return 0;
  
  const activeProjects = projects.filter(p => p.status === 'Active' || !p.status);
  if (activeProjects.length === 0) return 0;
  
  if (method === 'weighted') {
    const totalRevenue = activeProjects.reduce((sum, p) => sum + getProjectRevenue(p), 0);
    if (totalRevenue <= 0) return poolSum / activeProjects.length;
    
    const projectRev = getProjectRevenue(project);
    return poolSum * (projectRev / totalRevenue);
  }
  
  // Default: Equal Allocation mode (Correction 2: "manual" allocation removed)
  return poolSum / activeProjects.length;
};

export const getTrueProjectProfit = (project, vendors, config, method, projects) => {
  if (!project) return 0;
  const netProfit = getProjectProfit(project, vendors);
  const allocatedOverhead = getAllocatedProjectOverhead(project, config, method, projects);
  return netProfit - allocatedOverhead;
};
export const getTrueProjectMargin = (project, vendors, config, method, projects) => {
  if (!project) return 0;
  const revenue = getProjectRevenue(project);
  if (revenue <= 0) return 0;
  const trueProfit = getTrueProjectProfit(project, vendors, config, method, projects);
  return (trueProfit / revenue) * 100;
};
