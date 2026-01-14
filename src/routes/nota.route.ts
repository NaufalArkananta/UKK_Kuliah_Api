import { Router } from "express";
import { cetakNotaHtml, cetakNotaPdf } from "../controllers/nota.controller";
import { verifyToken } from "../middlewares/authorization";

const router = Router();

router.get("/cetaknota/:id/html", verifyToken, cetakNotaHtml);
router.get("/cetaknota/:id/pdf", verifyToken, cetakNotaPdf);

export default router;
