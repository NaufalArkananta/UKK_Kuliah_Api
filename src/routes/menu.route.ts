import { Router } from "express";
import { verifyToken } from "../middlewares/authorization";
import {
  createMenuValidation, updateMenuValidation,
} from "../middlewares/menu.validation";
import {
  createMenu, updateMenu, deleteMenu,
  getMenuStan,
  getMenuDiskonAll,
  getMenuMakanan,
  getMenuAll,
  getMenuMinuman,
} from "../controllers/menu.controller";
import { uploadMenuImage } from "../middlewares/menu.upload";
import authorizeStan from "../middlewares/authorize.stan";

const router = Router();

// ROUTES MENU FOR ROLE STAN

router.post("/tambahmenu", verifyToken, authorizeStan, uploadMenuImage.single("foto"), createMenuValidation, createMenu);
router.put("/updatemenu/:id", verifyToken, authorizeStan, uploadMenuImage.single("foto"), updateMenuValidation, updateMenu);
router.delete("/hapus_menu/:id", verifyToken, authorizeStan, deleteMenu);
router.get("/showmenu", verifyToken, authorizeStan, getMenuStan);

// ROUTES MENU FOR ALL USERS

router.get("/getmenudiskonsiswa", getMenuDiskonAll);
router.get("/getmenufood", getMenuMakanan);
router.get("/getmenudrink", getMenuMinuman);
router.get("/menu", getMenuAll);

export default router;
