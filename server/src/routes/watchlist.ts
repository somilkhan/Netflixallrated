import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, async (req: AuthRequest, res) => {
  const schema = z.object({ titleId: z.string(), status: z.enum(['PLAN_TO_WATCH','WATCHING','COMPLETED','DROPPED']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const item = await prisma.watchlistItem.upsert({
    where: { userId_titleId: { userId: req.user!.id, titleId: parsed.data.titleId } },
    update: { status: parsed.data.status },
    create: { userId: req.user!.id, titleId: parsed.data.titleId, status: parsed.data.status },
  });
  res.json(item);
});

router.get('/me', authenticate, async (req: AuthRequest, res) => { const items = await prisma.watchlistItem.findMany({ where: { userId: req.user!.id }, include: { title: { include: { platforms: { include: { platform: true } } } } }, orderBy: { createdAt: 'desc' } }); res.json(items); });
router.patch('/:id', authenticate, async (req: AuthRequest, res) => { const schema = z.object({ status: z.enum(['PLAN_TO_WATCH','WATCHING','COMPLETED','DROPPED']) }); const parsed = schema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() }); const item = await prisma.watchlistItem.updateMany({ where: { id: req.params.id, userId: req.user!.id }, data: { status: parsed.data.status } }); res.json(item); });
router.delete('/:id', authenticate, async (req: AuthRequest, res) => { await prisma.watchlistItem.deleteMany({ where: { id: req.params.id, userId: req.user!.id } }); res.status(204).send(); });

export default router;
