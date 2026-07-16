import { Router } from "express";
import { upload } from "../middleware/upload";
import { importCsv } from "../controllers/import.controller";

const router = Router();

// POST /api/import  (multipart/form-data, field name "file")
router.post("/import", upload.single("file"), importCsv);

export default router;
