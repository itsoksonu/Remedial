import { z } from 'zod';

export const createClaimSchema = z.object({
  body: z.object({
    claimNumber: z.string().min(1).max(100),
    patientId: z.string().uuid().optional(),
    providerId: z.string().uuid().optional(),
    payerId: z.string().uuid().optional(),
    dateOfService: z.string().transform((str) => new Date(str)),
    totalCharge: z.number().positive(),
    denialCode: z.string().optional(),
    denialReason: z.string().optional(),
    lineItems: z.array(z.object({
      lineNumber: z.number().int().positive(),
      cptCode: z.string().min(1).max(10),
      chargeAmount: z.number().positive(),
      units: z.number().int().positive().default(1),
    })).optional(),
  }),
});

export const updateClaimSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['pending', 'in_progress', 'appealed', 'resolved', 'rejected', 'paid', 'partial_paid']).optional(),
    priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
    assignedTo: z.string().uuid().optional(),
    denialCode: z.string().optional(),
    denialReason: z.string().optional(),
  }),
});

export const queryClaimsSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().int().positive()).default('1'),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).default('20'),
    status: z.string().optional(),
    priority: z.string().optional(),
    assignedTo: z.string().uuid().optional(),
    search: z.string().optional(),
    dateFrom: z.string().transform((str) => new Date(str)).optional(),
    dateTo: z.string().transform((str) => new Date(str)).optional(),
  }),
});