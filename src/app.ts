import express from "express";
import { prisma } from "./lib/prisma";
import { authRouter } from "./routes/auth";
import { courseRouter } from "./routes/course";
import { authMiddleware } from "./middleware/auth";
const app = express();

app.set("port", process.env.PORT || 3001);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Hello World!" });
});

app.use("/auth", authRouter);
app.use("/course", courseRouter);

app.listen(app.get("port"), () => {
  console.log(app.get("port"), "번에서 대기중");
});
