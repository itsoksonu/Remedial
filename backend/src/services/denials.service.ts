import { Prisma, DenialPriority } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { cache } from '../utils/cache';

interface CreateRuleDto {
  denialCode: string;
  payerId?: string;
  reason: string;
  recommendedAction: string;
  requiredDocumentation?: string[];
  priorityOverride?: DenialPriority;
  isActive?: boolean;
}

interface UpdateRuleDto {
  reason?: string;
  recommendedAction?: string;
  requiredDocumentation?: string[];
  priorityOverride?: DenialPriority;
  isActive?: boolean;
}

export class DenialsService {
  async getRules(organizationId: string) {
    const cacheKey = `denial_rules:${organizationId}`;
    const cached = await cache.get<any>(cacheKey);
    if (cached) return cached;

    const rules = await prisma.denialRule.findMany({
      where: { organizationId },
      orderBy: { denialCode: 'asc' },
    });

    await cache.set(cacheKey, rules, 600); // 10 minutes
    return rules;
  }

  async createRule(organizationId: string, userId: string, data: CreateRuleDto) {
    // Check if rule exists
    const existing = await prisma.denialRule.findFirst({
      where: {
        organizationId,
        denialCode: data.denialCode,
        payerId: data.payerId || null,
      },
    });

    if (existing) {
      throw new AppError('Rule already exists for this denial code and payer', 400);
    }

    const rule = await prisma.denialRule.create({
      data: {
        organizationId,
        denialCode: data.denialCode,
        payerId: data.payerId,
        reason: data.reason,
        recommendedAction: data.recommendedAction,
        requiredDocumentation: data.requiredDocumentation || [],
        priorityOverride: data.priorityOverride,
        isActive: data.isActive ?? true,
        createdBy: userId,
      },
      include: {
        payer: { select: { name: true } },
      },
    });

    await cache.invalidatePattern(`denial_rules:${organizationId}`);
    return rule;
  }

  async updateRule(id: string, organizationId: string, data: UpdateRuleDto) {
    const existing = await prisma.denialRule.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new AppError('Rule not found', 404);
    }

    const rule = await prisma.denialRule.update({
      where: { id },
      data: {
        ...data,
      },
    });

    await cache.invalidatePattern(`denial_rules:${organizationId}`);
    return rule;
  }

  async getAnalytics(
    organizationId: string,
    filters: { startDate?: string; endDate?: string; groupBy?: string },
  ) {
    const { startDate, endDate } = filters;

    const where: Prisma.ClaimWhereInput = {
      organizationId,
      denialCode: { not: null },
    };

    if (startDate || endDate) {
      where.dateOfService = {};
      if (startDate) where.dateOfService.gte = new Date(startDate);
      if (endDate) where.dateOfService.lte = new Date(endDate);
    }

    // Aggregate totals
    const aggregate = await prisma.claim.aggregate({
      where,
      _count: { _all: true },
      _sum: { totalCharge: true },
    });

    const totalDenials = aggregate._count._all;
    const totalDenialAmount = aggregate._sum.totalCharge || new Prisma.Decimal(0);

    // Top denial codes
    const topCodes = await prisma.claim.groupBy({
      by: ['denialCode'],
      where,
      _count: { denialCode: true },
      _sum: { totalCharge: true },
      orderBy: { _count: { denialCode: 'desc' } },
      take: 5,
    });

    const topDenialCodes = topCodes.map((item) => ({
      code: item.denialCode,
      count: item._count.denialCode,
      amount: item._sum.totalCharge,
      percentage: totalDenials > 0 ? ((item._count.denialCode / totalDenials) * 100).toFixed(1) : 0,
    }));

    // Denials by Payer
    const byPayer = await prisma.claim.groupBy({
      by: ['payerId'],
      where,
      _count: { payerId: true },
      orderBy: { _count: { payerId: 'desc' } },
      take: 5,
    });
    // We need to fetch payer names separately as groupBy doesn't support include
    const payerIds = byPayer.map((p) => p.payerId).filter((id) => id !== null) as string[];
    const payers = await prisma.payer.findMany({
      where: { id: { in: payerIds } },
      select: { id: true, name: true },
    });
    const payerMap = new Map(payers.map((p) => [p.id, p.name]));

    const denialsByPayer = byPayer.map((item) => ({
      payerId: item.payerId,
      payerName: item.payerId ? payerMap.get(item.payerId) : 'Unknown',
      count: item._count.payerId,
    }));

    // Trend Data (Group by month roughly)
    // Prisma raw query might be needed for efficient date truncation grouping, but lets do simple JS processing for now
    // if dataset isn't huge, or simplified approximate using multiple queries?
    // Using raw query for postgres date_trunc

    const trendData: any = { labels: [], denialCounts: [], amounts: [] };

    // Safe to use variable interpolation in raw query tags? Yes usually.
    // But let's look at doing it without raw first if possible.
    // Actually, standard prisma doesn't support date_trunc easily in groupBy efficiently across all DBs.
    // Given we use valid Postgres, we can use queryRaw.

    try {
      // Important: Handle dates safely.
      const start = startDate
        ? new Date(startDate)
        : new Date(new Date().setMonth(new Date().getMonth() - 6));
      const end = endDate ? new Date(endDate) : new Date();

      const rawTrends: any[] = await prisma.$queryRaw`
            SELECT 
                TO_CHAR(date_of_service, 'Mon YYYY') as label,
                DATE_TRUNC('month', date_of_service) as month_val,
                COUNT(*) as count, 
                SUM(total_charge) as amount
            FROM claims
            WHERE organization_id = ${organizationId}::uuid
            AND denial_code IS NOT NULL
            AND date_of_service >= ${start}
            AND date_of_service <= ${end}
            GROUP BY month_val, label
            ORDER BY month_val ASC
          `;

      trendData.labels = rawTrends.map((t: any) => t.label);
      trendData.denialCounts = rawTrends.map((t: any) => Number(t.count));
      trendData.amounts = rawTrends.map((t: any) => Number(t.amount));
    } catch (e) {
      console.error('Trend analytics error', e);
      // Fallback empty
    }

    return {
      totalDenials,
      totalDenialAmount,
      topDenialCodes,
      denialsByPayer,
      trendData,
    };
  }
}

export default new DenialsService();
