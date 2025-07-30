// src/utils/urlUtils.js - URL validation and parsing utilities

/**
 * Validates and normalizes URLs
 * @param {string} input - URL string to parse
 * @returns {URL} Parsed URL object
 * @throws {Error} If URL is invalid
 */
export function parseUrl(input) {
  try {
    return new URL(input);
  } catch (error) {
    console.error(`❌ URL Parse Error: ${input} - ${error.message}`);
    throw new Error(`Invalid URL: ${input}`);
  }
}

/**
 * Validates required query parameters
 * @param {URLSearchParams} searchParams - URL search parameters
 * @param {string[]} requiredParams - Array of required parameter names
 * @returns {Object} Object containing validation result and parsed parameters
 */
export function validateQueryParams(searchParams, requiredParams = ['url', 'ref']) {
  const params = {};
  const missing = [];
  
  for (const param of requiredParams) {
    const value = searchParams.get(param);
    if (!value) {
      missing.push(param);
    } else {
      params[param] = value;
    }
  }
  
  return {
    isValid: missing.length === 0,
    params,
    missing
  };
}

/**
 * Creates error response for missing parameters
 * @param {string[]} missingParams - Array of missing parameter names
 * @returns {Response} Error response
 */
export function createParamErrorResponse(missingParams) {
  return new Response(
    JSON.stringify({ 
      error: `Missing required query parameters: ${missingParams.join(', ')}`,
      required: missingParams
    }),
    { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Creates error response for URL parsing errors
 * @param {Error} error - The parsing error
 * @returns {Response} Error response
 */
export function createUrlErrorResponse(error) {
  return new Response(
    JSON.stringify({ error: error.message }),
    { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}