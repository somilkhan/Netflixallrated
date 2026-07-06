import { Request, Response, NextFunction } from 'express';
import { getSupabaseClient } from '../lib/supabase.js';
import { prisma } from '../lib/prisma.js';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: 'USER' | 'ADMIN' };
}

function isAdmin(email: string | null | undefined): boolean {
  const admin = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  return !!admin && email?.trim().toLowerCase() === admin;
}

async function _authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.slice(7);

  const supabase = getSupabaseClient();
  if (!supabase) return res.status(503).json({ error: 'Auth service not configured' });

  const { data: { user: s }, error } = await supabase.auth.getUser(token);
  if (error || !s?.email) return res.status(401).json({ error: 'Invalid token' });

  const email = s.email.trim().toLowerCase();
  const admin = isAdmin(s.email);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== s.id) {
    // Supabase auth ID changed for the same email — migrate the record.
    // Order: rename old email first to release the unique constraint, then
    // create the new user, move related records, and delete the old user.
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: existing.id }, data: { email: `migrated_${existing.id}@_old` } });
      await tx.user.create({ data: { id: s.id, email, displayName: existing.displayName, avatarUrl: existing.avatarUrl, role: admin ? 'ADMIN' : existing.role } });
      await tx.rating.updateMany({ where: { userId: existing.id }, data: { userId: s.id } });
      await tx.watchlistItem.updateMany({ where: { userId: existing.id }, data: { userId: s.id } });
      await tx.user.delete({ where: { id: existing.id } });
    });
  }

  const user = await prisma.user.upsert({
    where: { id: s.id },
    // Preserve the DB role for users promoted via /api/auth/promote.
    // Only force ADMIN when ADMIN_EMAIL matches — never silently downgrade.
    update: { email, ...(admin ? { role: 'ADMIN' } : {}) },
    create: { id: s.id, email, displayName: (s.user_metadata?.display_name as string) || email.split('@')[0], role: admin ? 'ADMIN' : 'USER' },
  });

  req.user = { id: user.id, email: user.email, role: user.role };
  next();
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  _authenticate(req, res, next).catch(next);
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });
  next();
}
