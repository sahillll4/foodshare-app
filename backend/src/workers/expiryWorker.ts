import Queue from 'bull';
import { prisma } from '../lib/prisma';
import { io } from '../index'; // Import socket.io to broadcast updates

const REDIS_URL = process.env.REDIS_URL;

// Only initialize the queue if Redis is configured
export const expiryQueue = REDIS_URL ? new Queue('expiry', REDIS_URL) : null;

if (expiryQueue) {
  expiryQueue.process(async (job) => {
    console.log('[Worker] Running expiry checks...');
    const now = new Date();

    // 1. Expire Active Claims that missed their 30 min window
    const expiredClaims = await prisma.claim.findMany({
      where: { status: 'active', expiresAt: { lt: now } },
      include: { listing: true },
    });

    for (const claim of expiredClaims) {
      // Transaction to safely expire claim and restore listing
      await prisma.$transaction([
        prisma.claim.update({
          where: { id: claim.id },
          data: { status: 'expired' },
        }),
        prisma.foodListing.update({
          where: { id: claim.listingId },
          data: { status: 'live' }, // release back to public
        }),
        // Notify the receiver that they missed the pickup
        prisma.notification.create({
          data: {
            userId: claim.receiverId,
            type: 'expiry',
            title: 'Claim Expired',
            body: `Your claim for ${claim.listing.title} expired because you didn't pick it up in time.`,
            data: { listingId: claim.listingId },
          },
        }),
      ]);

      console.log(`[Worker] Expired claim ${claim.id} for listing ${claim.listingId}`);
      // Broadcast status change so map updates
      io.to(`listing:${claim.listingId}`).emit('listing:status', { listingId: claim.listingId, status: 'live' });
    }

    // 2. Expire Live Listings that passed their pickup window
    const expiredListings = await prisma.foodListing.findMany({
      where: { status: 'live', pickupEnd: { lt: now } },
    });

    for (const listing of expiredListings) {
      await prisma.$transaction([
        prisma.foodListing.update({
          where: { id: listing.id },
          data: { status: 'expired' },
        }),
        // Notify donor
        prisma.notification.create({
          data: {
            userId: listing.donorId,
            type: 'expiry',
            title: 'Listing Expired',
            body: `Your listing "${listing.title}" expired as no one claimed it in time.`,
            data: { listingId: listing.id },
          },
        }),
      ]);

      console.log(`[Worker] Expired listing ${listing.id}`);
      io.to(`listing:${listing.id}`).emit('listing:status', { listingId: listing.id, status: 'expired' });
    }

    return { claimsProcessed: expiredClaims.length, listingsProcessed: expiredListings.length };
  });

  // Schedule to run every 5 minutes
  expiryQueue.add({}, { repeat: { cron: '*/5 * * * *' } })
    .then(() => console.log('[Worker] Expiry cron job scheduled (every 5m)'));
} else {
  console.log('[Worker] Skipping expiry worker initialization (No REDIS_URL provided)');
}
