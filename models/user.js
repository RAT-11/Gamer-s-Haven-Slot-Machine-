
import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
  winnings: Number,
  lines: [Number],
  date: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  balance: { type: Number, default: 0 },
  history: [historySchema]
});

export default mongoose.model('User', userSchema);
