// src/utils/httpClient.js - HTTP client with timeout and headers

/**
 * Default headers for all requests
 */
const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36'
};

/**
 * Creates fetch request with timeout and custom headers
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds (default: 15000)
 * @returns {Promise<Response>} Fetch response
 */
export async function fetchWithConfig(url, options = {}, timeout = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...DEFAULT_HEADERS,
        ...options.headers
      }
    });
    
    clearTimeout(timeoutId);
    
    // Validate status (200-399)
    if (response.status < 200 || response.status >= 400) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Creates headers for proxying requests with referer
 * @param {string} refUrl - Referer URL
 * @returns {Object} Headers object
 */
export function createProxyHeaders(refUrl) {
  const refUrlObj = new URL(refUrl);
  
  return {
    'Referer': refUrl,
    'Origin': refUrl,
    'Authority': refUrlObj.hostname
  };
}

/**
 * Creates error response for HTTP errors
 * @param {Error} error - The HTTP error
 * @param {string} operation - Description of the operation that failed
 * @returns {Response} Error response
 */
export function createHttpErrorResponse(error, operation = 'HTTP request') {
  const statusCode = error.name === 'AbortError' ? 408 : 500;
  
  console.log(`▶️  Error in ${operation}: ${error}`);
  
  return new Response(
    JSON.stringify({ 
      error: `Failed to ${operation}`, 
      message: error.message,
      status: statusCode
    }),
    { 
      status: statusCode,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}