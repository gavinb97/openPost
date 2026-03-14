// ============================================================
// Global Error Handler
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    res.status(400).json({ ok: false, error: 'Validation error', details: messages });
    return;
  }

  // Known application errors
  if (err.statusCode) {
    res.status(err.statusCode).json({ ok: false, error: err.message });
    return;
  }

  // Unexpected errors
  console.error('[ERROR]', err);
  res.status(500).json({ ok: false, error: 'Internal server error' });
}

/** Utility to create errors with status codes */
export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

/** Async route wrapper — catches promise rejections */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
