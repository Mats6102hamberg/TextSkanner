import { Router } from "express";
import { ocrFromImage } from "../controllers/ocr.controller";

const router = Router();

// POST /api/ocr
router.post("/", ocrFromImage);

export default router;
