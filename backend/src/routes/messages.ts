import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { sendPushNotification } from '../lib/notifications';

const router = Router();

router.get('/:listingId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const listingId = req.params['listingId'] as string;

    const messages = await prisma.message.findMany({
      where: { listingId },
      include: { sender: { select: { id: true, name: true, avatarUrl: true, primaryRole: true } } },
      orderBy: { createdAt: 'asc' },
    });

    await prisma.message.updateMany({
      where: { listingId, receiverId: req.user!.id, read: false },
      data: { read: true },
    });

    res.json({ messages });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/:listingId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const listingId = req.params['listingId'] as string;
    const { content, receiverId } = req.body as { content: string; receiverId: string };

    if (!content?.trim()) { res.status(400).json({ error: 'Message content is required' }); return; }

    const message = await prisma.message.create({
      data: { listingId, senderId: req.user!.id, receiverId, content: content.trim() },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    });

    res.status(201).json({ message });

    // Notify the receiver of the message
    const listing = await prisma.foodListing.findUnique({ where: { id: listingId }, select: { title: true } });
    await sendPushNotification(receiverId, 'message', {
      title: `New message from ${message.sender.name}`,
      body: content.trim(),
      data: { screen: 'Chat', listingId, title: listing?.title },
    });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
