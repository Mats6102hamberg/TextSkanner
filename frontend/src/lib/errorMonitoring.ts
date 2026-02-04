import { NextRequest, NextResponse } from "next/server";

// Simple error monitoring and logging
interface ErrorLog {
  timestamp: number;
  error: string;
  stack?: string;
  url: string;
  method: string;
  userAgent?: string;
  ip?: string;
}

// In-memory error logs (in production, use database or external service)
const errorLogs: ErrorLog[] = [];
const MAX_LOGS = 1000; // Keep only last 1000 errors

// Log error with context
export function logError(error: Error | string, req: NextRequest, context?: any) {
  const errorLog: ErrorLog = {
    timestamp: Date.now(),
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
    url: req.url,
    method: req.method,
    userAgent: req.headers.get('user-agent') || undefined,
    ip: req.ip || 
         req.headers.get('x-forwarded-for')?.split(',')[0] || 
         req.headers.get('x-real-ip') || 
         'unknown'
  };

  // Add context if provided
  if (context) {
    errorLog.error += ` | Context: ${JSON.stringify(context)}`;
  }

  // Add to logs
  errorLogs.push(errorLog);

  // Keep only recent logs
  if (errorLogs.length > MAX_LOGS) {
    errorLogs.shift();
  }

  // Console logging
  console.error('ERROR LOG:', {
    timestamp: new Date(errorLog.timestamp).toISOString(),
    error: errorLog.error,
    url: errorLog.url,
    method: errorLog.method,
    ip: errorLog.ip
  });

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Send to Sentry, DataDog, or similar
    console.log('PRODUCTION: Error sent to monitoring service');
  }
}

// Get recent errors
export function getRecentErrors(limit: number = 50): ErrorLog[] {
  return errorLogs.slice(-limit).reverse();
}

// Get error statistics
export function getErrorStats() {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const oneDay = 24 * 60 * 60 * 1000;

  const recentErrors = errorLogs.filter(log => now - log.timestamp < oneHour);
  const dailyErrors = errorLogs.filter(log => now - log.timestamp < oneDay);

  // Count errors by URL
  const errorsByUrl = errorLogs.reduce((acc, log) => {
    acc[log.url] = (acc[log.url] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total: errorLogs.length,
    lastHour: recentErrors.length,
    lastDay: dailyErrors.length,
    errorsByUrl: Object.entries(errorsByUrl)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
  };
}

// Middleware for error monitoring
export function withErrorMonitoring(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(req);
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), req);
      
      return NextResponse.json(
        { 
          error: 'Internal server error',
          message: 'An unexpected error occurred. The issue has been logged.',
          timestamp: Date.now()
        },
        { status: 500 }
      );
    }
  };
}

// API endpoint to get error stats (for admin dashboard)
export async function GET_ERRORS(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const stats = getErrorStats();
    const errors = getRecentErrors(limit);

    return NextResponse.json({
      stats,
      errors: errors.map(log => ({
        ...log,
        timestamp: new Date(log.timestamp).toISOString()
      }))
    });
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), req);
    return NextResponse.json(
      { error: 'Failed to get error logs' },
      { status: 500 }
    );
  }
}
