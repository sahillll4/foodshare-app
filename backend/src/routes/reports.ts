import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { sendPushNotification } from '../lib/notifications';

const router = Router();

router.post('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { listingId, reason } = req.body as { listingId: string; reason: string };

    if (!listingId || !reason) {
      res.status(400).json({ error: 'listingId and reason are required' });
      return;
    }

    const listing = await prisma.foodListing.findUnique({ where: { id: listingId } });
    
    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    // Flag the listing (this hides it from public feed since listings query filters flagged=false)
    await prisma.foodListing.update({
      where: { id: listingId },
      data: { 
        flagged: true,
        flagReason: reason 
      }
    });

    // Notify the donor that their post was taken down for review
    await sendPushNotification(listing.donorId, 'report', {
      title: 'Listing Flagged',
      body: `Your listing "${listing.title}" was flagged and hidden for review. Reason: ${reason}`,
      data: { listingId: listing.id }
    });

    res.status(200).json({ success: true, message: 'Listing flagged successfully' });
  } catch (err) {
    console.error('Report error:', err);
    res.status(500).json({ error: 'Failed to report listing' });
  }
});

export default router;
