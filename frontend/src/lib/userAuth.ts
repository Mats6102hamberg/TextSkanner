import { NextRequest, NextResponse } from "next/server";

// Simple user authentication system (in production, use proper auth)
interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  usage: {
    requests: number;
    lastReset: number;
  };
  createdAt: number;
}

// In-memory user store (in production, use database)
const users = new Map<string, User>();

// Usage quotas by plan
const QUOTAS = {
  free: {
    requests: 100,      // 100 requests per day
    features: ['basic']
  },
  pro: {
    requests: 1000,     // 1000 requests per day
    features: ['basic', 'advanced']
  },
  enterprise: {
    requests: 10000,    // 10000 requests per day
    features: ['basic', 'advanced', 'premium']
  }
};

// Simple API key generation
function generateApiKey(): string {
  return 'ts_' + Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Create demo user
function createDemoUser(email: string, plan: User['plan'] = 'free'): User {
  const user: User = {
    id: generateApiKey(),
    email,
    name: email.split('@')[0],
    plan,
    usage: {
      requests: 0,
      lastReset: Date.now()
    },
    createdAt: Date.now()
  };
  
  users.set(user.id, user);
  return user;
}

// Get user by API key
export function getUserByApiKey(apiKey: string): User | null {
  return users.get(apiKey) || null;
}

// Check user quota
export function checkUserQuota(user: User): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  
  // Reset daily counter if needed
  if (now - user.usage.lastReset > oneDay) {
    user.usage.requests = 0;
    user.usage.lastReset = now;
  }
  
  const quota = QUOTAS[user.plan];
  const remaining = quota.requests - user.usage.requests;
  const resetTime = user.usage.lastReset + oneDay;
  
  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
    resetTime
  };
}

// Track user usage
export function trackUserUsage(user: User): void {
  user.usage.requests++;
}

// Get or create user from request
export function getUserFromRequest(req: NextRequest): User | null {
  const apiKey = req.headers.get('x-api-key');
  
  if (!apiKey) {
    // Create demo user for development
    const email = `demo-${Date.now()}@textscanner.dev`;
    return createDemoUser(email, 'free');
  }
  
  return getUserByApiKey(apiKey);
}

// Middleware for user authentication and quota checking
export function withAuth(handler: (req: NextRequest, user: User) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const user = getUserFromRequest(req);
      
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        );
      }
      
      const quota = checkUserQuota(user);
      
      if (!quota.allowed) {
        return NextResponse.json(
          { 
            error: 'Quota exceeded',
            message: `Daily quota of ${QUOTAS[user.plan].requests} requests exceeded`,
            resetTime: quota.resetTime,
            plan: user.plan
          },
          { 
            status: 429,
            headers: {
              'X-Quota-Remaining': quota.remaining.toString(),
              'X-Quota-Reset': quota.resetTime.toString(),
              'X-User-Plan': user.plan
            }
          }
        );
      }
      
      // Track usage
      trackUserUsage(user);
      
      // Execute handler
      const response = await handler(req, user);
      
      // Add user info to headers
      response.headers.set('X-User-ID', user.id);
      response.headers.set('X-User-Plan', user.plan);
      response.headers.set('X-Quota-Remaining', quota.remaining.toString());
      
      return response;
      
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      );
    }
  };
}

// API endpoints for user management
export async function createUser(req: NextRequest) {
  try {
    const { email, plan = 'free' } = await req.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    const user = createDemoUser(email, plan);
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        apiKey: user.id
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

export async function getUserInfo(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const quota = checkUserQuota(user);
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        usage: user.usage,
        quota: {
          limit: QUOTAS[user.plan].requests,
          remaining: quota.remaining,
          resetTime: quota.resetTime
        }
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get user info' },
      { status: 500 }
    );
  }
}
