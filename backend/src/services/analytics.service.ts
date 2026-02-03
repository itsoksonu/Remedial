import prisma from '../config/database';
import { Prisma, Claim, Payer, Provider } from '@prisma/client';

class AnalyticsService {
  async getDashboardMetrics(organizationId: string) {
    const totalClaims = await prisma.claim.count({
      where: { organizationId },
    });

    const deniedClaims = await prisma.claim.count({
      where: { organizationId, status: 'rejected' },
    });

    const denialRate = totalClaims > 0 ? (deniedClaims / totalClaims) * 100 : 0;

    const totalDenialAmountResult = await prisma.claim.aggregate({
      where: { organizationId, status: 'rejected' },
      _sum: { totalCharge: true },
    });
    const totalDenialAmount = totalDenialAmountResult._sum.totalCharge?.toNumber() || 0;

    // Approximating 'recoveredAmount' via 'paidAmount' for previously rejected claims
    const recoveredClaimsResult = await prisma.claim.aggregate({
      where: {
        organizationId,
        status: 'paid',
        denialCode: { not: null },
      },
      _sum: { paidAmount: true },
    });
    const recoveredAmount = recoveredClaimsResult._sum.paidAmount?.toNumber() || 0;

    const recoveryRate = totalDenialAmount > 0 ? (recoveredAmount / totalDenialAmount) * 100 : 0;

    // Avg Days to Resolve
    const resolvedClaims = await prisma.claim.findMany({
      where: {
        organizationId,
        status: { in: ['resolved', 'paid'] },
        resolvedAt: { not: null },
      },
      select: { createdAt: true, resolvedAt: true },
    });

    let totalDays = 0;
    if (resolvedClaims.length > 0) {
      totalDays = resolvedClaims.reduce(
        (acc: number, claim: { createdAt: Date; resolvedAt: Date | null }) => {
          if (!claim.resolvedAt) return acc;
          const diffTime = Math.abs(claim.resolvedAt.getTime() - claim.createdAt.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return acc + diffDays;
        },
        0,
      );
    }
    const avgDaysToResolve = resolvedClaims.length > 0 ? totalDays / resolvedClaims.length : 0;

    // Trends
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentMonthStats = await this.getPeriodStats(organizationId, startOfCurrentMonth, now);
    const previousMonthStats = await this.getPeriodStats(
      organizationId,
      startOfPreviousMonth,
      endOfPreviousMonth,
    );

    const curentDenialRate =
      currentMonthStats.total > 0 ? (currentMonthStats.denied / currentMonthStats.total) * 100 : 0;
    const previousDenialRate =
      previousMonthStats.total > 0
        ? (previousMonthStats.denied / previousMonthStats.total) * 100
        : 0;

    return {
      totalClaims,
      deniedClaims,
      denialRate: parseFloat(denialRate.toFixed(2)),
      totalDenialAmount: parseFloat(totalDenialAmount.toFixed(2)),
      recoveredAmount: parseFloat(recoveredAmount.toFixed(2)),
      recoveryRate: parseFloat(recoveryRate.toFixed(2)),
      avgDaysToResolve: parseFloat(avgDaysToResolve.toFixed(1)),
      trends: {
        denialRate: {
          current: parseFloat(curentDenialRate.toFixed(2)),
          previous: parseFloat(previousDenialRate.toFixed(2)),
          change: parseFloat((curentDenialRate - previousDenialRate).toFixed(2)),
        },
      },
    };
  }

  private async getPeriodStats(organizationId: string, startDate: Date, endDate: Date) {
    const total = await prisma.claim.count({
      where: {
        organizationId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const denied = await prisma.claim.count({
      where: {
        organizationId,
        status: 'rejected',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return { total, denied };
  }

  async getDenialTrends(organizationId: string) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const claims = await prisma.claim.findMany({
      where: {
        organizationId,
        status: 'rejected',
        createdAt: { gte: sixMonthsAgo },
      },
      select: { createdAt: true, denialCode: true },
    });

    const trends: Record<string, number> = {};

    claims.forEach((claim: { createdAt: Date }) => {
      const month = claim.createdAt.toLocaleString('default', { month: 'short' });
      trends[month] = (trends[month] || 0) + 1;
    });

    return Object.entries(trends).map(([month, count]) => ({ month, count }));
  }

  async getPayerPerformance(organizationId: string) {
    const payers = await prisma.payer.findMany({
      where: { organizationId },
      include: {
        claims: {
          select: { status: true },
        },
      },
    });

    return payers.map((payer: Payer & { claims: { status: string }[] }) => {
      const total = payer.claims.length;
      const denied = payer.claims.filter((c: { status: string }) => c.status === 'rejected').length;
      const rate = total > 0 ? (denied / total) * 100 : 0;

      return {
        payerId: payer.id,
        payerName: payer.name,
        totalClaims: total,
        denialRate: parseFloat(rate.toFixed(2)),
      };
    });
  }

  async getProviderPerformance(organizationId: string) {
    const providers = await prisma.provider.findMany({
      where: { organizationId },
      include: {
        claims: {
          select: { status: true },
        },
      },
    });

    return providers.map((provider: Provider & { claims: { status: string }[] }) => {
      const total = provider.claims.length;
      const denied = provider.claims.filter(
        (c: { status: string }) => c.status === 'rejected',
      ).length;
      const rate = total > 0 ? (denied / total) * 100 : 0;

      return {
        providerId: provider.id,
        providerName: `${provider.firstName} ${provider.lastName}`,
        totalClaims: total,
        denialRate: parseFloat(rate.toFixed(2)),
      };
    });
  }

  async generateReport(organizationId: string, filters: any) {
    const { reportType, startDate, endDate, format } = filters;

    if (reportType === 'denial_summary') {
      const claims = await prisma.claim.findMany({
        where: {
          organizationId,
          status: 'rejected',
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        include: {
          payer: true,
          provider: true,
          patient: true,
        },
      });

      if (format === 'csv') {
        const headers = [
          'Claim Number',
          'Date of Service',
          'Denial Code',
          'Reason',
          'Payer',
          'Provider',
          'Amount',
        ];
        const rows = claims.map((c: any) => [
          c.claimNumber,
          c.dateOfService.toISOString().split('T')[0],
          c.denialCode || 'N/A',
          c.denialReason || 'N/A',
          c.payer?.name || 'Unknown',
          `${c.provider?.firstName} ${c.provider?.lastName}`,
          c.totalCharge.toString(),
        ]);

        const csvContent = [headers.join(','), ...rows.map((row: string[]) => row.join(','))].join(
          '\n',
        );

        return csvContent;
      }
    }

    throw new Error('Report type or format not fully supported yet');
  }
}

export default new AnalyticsService();
