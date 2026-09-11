import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  // Security & standard middlewares
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Razorpay-Signature', 'X-Razorpay-Event-Id'],
    })
  );

  // Route-specific raw body middleware strictly for Razorpay Webhooks before global express.json
  app.use('/api/v1/payments/webhook', express.raw({ type: '*/*' }));

  // Standard JSON and URL-encoded parsers for all standard application routes
  app.use(
    express.json({
      limit: '10mb',
      verify: (req: any, _res, buf) => {
        // Save raw buffer on request object as defense-in-depth
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Version 1
  app.use('/api/v1', routes);

  // Fallback and Error Handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
