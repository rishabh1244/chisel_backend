import { Router, Request, Response } from 'express'

const router = Router()

router.post('/login', (_req: Request, res: Response) => {
  res.json({ message: 'working' })
})

router.post('/signup', (_req: Request, res: Response) => {
  res.json({ message: 'working' })
})

export default router
