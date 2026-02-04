import { NextRequest, NextResponse } from "next/server";
import { withFullProtection } from "@/lib/protection";
import { estimateCost, trackCost, logCost } from "@/lib/costTracker";
import { logError } from "@/lib/errorMonitoring";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

// Protected API route with all safety measures
export const POST = withFullProtection(async (req: NextRequest, user: any) => {
  try {
    const { text, mode } = await req.json();
    
    if (!text || !mode) {
      return NextResponse.json(
        { error: "Text and mode are required" },
        { status: 400 }
      );
    }

    // Estimate cost before making API call
    const estimatedTokens = Math.ceil(text.length / 4); // Rough estimate
    const estimatedCost = estimateCost('gpt-4o-mini', estimatedTokens, estimatedTokens);
    
    // Track cost
    const costResult = trackCost(estimatedCost);
    
    if (!costResult.allowed) {
      return NextResponse.json(
        { 
          error: "Cost limit exceeded",
          warning: costResult.warning,
          usage: costResult.usage
        },
        { status: 429 }
      );
    }

    // Make OpenAI API call
    const response = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: text,
      temperature: 0.3,
      maxTokens: 1000,
    });

    // Calculate actual cost
    const actualCost = estimateCost('gpt-4o-mini', response.usage?.promptTokens || 0, response.usage?.completionTokens || 0);
    
    // Log cost for monitoring
    logCost('gpt-4o-mini', response.usage?.promptTokens || 0, response.usage?.completionTokens || 0, actualCost);
    
    // Return response with cost info
    const result = NextResponse.json({
      success: true,
      text: response.text,
      usage: response.usage,
      cost: actualCost,
      warning: costResult.warning
    });

    // Add cost headers
    result.headers.set('X-Cost-Estimated', estimatedCost.toString());
    result.headers.set('X-Cost-Actual', actualCost.toString());
    result.headers.set('X-Tokens-Input', (response.usage?.promptTokens || 0).toString());
    result.headers.set('X-Tokens-Output', (response.usage?.completionTokens || 0).toString());

    return result;

  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), req, { user: user.id, mode });
    
    return NextResponse.json(
      { 
        error: "Processing failed",
        message: "An error occurred while processing your request"
      },
      { status: 500 }
    );
  }
});
