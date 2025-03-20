import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";
import { authMiddleware } from "../middleware/auth";

export const courseRouter = Router();

courseRouter.get("/recommend", async (req, res) => {
  try {
    const recommendCourses = await prisma.dateCourse.findMany({
      where: {
        is_public: true,
        is_recommend: true,
      },
      orderBy: {
        created_at: "desc",
      },
      take: 6,
      include: {
        images: {
          where: { is_main: true },
          take: 1,
        },
      },
    });

    const transformedCourses = recommendCourses.map((course) => ({
      id: course.id,
      name: course.name,
      description: course.description,
      tags: course.tags,
      price: course.price || 0,
      thumbnail: course.thumbnail || course.images[0]?.image_url || "",
      rating: course.rating || 0,
      like_count: course.like_count || 0,
    }));

    res.json({
      message: "추천 코스를 불러왔습니다.",
      courses: transformedCourses.length > 0 ? transformedCourses : [],
    });
  } catch (error) {
    console.error("Error fetching recommended courses:", error);
    res.status(500).json({ message: "추천 코스를 불러오는데 실패했습니다." });
  }
});

courseRouter.get(
  "/detail/:id",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params;
      const accessToken = req.headers;
      console.log(accessToken);

      if (!id) {
        return res.status(400).json({ message: "id가 없습니다." });
      }

      const course = await prisma.dateCourse.findUnique({
        where: {
          id: id,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              profile_image: true,
            },
          },
          places: {
            include: {
              place: true,
            },
            orderBy: {
              visit_order: "asc",
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      });

      if (!course) {
        return res.status(404).json({ message: "코스를 찾을 수 없습니다." });
      }

      const transformedCourse = {
        id: course.id,
        name: course.name,
        description: course.description,
        tags: course.tags,
        price: course.price || 0,
        total_time: course.total_time || 0,
        rating: course.rating,
        review_count: course.reviews?.length || 0,
        like_count: course.like_count,
        thumbnail: course.thumbnail,
        creator: {
          id: course.creator.id,
          name: course.creator.name,
          image: course.creator.profile_image,
        },
        places: course.places.map((coursePlace) => ({
          id: coursePlace.place.id,
          name: coursePlace.place.name,
          address: coursePlace.place.address,
          image_url: coursePlace.place.image_url,
          category: coursePlace.place.category,
          latitude: coursePlace.place.latitude,
          longitude: coursePlace.place.longitude,
          visit_order: coursePlace.visit_order,
          recommended_time: coursePlace.recommended_time,
          tips: coursePlace.tips,
        })),
      };

      return res.json(transformedCourse);
    } catch (error) {
      console.error("Error fetching course details:", error);
      return res
        .status(500)
        .json({ message: "코스를 찾는 중 오류가 발생했습니다." });
    }
  }
);

courseRouter.post(
  "/create",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      const userId = req.user?.id;
      const {
        name,
        description,
        places,
        tags,
        price,
        total_time,
        total_distance,
        is_public,
      } = req.body;

      const createdCourse = await prisma.dateCourse.create({
        data: {
          name,
          description,
          places,
          tags,
          price,
          total_time,
          total_distance,
          is_public,
          creator: { connect: { id: userId } },
        },
      });

      return res.json({
        message: "코스가 성공적으로 생성되었습니다.",
        course: createdCourse,
      });
    } catch (error) {
      console.error("Course creation error:", error);
      return res
        .status(500)
        .json({ message: "코스 생성 중 오류가 발생했습니다." });
    }
  }
);

courseRouter.post(
  "/like/:id",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params;
      const accessToken = req.headers.authorization;
      console.log(accessToken);
      if (!id) {
        return res.status(400).json({ message: "id가 없습니다." });
      }

      const course = await prisma.dateCourse.findUnique({
        where: {
          id: id,
        },
      });

      if (!course) {
        return res.status(404).json({ message: "코스를 찾을 수 없습니다." });
      }

      const updatedCourse = await prisma.dateCourse.update({
        where: {
          id: id,
        },
        data: {
          like_count: {
            increment: 1,
          },
        },
      });

      return res.json({ like_count: updatedCourse.like_count });
    } catch (error) {
      console.error("Error liking course:", error);
      return res
        .status(500)
        .json({ message: "코스를 좋아하는 중 오류가 발생했습니다." });
    }
  }
);
