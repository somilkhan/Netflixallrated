import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/showbox/link?type=movie|show&id=...&season=...&episode=...
router.get('/link', authenticate, async (req: Request, res: Response) => {
  const { type, id, season, episode } = req.query;

  const showboxApiUrl = process.env.SHOWBOX_FEB_BOX_API_URL;
  const febBoxToken = process.env.FEB_BOX_TOKEN;

  if (!showboxApiUrl) {
    return res.status(503).json({ success: false, error: 'SHOWBOX_FEB_BOX_API_URL is not configured.' });
  }
  if (!type || !id) {
    return res.status(400).json({ success: false, error: 'Missing required params: type, id.' });
  }

  try {
    const params = new URLSearchParams({ type: type as string, id: id as string });
    if (season) params.set('season', season as string);
    if (episode) params.set('episode', episode as string);
    if (febBoxToken) params.set('token', febBoxToken);

    const upstream = await fetch(`${showboxApiUrl}/api/showbox/link?${params.toString()}`);
    if (!upstream.ok) {
      return res.status(upstream.status).json({
        success: false,
        error: `Upstream Showbox error: ${upstream.status}`,
      });
    }
    return res.json(await upstream.json());
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
