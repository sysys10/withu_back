"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
// src/routes/auth.ts
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../middleware/auth");
exports.authRouter = (0, express_1.Router)();
// 로그인 라우트
exports.authRouter.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield prisma_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(401).json({ message: "존재하지 않는 이메일입니다." });
        }
        const isPasswordValid = yield bcrypt_1.default.compare(password, user.hashed_password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
        }
        // 토큰 생성
        const refreshToken = jsonwebtoken_1.default.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET || "", { expiresIn: "7d" });
        const accessToken = jsonwebtoken_1.default.sign({ id: user.id }, process.env.ACCESS_TOKEN_SECRET || "", { expiresIn: "15m" });
        // 디바이스 및 IP 정보 가져오기
        const deviceInfo = req.headers["user-agent"] || "unknown";
        const ipAddress = req.ip || "unknown";
        // 리프레시 토큰을 DB에 저장
        yield prisma_1.prisma.authToken.create({
            data: {
                user_id: user.id,
                refresh_token: refreshToken,
                access_token: accessToken,
                device_info: deviceInfo,
                ip_address: ipAddress,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
            },
        });
        // 민감한 정보 제외하고 응답
        const { hashed_password } = user, userWithoutPassword = __rest(user, ["hashed_password"]);
        return res.json({
            user: userWithoutPassword,
            accessToken,
            refreshToken,
        });
    }
    catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "로그인 중 오류가 발생했습니다." });
    }
}));
// 회원가입 라우트
exports.authRouter.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "모든 필드를 입력해주세요." });
        }
        const existingUser = yield prisma_1.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return res.status(400).json({ message: "이미 존재하는 이메일입니다." });
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const user = yield prisma_1.prisma.user.create({
            data: {
                name,
                email,
                hashed_password: hashedPassword,
            },
        });
        // 민감한 정보 제외하고 응답
        const { hashed_password } = user, userWithoutPassword = __rest(user, ["hashed_password"]);
        return res.json({
            message: "회원가입이 완료되었습니다.",
            user: userWithoutPassword,
        });
    }
    catch (error) {
        console.error("Registration error:", error);
        return res
            .status(500)
            .json({ message: "회원가입 중 오류가 발생했습니다." });
    }
}));
// 토큰 갱신 라우트
exports.authRouter.post("/refresh", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: "리프레시 토큰이 필요합니다." });
        }
        // DB에서 리프레시 토큰 확인
        const tokenRecord = yield prisma_1.prisma.authToken.findUnique({
            where: { refresh_token: refreshToken },
            include: { user: true },
        });
        if (!tokenRecord ||
            tokenRecord.is_revoked ||
            tokenRecord.expires_at < new Date()) {
            return res
                .status(401)
                .json({ message: "유효하지 않은 리프레시 토큰입니다." });
        }
        // 토큰 검증
        try {
            jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || "");
        }
        catch (error) {
            // 토큰이 유효하지 않으면 DB에서도 삭제
            yield prisma_1.prisma.authToken.update({
                where: { id: tokenRecord.id },
                data: { is_revoked: true },
            });
            return res.status(401).json({ message: "만료된 리프레시 토큰입니다." });
        }
        // 새로운 액세스 토큰 발급
        const newAccessToken = jsonwebtoken_1.default.sign({ id: tokenRecord.user_id }, process.env.ACCESS_TOKEN_SECRET || "", { expiresIn: "15m" });
        // 토큰 레코드 업데이트
        yield prisma_1.prisma.authToken.update({
            where: { id: tokenRecord.id },
            data: { access_token: newAccessToken },
        });
        return res.json({
            accessToken: newAccessToken,
        });
    }
    catch (error) {
        console.error("Token refresh error:", error);
        return res
            .status(500)
            .json({ message: "토큰 갱신 중 오류가 발생했습니다." });
    }
}));
// 로그아웃 라우트
exports.authRouter.post("/logout", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: "리프레시 토큰이 필요합니다." });
        }
        // 해당 리프레시 토큰을 무효화
        yield prisma_1.prisma.authToken.updateMany({
            where: {
                user_id: userId,
                refresh_token: refreshToken,
            },
            data: {
                is_revoked: true,
            },
        });
        return res.json({ message: "로그아웃 되었습니다." });
    }
    catch (error) {
        console.error("Logout error:", error);
        return res
            .status(500)
            .json({ message: "로그아웃 중 오류가 발생했습니다." });
    }
}));
// 내 정보 조회 라우트
exports.authRouter.get("/me", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const user = yield prisma_1.prisma.user.findUnique({
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
    }
    catch (error) {
        console.error("Get user info error:", error);
        return res
            .status(500)
            .json({ message: "사용자 정보 조회 중 오류가 발생했습니다." });
    }
}));
