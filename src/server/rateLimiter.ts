import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipBuckets = new Map<string, RateLimitRecord>();

// Cleanup stale bucket entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of ipBuckets.entries()) {
    if (now > record.resetTime) {
      ipBuckets.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Lightweight, zero-dependency sliding rate limiter middleware
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  keyPrefix?: string;
}) {
  const { windowMs, max, message = 'Too many requests, please try again later.', keyPrefix = 'rl' } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // In local testing/unit test runs, allow header bypass if explicitly set
    if (process.env.NODE_ENV === 'test' && req.headers['x-skip-rate-limit'] === 'true') {
      return next();
    }

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const key = `${keyPrefix}:${clientIp}`;
    const now = Date.now();

    const record = ipBuckets.get(key);

    if (!record || now > record.resetTime) {
      ipBuckets.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', max - 1);
      return next();
    }

    record.count += 1;
    const remaining = Math.max(0, max - record.count);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);

    if (record.count > max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfterSeconds: retryAfter,
        },
      });
    }

    next();
  };
}

// Specialized rate limiters for high-security endpoints
export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 login/auth attempts per min
  message: 'Too many authentication attempts. Please try again after 60 seconds.',
  keyPrefix: 'auth',
});

export const bookingRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 40, // 40 booking creation attempts per min
  message: 'Booking request rate limit reached. Please wait before submitting another booking.',
  keyPrefix: 'booking',
});

export const webhookRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 100, // 100 webhook events per min
  message: 'Webhook intake rate limit exceeded.',
  keyPrefix: 'webhook',
});
