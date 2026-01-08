import { Router } from "express";
import { authentication, createSiswa, getProfileSiswa, updateSiswa } from "../controllers/user.controller";
import { createSiswaValidation, loginValidation, updateSiswaValidation } from "../middlewares/user.validation";
import { verifyToken } from "../middlewares/authorization";
import { uploadUserImage } from "../middlewares/user.upload";

const router = Router()

router.post(`/register_siswa`,createSiswaValidation, createSiswa)
router.get(`/get_profile`, verifyToken, getProfileSiswa);
router.post(`/login_siswa`, loginValidation, authentication)
router.put(`/update_siswa`, verifyToken, uploadUserImage.single("foto"), updateSiswaValidation, updateSiswa);

export default router