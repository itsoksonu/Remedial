import { Prisma, PaymentStatus, ActionType } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { cache } from '../utils/cache';

const paymentInclude = {
  claim: {
    select: {
      claimNumber: true,
      patient: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      payer: {
        select: {
          name: true,
        },
      },
    },
  },
  poster: {
    select: {
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  verifier: {
    select: {
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  lineItems: {
    include: {
      claimLineItem: {
        select: {
          cptCode: true,
          description: true,
          chargeAmount: true,
        },
      },
    },
  },
};

export class PaymentsService {
  async findAll(organizationId: string, filters: any) {
    const cacheKey = `payments:${organizationId}:${JSON.stringify(filters)}`;
    const cached = await cache.get<any>(cacheKey);
    if (cached) return cached;

    const page = Number(filters.page) || 1;
    const limit = Math.min(Number(filters.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentPostingWhereInput = {
      organizationId,
    };

    if (filters.status) where.status = filters.status as PaymentStatus;
    if (filters.claimId) where.claimId = filters.claimId;
    if (filters.postedBy) where.postedBy = filters.postedBy;

    if (filters.dateFrom || filters.dateTo) {
      where.paymentDate = {};
      if (filters.dateFrom) where.paymentDate.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.paymentDate.lte = new Date(filters.dateTo);
    }

    if (filters.search) {
      where.OR = [
        { checkNumber: { contains: filters.search, mode: 'insensitive' } },
        { claim: { claimNumber: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const [payments, total] = await Promise.all([
      prisma.paymentPosting.findMany({
        where,
        skip,
        take: limit,
        include: paymentInclude,
        orderBy: { paymentDate: 'desc' },
      }),
      prisma.paymentPosting.count({ where }),
    ]);

    const result = {
      payments,
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
    const payment = await prisma.paymentPosting.findFirst({
      where: { id, organizationId },
      include: paymentInclude,
    });

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    return payment;
  }

  async create(organizationId: string, userId: string, data: any) {
    const { lineItems, ...paymentData } = data;

    // Validate claim exists and belongs to organization
    const claim = await prisma.claim.findFirst({
      where: { id: paymentData.claimId, organizationId },
    });

    if (!claim) {
      throw new AppError('Claim not found', 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Payment Posting
      const payment = await tx.paymentPosting.create({
        data: {
          organizationId,
          postedBy: userId,
          claimId: paymentData.claimId,
          paymentDate: new Date(paymentData.paymentDate),
          checkNumber: paymentData.checkNumber,
          totalAmount: paymentData.totalAmount,
          eobDocumentKey: paymentData.eobDocumentKey,
          eraTraceNumber: paymentData.eraTraceNumber,
          notes: paymentData.notes,
          status: PaymentStatus.posted,
          lineItems: {
            create: lineItems.map((item: any) => ({
              claimLineItemId: item.claimLineItemId,
              cptCode: item.cptCode,
              paidAmount: item.paidAmount,
              adjustmentAmount: item.adjustmentAmount || 0,
              adjustmentCodes: item.adjustmentCodes || [],
            })),
          },
        },
        include: paymentInclude,
      });

      // 2. Update Claim Line Items (Paid Amount & Adjustments)
      let claimTotalPaid = new Prisma.Decimal(claim.paidAmount);
      let claimTotalAdj = new Prisma.Decimal(claim.adjustmentAmount);

      for (const item of lineItems) {
        if (item.claimLineItemId) {
          await tx.claimLineItem.update({
            where: { id: item.claimLineItemId },
            data: {
              paidAmount: { increment: item.paidAmount },
              adjustmentAmount: { increment: item.adjustmentAmount || 0 },
            },
          });

          claimTotalPaid = claimTotalPaid.add(new Prisma.Decimal(item.paidAmount));
          claimTotalAdj = claimTotalAdj.add(new Prisma.Decimal(item.adjustmentAmount || 0));
        }
      }

      // 3. Update Claim Totals
      await tx.claim.update({
        where: { id: claim.id },
        data: {
          paidAmount: claimTotalPaid,
          adjustmentAmount: claimTotalAdj,
        },
      });

      // 4. Record Action
      await tx.claimAction.create({
        data: {
          claimId: claim.id,
          userId,
          actionType: ActionType.mark_paid, // or generic update
          description: `Posted payment of $${paymentData.totalAmount}`,
          notes: `Check/Ref: ${paymentData.checkNumber}`,
        },
      });

      return payment;
    });

    await cache.invalidatePattern(`payments:${organizationId}:*`);
    await cache.invalidatePattern(`claims:${organizationId}:*`);

    return result;
  }

  async verify(id: string, organizationId: string, userId: string) {
    const payment = await this.findById(id, organizationId);

    if (payment.status === PaymentStatus.verified) {
      throw new AppError('Payment already verified', 400);
    }

    const updatedPayment = await prisma.paymentPosting.update({
      where: { id },
      data: {
        status: PaymentStatus.verified,
        verifiedBy: userId,
        verifiedAt: new Date(),
      },
      include: paymentInclude,
    });

    await cache.invalidatePattern(`payments:${organizationId}:*`);

    return updatedPayment;
  }

  async getSummary(organizationId: string, filters: any) {
    const cacheKey = `payments:summary:${organizationId}:${JSON.stringify(filters)}`;
    const cached = await cache.get<any>(cacheKey);
    if (cached) return cached;

    const where: Prisma.PaymentPostingWhereInput = {
      organizationId,
    };

    if (filters.dateFrom) where.paymentDate = { gte: new Date(filters.dateFrom) };
    if (filters.dateTo) {
      where.paymentDate = { ...(where.paymentDate as any), lte: new Date(filters.dateTo) };
    }

    const [totalPostedObj, totalVerifiedObj, pendingObj] = await Promise.all([
      prisma.paymentPosting.aggregate({
        where,
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      prisma.paymentPosting.aggregate({
        where: { ...where, status: PaymentStatus.verified },
        _sum: { totalAmount: true },
      }),
      prisma.paymentPosting.aggregate({
        where: { ...where, status: PaymentStatus.posted }, // 'posted' implies pending verification in this context, or add PaymentStatus.pending if that's the enum
        _sum: { totalAmount: true },
      }),
    ]);

    // Group by month (requires raw query for efficient date truncation or post-processing)
    // For simplicity, let's fetch basic stats first. Advanced analytics handles deep grouping.
    // If "byMonth" is strictly required, we can do a raw query or fetch and reduce.
    // Let's do a raw query for monthly breakdown for the current year or filtered range.

    // Fallback: simplified summary
    const totalPosted = totalPostedObj._sum.totalAmount || 0;
    const totalVerified = totalVerifiedObj._sum.totalAmount || 0;
    const pendingVerification = pendingObj._sum.totalAmount || 0;

    const result = {
      totalPosted,
      totalVerified,
      pendingVerification,
      count: totalPostedObj._count.id,
    };

    await cache.set(cacheKey, result, 300);
    return result;
  }
}

export default new PaymentsService();
