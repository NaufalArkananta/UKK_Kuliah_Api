import { Router } from "express";
import { verifyToken } from "../middlewares/authorization";
import {
  createMenuValidation, updateMenuValidation,
} from "../middlewares/menu.validation";
import {
  createMenu, updateMenu, deleteMenu,
  getMenuStan,
} from "../controllers/menu.controller";
import { uploadMenuImage } from "../middlewares/menu.upload";
import authorizeStan from "../middlewares/authorize.stan";

const router = Router();

// ROUTES MENU FOR ROLE STAN

router.post("/tambahmenu", verifyToken, authorizeStan, uploadMenuImage.single("foto"), createMenuValidation, createMenu);
router.put("/updatemenu/:id", verifyToken, authorizeStan, uploadMenuImage.single("foto"), updateMenuValidation, updateMenu);
router.delete("/hapus_menu/:id", verifyToken, authorizeStan, deleteMenu);
router.get("/showmenu", verifyToken, authorizeStan, getMenuStan);

export default router;
