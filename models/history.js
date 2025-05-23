import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  result: [String],
  winnings: Number,
  bet: Number,
  date: { type: Date, default: Date.now },
});

export default mongoose.model('History', historySchema);
