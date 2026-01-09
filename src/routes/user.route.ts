import { Router } from "express";
import { authentication, createSiswa, createStan, deleteSiswa, getAllSiswa, getProfileSiswa, getProfileStan, updateSiswa, updateSiswaByStan, updateStan } from "../controllers/user.controller";
import { createSiswaValidation, createStanValidation, loginValidation, updateSiswaValidation, updateStanValidation } from "../middlewares/user.validation";
import { verifyToken } from "../middlewares/authorization";
import { uploadUserImage } from "../middlewares/user.upload";
import authorizeStan from "../middlewares/authorize.stan";

const router = Router()

// ROUTE SISWA

router.post(`/register_siswa`,createSiswaValidation, createSiswa)
router.get(`/get_profile`, verifyToken, getProfileSiswa);
router.post(`/login_siswa`, loginValidation, authentication)
router.put(`/update_siswa`, verifyToken, uploadUserImage.single("foto"), updateSiswaValidation, updateSiswa);

// ROUTE STAN

router.post(`/register_stan`,createStanValidation, createStan)
router.post(`/login_stan`, loginValidation, authentication)
router.put(`/update_stan`, verifyToken, authorizeStan, uploadUserImage.single("foto"), updateStanValidation, updateStan);
router.get(`/get_stan`, verifyToken, authorizeStan, getProfileStan);

// REGISTER SISWA BY STAN

router.post(`/tambah_siswa`, verifyToken, authorizeStan, createSiswaValidation, createSiswa)
router.put(`/ubah_siswa/:id`, verifyToken, authorizeStan, uploadUserImage.single("foto"), updateSiswaValidation, updateSiswaByStan);
router.get("/get_siswa", verifyToken, authorizeStan, getAllSiswa);
router.delete("/hapus_siswa/:id", verifyToken, authorizeStan, deleteSiswa);

export default router