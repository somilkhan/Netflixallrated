import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

const registerSchema = z.object({ email: z.string().email(), password: z.string().min(6), displayName: z.string().optional() });
const loginSchema = z.object({ email: z.string().email(), password: z.string() });

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return res.status(409).json({ error: 'Email already registered' });
  const hash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({ data: { email: parsed.data.email, passwordHash: hash, displayName: parsed.data.displayName || parsed.data.email.split('@')[0] }, select: { id: true, email: true, displayName: true, role: true, createdAt: true } });
  const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '7d' });
  res.json({ user, token });
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '7d' });
  res.json({ user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role }, token });
});

router.get('/me', authenticate, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { id: true, email: true, displayName: true, avatarUrl: true, role: true } });
  res.json({ user });
});

export default router;
