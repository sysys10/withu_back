import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AuthRequest, authMiddleware } from "../middleware/auth";
import { generateRefreshToken } from "../utils/jwtUtils";
import { generateAccessToken } from "../utils/jwtUtils";

export const authRouter = Router();

authRouter.post("/login", async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "존재하지 않는 이메일입니다." });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.hashed_password
    );

    if (!isPasswordValid) {
      return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    const deviceInfo = req.headers["user-agent"] || "unknown";
    const ipAddress = req.ip || "unknown";

    await prisma.authToken.create({
      data: {
        user_id: user.id,
        refresh_token: refreshToken,
        access_token: accessToken,
        device_info: deviceInfo,
        ip_address: ipAddress,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
      },
    });

    const { hashed_password, ...userWithoutPassword } = user;

    return res.json({
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "로그인 중 오류가 발생했습니다." });
  }
});

authRouter.post(
  "/register",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: "모든 필드를 입력해주세요." });
      }

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ message: "이미 존재하는 이메일입니다." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          name,
          email,
          hashed_password: hashedPassword,
        },
      });

      const { hashed_password, ...userWithoutPassword } = user;

      return res.json({
        message: "회원가입이 완료되었습니다.",
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res
        .status(500)
        .json({ message: "회원가입 중 오류가 발생했습니다." });
    }
  }
);

authRouter.post(
  "/refresh",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ message: "리프레시 토큰이 필요합니다." });
      }

      const tokenRecord = await prisma.authToken.findUnique({
        where: { refresh_token: refreshToken },
        include: { user: true },
      });

      if (
        !tokenRecord ||
        tokenRecord.is_revoked ||
        tokenRecord.expires_at < new Date()
      ) {
        console.log("유효하지 않은 리프레시 토큰입니다.");
        return res
          .status(402)
          .json({ message: "유효하지 않은 리프레시 토큰입니다." });
      }

      try {
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || "");
      } catch (error) {
        await prisma.authToken.update({
          where: { id: tokenRecord.id },
          data: { is_revoked: true },
        });
        return res.status(402).json({ message: "만료된 리프레시 토큰입니다." });
      }

      // 새로운 액세스 토큰 발급
      const newAccessToken = jwt.sign(
        { id: tokenRecord.user_id },
        process.env.ACCESS_TOKEN_SECRET || "",
        { expiresIn: "15m" }
      );

      // await prisma.authToken.update({
      //   where: { id: tokenRecord.id },
      //   data: { access_token: newAccessToken },
      // });

      return res.json({
        accessToken: newAccessToken,
      });
    } catch (error) {
      console.error("Token refresh error:", error);
      return res
        .status(500)
        .json({ message: "토큰 갱신 중 오류가 발생했습니다." });
    }
  }
);

// 로그아웃 라우트
authRouter.post(
  "/logout",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      const userId = req.user?.id;
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ message: "리프레시 토큰이 필요합니다." });
      }

      await prisma.authToken.updateMany({
        where: {
          user_id: userId,
          refresh_token: refreshToken,
        },
        data: {
          is_revoked: true,
        },
      });

      return res.json({ message: "로그아웃 되었습니다." });
    } catch (error) {
      console.error("Logout error:", error);
      return res
        .status(500)
        .json({ message: "로그아웃 중 오류가 발생했습니다." });
    }
  }
);

// 내 정보 조회 라우트
authRouter.get(
  "/me",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      const userId = req.user?.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          gender: true,
          age: true,
          profile_image: true,
          bio: true,
          is_verified: true,
          created_at: true,
          updated_at: true,
          isComplete: true,
        },
      });

      if (!user) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      }

      return res.json(user);
    } catch (error) {
      console.error("Get user info error:", error);
      return res
        .status(500)
        .json({ message: "사용자 정보 조회 중 오류가 발생했습니다." });
    }
  }
);
