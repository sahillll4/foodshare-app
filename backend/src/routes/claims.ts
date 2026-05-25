import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { sendPushNotification } from '../lib/notifications';

const router = Router();

const CLAIM_EXPIRY_MINUTES = parseInt(process.env['CLAIM_EXPIRY_MINUTES'] || '30');
const MIN_CLAIMABLE_MINUTES = parseInt(process.env['MIN_CLAIMABLE_MINUTES'] || '30');

// ─── POST /api/listings/:id/claim ─────────────────────────────────────────────
router.post('/:id/claim', requireAuth, requireRole('receiver'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const listingId = req.params['id'] as string;

    const result = await prisma.$transaction(async (tx) => {
      type ListingLockRow = { id: string; status: string; "pickupEnd": Date; "needsCourier": boolean; "quantityNum": number };
      const listing = await tx.$queryRaw<ListingLockRow[]>`
        SELECT id, status, "pickupEnd", "needsCourier"::boolean, "quantityNum"
        FROM food_listings WHERE id = ${listingId}::uuid FOR UPDATE`;

      console.log('[CLAIM DEBUG] raw listing row:', JSON.stringify(listing[0]));

      if (!listing.length) throw new Error('NOT_FOUND');
      const l = listing[0]!;
      if (l.status !== 'live') throw new Error('NOT_AVAILABLE');

      const minutesLeft = (new Date(l.pickupEnd).getTime() - Date.now()) / 60000;
      if (minutesLeft < MIN_CLAIMABLE_MINUTES) throw new Error('TOO_LATE');

      const expiresAt = new Date(Date.now() + CLAIM_EXPIRY_MINUTES * 60 * 1000);
      const claim = await tx.claim.create({
        data: { listingId, receiverId: req.user!.id, expiresAt, status: 'active' },
      });

      await tx.foodListing.update({ where: { id: listingId }, data: { status: 'claimed' } });

      if (l.needsCourier) {
        await tx.courierJob.create({ data: { listingId, claimId: claim.id, status: 'open' } });
      }

      return { claim };
    });

    res.status(201).json({
      claim: result.claim,
      message: `Food reserved until ${result.claim.expiresAt?.toISOString()}`,
    });

    // Notify Donor
    const listingWithDonor = await prisma.foodListing.findUnique({ where: { id: listingId }, select: { donorId: true, title: true } });
    if (listingWithDonor) {
      await sendPushNotification(listingWithDonor.donorId, 'claimed', {
        title: 'Food Claimed!',
        body: `Your listing "${listingWithDonor.title}" has been claimed and will be picked up soon.`,
        data: { screen: 'DonorListingDetail', listingId },
      });
    }
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'NOT_FOUND') { res.status(404).json({ error: 'Listing not found' }); return; }
    if (msg === 'NOT_AVAILABLE') { res.status(409).json({ error: 'Listing already claimed' }); return; }
    if (msg === 'TOO_LATE') { res.status(400).json({ error: `Less than ${MIN_CLAIMABLE_MINUTES} minutes left` }); return; }
    console.error('Claim error:', err);
    res.status(500).json({ error: 'Failed to claim listing' });
  }
});

// ─── DELETE /api/listings/:id/claim ───────────────────────────────────────────
router.delete('/:id/claim', requireAuth, requireRole('receiver'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const listingId = req.params['id'] as string;

    await prisma.$transaction(async (tx) => {
      const claim = await tx.claim.findFirst({
        where: { listingId, receiverId: req.user!.id, status: 'active' },
      });
      if (!claim) throw new Error('NOT_FOUND');

      await tx.claim.update({ where: { id: claim.id }, data: { status: 'cancelled' } });
      await tx.foodListing.update({ where: { id: listingId }, data: { status: 'live' } });
      await tx.courierJob.updateMany({ where: { claimId: claim.id, status: 'open' }, data: { status: 'cancelled' } });
    });

    res.json({ success: true });
  } catch (err) {
    if ((err as Error).message === 'NOT_FOUND') { res.status(404).json({ error: 'Active claim not found' }); return; }
    console.error('Cancel claim error:', err);
    res.status(500).json({ error: 'Failed to cancel claim' });
  }
});

// ─── PATCH /api/claims/:claimId/collected ─────────────────────────────────────
router.patch('/:claimId/collected', requireAuth, requireRole('receiver'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const claimId = req.params['claimId'] as string;
    const claim = await prisma.claim.findUnique({ where: { id: claimId }, include: { listing: true } });

    if (!claim || claim.receiverId !== req.user!.id) { res.status(403).json({ error: 'Not authorized' }); return; }
    if (claim.status !== 'active') { res.status(400).json({ error: 'Claim is not active' }); return; }

    await prisma.$transaction([
      prisma.claim.update({ where: { id: claimId }, data: { status: 'collected', collectedAt: new Date() } }),
      prisma.foodListing.update({ where: { id: claim.listingId }, data: { status: 'delivered' } }),
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error('Collected error:', err);
    res.status(500).json({ error: 'Failed to mark as collected' });
  }
});

// ─── GET /api/claims/my ───────────────────────────────────────────────────────
router.get('/my', requireAuth, requireRole('receiver'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status = req.query['status'] as string | undefined;
    const page = (req.query['page'] as string) || '1';
    const limit = (req.query['limit'] as string) || '20';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const claims = await prisma.claim.findMany({
      where: { receiverId: req.user!.id, ...(status ? { status } : {}) },
      include: {
        listing: { include: { donor: { select: { name: true, ratingAvg: true, avatarUrl: true } } } },
      },
      orderBy: { claimedAt: 'desc' },
      skip: offset,
      take: parseInt(limit),
    });

    res.json({ claims });
  } catch (err) {
    console.error('Get my claims error:', err);
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

export default router;
