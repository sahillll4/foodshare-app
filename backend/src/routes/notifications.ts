import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Register / update FCM device token
router.post('/token', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.body as { token: string };
    if (!token) { res.status(400).json({ error: 'Token required' }); return; }

    // Store on user record (add fcmToken field if needed, or use a separate model)
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { fcmToken: token },
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to register token' });
  }
});

// Get all notifications for current user
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark a single notification as read
router.patch('/:id/read', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    await prisma.notification.updateMany({
      where: { id, userId: req.user!.id },
      data: { read: true },
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notification read' });
  }
});

// Mark all notifications as read
router.patch('/read-all', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, read: false },
      data: { read: true },
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all read' });
  }
});

export default router;
