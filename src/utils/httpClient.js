// src/utils/httpClient.js - HTTP client with timeout and headers

/**
 * Default headers for all requests
 */
const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Cache-Control': 'no-cache'
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
    // Create Headers object for better compatibility
    const headers = new Headers();
    
    // Add default headers first
    Object.entries(DEFAULT_HEADERS).forEach(([key, value]) => {
      headers.set(key, value);
    });
    
    // Add custom headers (will override defaults if same key)
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: headers
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
 * @param {string} targetUrl - Target URL being requested
 * @returns {Object} Headers object
 */
export function createProxyHeaders(refUrl, targetUrl) {
  const refUrlObj = new URL(refUrl);
  const targetUrlObj = new URL(targetUrl);
  
  return {
    'Referer': refUrl,
    'Origin': refUrlObj.origin, // Fixed: Use origin format, not full URL
    'Host': targetUrlObj.hostname, // Fixed: Host should match target domain
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'cross-site'
  };
}

/**
 * Creates headers using Headers API (recommended for Cloudflare Workers)
 * @param {string} refUrl - Referer URL
 * @param {string} targetUrl - Target URL being requested
 * @returns {Headers} Headers object
 */
export function createProxyHeadersAPI(refUrl, targetUrl) {
  const refUrlObj = new URL(refUrl);
  const targetUrlObj = new URL(targetUrl);
  
  const headers = new Headers();
  
  headers.set('Referer', refUrl);
  headers.set('Origin', refUrlObj.origin);
  headers.set('Host', targetUrlObj.hostname);
  headers.set('Sec-Fetch-Dest', 'empty');
  headers.set('Sec-Fetch-Mode', 'cors');
  headers.set('Sec-Fetch-Site', 'cross-site');
  
  return headers;
}

/**
 * Fetches with proxy headers - combines fetchWithConfig and createProxyHeaders
 * @param {string} url - URL to fetch
 * @param {string} refUrl - Referer URL
 * @param {Object} options - Additional fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>} Fetch response
 */
export async function fetchWithProxy(url, refUrl, options = {}, timeout = 15000) {
  const proxyHeaders = createProxyHeaders(refUrl, url);
  
  return fetchWithConfig(url, {
    ...options,
    headers: {
      ...proxyHeaders,
      ...options.headers // Allow overriding proxy headers if needed
    }
  }, timeout);
}

/**
 * Creates error response for HTTP errors
 * @param {Error} error - The HTTP error
 * @param {string} operation - Description of the operation that failed
 * @returns {Response} Error response
 */
export function createHttpErrorResponse(error, operation = 'HTTP request') {
  let statusCode = 500;
  
  // More specific error handling
  if (error.name === 'AbortError') {
    statusCode = 408; // Request Timeout
  } else if (error.message.includes('HTTP 403')) {
    statusCode = 403; // Forbidden
  } else if (error.message.includes('HTTP 404')) {
    statusCode = 404; // Not Found
  } else if (error.message.includes('HTTP 429')) {
    statusCode = 429; // Too Many Requests
  } else if (error.message.includes('HTTP 502') || error.message.includes('HTTP 503')) {
    statusCode = 502; // Bad Gateway
  }
  
  console.log(`▶️  Error in ${operation}: ${error}`);
  
  return new Response(
    JSON.stringify({ 
      error: `Failed to ${operation}`, 
      message: error.message,
      status: statusCode,
      timestamp: new Date().toISOString()
    }),
    { 
      status: statusCode,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    }
  );
}

/**
 * Validates if a URL is accessible
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL appears valid
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts domain from URL
 * @param {string} url - URL to extract domain from
 * @returns {string} Domain name
 */
export function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}