/**
 * Safely parses any value (number, string with commas, null, undefined) into a numeric float.
 * Prevents issues with parseInt() truncation and invalid string formatting.
 *
 * @param {*} val - The value to parse
 * @returns {number} The parsed number, or 0 if invalid
 */
export const parseMoney = (val) => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') {
    return Number.isNaN(val) ? 0 : val;
  }
  if (typeof val !== 'string') {
    // If it can be converted to a string or number, try it, otherwise fallback
    const num = Number(val);
    return Number.isNaN(num) ? 0 : num;
  }

  // Remove commas, currency symbols, and extra whitespaces
  const cleanVal = val.replace(/[,\s₹$]/g, '').trim();
  if (cleanVal === '') return 0;

  const parsed = parseFloat(cleanVal);
  return Number.isNaN(parsed) ? 0 : parsed;
};
