import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import bcrypt from 'bcrypt'
export const authRouter = Router()
import jwt from 'jsonwebtoken'
authRouter.post('/login', async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body
  console.log(email, password)
  const user = await prisma.user.findUnique({
    where: { email },
  })
  if (!user) {
    return res.status(401).json({ message: '존재하지 않는 이메일입니다.' })
  }
  const isPasswordValid = await bcrypt.compare(password, user.hashed_password)
  if (!isPasswordValid) {
    return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' })
  }
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.REFRESH_TOKEN_SECRET || '',
    { expiresIn: '7d' }
  )
  const accessToken = jwt.sign(
    { id: user.id },
    process.env.ACCESS_TOKEN_SECRET || '',
    { expiresIn: '15m' }
  )
  res.json({ user, accessToken, refreshToken })
})

authRouter.post(
  '/register',
  async (req: Request, res: Response): Promise<any> => {
    const { name, email, password } = req.body
    console.log(name, email, password)
    const hashedPassword = await bcrypt.hash(password, 10)
    if (!name || !email || !password) {
      return res.status(400).json({ message: '모든 필드를 입력해주세요.' })
    }
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })
    if (existingUser) {
      return res.status(400).json({ message: '이미 존재하는 이메일입니다.' })
    }
    const user = await prisma.user.create({
      data: { name, email, hashed_password: hashedPassword },
    })
    res.json({ user })
  }
)
