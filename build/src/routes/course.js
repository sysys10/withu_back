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
exports.courseRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
exports.courseRouter = (0, express_1.Router)();
exports.courseRouter.get("/recommend", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const recommendCourses = yield prisma_1.prisma.dateCourse.findMany({
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
        const transformedCourses = recommendCourses.map((course) => {
            var _a;
            return ({
                id: course.id,
                name: course.name,
                description: course.description,
                tags: course.tags,
                price: course.price || 0,
                thumbnail: course.thumbnail || ((_a = course.images[0]) === null || _a === void 0 ? void 0 : _a.image_url) || "",
                rating: course.rating || 0,
                like_count: course.like_count || 0,
            });
        });
        res.json({
            message: "추천 코스를 불러왔습니다.",
            courses: transformedCourses.length > 0 ? transformedCourses : [],
        });
    }
    catch (error) {
        console.error("Error fetching recommended courses:", error);
        res.status(500).json({ message: "추천 코스를 불러오는데 실패했습니다." });
    }
}));
exports.courseRouter.get("/detail/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const accessToken = req.headers;
        console.log(accessToken);
        if (!id) {
            return res.status(400).json({ message: "id가 없습니다." });
        }
        const course = yield prisma_1.prisma.dateCourse.findUnique({
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
            review_count: ((_a = course.reviews) === null || _a === void 0 ? void 0 : _a.length) || 0,
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
    }
    catch (error) {
        console.error("Error fetching course details:", error);
        return res
            .status(500)
            .json({ message: "코스를 찾는 중 오류가 발생했습니다." });
    }
}));
exports.courseRouter.post("/create", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { name, description, places, tags, price, total_time, total_distance, is_public, } = req.body;
        const createdCourse = yield prisma_1.prisma.dateCourse.create({
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
    }
    catch (error) {
        console.error("Course creation error:", error);
        return res
            .status(500)
            .json({ message: "코스 생성 중 오류가 발생했습니다." });
    }
}));
exports.courseRouter.get("/didUserLike/:id", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: "id가 없습니다." });
    }
    const course = yield prisma_1.prisma.dateCourse.findUnique({
        where: {
            id: id,
        },
    });
    if (!course) {
        return res.status(404).json({ message: "코스를 찾을 수 없습니다." });
    }
    const like = yield prisma_1.prisma.like.findUnique({
        where: {
            user_id_course_id: {
                user_id: userId,
                course_id: id,
            },
        },
    });
    console.log({ isLiked: like ? true : false });
    return res.json({ isLiked: like ? true : false });
}));
exports.courseRouter.post("/like/:id", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { id } = req.params;
        console.log("like", userId);
        if (!id) {
            return res.status(400).json({ message: "id가 없습니다." });
        }
        if (!userId) {
            return res.status(400).json({ message: "userId가 없습니다." });
        }
        const course = yield prisma_1.prisma.dateCourse.findUnique({
            where: {
                id: id,
            },
        });
        if (!course) {
            return res.status(404).json({ message: "코스를 찾을 수 없습니다." });
        }
        const isLiked = yield prisma_1.prisma.like.findUnique({
            where: {
                user_id_course_id: {
                    user_id: userId,
                    course_id: id,
                },
            },
        });
        let updatedCourse;
        if (isLiked) {
            // First delete the like
            yield prisma_1.prisma.like.delete({
                where: {
                    user_id_course_id: {
                        user_id: userId,
                        course_id: id,
                    },
                },
            });
            // Then update the course like count
            updatedCourse = yield prisma_1.prisma.dateCourse.update({
                where: {
                    id: id,
                },
                data: {
                    like_count: {
                        decrement: 1,
                    },
                },
            });
        }
        else {
            // Two-step approach: create like and then update course
            yield prisma_1.prisma.like.create({
                data: {
                    user_id: userId,
                    course_id: id,
                },
            });
            updatedCourse = yield prisma_1.prisma.dateCourse.update({
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
    }
    catch (error) {
        console.error("Error liking course:", error);
        return res
            .status(500)
            .json({ message: "코스를 좋아하는 중 오류가 발생했습니다." });
    }
}));
exports.courseRouter.get("/myrecent", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const course = yield prisma_1.prisma.dateCourse.findMany({
            where: {
                creator: {
                    id: userId,
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
        const transformedCourses = course.map((course) => {
            var _a;
            return ({
                id: course.id,
                name: course.name,
                description: course.description,
                tags: course.tags,
                price: course.price || 0,
                thumbnail: course.thumbnail || ((_a = course.images[0]) === null || _a === void 0 ? void 0 : _a.image_url) || "",
                rating: course.rating || 0,
                like_count: course.like_count || 0,
            });
        });
        res.json({
            message: "최근 코스를 불러왔습니다.",
            courses: transformedCourses,
        });
    }
    catch (error) {
        console.error("Error fetching my recent courses:", error);
        return res
            .status(500)
            .json({ message: "최근 코스를 불러오는 중 오류가 발생했습니다." });
    }
}));
