import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { maskText, getMaskingStats, containsSensitiveInfo } from '../services/masking.service';

const maskRequestSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  options: z.object({
    maskPersonnummer: z.boolean().optional(),
    maskEmail: z.boolean().optional(),
    maskPhone: z.boolean().optional(),
    maskLongNumbers: z.boolean().optional(),
  }).optional(),
});

/**
 * POST /api/masking/mask
 * Maskera känslig information i text
 */
export async function maskTextController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = maskRequestSchema.parse(req.body);

    const result = maskText(parsed.text, parsed.options);
    const stats = getMaskingStats(result);

    res.json({
      originalText: result.originalText,
      maskedText: result.maskedText,
      changes: result.changes,
      stats,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/masking/check
 * Kontrollera om text innehåller känslig information
 */
export async function checkSensitiveInfo(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { text } = z.object({ text: z.string() }).parse(req.body);

    const hasSensitiveInfo = containsSensitiveInfo(text);
    const result = maskText(text);
    const stats = getMaskingStats(result);

    res.json({
      hasSensitiveInfo,
      stats,
      types: result.changes.map(c => c.type),
    });
  } catch (err) {
    next(err);
  }
}
