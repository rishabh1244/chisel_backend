import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  userid: number
  username: string
  password_hash: string
}

const UserSchema = new Schema<IUser>({
  userid: { type: Number, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
})

export default mongoose.model<IUser>('User', UserSchema)
