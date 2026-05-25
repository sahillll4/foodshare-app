import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

import authRouter from './routes/auth';
import listingsRouter from './routes/listings';
import claimsRouter from './routes/claims';
import courierRouter from './routes/courier';
import messagesRouter from './routes/messages';
import ratingsRouter from './routes/ratings';
import notificationsRouter from './routes/notifications';
import reportsRouter from './routes/reports';
import { errorHandler, notFound } from './middleware/errorHandler';

import './workers/expiryWorker';

const app = express();
const server = http.createServer(app);

// ─── Socket.io Setup ──────────────────────────────────────────────────────────
export const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Join listing-specific room for status updates + chat
  socket.on('join:listing', ({ listingId }: { listingId: string }) => {
    socket.join(`listing:${listingId}`);
  });

  // Join personal notifications channel
  socket.on('join:user', ({ userId }: { userId: string }) => {
    socket.join(`user:${userId}`);
  });

  // Join city channel for new listing broadcasts
  socket.on('join:city', ({ cityCode }: { cityCode: string }) => {
    socket.join(`city:${cityCode}`);
  });

  // Real-time chat message relay
  socket.on('message:send', (payload: { listingId: string; content: string; receiverId: string; senderId: string; senderName: string }) => {
    io.to(`listing:${payload.listingId}`).emit('message:new', payload);
  });

  // Courier location broadcast
  socket.on('courier:location', (payload: { jobId: string; lat: number; lng: number }) => {
    io.to(`courier:job:${payload.jobId}`).emit('courier:location', payload);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: '*' })); // Restrict in production
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/listings', listingsRouter);
app.use('/api/listings', claimsRouter);    // claim routes hang off /api/listings/:id/claim
app.use('/api/claims', claimsRouter);      // also accessible as /api/claims/:claimId/collected
app.use('/api/courier', courierRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/ratings', ratingsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/reports', reportsRouter);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🍽️  FoodShare API running on port ${PORT}`);
  console.log(`📡  Socket.io ready`);
  console.log(`🌍  Env: ${process.env.NODE_ENV || 'development'}\n`);
});

export default app;
