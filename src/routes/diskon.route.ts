import { Router } from "express";
import { verifyToken } from "../middlewares/authorization";
import { createDiskonValidation, createMenuDiskonValidation, updateDiskonValidation, updateMenuDiskonValidation } from "../middlewares/diskon.validation";
import { createDiskon, createMenuDiskon, getAllDiskon, getDiskonById, getMenuDiskon, getMenuDiskonByMenuId, updateDiskon, updateMenuDiskon } from "../controllers/diskon.controller";
import authorizeStan from "../middlewares/authorize.stan";

const router = Router();

router.post(`/tambahdiskon`, verifyToken, authorizeStan, createDiskonValidation, createDiskon);
router.put(`/updatediskon/:id`, verifyToken, authorizeStan, updateDiskonValidation, updateDiskon);
router.get(`/showdiskon`, verifyToken, authorizeStan, getAllDiskon);
router.get(`/detaildiskon/:id`, verifyToken, authorizeStan, getDiskonById);

router.post(`/insert_menu_diskon`, verifyToken, authorizeStan, createMenuDiskonValidation, createMenuDiskon);
router.get(`/getmenudiskon`, verifyToken, getMenuDiskon);
router.get(`/getmenudiskon/:menuId`, verifyToken, getMenuDiskonByMenuId);
router.put(`/update_menu_diskon/:id`, verifyToken, authorizeStan, updateMenuDiskonValidation, updateMenuDiskon);

export default router;