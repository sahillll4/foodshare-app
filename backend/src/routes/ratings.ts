import { Router, Response, Request } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { listingId, ratedId, score, comment } = req.body as {
      listingId: string; ratedId: string; score: number; comment?: string;
    };

    if (!listingId || !ratedId || !score) { res.status(400).json({ error: 'listingId, ratedId, and score are required' }); return; }
    if (score < 1 || score > 5) { res.status(400).json({ error: 'Score must be between 1 and 5' }); return; }
    if (ratedId === req.user!.id) { res.status(400).json({ error: 'Cannot rate yourself' }); return; }

    const rating = await prisma.rating.create({
      data: { listingId, raterId: req.user!.id, ratedId, score, comment },
    });

    const stats = await prisma.rating.aggregate({
      where: { ratedId },
      _avg: { score: true },
      _count: { score: true },
    });

    await prisma.user.update({
      where: { id: ratedId },
      data: { ratingAvg: stats._avg.score || 0, ratingCount: stats._count.score },
    });

    res.status(201).json({ rating });
  } catch (err) {
    if ((err as { code?: string }).code === 'P2002') { res.status(409).json({ error: 'Already rated this user for this listing' }); return; }
    console.error('Rating error:', err);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

router.get('/users/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const ratings = await prisma.rating.findMany({
      where: { ratedId: req.params['id'] as string },
      include: { rater: { select: { name: true, avatarUrl: true, primaryRole: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json({ ratings });
  } catch (err) {
    console.error('Get ratings error:', err);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

router.get('/users/:id/impact', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params['id'] as string;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { impactMeals: true, impactPoints: true, ratingAvg: true, ratingCount: true, primaryRole: true },
    });

    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const [listingsPosted, listingsDelivered, claimsCollected, jobsDelivered] = await Promise.all([
      prisma.foodListing.count({ where: { donorId: userId } }),
      prisma.foodListing.count({ where: { donorId: userId, status: 'delivered' } }),
      prisma.claim.count({ where: { receiverId: userId, status: 'collected' } }),
      prisma.courierJob.count({ where: { courierId: userId, status: 'delivered' } }),
    ]);

    res.json({
      ...user,
      listingsPosted,
      listingsDelivered,
      claimsCollected,
      jobsDelivered,
      co2SavedKg: Math.round(user.impactMeals * 2.5),
    });
  } catch (err) {
    console.error('Get impact error:', err);
    res.status(500).json({ error: 'Failed to fetch impact stats' });
  }
});

export default router;
