import { Router } from "express";
import { healthHandler } from "../controllers/health.controller";
import ocrRouter from "./ocr.routes";

const router = Router();

router.get("/health", healthHandler);
router.use("/ocr", ocrRouter);

export default router;
