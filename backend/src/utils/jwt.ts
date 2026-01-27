import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export const signAccessToken = (payload: any) => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1d' });
};

export const signRefreshToken = (payload: any) => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};
