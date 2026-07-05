import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';

const router = Router();

function getConfig() {
  const apiKey = process.env.NETMIRROR_API_KEY;
  const baseUrl =
    process.env.NETMIRROR_API_URL ||
    (apiKey?.startsWith('sk_') ? 'https://screenscapeapi.dev' : 'https://netmirror.one');
  return { apiKey, baseUrl };
}

// GET /api/netmirror
router.get('/', authenticate, async (_req: Request, res: Response) => {
  const { apiKey, baseUrl } = getConfig();
  if (!apiKey) {
    return res.status(503).json({ success: false, error: 'NETMIRROR_API_KEY is not configured.' });
  }
  try {
    const upstream = await fetch(`${baseUrl}/api/netmirror`, {
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    });
    if (!upstream.ok) {
      return res.status(upstream.status).json({ success: false, error: await upstream.text() });
    }
    return res.json(await upstream.json());
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/netmirror/stream?id=...
router.get('/stream', authenticate, async (req: Request, res: Response) => {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ success: false, error: 'Missing required query param: id.' });
  }
  const { apiKey, baseUrl } = getConfig();
  if (!apiKey) {
    return res.status(503).json({ success: false, error: 'NETMIRROR_API_KEY is not configured.' });
  }
  try {
    const upstream = await fetch(
      `${baseUrl}/api/netmirror/stream?id=${encodeURIComponent(id as string)}`,
      { headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' } },
    );
    if (!upstream.ok) {
      return res.status(upstream.status).json({ success: false, error: await upstream.text() });
    }
    return res.json(await upstream.json());
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
