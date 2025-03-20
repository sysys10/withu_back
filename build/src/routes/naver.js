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
exports.naverRouter = void 0;
const axios_1 = __importDefault(require("axios"));
const express_1 = __importDefault(require("express"));
exports.naverRouter = express_1.default.Router();
exports.naverRouter.get("/", (req, res) => {
    res.send("Hello World");
});
const clientId = process.env.NAVER_API_CLIENT_ID;
const clientSecret = process.env.NAVER_API_CLIENT_SECRET;
exports.naverRouter.get("/search/:query", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { query } = req.params;
    const { data } = yield axios_1.default.get(`https://openapi.naver.com/v1/search/local.json?query=${query}&display=5&start=1&sort=random`, {
        headers: {
            "X-Naver-Client-Id": clientId,
            "X-Naver-Client-Secret": clientSecret,
        },
    });
    console.log(data);
    res.json(data);
}));
