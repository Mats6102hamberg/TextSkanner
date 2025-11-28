import { Router } from "express";

import { handleLanguageProcess } from "../controllers/language.controller";

const router = Router();

router.post("/process", handleLanguageProcess);

export default router;
