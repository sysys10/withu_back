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
const express_1 = __importDefault(require("express"));
const prisma_1 = require("./lib/prisma");
const auth_1 = require("./routes/auth");
const course_1 = require("./routes/course");
const app = (0, express_1.default)();
app.set('port', process.env.PORT || 3001);
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.json({ message: 'Hello World!' });
});
app.use('/auth', auth_1.authRouter);
app.use('/course', course_1.courseRouter);
app.post('/auth/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const user = yield prisma_1.prisma.user.findUnique({
        where: { email },
    });
    res.json({ user });
}));
app.get('/course/recommend', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const recommendCourses = yield prisma_1.prisma.dateCourse.findMany({
            where: {
                is_public: true,
                is_recommend: true,
            },
            orderBy: {
                created_at: 'desc',
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
                thumbnail: course.thumbnail || ((_a = course.images[0]) === null || _a === void 0 ? void 0 : _a.image_url) || '',
                rating: course.rating || 0,
                like_count: course.like_count || 0,
            });
        });
        res.json({
            message: '추천 코스를 불러왔습니다.',
            courses: transformedCourses.length > 0 ? transformedCourses : [],
        });
    }
    catch (error) {
        console.error('Error fetching recommended courses:', error);
        res.status(500).json({ message: '추천 코스를 불러오는데 실패했습니다.' });
    }
}));
app.get('/private/course/myrecent', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.query;
    const course = yield prisma_1.prisma.dateCourse.findUnique({
        where: { id: id },
    });
    res.json({ course });
}));
app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번에서 대기중');
});
