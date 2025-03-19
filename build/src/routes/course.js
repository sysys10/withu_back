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
exports.courseRouter = (0, express_1.Router)();
exports.courseRouter.get('/detail/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'id가 없습니다.' });
        }
        // Find the date course with the given ID
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
                        visit_order: 'asc',
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
            return res.status(404).json({ message: '코스를 찾을 수 없습니다.' });
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
        return res.json(transformedCourse);
    }
    catch (error) {
        console.error('Error fetching course details:', error);
        return res
            .status(500)
            .json({ message: '코스를 찾는 중 오류가 발생했습니다.' });
    }
}));
