
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import gameRoutes from './routes/game.js';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

// Required for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

//  Serve static files from 'public' folder (like index.html, styles, js)
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI).then(() => {
  app.listen(5000, () => console.log('Server running on http://localhost:5000'));
});
