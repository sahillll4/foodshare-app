import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
const COURIER_POINTS = parseInt(process.env['COURIER_POINTS_PER_DELIVERY'] || '10');

// ─── GET /api/courier/jobs ────────────────────────────────────────────────────
router.get('/jobs', requireAuth, requireRole('courier'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lat = req.query['lat'] as string;
    const lng = req.query['lng'] as string;
    const radius = (req.query['radius'] as string) || '5000';
    const cold_chain = req.query['cold_chain'] as string | undefined;
    const page = (req.query['page'] as string) || '1';
    const limit = (req.query['limit'] as string) || '20';

    if (!lat || !lng) { res.status(400).json({ error: 'lat and lng are required' }); return; }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const latF = parseFloat(lat);
    const lngF = parseFloat(lng);
    const radiusM = parseInt(radius);

    type JobRow = {
      id: string; listing_id: string; claim_id: string; status: string; vehicle_type: string;
      title: string; food_type: string; quantity_num: number; quantity_text: string;
      pickup_end: Date; requires_cold_chain: boolean; donor_address: string;
      latitude: number; longitude: number; donor_name: string; distance_m: number;
    };

    let jobs: JobRow[];

    if (cold_chain === 'true') {
      jobs = await prisma.$queryRaw<JobRow[]>`
        SELECT cj.id, cj."listingId", cj."claimId", cj.status, cj."vehicleType",
          fl.title, fl."foodType", fl."quantityNum", fl."quantityText", fl."pickupEnd",
          fl."requiresColdChain", fl."addressText" AS donor_address, fl.latitude, fl.longitude,
          u.name AS donor_name,
          (6371000 * acos(LEAST(1.0, GREATEST(-1.0, cos(radians(${latF})) * cos(radians(fl.latitude)) *
            cos(radians(fl.longitude) - radians(${lngF})) + sin(radians(${latF})) * sin(radians(fl.latitude)))))) AS distance_m
        FROM courier_jobs cj
        JOIN food_listings fl ON fl.id = cj."listingId"
        JOIN users u ON u.id = fl."donorId"
        WHERE cj.status = 'open' AND cj."courierId" IS NULL AND fl."pickupEnd" > NOW()
          AND fl."requiresColdChain" = true
          AND (6371000 * acos(LEAST(1.0, GREATEST(-1.0, cos(radians(${latF})) * cos(radians(fl.latitude)) *
            cos(radians(fl.longitude) - radians(${lngF})) + sin(radians(${latF})) * sin(radians(fl.latitude)))))) <= ${radiusM}
        ORDER BY distance_m ASC LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    } else {
      jobs = await prisma.$queryRaw<JobRow[]>`
        SELECT cj.id, cj."listingId", cj."claimId", cj.status, cj."vehicleType",
          fl.title, fl."foodType", fl."quantityNum", fl."quantityText", fl."pickupEnd",
          fl."requiresColdChain", fl."addressText" AS donor_address, fl.latitude, fl.longitude,
          u.name AS donor_name,
          (6371000 * acos(LEAST(1.0, GREATEST(-1.0, cos(radians(${latF})) * cos(radians(fl.latitude)) *
            cos(radians(fl.longitude) - radians(${lngF})) + sin(radians(${latF})) * sin(radians(fl.latitude)))))) AS distance_m
        FROM courier_jobs cj
        JOIN food_listings fl ON fl.id = cj."listingId"
        JOIN users u ON u.id = fl."donorId"
        WHERE cj.status = 'open' AND cj."courierId" IS NULL AND fl."pickupEnd" > NOW()
          AND (6371000 * acos(LEAST(1.0, GREATEST(-1.0, cos(radians(${latF})) * cos(radians(fl.latitude)) *
            cos(radians(fl.longitude) - radians(${lngF})) + sin(radians(${latF})) * sin(radians(fl.latitude)))))) <= ${radiusM}
        ORDER BY distance_m ASC LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    }

    res.json({ jobs, count: jobs.length });
  } catch (err) {
    console.error('Get courier jobs error:', err);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// ─── GET /api/courier/jobs/my ─────────────────────────────────────────────────
router.get('/jobs/my', requireAuth, requireRole('courier'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status = req.query['status'] as string | undefined;
    const page = (req.query['page'] as string) || '1';
    const limit = (req.query['limit'] as string) || '20';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const jobs = await prisma.courierJob.findMany({
      where: { courierId: req.user!.id, ...(status ? { status } : {}) },
      include: {
        listing: { include: { donor: { select: { name: true, phone: true, avatarUrl: true } } } },
        claim: { include: { receiver: { select: { name: true, phone: true, avatarUrl: true } } } },
      },
      orderBy: { acceptedAt: 'desc' },
      skip: offset,
      take: parseInt(limit),
    });

    const totals = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { impactPoints: true, impactMeals: true },
    });

    res.json({ jobs, totalPoints: totals?.impactPoints || 0, totalMeals: totals?.impactMeals || 0 });
  } catch (err) {
    console.error('Get my courier jobs error:', err);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// ─── POST /api/courier/jobs/:id/accept ────────────────────────────────────────
router.post('/jobs/:id/accept', requireAuth, requireRole('courier'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobId = req.params['id'] as string;

    const job = await prisma.$transaction(async (tx) => {
      type JobLockRow = { id: string; status: string; courierId: string | null };
      const existing = await tx.$queryRaw<JobLockRow[]>`
        SELECT id, status, "courierId" FROM courier_jobs WHERE id = ${jobId}::uuid FOR UPDATE`;

      if (!existing.length) throw new Error('NOT_FOUND');
      const e = existing[0]!;
      if (e.status !== 'open' || e.courierId) throw new Error('NOT_AVAILABLE');

      return tx.courierJob.update({
        where: { id: jobId },
        data: { courierId: req.user!.id, status: 'accepted', acceptedAt: new Date() },
        include: { listing: { select: { title: true, addressText: true, latitude: true, longitude: true, donorId: true } } },
      });
    });

    res.json({ job });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'NOT_FOUND') { res.status(404).json({ error: 'Job not found' }); return; }
    if (msg === 'NOT_AVAILABLE') { res.status(409).json({ error: 'Job already taken' }); return; }
    console.error('Accept job error:', err);
    res.status(500).json({ error: 'Failed to accept job' });
  }
});

