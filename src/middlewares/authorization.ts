import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";

interface JwtPayload {
  id: number;
  username: string;
}

const verifyToken = (
  req: Request & { user?: JwtPayload },
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ message: "Token tidak ditemukan" });
      return;
    }

    const [bearer, token] = authHeader.split(" ");

    if (bearer !== "Bearer" || !token) {
      res.status(401).json({ message: "Format token salah" });
      return;
    }

    const secret = process.env.SECRET;
    if (!secret) {
      res.status(500).json({ message: "JWT secret belum diset" });
      return;
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;

    req.user = decoded; // ✅ SIMPAN PAYLOAD
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

export { verifyToken };
