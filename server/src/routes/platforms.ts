import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();
router.get('/', async (_req, res) => { const platforms = await prisma.platform.findMany({ include: { _count: { select: { titles: true } } } }); res.json(platforms); });
export default router;
