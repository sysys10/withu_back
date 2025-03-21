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
      // let centerPlace = {
      //   latitude: 0,
      //   longitude: 0,
      // };
      // for (let i = 0; i < transformedCourse.places.length; i++) {
      //   centerPlace.latitude += transformedCourse.places[i].latitude;
      //   centerPlace.longitude += transformedCourse.places[i].longitude;
      // }
      // centerPlace.latitude /= transformedCourse.places.length;
      // centerPlace.longitude /= transformedCourse.places.length;
      // return res.json({
      //   ...transformedCourse,
      //   centerPlace,
      // });
      console.log(transformedCourse);
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

courseRouter.get(
  "/didUserLike/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<any> => {
    const userId = req.user?.id;
    const { id } = req.params;
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

    const like = await prisma.like.findUnique({
      where: {
        user_id_course_id: {
          user_id: userId!,
          course_id: id,
        },
      },
    });
    console.log({ isLiked: like ? true : false });
    return res.json({ isLiked: like ? true : false });
  }
);
courseRouter.post(
  "/like/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      console.log("like", userId);

      if (!id) {
        return res.status(400).json({ message: "id가 없습니다." });
      }
      if (!userId) {
        return res.status(400).json({ message: "userId가 없습니다." });
      }

      const course = await prisma.dateCourse.findUnique({
        where: {
          id: id,
        },
      });

      if (!course) {
        return res.status(404).json({ message: "코스를 찾을 수 없습니다." });
      }

      const isLiked = await prisma.like.findUnique({
        where: {
          user_id_course_id: {
            user_id: userId!,
            course_id: id,
          },
        },
      });

      let updatedCourse;

      if (isLiked) {
        // First delete the like
        await prisma.like.delete({
          where: {
            user_id_course_id: {
              user_id: userId!,
              course_id: id,
            },
          },
        });

        // Then update the course like count
        updatedCourse = await prisma.dateCourse.update({
          where: {
            id: id,
          },
          data: {
            like_count: {
              decrement: 1,
            },
          },
        });
      } else {
        // Two-step approach: create like and then update course
        await prisma.like.create({
          data: {
            user_id: userId!,
            course_id: id,
          },
        });

        updatedCourse = await prisma.dateCourse.update({
          where: {
            id: id,
          },
          data: {
            like_count: {
              increment: 1,
            },
          },
        });
      }

      const newIsLiked = !isLiked;

      return res.json({
        like_count: updatedCourse.like_count,
        isLiked: newIsLiked,
      });
    } catch (error) {
      console.error("Error liking course:", error);
      return res
        .status(500)
        .json({ message: "코스를 좋아하는 중 오류가 발생했습니다." });
    }
  }
);
courseRouter.get(
  "/myrecent",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      const userId = req.user?.id;
      const course = await prisma.dateCourse.findMany({
        where: {
          creator: {
            id: userId!,
          },
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
      if (course.length === 0) {
        return res.json({ message: "최근 코스가 없습니다.", courses: [] });
      }

      const transformedCourses = course.map((course) => ({
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
        message: "최근 코스를 불러왔습니다.",
        courses: transformedCourses,
      });
    } catch (error) {
      console.error("Error fetching my recent courses:", error);
      return res
        .status(500)
        .json({ message: "최근 코스를 불러오는 중 오류가 발생했습니다." });
    }
  }
);
