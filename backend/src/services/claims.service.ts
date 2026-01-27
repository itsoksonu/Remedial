import { Prisma, ClaimStatus, DenialPriority } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { cache } from '../utils/cache';

const claimInclude = {
  lineItems: true,
  patient: true,
  provider: true,
  payer: true,
  assignedUser: true,
  actions: {
    include: { user: true },
    orderBy: { createdAt: 'desc' as const },
    take: 10,
  },
  notes: {
    include: { user: true },
    orderBy: { createdAt: 'desc' as const },
  },
  appeals: {
    orderBy: { createdAt: 'desc' as const },
  },
  paymentPostings: {
    include: { lineItems: true },
    orderBy: { paymentDate: 'desc' as const },
  },
};

export class ClaimsService {
  async createClaim(organizationId: string, data: any) {
    const claim = await prisma.claim.create({
      data: {
        organizationId,
        ...data,
        lineItems: data.lineItems
          ? {
              create: data.lineItems,
            }
          : undefined,
      },
      include: {
        lineItems: true,
        patient: true,
        provider: true,
        payer: true,
      },
    });

    // Invalidate cache
    await cache.invalidatePattern(`claims:${organizationId}:*`);

    return claim;
  }

  async getClaims(organizationId: string, filters: any) {
    const cacheKey = `claims:${organizationId}:${JSON.stringify(filters)}`;

    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const {
      page = 1,
      limit = 20,
      status,
      priority,
      assignedTo,
      search,
      dateFrom,
      dateTo,
    } = filters;

    const where: Prisma.ClaimWhereInput = {
      organizationId,
      ...(status && { status: status as ClaimStatus }),
      ...(priority && { priority: priority as DenialPriority }),
      ...(assignedTo && { assignedTo }),
      ...(search && {
        OR: [
          { claimNumber: { contains: search, mode: 'insensitive' } },
          {
            patient: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
          { denialReason: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(dateFrom || dateTo
        ? {
            dateOfService: {
              ...(dateFrom && { gte: dateFrom }),
              ...(dateTo && { lte: dateTo }),
            },
          }
        : {}),
    };

    const [claims, total] = await Promise.all([
      prisma.claim.findMany({
        where,
        include: {
          patient: { select: { firstName: true, lastName: true } },
          provider: { select: { firstName: true, lastName: true } },
          payer: { select: { name: true } },
          assignedUser: { select: { firstName: true, lastName: true, email: true } },
          lineItems: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.claim.count({ where }),
    ]);

    const result = {
      claims,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, result, 300);

    return result;
  }

  async getClaimById(id: string, organizationId: string) {
    const claim = await prisma.claim.findFirst({
      where: { id, organizationId },
      include: claimInclude,
    });

    if (!claim) {
      throw new AppError('Claim not found', 404);
    }

    return claim;
  }

  async updateClaim(id: string, organizationId: string, data: any, userId: string) {
    const existingClaim = await this.getClaimById(id, organizationId);

    const claim = await prisma.claim.update({
      where: { id },
      data,
      include: {
        lineItems: true,
        patient: true,
        provider: true,
        payer: true,
      },
    });

    // Log action
    await prisma.claimAction.create({
      data: {
        claimId: id,
        userId,
        actionType: 'status_change',
        description: `Updated claim`,
        previousState: existingClaim,
        newState: claim,
      },
    });

    // Invalidate cache
    await cache.invalidatePattern(`claims:${organizationId}:*`);

    return claim;
  }

  async importClaimsFromCSV(organizationId: string, csvData: any[]) {
    const claims = await prisma.$transaction(
      csvData.map((row) =>
        prisma.claim.create({
          data: {
            organizationId,
            claimNumber: row.claimNumber,
            dateOfService: new Date(row.dateOfService),
            totalCharge: parseFloat(row.totalCharge),
            denialCode: row.denialCode,
            denialCodeNormalized: this.normalizeDenialCode(row.denialCode),
            denialReason: row.denialReason,
            status: 'pending',
            priority: 'medium',
          },
        }),
      ),
    );

    await cache.invalidatePattern(`claims:${organizationId}:*`);

    return claims;
  }

  private normalizeDenialCode(code: string): string {
    if (!code) return '';
    return code.trim().toUpperCase();
  }

  async assignClaim(claimId: string, organizationId: string, userId: string, assignedBy: string) {
    const claim = await prisma.claim.update({
      where: { id: claimId, organizationId },
      data: {
        assignedTo: userId,
        assignedAt: new Date(),
      },
    });

    await prisma.claimAction.create({
      data: {
        claimId,
        userId: assignedBy,
        actionType: 'assignment',
        description: `Assigned to user ${userId}`,
      },
    });

    // Send notification
    await prisma.notification.create({
      data: {
        userId,
        organizationId,
        type: 'in_app',
        title: 'New Claim Assigned',
        message: `Claim ${claim.claimNumber} has been assigned to you`,
        relatedClaimId: claimId,
        actionUrl: `/claims/${claimId}`,
      },
    });

    await cache.invalidatePattern(`claims:${organizationId}:*`);

    return claim;
  }
}

export default new ClaimsService();
