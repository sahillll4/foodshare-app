import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { firebaseAuth } from '../lib/firebase';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/send-otp', (_req, res: Response): void => {
  res.json({ message: 'Use Firebase Phone Auth SDK on mobile to get ID token, then call /verify-otp' });
});

router.post('/verify-otp', async (req, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body as { idToken: string };
    if (!idToken) { res.status(400).json({ error: 'idToken is required' }); return; }

    const decoded = await firebaseAuth.verifyIdToken(idToken);
    const phone = decoded.phone_number;
    if (!phone) { res.status(400).json({ error: 'Token does not contain a phone number' }); return; }

    let user = await prisma.user.findUnique({ where: { phone }, include: { roles: true } });
    const isNewUser = !user;

    if (!user) {
      user = await prisma.user.create({
        data: { phone, primaryRole: 'donor' },
        include: { roles: true },
      });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      isNewUser,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        primaryRole: user.primaryRole,
        roles: user.roles.map((r) => r.role),
        verified: user.verified,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(401).json({ error: 'Invalid Firebase ID token' });
  }
});

router.post('/profile', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, primaryRole, roles, orgName, orgType } = req.body as {
      name: string;
      primaryRole: string;
      roles: string[];
      orgName?: string;
      orgType?: string;
    };

    const validRoles = ['donor', 'receiver', 'courier'];
    if (!validRoles.includes(primaryRole)) {
      res.status(400).json({ error: 'primaryRole must be donor, receiver, or courier' });
      return;
    }

    const selectedRoles = (roles || [primaryRole]).filter((r) => validRoles.includes(r));

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        name,
        primaryRole,
        orgName,
        orgType,
        roles: {
          deleteMany: {},
          createMany: { data: selectedRoles.map((role) => ({ role })) },
        },
      },
      include: { roles: true },
    });

    res.json({
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        primaryRole: user.primaryRole,
        roles: user.roles.map((r) => r.role),
        orgName: user.orgName,
        orgType: user.orgType,
      },
    });
  } catch (err) {
    console.error('Profile setup error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.get('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { roles: true },
    });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    res.json({
      id: user.id,
      phone: user.phone,
      name: user.name,
      primaryRole: user.primaryRole,
      roles: user.roles.map((r) => r.role),
      avatarUrl: user.avatarUrl,
      orgName: user.orgName,
      orgType: user.orgType,
      verified: user.verified,
      ratingAvg: user.ratingAvg,
      ratingCount: user.ratingCount,
      impactMeals: user.impactMeals,
      impactPoints: user.impactPoints,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.patch('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, avatarUrl, fcmToken, orgName, orgType } = req.body as {
      name?: string;
      avatarUrl?: string;
      fcmToken?: string;
      orgName?: string;
      orgType?: string;
    };

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name, avatarUrl, fcmToken, orgName, orgType },
    });

    res.json({ success: true, name: user.name });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
