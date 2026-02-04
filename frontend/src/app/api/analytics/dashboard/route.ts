import { NextRequest, NextResponse } from "next/server";
import { withFullProtection } from "@/lib/protection";
import { getUsageStats } from "@/lib/costTracker";
import { getErrorStats, getRecentErrors } from "@/lib/errorMonitoring";
import { getUserFromRequest } from "@/lib/userAuth";

export const GET = withFullProtection(async (req: NextRequest, user: any) => {
  try {
    // Get usage statistics
    const costStats = getUsageStats();
    const errorStats = getErrorStats();
    const recentErrors = getRecentErrors(20);

    // Get user statistics
    const userStats = {
      plan: user.plan,
      usage: user.usage,
      quota: {
        limit: user.plan === 'free' ? 100 : user.plan === 'pro' ? 1000 : 10000,
        remaining: Math.max(0, (user.plan === 'free' ? 100 : user.plan === 'pro' ? 1000 : 10000) - user.usage.requests),
        resetTime: user.usage.lastReset + (24 * 60 * 60 * 1000)
      }
    };

    // System health metrics
    const systemHealth = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      timestamp: Date.now()
    };

    return NextResponse.json({
      success: true,
      data: {
        user: userStats,
        costs: {
          daily: costStats.dailyUsage,
          monthly: costStats.monthlyUsage,
          requestCount: costStats.requestCount,
          limits: {
            daily: 10.00,
            monthly: 100.00,
            alert: 5.00
          }
        },
        errors: {
          stats: errorStats,
          recent: recentErrors.map(error => ({
            ...error,
            timestamp: new Date(error.timestamp).toISOString(),
            timeAgo: getTimeAgo(error.timestamp)
          }))
        },
        system: systemHealth
      }
    });

  } catch (error) {
    console.error("Analytics dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to load analytics data" },
      { status: 500 }
    );
  }
});

function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
}
