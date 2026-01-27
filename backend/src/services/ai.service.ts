import { geminiClient } from '../config/ai';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { cache } from '../utils/cache';

interface DenialAnalysisResult {
  denialCode: string;
  reason: string;
  recommendedAction: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  requiredDocumentation: string[];
  appealStrategy: string;
}

export class AIService {
  private model = geminiClient.getGenerativeModel({ model: 'gemini-1.5-pro' });

  async analyzeDenial(claimData: any): Promise<DenialAnalysisResult> {
    try {
      // Check cache first
      const cacheKey = `ai:denial:${claimData.denialCode}:${claimData.payerId}`;
      const cached = await cache.get<DenialAnalysisResult>(cacheKey);
      if (cached) return cached;

      const prompt = this.buildDenialAnalysisPrompt(claimData);
      
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      const analysis = this.parseAnalysisResponse(response, claimData);
      
      // Cache for 24 hours
      await cache.set(cacheKey, analysis, 86400);
      
      return analysis;
    } catch (error) {
      logger.error('AI analysis error:', error);
      return this.getFallbackAnalysis(claimData);
    }
  }

  private buildDenialAnalysisPrompt(claimData: any): string {
    return `
You are a medical billing and denial management expert. Analyze the following claim denial and provide actionable recommendations.

Claim Information:
- Claim Number: ${claimData.claimNumber}
- Date of Service: ${claimData.dateOfService}
- Total Charge: $${claimData.totalCharge}
- Denial Code: ${claimData.denialCode}
- Denial Reason: ${claimData.denialReason || 'Not specified'}
- Payer: ${claimData.payerName || 'Unknown'}
- CPT Codes: ${claimData.cptCodes?.join(', ') || 'None'}

Based on this information, provide a JSON response with the following structure:
{
  "reason": "Clear explanation of why this claim was denied",
  "recommendedAction": "Specific actionable steps to resolve this denial",
  "priority": "critical|high|medium|low",
  "confidence": 0.0-1.0,
  "requiredDocumentation": ["list", "of", "required", "documents"],
  "appealStrategy": "Detailed strategy for appealing if needed"
}

Consider:
1. Common reasons for this denial code
2. Payer-specific policies
3. Required documentation for appeal
4. Success rate of appeals for similar cases
5. Time-sensitivity and financial impact

Respond ONLY with valid JSON, no additional text.
`;
  }

