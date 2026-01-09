import { Router } from "express";
import { cetakNotaByOrderId, createPesan, getMonthlyIncomeAndTopMenu, getOrderByStatusSiswa, getOrderByStatusStan, getOrderHistoryByMonth, getOrderHistoryByMonthSiswa, updateOrderStatusByStan } from "../controllers/order.controller";
import { verifyToken } from "../middlewares/authorization";
import { createPesanValidation } from "../middlewares/order.validation";
import authorizeStan from "../middlewares/authorize.stan";

const router = Router()

// SISWA ROUTES

router.post("/pesan", verifyToken, createPesanValidation, createPesan);
router.get("/showorder", verifyToken, getOrderByStatusSiswa);
router.get("/showorder/:status", verifyToken, getOrderByStatusSiswa);
router.get("/showorderbymonthbysiswa/:bulan", verifyToken, getOrderHistoryByMonthSiswa);
router.get("/cetaknota/:id", verifyToken, cetakNotaByOrderId);

// STAN ROUTES

router.get("/getorder", verifyToken, authorizeStan, getOrderByStatusStan);
router.get("/getorder/:status", verifyToken, authorizeStan, getOrderByStatusStan);
router.put(`/updatestatus/:id`, verifyToken, authorizeStan, updateOrderStatusByStan);
router.get(`/showpemasukanbybulan/:bulan`, verifyToken, authorizeStan, getMonthlyIncomeAndTopMenu);
router.get("/showorderbymonth/:bulan", verifyToken, authorizeStan, getOrderHistoryByMonth);

export default router;