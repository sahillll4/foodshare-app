import { Request, Response, NextFunction } from 'express';

interface PrismaError {
  code: string;
  meta?: Record<string, unknown>;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err);

  const prismaErr = err as unknown as PrismaError;
  if (prismaErr.code === 'P2002') {
    res.status(409).json({ error: 'Resource already exists (unique constraint)' });
    return;
  }
  if (prismaErr.code === 'P2025') {
    res.status(404).json({ error: 'Record not found' });
    return;
  }

  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
};
