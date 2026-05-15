import { Router, Response, Request } from 'express';
import multer from 'multer';
import { prisma } from '../lib/prisma';
import { uploadImage } from '../lib/cloudinary';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';

interface MulterAuthRequest extends AuthRequest {
  file?: Express.Multer.File;
}

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ─── GET /api/listings ────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lat = req.query['lat'] as string;
    const lng = req.query['lng'] as string;
    const radius = (req.query['radius'] as string) || (process.env['DEFAULT_SEARCH_RADIUS_M'] as string) || '5000';
    const food_type = req.query['food_type'] as string | undefined;
    const cold_chain = req.query['cold_chain'] as string | undefined;
    const page = (req.query['page'] as string) || '1';
    const limit = (req.query['limit'] as string) || '20';

    if (!lat || !lng) { res.status(400).json({ error: 'lat and lng are required' }); return; }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const latF = parseFloat(lat);
    const lngF = parseFloat(lng);
    const radiusM = parseInt(radius);

    type ListingRow = {
      id: string; title: string; food_type: string; quantity_text: string;
      quantity_num: number; photo_url: string; address_text: string;
      latitude: number; longitude: number; pickup_start: Date; pickup_end: Date;
      status: string; requires_cold_chain: boolean; needs_courier: boolean;
      donor_id: string; donor_name: string; donor_rating_avg: number; distance_m: number;
    };

    // Haversine distance via raw SQL (works without PostGIS extension)
    let listings: ListingRow[];

    if (food_type && cold_chain === 'true') {
      listings = await prisma.$queryRaw<ListingRow[]>`
        SELECT fl.id, fl.title, fl.food_type, fl.quantity_text, fl.quantity_num,
          fl.photo_url, fl.address_text, fl.latitude, fl.longitude,
          fl.pickup_start, fl.pickup_end, fl.status, fl.requires_cold_chain, fl.needs_courier,
          fl.donor_id, u.name AS donor_name, u.rating_avg AS donor_rating_avg,
          (6371000 * acos(cos(radians(${latF})) * cos(radians(fl.latitude)) *
            cos(radians(fl.longitude) - radians(${lngF})) + sin(radians(${latF})) * sin(radians(fl.latitude)))) AS distance_m
        FROM food_listings fl JOIN users u ON u.id = fl.donor_id
        WHERE fl.status = 'live' AND fl.pickup_end > NOW() AND fl.flagged = false
          AND fl.food_type = ${food_type} AND fl.requires_cold_chain = true
        HAVING (6371000 * acos(cos(radians(${latF})) * cos(radians(fl.latitude)) *
            cos(radians(fl.longitude) - radians(${lngF})) + sin(radians(${latF})) * sin(radians(fl.latitude)))) <= ${radiusM}
        ORDER BY distance_m ASC LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    } else if (food_type) {
      listings = await prisma.$queryRaw<ListingRow[]>`
        SELECT fl.id, fl.title, fl.food_type, fl.quantity_text, fl.quantity_num,
          fl.photo_url, fl.address_text, fl.latitude, fl.longitude,
          fl.pickup_start, fl.pickup_end, fl.status, fl.requires_cold_chain, fl.needs_courier,
          fl.donor_id, u.name AS donor_name, u.rating_avg AS donor_rating_avg,
          (6371000 * acos(cos(radians(${latF})) * cos(radians(fl.latitude)) *
            cos(radians(fl.longitude) - radians(${lngF})) + sin(radians(${latF})) * sin(radians(fl.latitude)))) AS distance_m
        FROM food_listings fl JOIN users u ON u.id = fl.donor_id
        WHERE fl.status = 'live' AND fl.pickup_end > NOW() AND fl.flagged = false AND fl.food_type = ${food_type}
        HAVING (6371000 * acos(cos(radians(${latF})) * cos(radians(fl.latitude)) *
            cos(radians(fl.longitude) - radians(${lngF})) + sin(radians(${latF})) * sin(radians(fl.latitude)))) <= ${radiusM}
        ORDER BY distance_m ASC LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    } else {
      listings = await prisma.$queryRaw<ListingRow[]>`
        SELECT fl.id, fl.title, fl.food_type, fl.quantity_text, fl.quantity_num,
          fl.photo_url, fl.address_text, fl.latitude, fl.longitude,
          fl.pickup_start, fl.pickup_end, fl.status, fl.requires_cold_chain, fl.needs_courier,
          fl.donor_id, u.name AS donor_name, u.rating_avg AS donor_rating_avg,
          (6371000 * acos(cos(radians(${latF})) * cos(radians(fl.latitude)) *
            cos(radians(fl.longitude) - radians(${lngF})) + sin(radians(${latF})) * sin(radians(fl.latitude)))) AS distance_m
        FROM food_listings fl JOIN users u ON u.id = fl.donor_id
        WHERE fl.status = 'live' AND fl.pickup_end > NOW() AND fl.flagged = false
        HAVING (6371000 * acos(cos(radians(${latF})) * cos(radians(fl.latitude)) *
            cos(radians(fl.longitude) - radians(${lngF})) + sin(radians(${latF})) * sin(radians(fl.latitude)))) <= ${radiusM}
        ORDER BY distance_m ASC LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    }

    res.json({ listings, count: listings.length });
  } catch (err) {
    console.error('Get listings error:', err);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// ─── GET /api/listings/my ─────────────────────────────────────────────────────
router.get('/my', requireAuth, requireRole('donor'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status = req.query['status'] as string | undefined;
    const page = (req.query['page'] as string) || '1';
    const limit = (req.query['limit'] as string) || '20';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const listings = await prisma.foodListing.findMany({
      where: { donorId: req.user!.id, ...(status ? { status } : {}) },
      include: {
        claims: { where: { status: 'active' }, include: { receiver: { select: { name: true, phone: true, ratingAvg: true } } } },
        courierJobs: { where: { status: { in: ['accepted', 'picked_up'] } }, include: { courier: { select: { name: true, phone: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: parseInt(limit),
    });

    res.json({ listings });
  } catch (err) {
    console.error('Get my listings error:', err);
    res.status(500).json({ error: 'Failed to fetch your listings' });
  }
});

// ─── GET /api/listings/:id ────────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const listing = await prisma.foodListing.findUnique({
      where: { id: req.params['id'] as string },
      include: {
        donor: { select: { id: true, name: true, ratingAvg: true, ratingCount: true, impactMeals: true, avatarUrl: true, orgName: true } },
        claims: { where: { status: 'active' }, include: { receiver: { select: { name: true, avatarUrl: true, phone: true } } } },
        courierJobs: { where: { status: { in: ['accepted', 'picked_up'] } }, include: { courier: { select: { name: true, phone: true, avatarUrl: true } } } },
      },
    });

    if (!listing) { res.status(404).json({ error: 'Listing not found' }); return; }
    res.json({ listing });
  } catch (err) {
    console.error('Get listing error:', err);
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
});

// ─── POST /api/listings ───────────────────────────────────────────────────────
router.post('/', requireAuth, requireRole('donor'), upload.single('photo'), async (req: MulterAuthRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as Record<string, string>;
    const { title, description, foodType, quantityText, quantityNum, latitude, longitude,
      addressText, pickupStart, pickupEnd, allergenNotes, packagingNotes,
      requiresColdChain, needsCourier, isScheduled } = body;

    if (!title || !foodType || !latitude || !longitude || !pickupStart || !pickupEnd) {
      res.status(400).json({ error: 'title, foodType, location, and pickup times are required' });
      return;
    }

    let photoUrl: string | undefined;
    if (req.file) {
      photoUrl = await uploadImage(req.file.buffer, 'food-listings');
    }

    const listing = await prisma.foodListing.create({
      data: {
        donorId: req.user!.id,
        title, description, foodType, quantityText,
        quantityNum: quantityNum ? parseInt(quantityNum) : undefined,
        photoUrl,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        addressText,
        pickupStart: new Date(pickupStart),
        pickupEnd: new Date(pickupEnd),
        allergenNotes, packagingNotes,
        requiresColdChain: requiresColdChain === 'true',
        needsCourier: needsCourier === 'true',
        isScheduled: isScheduled === 'true',
        status: 'live',
      },
    });

    res.status(201).json({ listing });
  } catch (err) {
    console.error('Create listing error:', err);
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

// ─── PATCH /api/listings/:id ──────────────────────────────────────────────────
router.patch('/:id', requireAuth, requireRole('donor'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params['id'] as string;
    const listing = await prisma.foodListing.findUnique({ where: { id } });

    if (!listing || listing.donorId !== req.user!.id) { res.status(403).json({ error: 'Not authorized' }); return; }
    if (listing.status !== 'live') { res.status(400).json({ error: 'Can only edit live listings' }); return; }

    const updated = await prisma.foodListing.update({ where: { id }, data: req.body as Record<string, unknown> });
    res.json({ listing: updated });
  } catch (err) {
    console.error('Update listing error:', err);
    res.status(500).json({ error: 'Failed to update listing' });
  }
});

// ─── DELETE /api/listings/:id ─────────────────────────────────────────────────
router.delete('/:id', requireAuth, requireRole('donor'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params['id'] as string;
    const listing = await prisma.foodListing.findUnique({ where: { id } });

    if (!listing || listing.donorId !== req.user!.id) { res.status(403).json({ error: 'Not authorized' }); return; }

    await prisma.foodListing.update({ where: { id }, data: { status: 'cancelled' } });
    res.json({ success: true });
  } catch (err) {
    console.error('Cancel listing error:', err);
    res.status(500).json({ error: 'Failed to cancel listing' });
  }
});

// ─── PATCH /api/listings/:id/confirm-pickup ───────────────────────────────────
router.patch('/:id/confirm-pickup', requireAuth, requireRole('donor'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params['id'] as string;
    const listing = await prisma.foodListing.findUnique({ where: { id } });

    if (!listing || listing.donorId !== req.user!.id) { res.status(403).json({ error: 'Not authorized' }); return; }

    const updated = await prisma.foodListing.update({ where: { id }, data: { status: 'picked_up' } });

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { impactMeals: { increment: listing.quantityNum || 0 } },
    });

    res.json({ listing: updated });
  } catch (err) {
    console.error('Confirm pickup error:', err);
    res.status(500).json({ error: 'Failed to confirm pickup' });
  }
});

export default router;
