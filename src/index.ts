import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import connectDB from './config/db'

const app = express()
const port = process.env.PORT || 3000

connectDB()

app.use(express.json())

app.get('/', (_req, res) => {
  res.json({ message: 'Hello World!' })
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
