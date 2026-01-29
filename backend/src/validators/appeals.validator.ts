import { z } from 'zod';

export const queryAppealsSchema = z.object({
  query: z.object({
    page: z
      .string()
      .transform(Number)
      .pipe(z.number().int().positive())
      .default('1'),
    limit: z
      .string()
      .transform(Number)
      .pipe(z.number().int().positive().max(100))
      .default('20'),
    status: z
      .enum(['draft', 'submitted', 'pending_review', 'approved', 'denied'])
      .optional(),
    claimId: z.string().uuid().optional(),
  }),
});

export const createAppealSchema = z.object({
  body: z.object({
    claimId: z.string().uuid(),
    level: z.number().int().positive().default(1),
    letterContent: z.string().min(1),
    supportingDocuments: z.array(z.string()).optional(),
  }),
});

export const updateAppealSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z
    .object({
      level: z.number().int().positive().optional(),
      status: z
        .enum(['draft', 'submitted', 'pending_review', 'approved', 'denied'])
        .optional(),
      letterContent: z.string().optional(),
      supportingDocuments: z.array(z.string()).optional(),
    })
    .refine((val) => Object.keys(val).length > 0, {
      message: 'At least one field must be provided to update an appeal',
    }),
});

export const submitAppealSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    payerId: z.string().uuid(),
    submissionMethod: z.enum(['portal', 'fax', 'mail']),
    confirmationNumber: z.string().min(1),
  }),
});

export const recordAppealResponseSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    outcome: z.enum(['approved', 'denied', 'partial_approval']),
    responseContent: z.string().min(1),
    recoveredAmount: z.number().nonnegative().optional(),
  }),
});

