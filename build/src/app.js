"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const auth_1 = require("./routes/auth");
const course_1 = require("./routes/course");
const naver_1 = require("./routes/naver");
const image_1 = require("./routes/image");
const app = (0, express_1.default)();
// 환경 변수에 따른 로깅 포맷 설정
const morganFormat = process.env.NODE_ENV !== "production" ? "dev" : "combined";
// Morgan 미들웨어 적용
app.use((0, morgan_1.default)(morganFormat, {
    // 로그 스트림 설정 (선택 사항)
    stream: {
        write: (message) => {
            console.log(message.trim());
        },
    },
    // 특정 상태 코드에 대한 로깅 스킵 (선택 사항)
    skip: (req, res) => {
        // 예: 400 이하의 상태 코드만 로깅
        // return res.statusCode < 400;
        return false;
    },
}));
app.set("port", process.env.PORT || 3001);
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.json({ message: "Hello World!" });
});
app.use("/image", image_1.imageRouter);
app.use("/naver", naver_1.naverRouter);
app.use("/auth", auth_1.authRouter);
app.use("/course", course_1.courseRouter);
app.listen(app.get("port"), () => {
    console.log(app.get("port"), "번에서 대기중");
});
