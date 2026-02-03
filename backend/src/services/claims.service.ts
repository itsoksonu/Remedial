import { Prisma, ClaimStatus, DenialPriority, ActionType } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { cache } from '../utils/cache';
import { Readable } from 'stream';
import { FilesService } from './files.service';

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
  async findAll(organizationId: string, filters: any) {
    const cacheKey = `claims:${organizationId}:${JSON.stringify(filters)}`;
    const cached = await cache.get<any>(cacheKey);
    if (cached) return cached;

    const page = Number(filters.page) || 1;
    const limit = Math.min(Number(filters.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.ClaimWhereInput = {
      organizationId,
    };

    if (filters.status) where.status = filters.status as ClaimStatus;
    if (filters.priority) where.priority = filters.priority as DenialPriority;
    if (filters.assignedTo) where.assignedTo = filters.assignedTo;
    if (filters.payerId) where.payerId = filters.payerId;
    if (filters.providerId) where.providerId = filters.providerId;

    if (filters.search) {
      where.OR = [
        { claimNumber: { contains: filters.search, mode: 'insensitive' } },
        { patient: { firstName: { contains: filters.search, mode: 'insensitive' } } },
        { patient: { lastName: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    if (filters.dateFrom || filters.dateTo) {
      where.dateOfService = {};
      if (filters.dateFrom) where.dateOfService.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.dateOfService.lte = new Date(filters.dateTo);
    }

    const [claims, total] = await Promise.all([
      prisma.claim.findMany({
        where,
        skip,
        take: limit,
        include: {
          patient: { select: { firstName: true, lastName: true } },
          provider: { select: { firstName: true, lastName: true } },
          payer: { select: { name: true } },
          assignedUser: { select: { firstName: true, lastName: true, email: true } },
          lineItems: true,
        },
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

    await cache.set(cacheKey, result, 300); // 5 minutes
    return result;
  }

  async findById(id: string, organizationId: string) {
    const claim = await prisma.claim.findFirst({
      where: { id, organizationId },
      include: claimInclude,
    });

    if (!claim) {
      throw new AppError('Claim not found', 404);
    }

    return claim;
  }

  async create(organizationId: string, data: any) {
    const { lineItems, ...claimData } = data;

    // Ensure dateOfService is a Date object
    if (claimData.dateOfService && typeof claimData.dateOfService === 'string') {
      claimData.dateOfService = new Date(claimData.dateOfService);
    }

    const claim = await prisma.claim.create({
      data: {
        organizationId,
        ...claimData,
        lineItems: lineItems
          ? {
              create: lineItems,
            }
          : undefined,
      },
      include: claimInclude,
    });

    await cache.invalidatePattern(`claims:${organizationId}:*`);
    return claim;
  }

  async update(id: string, organizationId: string, data: any) {
    const exist = await this.findById(id, organizationId);

    const claim = await prisma.claim.update({
      where: { id },
      data,
      include: claimInclude,
    });

    await cache.invalidatePattern(`claims:${organizationId}:*`);
    return claim;
  }

  async assign(id: string, organizationId: string, userId: string, assignedByUserId: string) {
    await this.findById(id, organizationId); // check exists

    const result = await prisma.$transaction(async (tx) => {
      const claim = await tx.claim.update({
        where: { id },
        data: { assignedTo: userId, assignedAt: new Date() },
        include: claimInclude,
      });

      await tx.claimAction.create({
        data: {
          claimId: id,
          userId: assignedByUserId,
          actionType: ActionType.assignment,
          description: `Assigned claim to user ${userId}`,
        },
      });

      return claim;
    });

    await cache.invalidatePattern(`claims:${organizationId}:*`);
    return result;
  }

  async addNote(
    id: string,
    organizationId: string,
    userId: string,
    data: { content: string; isInternal: boolean; mentions?: string[] },
  ) {
    await this.findById(id, organizationId);

    const note = await prisma.claimNote.create({
      data: {
        claimId: id,
        userId,
        content: data.content,
        isInternal: data.isInternal,
        mentions: data.mentions || [],
      },
      include: { user: true },
    });

    return note;
  }

  async recordAction(
    id: string,
    organizationId: string,
    userId: string,
    data: { actionType: ActionType; description: string; notes?: string },
  ) {
    await this.findById(id, organizationId);

    const action = await prisma.claimAction.create({
      data: {
        claimId: id,
        userId,
        actionType: data.actionType,
        description: data.description,
        notes: data.notes,
      },
      include: { user: true },
    });

    return action;
  }

  async importClaims(organizationId: string, fileId: string) {
    // Fetch file stream from S3
    const stream = await FilesService.getFileStream(fileId, organizationId);

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    // Manual CSV parsing
    const text = buffer.toString('utf-8');
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return { imported: 0, failed: 0, errors: [] };

    const headers = lines[0].split(',').map((h) => h.trim());
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(',');
      const row: any = {};
      headers.forEach((h, idx) => {
        // Simple handling of potential quotes?
        // For now, simple split.
        row[h] = values[idx]?.trim();
      });
      rows.push(row);
    }

    let imported = 0;
    let failed = 0;
    const errors: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (!row.claimNumber) throw new Error('Missing claimNumber');

        await prisma.claim.create({
          data: {
            organizationId,
            claimNumber: row.claimNumber,
            patientId: row.patientId || undefined,
            providerId: row.providerId || undefined,
            payerId: row.payerId || undefined,
            dateOfService: new Date(row.dateOfService || new Date()),
            totalCharge: parseFloat(row.totalCharge || '0'),
            denialCode: row.denialCode,
            denialReason: row.denialReason,
            status: ClaimStatus.pending,
            priority: DenialPriority.medium,
          },
        });
        imported++;
      } catch (err: any) {
        failed++;
        errors.push({ row: i + 1, error: err.message });
      }
    }

    await cache.invalidatePattern(`claims:${organizationId}:*`);
    return { imported, failed, errors };
  }

  async exportClaims(organizationId: string, filters: any) {
    const result = await this.findAll(organizationId, { ...filters, limit: 10000 });
    const data = result.claims;

    // Manual CSV generation
    const header =
      'Claim Number,Date of Service,Patient Name,Provider Name,Payer,Total Charge,Status,Priority,Denial Code';
    const rows = data.map((c: any) => {
      const dos = c.dateOfService ? new Date(c.dateOfService).toISOString().split('T')[0] : '';
      const pat = `${c.patient?.firstName || ''} ${c.patient?.lastName || ''}`;
      const prov = `${c.provider?.firstName || ''} ${c.provider?.lastName || ''}`;
      // Escaping quotes for simpler CSV
      const escape = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;

      return [
        c.claimNumber,
        dos,
        escape(pat),
        escape(prov),
        escape(c.payer?.name || ''),
        c.totalCharge,
        c.status,
        c.priority,
        escape(c.denialCode || ''),
      ].join(',');
    });
    return [header, ...rows].join('\n');
  }
}

export default new ClaimsService();
