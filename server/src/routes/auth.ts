import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/me', authenticate, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { id: true, email: true, displayName: true, avatarUrl: true, role: true } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: { ...user, isAdmin: user.role === 'ADMIN' } });
});

router.patch('/me', authenticate, async (req: AuthRequest, res) => {
  const parsed = z.object({
    displayName: z.string().min(1).max(60).optional(),
    avatarUrl: z.string().url().optional(),
    region: z.string().max(10).optional(),
    language: z.string().max(20).optional(),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: parsed.data,
    select: { id: true, email: true, displayName: true, avatarUrl: true, role: true, region: true, language: true },
  });
  res.json({ user: { ...user, isAdmin: user.role === 'ADMIN' } });
});

router.post('/promote', authenticate, async (req: AuthRequest, res) => {
  const { email, adminPassword } = req.body;
  if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) return res.status(403).json({ error: 'Forbidden' });
  const user = await prisma.user.update({ where: { email }, data: { role: 'ADMIN' }, select: { id: true, email: true, role: true } });
  res.json({ user });
});

export default router;
