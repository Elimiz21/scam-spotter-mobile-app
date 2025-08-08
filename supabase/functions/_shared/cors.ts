// CORS configuration with environment-based origin restrictions

const getAllowedOrigins = (): string[] => {
  const env = Deno.env.get('ENVIRONMENT') || 'development';
  
  // Define allowed origins based on environment
  const origins: Record<string, string[]> = {
    production: [
      'https://www.scamshiel.com',
      'https://scamshiel.com',
      'https://app.scamshiel.com'
    ],
    staging: [
      'https://staging.scamshiel.com',
      'https://www.scamshiel.com',
      'https://scamshiel.com'
    ],
    development: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'https://www.scamshiel.com' // Allow production domain in dev for testing
    ]
  };
  
  return origins[env] || origins.development;
};

const isOriginAllowed = (origin: string | null): boolean => {
  if (!origin) return false;
  
  const allowedOrigins = getAllowedOrigins();
  
  // Check if origin is in the allowed list
  if (allowedOrigins.includes(origin)) {
    return true;
  }
  
  // In development, also allow Capacitor origins for mobile testing
  const env = Deno.env.get('ENVIRONMENT') || 'development';
  if (env === 'development') {
    // Allow Capacitor origins
    if (origin.startsWith('capacitor://') || 
        origin.startsWith('ionic://') ||
        origin === 'http://localhost' ||
        origin.includes('localhost')) {
      return true;
    }
  }
  
  return false;
};

export const getCorsHeaders = (request: Request): HeadersInit => {
  const origin = request.headers.get('origin');
  
  // For OPTIONS preflight requests, always return CORS headers
  if (request.method === 'OPTIONS') {
    if (isOriginAllowed(origin)) {
      return {
        'Access-Control-Allow-Origin': origin!,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
        'Access-Control-Max-Age': '86400', // 24 hours
        'Access-Control-Allow-Credentials': 'true'
      };
    } else {
      // Return minimal headers for rejected origins
      return {
        'Access-Control-Allow-Origin': 'null',
        'Access-Control-Allow-Methods': 'OPTIONS'
      };
    }
  }
  
  // For actual requests, validate origin
  if (isOriginAllowed(origin)) {
    return {
      'Access-Control-Allow-Origin': origin!,
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
      'Access-Control-Allow-Credentials': 'true',
      'Vary': 'Origin' // Important for caching
    };
  }
  
  // No CORS headers for disallowed origins
  return {};
};

// Legacy export for backward compatibility (will be removed in future)
// This should only be used during migration period
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

// Helper function to create CORS error response
export const createCorsErrorResponse = (message: string = 'CORS origin not allowed'): Response => {
  return new Response(
    JSON.stringify({ error: message }),
    { 
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};

// Helper function to handle OPTIONS preflight
export const handleOptions = (request: Request): Response => {
  const headers = getCorsHeaders(request);
  
  // If origin is not allowed, return 403
  if (!headers['Access-Control-Allow-Origin'] || headers['Access-Control-Allow-Origin'] === 'null') {
    return createCorsErrorResponse();
  }
  
  return new Response(null, { status: 204, headers });
};

// Middleware function to validate CORS
export const validateCors = (request: Request): Response | null => {
  // Handle OPTIONS
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }
  
  // Validate origin for other methods
  const origin = request.headers.get('origin');
  if (origin && !isOriginAllowed(origin)) {
    return createCorsErrorResponse();
  }
  
  return null; // Request is valid
};