import { NextRequest, NextResponse } from "next/server";
import { rateLimit, createRateLimitResponse, addRateLimitHeaders, rateLimitMap } from "@/lib/rateLimit";

// Middleware wrapper for rate limiting
export function withRateLimit(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Check rate limit
    const rateLimitResult = rateLimit(req);
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.resetTime!);
    }

    try {
      // Execute the actual handler
      const response = await handler(req);
      
      // Add rate limit headers
      const remaining = rateLimitResult.success ? 
        Math.max(0, 50 - (rateLimitMap.get(req.ip || 'unknown')?.count || 0)) : 0;
      
      return addRateLimitHeaders(response, remaining, rateLimitResult.resetTime!);
    } catch (error) {
      console.error('Rate limited request error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Helper function to get rate limit info
export function getRateLimitInfo(req: NextRequest) {
  const ip = req.ip || 
    req.headers.get('x-forwarded-for')?.split(',')[0] || 
    req.headers.get('x-real-ip') || 
    'unknown';
  
  const record = rateLimitMap.get(ip);
  const now = Date.now();
  
  if (!record || now > record.resetTime) {
    return {
      limit: 50,
      remaining: 50,
      resetTime: now + 60000,
      success: true
    };
  }
  
  return {
    limit: 50,
    remaining: Math.max(0, 50 - record.count),
    resetTime: record.resetTime,
    success: record.count < 50
  };
}

