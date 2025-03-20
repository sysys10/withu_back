import { Response, Router } from "express";
import upload from "../lib/s3";
import { authMiddleware, AuthRequest } from "../middleware/auth";

export const imageRouter = Router();

imageRouter.post(
  "/",
  authMiddleware,
  upload.array("image"),
  async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const images = req.files as Express.MulterS3.File[];
      const imageUrls = images?.map((image) => image.location);

      res.json({ message: "이미지 업로드 성공", imageUrls });
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      res.status(500).json({ message: "이미지 업로드 실패" });
    }
  }
);