  private parseAnalysisResponse(response: string, claimData: any): DenialAnalysisResult {
    try {
      // Extract JSON from response (sometimes AI adds markdown formatting)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        denialCode: claimData.denialCode,
        reason: parsed.reason || 'Unable to determine',
        recommendedAction: parsed.recommendedAction || 'Manual review required',
        priority: parsed.priority || 'medium',
        confidence: parseFloat(parsed.confidence) || 0.5,
        requiredDocumentation: parsed.requiredDocumentation || [],
        appealStrategy: parsed.appealStrategy || 'Standard appeal process',
      };
    } catch (error) {
      logger.error('Failed to parse AI response:', error);
      return this.getFallbackAnalysis(claimData);
    }
  }

  private getFallbackAnalysis(claimData: any): DenialAnalysisResult {
    // Use rule-based system as fallback
    const denialRules: Record<string, Partial<DenialAnalysisResult>> = {
      'CO-45': {
        reason: 'Charge exceeds fee schedule/maximum allowable',
        recommendedAction: 'Verify contracted rates and appeal with documentation',
        priority: 'medium',
        requiredDocumentation: ['Contract terms', 'Fee schedule'],
      },
      'CO-16': {
        reason: 'Claim lacks required information or documentation',
        recommendedAction: 'Gather medical records and supporting documentation, then resubmit',
        priority: 'high',
        requiredDocumentation: ['Medical records', 'Physician notes', 'Test results'],
      },
      'CO-22': {
        reason: 'Duplicate claim submission',
        recommendedAction: 'Verify if claim was previously processed and void duplicate',
        priority: 'high',
        requiredDocumentation: ['Previous claim confirmation'],
      },
      'PR-1': {
        reason: 'Deductible amount - patient responsibility',
        recommendedAction: 'Bill patient for deductible amount',
        priority: 'low',
        requiredDocumentation: ['EOB', 'Patient statement'],
      },
    };

    const rule = denialRules[claimData.denialCode] || {
      reason: 'Denial requires manual review',
      recommendedAction: 'Review EOB and payer policy, contact payer if needed',
      priority: 'medium',
      requiredDocumentation: ['EOB', 'Claim details'],
    };

    return {
      denialCode: claimData.denialCode,
      confidence: 0.7,
      appealStrategy: 'Follow standard appeal process per payer guidelines',
      ...rule,
    } as DenialAnalysisResult;
  }

  async generateAppealLetter(claimData: any, appealType: 'first' | 'second' = 'first'): Promise<string> {
    try {
      const prompt = `
You are a medical billing expert writing an appeal letter for a denied insurance claim.

Claim Details:
- Claim Number: ${claimData.claimNumber}
- Patient: ${claimData.patientName}
- Date of Service: ${claimData.dateOfService}
- Provider: ${claimData.providerName}
- Payer: ${claimData.payerName}
- Denial Code: ${claimData.denialCode}
- Denial Reason: ${claimData.denialReason}
- Services: ${claimData.services?.join(', ')}
- Amount: $${claimData.amount}

Write a professional, compelling ${appealType}-level appeal letter that:
1. Clearly states the purpose of the appeal
2. References the denial code and reason
3. Provides medical necessity justification
4. Cites relevant policy or contract terms
5. Requests specific action (reconsideration)
6. Maintains professional tone

Format as a formal business letter. Include placeholders for [PROVIDER NAME], [DATE], etc.
`;

      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      logger.error('Appeal letter generation error:', error);
      return this.getTemplateAppealLetter(claimData);
    }
  }

  private getTemplateAppealLetter(claimData: any): string {
    return `[DATE]

[PAYER NAME]
[PAYER ADDRESS]

Re: Appeal for Claim #${claimData.claimNumber}
Patient: ${claimData.patientName}
Date of Service: ${claimData.dateOfService}

Dear Appeals Department,

We are writing to appeal the denial of the above-referenced claim, which was denied with reason code ${claimData.denialCode}: ${claimData.denialReason}.

We respectfully request reconsideration of this claim based on the following:

1. Medical Necessity: The services provided were medically necessary and appropriate for the patient's condition.

2. Documentation: We have attached all required supporting documentation including medical records and physician notes.

3. Policy Compliance: The services rendered are consistent with the terms of our contract and your coverage policies.

We request that you review this claim and process payment for the services rendered. If you require any additional information, please contact our office immediately.

Thank you for your prompt attention to this matter.

Sincerely,

[PROVIDER NAME]
[CONTACT INFORMATION]

Attachments: Medical Records, Physician Notes, Supporting Documentation
`;
  }

  async batchAnalyzeClaims(organizationId: string, claimIds: string[]): Promise<void> {
    logger.info(`Starting batch analysis for ${claimIds.length} claims`);

    for (const claimId of claimIds) {
      try {
        const claim = await prisma.claim.findUnique({
          where: { id: claimId },
          include: {
            payer: true,
            lineItems: true,
            patient: true,
          },
        });

        if (!claim) continue;

        const analysis = await this.analyzeDenial({
          claimNumber: claim.claimNumber,
          denialCode: claim.denialCode,
          denialReason: claim.denialReason,
          dateOfService: claim.dateOfService,
          totalCharge: claim.totalCharge.toNumber(),
          payerId: claim.payerId,
          payerName: claim.payer?.name,
          cptCodes: claim.lineItems.map(li => li.cptCode),
        });

        // Update claim with AI recommendations
        await prisma.claim.update({
          where: { id: claimId },
          data: {
            aiRecommendedAction: analysis.recommendedAction,
            aiConfidenceScore: analysis.confidence,
            aiAnalyzedAt: new Date(),
            priority: analysis.priority,
          },
        });

        logger.info(`Analyzed claim ${claim.claimNumber}`);
      } catch (error) {
        logger.error(`Error analyzing claim ${claimId}:`, error);
      }
    }

    logger.info('Batch analysis complete');
  }

  async predictDenialRisk(claimData: any): Promise<{
    riskScore: number;
    riskFactors: string[];
    recommendations: string[];
  }> {
    try {
      const prompt = `
Analyze this claim for potential denial risk BEFORE submission:

Claim Data:
- Patient Age: ${claimData.patientAge}
- CPT Codes: ${claimData.cptCodes?.join(', ')}
- Diagnosis Codes: ${claimData.diagnosisCodes?.join(', ')}
- Payer: ${claimData.payerName}
- Modifier: ${claimData.modifiers || 'None'}
- Place of Service: ${claimData.placeOfService}

Provide a risk assessment with:
1. Risk score (0-100)
2. Risk factors
3. Recommendations to reduce denial risk

Respond in JSON format:
{
  "riskScore": 0-100,
  "riskFactors": ["factor1", "factor2"],
  "recommendations": ["rec1", "rec2"]
}
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      logger.error('Risk prediction error:', error);
    }

    return {
      riskScore: 50,
      riskFactors: ['Unable to assess'],
      recommendations: ['Review claim before submission'],
    };
  }

  async chatWithAdvisor(query: string, context?: any): Promise<string> {
    try {
      const prompt = `
You are an expert medical billing and denial management advisor. Answer this question:

${query}

${context ? `Context: ${JSON.stringify(context)}` : ''}

Provide a clear, actionable answer. If discussing denial codes, include specific steps.
Keep response concise (under 200 words) but informative.
`;

      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      logger.error('Chat advisor error:', error);
      return 'I apologize, but I am unable to process your request at this time. Please try again or contact support.';
    }
  }
}

export default new AIService();