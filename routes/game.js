import express from 'express';
import User from '../models/user.js';
import History from '../models/history.js';
import { auth } from '../Middleware/auth.js';

const router = express.Router();

const symbols = ["A", "B", "C", "D"];
const symbolCounts = { A: 2, B: 4, C: 6, D: 8 };
const symbolValues = { A: 5, B: 4, C: 3, D: 2 };

function getSpin() {
  let all = [];
  for (let s of symbols) {
    all.push(...Array(symbolCounts[s]).fill(s));
  }

  const columns = [];
  for (let i = 0; i < 3; i++) {
    let current = [...all];
    const col = [];
    for (let j = 0; j < 3; j++) {
      const index = Math.floor(Math.random() * current.length);
      col.push(current[index]);
      current.splice(index, 1);
    }
    columns.push(col);
  }
  return columns;
}

function checkWinnings(columns, lines, bet) {
  let winnings = 0;
  const winningLines = [];

  for (let i = 0; i < lines; i++) {
    const sym = columns[0][i];
    const isWin = columns.every(col => col[i] === sym);
    if (isWin) {
      winnings += symbolValues[sym] * bet;
      winningLines.push(i + 1);
    }
  }

  return { winnings, winningLines };
}

router.post('/deposit', auth, async (req, res) => {
  const { amount } = req.body;
  const user = await User.findById(req.user.id);
  user.balance += amount;
  await user.save();
  res.json({ balance: user.balance });
});

router.post('/spin', auth, async (req, res) => {
  const { betPerLine, lines } = req.body;
  const totalBet = betPerLine * lines;

  const user = await User.findById(req.user.id);
  if (user.balance < totalBet) {
    return res.status(400).json({ message: "Insufficient balance" });
  }

  const result = getSpin();
  const flatResult = result[0].map((_, i) => result.map(col => col[i])).flat();

  const { winnings, winningLines } = checkWinnings(result, lines, betPerLine);
  user.balance += winnings - totalBet;
  await user.save();

  await History.create({
    userId: user._id,
    result: flatResult,
    winnings,
    bet: totalBet
  });

  res.json({
    result: flatResult,
    winnings,
    winningLines,
    balance: user.balance
  });
});

router.get('/history', auth, async (req, res) => {
  const history = await History.find({ userId: req.user.id })
    .sort({ date: -1 })
    .limit(10);
  res.json(history);
});

export default router;
