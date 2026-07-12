import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// All routes require auth — history is per-user and synced across devices.

/**
 * GET /api/history/me
 * Returns the user's full watch history sorted by most-recently-updated first.
 * Includes the related title so the client can render cards directly.
 */
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const items = await prisma.watchProgress.findMany({
      where: { userId: req.user!.id },
      include: {
        title: {
          include: { platforms: { include: { platform: true } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * GET /api/history/me/:titleId
 * Returns the single progress record for a specific title (or 404).
 * Used on the detail page to resume playback at the right position.
 */
router.get('/me/:titleId', authenticate, async (req: AuthRequest, res) => {
  try {
    const item = await prisma.watchProgress.findUnique({
      where: { userId_titleId: { userId: req.user!.id, titleId: req.params.titleId } },
    });
    // Return null (not 404) when no record exists — the client treats null as "no progress yet"
    res.json(item ?? null);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

const progressSchema = z.object({
  titleId:         z.string(),
  positionSeconds: z.number().int().min(0),
  durationSeconds: z.number().int().min(0).optional(),
  seasonNumber:    z.number().int().min(1).optional().nullable(),
  episodeNumber:   z.number().int().min(0).optional().nullable(),
  episodeTitle:    z.string().optional().nullable(),
  completed:       z.boolean().optional(),
});

/**
 * POST /api/history
 * Upserts a progress record (called periodically during playback, and on
 * play-start / completion).  Idempotent — safe to call many times.
 */
router.post('/', authenticate, async (req: AuthRequest, res) => {
  const parsed = progressSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { titleId, positionSeconds, durationSeconds, seasonNumber, episodeNumber, episodeTitle, completed } = parsed.data;

  // Auto-mark completed when position is within the last 5% or 2 minutes.
  const autoCompleted =
    completed ??
    (durationSeconds != null && durationSeconds > 0
      ? positionSeconds >= durationSeconds - Math.min(durationSeconds * 0.05, 120)
      : false);

  try {
    const item = await prisma.watchProgress.upsert({
      where: { userId_titleId: { userId: req.user!.id, titleId } },
      update: {
        positionSeconds,
        ...(durationSeconds != null ? { durationSeconds } : {}),
        ...(seasonNumber  != null ? { seasonNumber }  : {}),
        ...(episodeNumber != null ? { episodeNumber } : {}),
        ...(episodeTitle  != null ? { episodeTitle }  : {}),
        completed: autoCompleted,
      },
      create: {
        userId:     req.user!.id,
        titleId,
        positionSeconds,
        durationSeconds,
        seasonNumber,
        episodeNumber,
        episodeTitle,
        completed: autoCompleted,
      },
    });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * DELETE /api/history/:titleId
 * Removes a single title from the user's history.
 */
router.delete('/:titleId', authenticate, async (req: AuthRequest, res) => {
  try {
    await prisma.watchProgress.deleteMany({
      where: { userId: req.user!.id, titleId: req.params.titleId },
    });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * DELETE /api/history
 * Clears the user's entire watch history.
 */
router.delete('/', authenticate, async (req: AuthRequest, res) => {
  try {
    await prisma.watchProgress.deleteMany({ where: { userId: req.user!.id } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
