import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import titleRoutes from './routes/titles.js';
import watchlistRoutes from './routes/watchlist.js';
import platformRoutes from './routes/platforms.js';
import netmirrorRoutes from './routes/netmirror.js';
import showboxRoutes from './routes/showbox.js';
import configRoutes from './routes/config.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5000', credentials: true }));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
app.use('/api/', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/titles', titleRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/platforms', platformRoutes);
app.use('/api/netmirror', netmirrorRoutes);
app.use('/api/showbox', showboxRoutes);
app.use('/api/config', configRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Export for Vercel serverless — only bind to a port when running directly
export default app;

if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
