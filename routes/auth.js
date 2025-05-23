

import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const router = express.Router();

// Middleware to verify token
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") 
    ? authHeader.split(" ")[1] 
    : authHeader;

  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) return res.status(404).json({ message: 'User not found' });
    next();
  } catch (err) {
    console.error('JWT Error:', err.message);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hash, balance: 0 });
    res.json({ message: "User registered successfully" });
  } catch (err) {
    res.status(400).json({ message: "Username already exists" });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ message: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, balance: user.balance });
});

// Deposit route
router.post('/deposit', authMiddleware, async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid deposit amount' });

  req.user.balance += amount;
  await req.user.save();

  res.json({ message: 'Deposit successful', balance: req.user.balance });
});

// Balance route
router.get('/balance', authMiddleware, (req, res) => {
  res.json({ balance: req.user.balance });
});

// Spin route
router.post('/spin', authMiddleware, async (req, res) => {
  const { winnings, lines } = req.body;
  req.user.balance += winnings;
  if (!req.user.history) req.user.history = [];
  if (winnings > 0) {
    req.user.history.push({ winnings, lines, date: new Date() });
  }
  await req.user.save();
  res.json({ message: 'Spin processed', balance: req.user.balance });
});

// History route
router.get('/history', authMiddleware, (req, res) => {
  res.json(req.user.history || []);
});

export default router;
