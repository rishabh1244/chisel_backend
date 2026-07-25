import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import connectDB from './config/db'
import authRoutes from './api_gateway/auth'
import workspaceRoutes from './api_gateway/workspace'
import usersRoutes from './api_gateway/users'
import fetchProblemsRoutes from './api_gateway/fetch_projects'
import issueRoutes from './api_gateway/issueRoute'
import commentRoutes from './api_gateway/commentRoute'
import blueprintRoutes from './api_gateway/blueprintRoute'

const app = express()
const port = process.env.PORT || 3000

connectDB()

app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/workspace', workspaceRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/projects', fetchProblemsRoutes)
app.use('/api/issues', issueRoutes)
app.use('/api/comments', commentRoutes)
app.use('/api/blueprint', blueprintRoutes)

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
