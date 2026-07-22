import { Router, Request, Response } from 'express'

const router = Router()

router.post('/createProject', (_req: Request, res: Response) => {
  res.json({ message: 'working' })
})

router.post('/editProject', (_req: Request, res: Response) => {
  res.json({ message: 'working' })
})

export default router
