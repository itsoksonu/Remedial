import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import aiService from '../services/ai.service';
import claimsService from '../services/claims.service';
import { AppError } from '../middleware/errorHandler';
import { aiQueue } from '../queues/ai-analysis.queue';

export class AIController {
  async analyzeClaim(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;

      const claim = await claimsService.getClaimById(id, organizationId);

      const analysis = await aiService.analyzeDenial({
        claimNumber: claim.claimNumber,
        denialCode: claim.denialCode,
        denialReason: claim.denialReason,
        dateOfService: claim.dateOfService,
        totalCharge: claim.totalCharge.toNumber(),
        payerId: claim.payerId,
        payerName: claim.payer?.name,
        cptCodes: claim.lineItems?.map((li: any) => li.cptCode) || [],
      });

      // Update claim with AI analysis
      await claimsService.updateClaim(
        id,
        organizationId,
        {
          aiRecommendedAction: analysis.recommendedAction,
          aiConfidenceScore: analysis.confidence,
          aiAnalyzedAt: new Date(),
          priority: analysis.priority,
        },
        req.user!.id,
      );

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      next(error);
    }
  }

  async batchAnalyze(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { claimIds } = req.body;
      const organizationId = req.user!.organizationId;

      if (!Array.isArray(claimIds) || claimIds.length === 0) {
        throw new AppError('claimIds must be a non-empty array', 400);
      }

      // Add to queue for background processing
      await aiQueue.add('batch-analysis', {
        organizationId,
        claimIds,
      });

      res.json({
        success: true,
        message: `Batch analysis started for ${claimIds.length} claims`,
      });
    } catch (error) {
      next(error);
    }
  }

  async generateAppealLetter(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { appealType = 'first' } = req.body;
      const organizationId = req.user!.organizationId;

      const claim = await claimsService.getClaimById(id, organizationId);

      const letter = await aiService.generateAppealLetter(
        {
          claimNumber: claim.claimNumber,
          patientName: claim.patient
            ? `${claim.patient.firstName} ${claim.patient.lastName}`
            : 'Unknown',
          dateOfService: claim.dateOfService.toISOString().split('T')[0],
          providerName: claim.provider
            ? `${claim.provider.firstName} ${claim.provider.lastName}`
            : 'Unknown',
          payerName: claim.payer?.name || 'Unknown',
          denialCode: claim.denialCode,
          denialReason: claim.denialReason,
          services: claim.lineItems?.map((li: any) => li.cptCode) || [],
          amount: claim.totalCharge.toNumber(),
        },
        appealType,
      );

      res.json({
        success: true,
        data: { letter },
      });
    } catch (error) {
      next(error);
    }
  }

  async predictDenialRisk(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const claimData = req.body;

      const prediction = await aiService.predictDenialRisk(claimData);

      res.json({
        success: true,
        data: prediction,
      });
    } catch (error) {
      next(error);
    }
  }

  async chat(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { query, context } = req.body;

      if (!query) {
        throw new AppError('Query is required', 400);
      }

      const response = await aiService.chatWithAdvisor(query, context);

      res.json({
        success: true,
        data: { response },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AIController();
