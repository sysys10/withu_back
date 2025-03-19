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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
exports.authRouter = (0, express_1.Router)();
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.authRouter.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    console.log(email, password);
    const user = yield prisma_1.prisma.user.findUnique({
        where: { email },
    });
    if (!user) {
        return res.status(401).json({ message: '존재하지 않는 이메일입니다.' });
    }
    const isPasswordValid = yield bcrypt_1.default.compare(password, user.hashed_password);
    if (!isPasswordValid) {
        return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    }
    const refreshToken = jsonwebtoken_1.default.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET || '', { expiresIn: '7d' });
    const accessToken = jsonwebtoken_1.default.sign({ id: user.id }, process.env.ACCESS_TOKEN_SECRET || '', { expiresIn: '15m' });
    res.json({ user, accessToken, refreshToken });
}));
exports.authRouter.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password } = req.body;
    console.log(name, email, password);
    const hashedPassword = yield bcrypt_1.default.hash(password, 10);
    if (!name || !email || !password) {
        return res.status(400).json({ message: '모든 필드를 입력해주세요.' });
    }
    const existingUser = yield prisma_1.prisma.user.findUnique({
        where: { email },
    });
    if (existingUser) {
        return res.status(400).json({ message: '이미 존재하는 이메일입니다.' });
    }
    const user = yield prisma_1.prisma.user.create({
        data: { name, email, hashed_password: hashedPassword },
    });
    res.json({ user });
}));
