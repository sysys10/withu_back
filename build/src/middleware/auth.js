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
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jwtUtils_1 = require("../utils/jwtUtils");
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "인증 토큰이 필요합니다." });
        }
        const token = authHeader.split(" ")[1];
        try {
            const decoded = (0, jwtUtils_1.verifyAccessToken)(token);
            req.user = { id: decoded.id };
            next();
        }
        catch (error) {
            return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
        }
    }
    catch (error) {
        return res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
});
exports.authMiddleware = authMiddleware;
