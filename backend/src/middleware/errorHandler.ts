import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("❌ Error:", err);

  if (err.name === "ZodError") {
    return res.status(400).json({
      error: "Validation error",
      issues: err.issues
    });
  }

  res.status(500).json({ error: "Internal server error" });
}
