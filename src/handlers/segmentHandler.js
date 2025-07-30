// src/handlers/segmentHandler.js - Video segment proxy handler

import { parseUrl, validateQueryParams, createParamErrorResponse, createUrlErrorResponse } from '../utils/urlUtils.js';
import { fetchWithConfig, createProxyHeaders, createHttpErrorResponse } from '../utils/httpClient.js';
import { createCorsResponse } from '../middleware/cors.js';

/**
 * Determines the content type for a segment based on URL and response headers
 * @param {Response} response - Original response
 * @param {string} segmentUrl - Segment URL
 * @returns {string} Content type
 */
function determineContentType(response, segmentUrl) {
  const responseContentType = response.headers.get('content-type');
  
  if (responseContentType) {
    return responseContentType;
  }
  
  // Fallback based on file extension
  if (segmentUrl.endsWith('.ts')) {
    return 'video/MP2T';
  } else if (segmentUrl.endsWith('.m4s')) {
    return 'video/mp4';
  } else if (segmentUrl.endsWith('.webm')) {
    return 'video/webm';
  }
  
  return 'application/octet-stream';
}

/**
 * Creates headers for segment response
 * @param {string} contentType - Content type
 * @returns {Object} Headers object
 */
function createSegmentHeaders(contentType) {
  return {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=3600', // Cache segments for 1 hour
    'Accept-Ranges': 'bytes'
  };
}

/**
 * Handles video segment proxying
 * @param {Request} request - Incoming request
 * @param {URL} url - Parsed URL object
 * @returns {Promise<Response>} Proxied segment response
 */
export async function proxySegment(request, url) {
  try {
    // Validate query parameters
    const validation = validateQueryParams(url.searchParams, ['url', 'ref']);
    if (!validation.isValid) {
      console.error(`❌ [proxySegment][Request Error] Missing query params: ${validation.missing.join(', ')}`);
      return createParamErrorResponse(validation.missing);
    }
    
    const { url: segParam, ref: refParam } = validation.params;
    
    // Parse and validate URLs
    let segmentUrl, refUrl;
    try {
      segmentUrl = parseUrl(segParam).href;
      refUrl = parseUrl(refParam).href;
    } catch (error) {
      console.error(`❌ [proxySegment][URL Parse Error] ${error.message}`);
      return createUrlErrorResponse(error);
    }
    
    console.log(`▶️  Fetching segment: ${segmentUrl} (ref: ${refUrl})`);
    
    // Fetch the segment
    const response = await fetchWithConfig(segmentUrl, {
      headers: createProxyHeaders(refUrl)
    });
    
    // Determine content type
    const contentType = determineContentType(response, segmentUrl);
    
    // Create segment headers
    const segmentHeaders = createSegmentHeaders(contentType);
    
    // Return the response with proper headers
    return createCorsResponse(response.body, {
      headers: segmentHeaders
    });
    
  } catch (err) {
    return createHttpErrorResponse(err, 'fetch video segment');
  }
}