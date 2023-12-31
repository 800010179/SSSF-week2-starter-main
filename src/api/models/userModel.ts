// TODO: mongoose schema for user
import {Schema, model} from 'mongoose';
import {User} from '../../interfaces/User';

const userSchema = new Schema<User>({
  user_name: {type: String, required: true, unique: true},
  email: {type: String, required: true, unique: true},
  role: {type: String, required: true, enum: ['user', 'admin']},
  password: {type: String, required: true},
});

export default model<User>('User', userSchema);
