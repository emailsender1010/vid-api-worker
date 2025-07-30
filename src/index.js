// src/index.js - Main entry point and request router
import { proxyM3U8 } from './handlers/m3u8Handler.js';
import { proxySegment } from './handlers/segmentHandler.js';
import { handleOptions } from './middleware/cors.js';

/**
 * Main request handler for the Cloudflare Worker
 * Routes requests to appropriate handlers based on pathname
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }
    
    // Only handle GET requests
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Route requests to appropriate handlers
    switch (url.pathname) {
      case '/player/stream':
        return proxyM3U8(request, url);
      
      case '/segment':
        return proxySegment(request, url);
      
      case '/':
      case '/health':
        return new Response(JSON.stringify({ 
          status: 'ok', 
          service: 'Video Proxy Worker',
          endpoints: ['/player/stream', '/segment']
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      
      default:
        return new Response(JSON.stringify({ 
          error: 'Not found',
          available_endpoints: ['/player/stream', '/segment']
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
    }
  }
};