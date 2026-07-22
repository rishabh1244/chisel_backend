import { Router, Request, Response } from 'express'

const router = Router()

router.get('/listUsers', (_req: Request, res: Response) => {
  res.json({ message: 'working' })
})

router.post('/sendInvite', (_req: Request, res: Response) => {
  res.json({ message: 'working' })
})

router.get('/searchUsers', (_req: Request, res: Response) => {
  res.json({ message: 'working' })
})

export default router
