import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { logger } from '../../config/logger';
import { loggerContextStore } from '../logger-context.store';
import { randomUUID } from 'crypto';

@Injectable()
export class PinoRequestLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime();
    const correlationId = (req.headers['x-correlation-id'] || req.headers['x-request-id'] || randomUUID()) as string;

    // Set correlation ID in response headers so clients can trace it
    res.setHeader('x-correlation-id', correlationId);

    // Attach correlationId to request object for easy access
    (req as any).correlationId = correlationId;

    // Run the request within the AsyncLocalStorage context
    loggerContextStore.run({ correlationId }, () => {
      // Log request details
      logger.info({
        type: 'request',
        method: req.method,
        url: req.originalUrl || req.url,
        ip: req.ip,
      }, `Incoming Request: ${req.method} ${req.originalUrl || req.url}`);

      res.on('finish', () => {
        const diff = process.hrtime(start);
        const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

        logger.info({
          type: 'response',
          method: req.method,
          url: req.originalUrl || req.url,
          statusCode: res.statusCode,
          durationMs: parseFloat(durationMs),
        }, `Outgoing Response: ${req.method} ${req.originalUrl || req.url} - ${res.statusCode} (${durationMs}ms)`);
      });

      next();
    });
  }
}
