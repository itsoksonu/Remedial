import { AppealStatus, ClaimStatus, Prisma } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { cache } from '../utils/cache';

const appealInclude = {
  claim: {
    select: {
      id: true,
      claimNumber: true,
      status: true,
      payerId: true,
    },
  },
  payer: {
    select: {
      id: true,
      name: true,
    },
  },
  organization: {
    select: {
      id: true,
      name: true,
    },
  },
};

class AppealsService {
  async findAll(organizationId: string, filters: any) {
    const cacheKey = `appeals:${organizationId}:${JSON.stringify(filters)}`;
    const cached = await cache.get<any>(cacheKey);
    if (cached) return cached;

    const page = Number(filters.page) || 1;
    const limit = Math.min(Number(filters.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.AppealWhereInput = {
      organizationId,
    };

    if (filters.status) {
      where.status = filters.status as AppealStatus;
    }

    if (filters.claimId) {
      where.claimId = filters.claimId;
    }

    const [appeals, total] = await Promise.all([
      prisma.appeal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: appealInclude,
      }),
      prisma.appeal.count({ where }),
    ]);

    const result = {
      appeals,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    await cache.set(cacheKey, result, 300);
    return result;
  }

  async findById(id: string, organizationId: string) {
    const appeal = await prisma.appeal.findFirst({
      where: { id, organizationId },
      include: appealInclude,
    });

    if (!appeal) {
      throw new AppError('Appeal not found', 404);
    }

    return appeal;
  }

  async create(
    organizationId: string,
    userId: string,
    data: { claimId: string; level: number; letterContent: string; supportingDocuments?: string[] },
  ) {
    const claim = await prisma.claim.findFirst({
      where: {
        id: data.claimId,
        organizationId,
      },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!claim) {
      throw new AppError('Claim not found', 404);
    }

    const created = await prisma.$transaction(async (tx) => {
      const appeal = await tx.appeal.create({
        data: {
          organizationId,
          claimId: data.claimId,
          level: data.level || 1,
          letterContent: data.letterContent,
          supportingDocuments: data.supportingDocuments || [],
          createdBy: userId,
          status: AppealStatus.draft,
        },
        include: appealInclude,
      });

      await tx.claim.update({
        where: { id: data.claimId },
        data: { status: ClaimStatus.appealed },
      });

      return appeal;
    });

    await cache.invalidatePattern(`appeals:${organizationId}:*`);
    return created;
  }

  async update(
    id: string,
    organizationId: string,
    data: Partial<{
      level: number;
      status: AppealStatus;
      letterContent: string;
      supportingDocuments: string[];
    }>,
  ) {
    await this.findById(id, organizationId);

    const updated = await prisma.appeal.update({
      where: { id },
      data,
      include: appealInclude,
    });

    await cache.invalidatePattern(`appeals:${organizationId}:*`);
    return updated;
  }

  async submit(
    id: string,
    organizationId: string,
    userId: string,
    data: { payerId: string; submissionMethod: 'portal' | 'fax' | 'mail'; confirmationNumber: string },
  ) {
    const existing = await this.findById(id, organizationId);

    if (existing.status !== AppealStatus.draft && existing.status !== AppealStatus.pending_review) {
      throw new AppError('Only draft or pending_review appeals can be submitted', 400);
    }

    const updated = await prisma.appeal.update({
      where: { id },
      data: {
        submittedTo: data.payerId,
        submittedAt: new Date(),
        submittedBy: userId,
        status: AppealStatus.submitted,
        // These fields assume corresponding columns exist in the Appeal model
        // submissionMethod: data.submissionMethod,
        // confirmationNumber: data.confirmationNumber,
      },
      include: appealInclude,
    });

    await cache.invalidatePattern(`appeals:${organizationId}:*`);
    return updated;
  }

  async recordResponse(
    id: string,
    organizationId: string,
    data: { outcome: 'approved' | 'denied' | 'partial_approval'; responseContent: string; recoveredAmount?: number },
  ) {
    const existing = await this.findById(id, organizationId);

    let status: AppealStatus;
    switch (data.outcome) {
      case 'approved':
      case 'partial_approval':
        status = AppealStatus.approved;
        break;
      case 'denied':
        status = AppealStatus.denied;
        break;
      default:
        status = existing.status;
    }

    const updated = await prisma.appeal.update({
      where: { id },
      data: {
        outcome: data.outcome,
        responseContent: data.responseContent,
        recoveredAmount: data.recoveredAmount,
        responseReceivedAt: new Date(),
        status,
      },
      include: appealInclude,
    });

    await cache.invalidatePattern(`appeals:${organizationId}:*`);
    return updated;
  }
}

export default new AppealsService();

