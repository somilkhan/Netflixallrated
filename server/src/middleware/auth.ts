import { Request, Response, NextFunction } from 'express';
import { getSupabaseClient } from '../lib/supabase.js';
import { prisma } from '../lib/prisma.js';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: 'USER' | 'ADMIN' };
}

async function _authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.slice(7);

  const supabase = getSupabaseClient();
  if (!supabase) return res.status(503).json({ error: 'Auth service not configured' });

  // Verify the Supabase access token
  const { data: { user: supaUser }, error } = await supabase.auth.getUser(token);
  if (error || !supaUser) return res.status(401).json({ error: 'Invalid token' });

  const adminEmail = process.env.ADMIN_EMAIL || '';

  // Handle migration from old UUID system: if the same email exists under a different
  // (pre-Supabase) ID, re-link all history to the Supabase UUID in a transaction so
  // no ratings or watchlist items are lost.
  const existing = await prisma.user.findUnique({ where: { email: supaUser.email! } });
  if (existing && existing.id !== supaUser.id) {
    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: supaUser.id,
          email: supaUser.email!,
          displayName: existing.displayName,
          avatarUrl: existing.avatarUrl,
          role: existing.role, // preserve any admin role already granted
        },
      });
      await tx.rating.updateMany({ where: { userId: existing.id }, data: { userId: supaUser.id } });
      await tx.watchlistItem.updateMany({ where: { userId: existing.id }, data: { userId: supaUser.id } });
      await tx.user.delete({ where: { id: existing.id } });
    });
  }

  // Upsert the user — auto-creates on first login, stays idempotent after
  const neonUser = await prisma.user.upsert({
    where: { id: supaUser.id },
    update: { email: supaUser.email! },
    create: {
      id: supaUser.id,
      email: supaUser.email!,
      displayName:
        (supaUser.user_metadata?.display_name as string | undefined) ||
        supaUser.email!.split('@')[0],
      role: adminEmail && supaUser.email === adminEmail ? 'ADMIN' : 'USER',
    },
  });

  req.user = { id: neonUser.id, email: neonUser.email, role: neonUser.role };
  next();
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  _authenticate(req, res, next).catch(next);
}

// Must run AFTER authenticate (relies on req.user being set)
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });
  next();
}
