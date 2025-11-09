// Utility functions to handle DynamoDB data format safely

/**
 * Safely extracts values from DynamoDB format to prevent React render errors
 * @param {any} value - The value that might be in DynamoDB format {N: "1"} or {S: "text"}
 * @param {any} defaultValue - Default value to return if extraction fails
 * @returns {any} - Clean value safe for React rendering
 */
export const extractValue = (value, defaultValue = '') => {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  if (typeof value === 'object' && value !== null) {
    // Handle DynamoDB format like {N: "1"} for numbers
    if (value.N) return value.N;
    // Handle DynamoDB format like {S: "text"} for strings  
    if (value.S) return value.S;
    // Handle DynamoDB format like {BOOL: true} for booleans
    if (value.BOOL !== undefined) return value.BOOL;
    // Handle DynamoDB format like {L: [...]} for lists
    if (value.L) return value.L;
    // Handle DynamoDB format like {M: {...}} for maps
    if (value.M) return value.M;
    
    // If it's a regular object but not DynamoDB format, return as is
    return value;
  }
  
  return value || defaultValue;
};

/**
 * Safely extracts numeric values from DynamoDB format
 * @param {any} value - The value that might be in DynamoDB format {N: "1"}
 * @param {number} defaultValue - Default numeric value
 * @returns {number} - Clean numeric value
 */
export const extractNumber = (value, defaultValue = 0) => {
  const extracted = extractValue(value, defaultValue);
  const num = Number(extracted);
  return isNaN(num) ? defaultValue : num;
};

/**
 * Safely extracts string values from DynamoDB format
 * @param {any} value - The value that might be in DynamoDB format {S: "text"}
 * @param {string} defaultValue - Default string value
 * @returns {string} - Clean string value
 */
export const extractString = (value, defaultValue = '') => {
  const extracted = extractValue(value, defaultValue);
  return String(extracted);
};

/**
 * Safely extracts boolean values from DynamoDB format
 * @param {any} value - The value that might be in DynamoDB format {BOOL: true}
 * @param {boolean} defaultValue - Default boolean value
 * @returns {boolean} - Clean boolean value
 */
export const extractBoolean = (value, defaultValue = false) => {
  const extracted = extractValue(value, defaultValue);
  if (typeof extracted === 'boolean') return extracted;
  if (typeof extracted === 'string') {
    return extracted.toLowerCase() === 'true';
  }
  return Boolean(extracted);
};

/**
 * Safely extracts array values from DynamoDB format
 * @param {any} value - The value that might be in DynamoDB format {L: [...]}
 * @param {array} defaultValue - Default array value
 * @returns {array} - Clean array value
 */
export const extractArray = (value, defaultValue = []) => {
  const extracted = extractValue(value, defaultValue);
  return Array.isArray(extracted) ? extracted : defaultValue;
};