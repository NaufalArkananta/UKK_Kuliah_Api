import { Router } from "express";
import { verifyToken } from "../middlewares/authorization";
import { createDiskonValidation, updateDiskonValidation } from "../middlewares/diskon.validation";
import { createDiskon, getAllDiskon, getDiskonById, updateDiskon } from "../controllers/diskon.controller";
import authorizeStan from "../middlewares/authorize.stan";

const router = Router();

router.post("/tambahdiskon", verifyToken, authorizeStan, createDiskonValidation, createDiskon);
router.put("/updatediskon/:id", verifyToken, authorizeStan, updateDiskonValidation, updateDiskon);
router.get("/showdiskon", verifyToken, authorizeStan, getAllDiskon);
router.get("/detaildiskon/:id", verifyToken, authorizeStan, getDiskonById);

export default router;