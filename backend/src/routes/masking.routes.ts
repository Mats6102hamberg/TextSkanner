import { Router } from 'express';
import { maskTextController, checkSensitiveInfo } from '../controllers/masking.controller';

const router = Router();

/**
 * POST /api/masking/mask
 * Maskera känslig information i text
 */
router.post('/mask', maskTextController);

/**
 * POST /api/masking/check
 * Kontrollera om text innehåller känslig information
 */
router.post('/check', checkSensitiveInfo);

export default router;