// ─── PATCH /api/courier/jobs/:id/picked-up ────────────────────────────────────
router.patch('/jobs/:id/picked-up', requireAuth, requireRole('courier'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobId = req.params['id'] as string;
    const job = await prisma.courierJob.findUnique({ where: { id: jobId } });

    if (!job || job.courierId !== req.user!.id) { res.status(403).json({ error: 'Not your job' }); return; }
    if (job.status !== 'accepted') { res.status(400).json({ error: 'Job must be in accepted state' }); return; }

    await prisma.$transaction([
      prisma.courierJob.update({ where: { id: jobId }, data: { status: 'picked_up', pickedUpAt: new Date() } }),
      prisma.foodListing.update({ where: { id: job.listingId }, data: { status: 'picked_up' } }),
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error('Picked up error:', err);
    res.status(500).json({ error: 'Failed to mark as picked up' });
  }
});

// ─── PATCH /api/courier/jobs/:id/delivered ────────────────────────────────────
router.patch('/jobs/:id/delivered', requireAuth, requireRole('courier'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobId = req.params['id'] as string;
    const job = await prisma.courierJob.findUnique({
      where: { id: jobId },
      include: { listing: true },
    });

    if (!job || job.courierId !== req.user!.id) { res.status(403).json({ error: 'Not your job' }); return; }
    if (job.status !== 'picked_up') { res.status(400).json({ error: 'Must be picked up first' }); return; }

    await prisma.$transaction([
      prisma.courierJob.update({ where: { id: jobId }, data: { status: 'delivered', deliveredAt: new Date() } }),
      prisma.foodListing.update({ where: { id: job.listingId }, data: { status: 'delivered' } }),
      prisma.user.update({
        where: { id: req.user!.id },
        data: { impactPoints: { increment: COURIER_POINTS }, impactMeals: { increment: job.listing.quantityNum || 0 } },
      }),
      prisma.user.update({
        where: { id: job.listing.donorId },
        data: { impactMeals: { increment: job.listing.quantityNum || 0 } },
      }),
    ]);

    res.json({ success: true, pointsAwarded: COURIER_POINTS });
  } catch (err) {
    console.error('Delivered error:', err);
    res.status(500).json({ error: 'Failed to mark as delivered' });
  }
});

export default router;
