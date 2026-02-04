import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rateLimitMiddleware";
import { withCostTracking } from "@/lib/costTracker";
import { withErrorMonitoring } from "@/lib/errorMonitoring";
import { withAuth } from "@/lib/userAuth";

// Combined middleware for all protections
export function withProtection(handler: (req: NextRequest, user?: any) => Promise<NextResponse>) {
  return withErrorMonitoring(
    withCostTracking(
      withRateLimit(
        withAuth(handler)
      )
    )
  );
}

// Simple protection (rate limiting + error monitoring only)
export function withBasicProtection(handler: (req: NextRequest) => Promise<NextResponse>) {
  return withErrorMonitoring(
    withRateLimit(handler)
  );
}

// Full protection (auth + rate limiting + cost tracking + error monitoring)
export function withFullProtection(handler: (req: NextRequest, user: any) => Promise<NextResponse>) {
  return withProtection(handler);
}

// Admin-only protection
export function withAdminProtection(handler: (req: NextRequest, user: any) => Promise<NextResponse>) {
  return withProtection(async (req: NextRequest, user: any) => {
    // Check if user is admin (in production, check user.role)
    if (user.plan !== 'enterprise') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    return handler(req, user);
  });
}
