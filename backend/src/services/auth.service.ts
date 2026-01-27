import bcrypt from 'bcryptjs';
import { UserRole, Prisma } from '@prisma/client';
// Force re-index
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { signAccessToken, signRefreshToken, verifyToken } from '../utils/jwt';
import crypto from 'crypto';
import { Resend } from 'resend';
import { env } from '../config/env';

const resend = new Resend(env.RESEND_API_KEY);

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
}

export class AuthService {
  static async register(data: RegisterInput) {
    // Check if email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('Email already in use', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create Org and User in transaction
    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: data.organizationName,
        },
      });

      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          role: UserRole.admin,
          organizationId: organization.id,
          // Set required fields if any or defaults are handled by DB
        },
      });

      return { organization, user };
    });

    // Generate tokens
    const token = signAccessToken({ id: result.user.id, role: result.user.role });
    const refreshToken = signRefreshToken({ id: result.user.id });

    // Return data
    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
      },
      organization: {
        id: result.organization.id,
        name: result.organization.name,
      },
      token,
      refreshToken,
    };
  }

  static async login(data: Omit<RegisterInput, 'firstName' | 'lastName' | 'organizationName'>) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { organization: true },
    });

    if (!user || !user.passwordHash) {
      throw new AppError('Invalid email or password', 401);
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = signAccessToken({ id: user.id, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
      },
      token,
      refreshToken,
    };
  }

  static async refreshToken(token: string) {
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      throw new AppError('Invalid refresh token', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const newAccessToken = signAccessToken({ id: user.id, role: user.role });
    const newRefreshToken = signRefreshToken({ id: user.id });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  static async logout() {
    // Since we are using stateless JWT, we can't really "logout" server-side
    // without a blacklist. For now, client just removes the token.
    // If we implemented the session table fully, we would delete the session here.
    return { success: true };
  }

  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal user existence
      return { success: true };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken,
        passwordResetExpires,
      },
    });

    // Send email
    const resetUrl = `${env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      await resend.emails.send({
        from: 'onboarding@resend.dev', // Default Resend test sender
        to: user.email,
        subject: 'Password Reset Request',
        html: `
          <p>You requested a password reset</p>
          <p>Click this link to reset your password:</p>
          <a href="${resetUrl}">${resetUrl}</a>
        `,
      });
    } catch (error) {
      console.error('Email send failed:', error);
      throw new AppError('Email could not be sent', 500);
    }

    return { success: true };
  }

  static async resetPassword(token: string, password: string) {
    const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new AppError('Token is invalid or has expired', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return { success: true };
  }
}
