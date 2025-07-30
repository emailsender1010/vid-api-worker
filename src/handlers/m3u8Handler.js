// src/handlers/m3u8Handler.js - M3U8 playlist proxy handler

import { parseUrl, validateQueryParams, createParamErrorResponse, createUrlErrorResponse } from '../utils/urlUtils.js';
import { fetchWithConfig, createProxyHeaders, createHttpErrorResponse } from '../utils/httpClient.js';
import { createCorsResponse } from '../middleware/cors.js';

/**
 * Processes M3U8 playlist content and rewrites URLs
 * @param {string} playlistText - Original playlist content
 * @param {string} m3u8Url - Original M3U8 URL
 * @param {string} refUrl - Referer URL
 * @returns {string} Processed playlist with rewritten URLs
 */
function processPlaylistContent(playlistText, m3u8Url, refUrl) {
  const baseForRelative = new URL('.', m3u8Url).href;
  const lines = playlistText.split(/\r?\n/);
  const out = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Master playlist reference
    if (line.startsWith('#EXT-X-STREAM-INF')) {
      out.push(line);
      const next = (lines[++i] || '').trim();
      if (!next) {
        console.error(`❌ [proxyM3U8][Parse Error] Missing URI after #EXT-X-STREAM-INF`);
        continue;
      }
      const abs = new URL(next, baseForRelative).href;
      out.push(
        `/player/stream?url=${encodeURIComponent(abs)}&ref=${encodeURIComponent(refUrl)}`
      );
    }
    // Media segment or variant
    else if (line && !line.startsWith('#')) {
      const abs = new URL(line, baseForRelative).href;
      out.push(
        `/segment?url=${encodeURIComponent(abs)}&ref=${encodeURIComponent(refUrl)}`
      );
    }
    // Comment or blank
    else {
      out.push(line);
    }
  }
  
  return out.join('\n');
}

/**
 * Handles M3U8 playlist proxying and URL rewriting
 * @param {Request} request - Incoming request
 * @param {URL} url - Parsed URL object
 * @returns {Promise<Response>} Proxied playlist response
 */
export async function proxyM3U8(request, url) {
  try {
    // Validate query parameters
    const validation = validateQueryParams(url.searchParams, ['url', 'ref']);
    if (!validation.isValid) {
      console.error(`❌ [proxyM3U8][Request Error] Missing query params: ${validation.missing.join(', ')}`);
      return createParamErrorResponse(validation.missing);
    }
    
    const { url: m3u8Param, ref: refParam } = validation.params;
    
    // Parse and validate URLs
    let m3u8Url, refUrl;
    try {
      m3u8Url = parseUrl(m3u8Param).href;
      refUrl = parseUrl(refParam).href;
    } catch (error) {
      console.error(`❌ [proxyM3U8][URL Parse Error] ${error.message}`);
      return createUrlErrorResponse(error);
    }
    
    console.log(`▶️  Fetching playlist: ${m3u8Url} (ref: ${refUrl})`);
    
    // Fetch playlist content
    const response = await fetchWithConfig(m3u8Url, {
      headers: createProxyHeaders(refUrl)
    });
    
    const playlistText = await response.text();
    
    // Process and rewrite playlist URLs
    const processedPlaylist = processPlaylistContent(playlistText, m3u8Url, refUrl);
    
    return createCorsResponse(processedPlaylist, {
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl'
      }
    });
    
  } catch (err) {
    return createHttpErrorResponse(err, 'proxy M3U8 playlist');
  }
}