import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis';

export const apiLimiter = rateLimit({
  store: new RedisStore({
    // @ts-ignore
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
});

export const authLimiter = rateLimit({
  store: new RedisStore({
    // @ts-ignore
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts
  message: 'Too many login attempts',
});
