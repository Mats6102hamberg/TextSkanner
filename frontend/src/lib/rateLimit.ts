import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter for development
// In production, use Redis or database-backed rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = {
  // Requests per window
  requests: 50,
  // Window in milliseconds (1 minute)
  windowMs: 60 * 1000,
  // Cleanup interval
  cleanupMs: 5 * 60 * 1000, // 5 minutes
};

// Cleanup old entries
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, RATE_LIMIT.cleanupMs);

export { rateLimitMap };
export function rateLimit(request: NextRequest): { success: boolean; resetTime?: number } {
  const ip = request.ip || 
    request.headers.get('x-forwarded-for')?.split(',')[0] || 
    request.headers.get('x-real-ip') || 
    'unknown';
  
  const now = Date.now();
  const key = ip;
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    // New window or expired window
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs,
    });
    return { success: true, resetTime: now + RATE_LIMIT.windowMs };
  }

  if (record.count >= RATE_LIMIT.requests) {
    // Rate limit exceeded
    return { success: false, resetTime: record.resetTime };
  }

  // Increment counter
  record.count++;
  return { success: true, resetTime: record.resetTime };
}

export function createRateLimitResponse(resetTime: number) {
  return NextResponse.json(
    { 
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
      resetTime 
    },
    { 
      status: 429,
      headers: {
        'X-RateLimit-Limit': RATE_LIMIT.requests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': resetTime.toString(),
        'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
      }
    }
  );
}

export function addRateLimitHeaders(response: NextResponse, remaining: number, resetTime: number) {
  response.headers.set('X-RateLimit-Limit', RATE_LIMIT.requests.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', resetTime.toString());
  return response;
}
