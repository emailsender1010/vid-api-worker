// src/middleware/cors.js - CORS handling middleware

/**
 * Default CORS headers
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

/**
 * Handles CORS preflight requests
 * @returns {Response} CORS preflight response
 */
export function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS
  });
}

/**
 * Adds CORS headers to a response
 * @param {Object} headers - Existing headers object
 * @returns {Object} Headers object with CORS headers added
 */
export function addCorsHeaders(headers = {}) {
  return {
    ...headers,
    ...CORS_HEADERS
  };
}

/**
 * Creates a response with CORS headers
 * @param {any} body - Response body
 * @param {Object} options - Response options
 * @returns {Response} Response with CORS headers
 */
export function createCorsResponse(body, options = {}) {
  return new Response(body, {
    ...options,
    headers: addCorsHeaders(options.headers)
  });
}