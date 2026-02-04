import { NextRequest, NextResponse } from "next/server";

// Cost tracking for OpenAI API usage
interface CostTracker {
  dailyUsage: number;
  monthlyUsage: number;
  requestCount: number;
  lastReset: {
    daily: number;
    monthly: number;
  };
}

// In-memory cost tracker (in production, use database)
const costTracker: CostTracker = {
  dailyUsage: 0,
  monthlyUsage: 0,
  requestCount: 0,
  lastReset: {
    daily: Date.now(),
    monthly: Date.now()
  }
};

// OpenAI GPT-4o-mini pricing (as of 2024)
const PRICING = {
  'gpt-4o-mini': {
    input: 0.00015, // $0.15 per 1M input tokens
    output: 0.0006  // $0.60 per 1M output tokens
  }
};

// Cost limits (in USD)
const COST_LIMITS = {
  daily: 10.00,    // $10 per day
  monthly: 100.00, // $100 per month
  alert: 5.00      // Alert at $5 daily usage
};

// Reset counters if needed
function resetCounters() {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneMonth = 30 * 24 * 60 * 60 * 1000;

  // Reset daily counter
  if (now - costTracker.lastReset.daily > oneDay) {
    costTracker.dailyUsage = 0;
    costTracker.lastReset.daily = now;
  }

  // Reset monthly counter
  if (now - costTracker.lastReset.monthly > oneMonth) {
    costTracker.monthlyUsage = 0;
    costTracker.lastReset.monthly = now;
  }
}

// Estimate cost for OpenAI API call
export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = PRICING[model as keyof typeof PRICING];
  if (!pricing) return 0;

  const inputCost = (inputTokens / 1000000) * pricing.input;
  const outputCost = (outputTokens / 1000000) * pricing.output;
  
  return inputCost + outputCost;
}

// Track cost and check limits
export function trackCost(cost: number): { allowed: boolean; warning?: string; usage: CostTracker } {
  resetCounters();
  
  costTracker.dailyUsage += cost;
  costTracker.monthlyUsage += cost;
  costTracker.requestCount += 1;

  // Check daily limit
  if (costTracker.dailyUsage > COST_LIMITS.daily) {
    return {
      allowed: false,
      warning: `Daily cost limit exceeded ($${COST_LIMITS.daily.toFixed(2)})`,
      usage: { ...costTracker }
    };
  }

  // Check monthly limit
  if (costTracker.monthlyUsage > COST_LIMITS.monthly) {
    return {
      allowed: false,
      warning: `Monthly cost limit exceeded ($${COST_LIMITS.monthly.toFixed(2)})`,
      usage: { ...costTracker }
    };
  }

  // Check alert threshold
  let warning: string | undefined;
  if (costTracker.dailyUsage > COST_LIMITS.alert) {
    warning = `Approaching daily cost limit: $${costTracker.dailyUsage.toFixed(2)} / $${COST_LIMITS.daily.toFixed(2)}`;
  }

  return {
    allowed: true,
    warning,
    usage: { ...costTracker }
  };
}

// Get current usage statistics
export function getUsageStats(): CostTracker {
  resetCounters();
  return { ...costTracker };
}

// Middleware for cost monitoring
export function withCostTracking(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const response = await handler(req);
      
      // Add cost headers
      const stats = getUsageStats();
      response.headers.set('X-Cost-Daily', stats.dailyUsage.toString());
      response.headers.set('X-Cost-Monthly', stats.monthlyUsage.toString());
      response.headers.set('X-Request-Count', stats.requestCount.toString());
      
      return response;
    } catch (error) {
      console.error('Cost tracking error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Log cost for monitoring
export function logCost(model: string, inputTokens: number, outputTokens: number, cost: number) {
  console.log(`OpenAI API Usage - Model: ${model}, Input: ${inputTokens}, Output: ${outputTokens}, Cost: $${cost.toFixed(4)}`);
  
  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Send to Sentry, DataDog, or similar
    console.log('PRODUCTION: Cost data sent to monitoring service');
  }
}
