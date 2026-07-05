import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: 'USER' | 'ADMIN' };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = { id: decoded.userId, email: decoded.email, role: decoded.role === 'ADMIN' ? 'ADMIN' : 'USER' };
    next();
  } catch { return res.status(401).json({ error: 'Invalid token' }); }
}

// Must run AFTER `authenticate` on a route (it relies on req.user being set).
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });
  next();
}
