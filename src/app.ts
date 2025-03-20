import express from "express";
import morgan from "morgan";
import { authRouter } from "./routes/auth";
import { courseRouter } from "./routes/course";
import { naverRouter } from "./routes/naver";
import { imageRouter } from "./routes/image";
const app = express();

// 환경 변수에 따른 로깅 포맷 설정
const morganFormat = process.env.NODE_ENV !== "production" ? "dev" : "combined";

// Morgan 미들웨어 적용
app.use(
  morgan(morganFormat, {
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
  })
);

app.set("port", process.env.PORT || 3001);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Hello World!" });
});

app.use("/image", imageRouter);
app.use("/naver", naverRouter);
app.use("/auth", authRouter);
app.use("/course", courseRouter);

app.listen(app.get("port"), () => {
  console.log(app.get("port"), "번에서 대기중");
});
