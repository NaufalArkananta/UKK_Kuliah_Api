import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
    id: number;
    username: string;
    role: string;
}

const authorizeStan = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ message: "Unauthorized, token is missing" });
            return;
        }

        const token = authHeader.split(" ")[1]; // Ambil token setelah "Bearer"
        const secret = process.env.SECRET || "" // Ganti dengan kunci rahasia JWT Anda

        // Verifikasi dan decode token
        const decoded = jwt.verify(token, secret) as JwtPayload;

        // Periksa role dari payload
        if (decoded.role !== "ADMIN_STAN") {
            res.status(403).json({ message: "Forbidden, only admins can perform this action" });
            return;
        }

        // Lolos validasi, lanjut ke handler berikutnya
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid token", error });
    }
};

export default authorizeStan;