import { Router } from "express";
import { healthHandler } from "../controllers/health.controller";
import ocrRouter from "./ocr.routes";
import contractsRouter from "./contracts.routes";
import languageRouter from "./language.routes";

const router = Router();

router.get("/health", healthHandler);
router.use("/ocr", ocrRouter);
router.use("/contracts", contractsRouter);
router.use("/language", languageRouter);

export default router;
