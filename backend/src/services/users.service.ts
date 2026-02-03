import prisma from '../config/database';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AppError } from '../middleware/errorHandler';

interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  password?: string;
  phone?: string;
}

interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  phone?: string;
  isActive?: boolean;
}

export class UserService {
  async getOrganizationUsers(organizationId: string) {
    return prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createUser(organizationId: string, data: CreateUserDto) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Default password if not provided (should be changed on first login)
    const password = data.password || 'Temporary@123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        phone: data.phone,
        organizationId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return { ...user, tempPassword: data.password ? undefined : password };
  }

  async updateUser(userId: string, organizationId: string, data: UpdateUserDto) {
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async deactivateUser(userId: string, organizationId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Prevent deactivating oneself? Maybe controller logic.
    // Prevent deactivating the last admin? Complex check, maybe skip for now.

    return prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  }

  async getUserActivity(userId: string, organizationId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to last 50 activities
    });
  }
}

export default new UserService();
