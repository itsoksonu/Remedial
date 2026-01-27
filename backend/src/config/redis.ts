import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { env } from './env';

export const redis = new Redis(env.REDIS_URL);

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.info('Redis error: ', err));
