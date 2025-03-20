import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { verifyAccessToken } from "../utils/jwtUtils";

export interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "인증 토큰이 필요합니다." });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = verifyAccessToken(token);
      req.user = { id: decoded.id };
      next();
    } catch (error) {
      return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
    }
  } catch (error) {
    return res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};
