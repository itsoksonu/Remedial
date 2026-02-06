import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis';
import { Request, Response } from 'express';

const rateLimitHandler = (req: Request, res: Response) => {
  res.status(429).json({
    success: false,
    message: 'Rate limit exceeded. Try again in 15 minutes.',
  });
};

const createLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    store: new RedisStore({
      // @ts-ignore
      sendCommand: (...args: string[]) => redis.call(...args),
    }),
    windowMs,
    max,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: message,
      });
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

export const authLimiter = createLimiter(
  15 * 60 * 1000,
  50,
  'Rate limit exceeded. Try again in 15 minutes.',
); // 5 requests per 15 minutes
export const standardLimiter = createLimiter(
  15 * 60 * 1000,
  100,
  'Rate limit exceeded. Try again in 15 minutes.',
); // 100 requests per 15 minutes
export const fileLimiter = createLimiter(
  60 * 60 * 1000,
  20,
  'File upload rate limit exceeded. Try again in 1 hour.',
); // 20 requests per hour
export const aiLimiter = createLimiter(
  60 * 60 * 1000,
  50,
  'AI request rate limit exceeded. Try again in 1 hour.',
); // 50 requests per hour
