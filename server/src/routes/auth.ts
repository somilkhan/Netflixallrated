import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/auth/me
 * Returns the current user from Neon DB (auth verified by middleware).
 * Also used by the client on startup to hydrate the user with role + displayName.
 */
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, email: true, displayName: true, avatarUrl: true, role: true },
  });
  res.json({ user });
});

/**
 * PATCH /api/auth/me
 * Update display name or avatar URL.
 */
router.patch('/me', authenticate, async (req: AuthRequest, res) => {
  const schema = z.object({
    displayName: z.string().min(1).max(60).optional(),
    avatarUrl: z.string().url().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: parsed.data,
    select: { id: true, email: true, displayName: true, avatarUrl: true, role: true },
  });
  res.json({ user });
});

/**
 * POST /api/auth/promote
 * Promotes a user to ADMIN. Requires a valid Bearer token (the caller must be
 * authenticated) AND the ADMIN_PASSWORD env var as proof.
 * Usage: POST /api/auth/promote { "email": "you@example.com", "adminPassword": "..." }
 */
router.post('/promote', authenticate, async (req: AuthRequest, res) => {
  const { email, adminPassword } = req.body;
  if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const user = await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' },
    select: { id: true, email: true, role: true },
  });
  res.json({ user });
});

export default router;
