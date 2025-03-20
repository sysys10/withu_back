import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const courseRouter = Router();

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

      // Find the date course with the given ID
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

      // Transform the data to match the frontend's expected format
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
