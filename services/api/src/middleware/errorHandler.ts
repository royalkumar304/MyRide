import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('API Error:', err);

  const statusCode = err.statusCode || 500;
  const userFriendlyMessage =
    err.message || 'Something went wrong on our servers. Please try again later.';

  res.status(statusCode).json({
    success: false,
    message: userFriendlyMessage,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
}
