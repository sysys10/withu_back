import express from 'express'
import { prisma } from './lib/prisma'
import { authRouter } from './routes/auth'
import { courseRouter } from './routes/course'
const app = express()

app.set('port', process.env.PORT || 3001)
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' })
})
app.use('/auth', authRouter)
app.use('/course', courseRouter)
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body
  const user = await prisma.user.findUnique({
    where: { email },
  })
  res.json({ user })
})

app.get('/course/recommend', async (req, res) => {
  try {
    const recommendCourses = await prisma.dateCourse.findMany({
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
    })

    const transformedCourses = recommendCourses.map((course) => ({
      id: course.id,
      name: course.name,
      description: course.description,
      tags: course.tags,
      price: course.price || 0,
      thumbnail: course.thumbnail || course.images[0]?.image_url || '',
      rating: course.rating || 0,
      like_count: course.like_count || 0,
    }))

    res.json({
      message: '추천 코스를 불러왔습니다.',
      courses: transformedCourses.length > 0 ? transformedCourses : [],
    })
  } catch (error) {
    console.error('Error fetching recommended courses:', error)
    res.status(500).json({ message: '추천 코스를 불러오는데 실패했습니다.' })
  }
})
app.get('/private/course/myrecent', async (req, res) => {
  const { id } = req.query
  const course = await prisma.dateCourse.findUnique({
    where: { id: id as string },
  })
  res.json({ course })
})

app.listen(app.get('port'), () => {
  console.log(app.get('port'), '번에서 대기중')
})
