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
exports.imageRouter = void 0;
const express_1 = require("express");
const s3_1 = __importDefault(require("../lib/s3"));
const auth_1 = require("../middleware/auth");
exports.imageRouter = (0, express_1.Router)();
exports.imageRouter.post("/", auth_1.authMiddleware, s3_1.default.array("image"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const images = req.files;
        const imageUrls = images === null || images === void 0 ? void 0 : images.map((image) => image.location);
        res.json({ message: "이미지 업로드 성공", imageUrls });
    }
    catch (error) {
        console.error("이미지 업로드 실패:", error);
        res.status(500).json({ message: "이미지 업로드 실패" });
    }
}));
