import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../../../models/User'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me'

function generateUserId(): number {
  return Math.floor(100000 + Math.random() * 900000)
}

export async function register(username: string, password: string) {
  const existing = await User.findOne({ username })
  if (existing) {
    throw new Error('Username already exists')
  }

  let userid: number
  let isUnique = false
  do {
    userid = generateUserId()
    const dup = await User.findOne({ userid })
    if (!dup) isUnique = true
  } while (!isUnique)

  const salt = await bcrypt.genSalt(10)
  const password_hash = await bcrypt.hash(password, salt)

  const user = await User.create({ userid, username, password_hash })

  const token = jwt.sign(
    { userid: user.userid, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  )

  return { token, user: { userid: user.userid, username: user.username } }
}

export async function login(username: string, password: string) {
  const user = await User.findOne({ username })
  if (!user) {
    throw new Error('Invalid username or password')
  }

  const isMatch = await bcrypt.compare(password, user.password_hash)
  if (!isMatch) {
    throw new Error('Invalid username or password')
  }

  const token = jwt.sign(
    { userid: user.userid, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  )

  return { token, user: { userid: user.userid, username: user.username } }
}