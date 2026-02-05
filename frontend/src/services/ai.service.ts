import api from "@/lib/api";

export interface AIAnalysisResult {
  recommendedAction: string;
  confidenceScore: number;
  reasoning: string;
  similarClaims: any[]; // Define better if needed
  appealLetter?: string;
  denialRiskScore?: number;
}

export const aiService = {
  analyzeClaim: async (claimId: string) => {
    const response = await api.post(`/ai/analyze/${claimId}`);
    return response.data;
  },

  generateAppealLetter: async (claimId: string, options?: any) => {
    const response = await api.post(`/ai/appeal-letter/${claimId}`, options);
    return response.data;
  },

  predictDenial: async (claimData: any) => {
    const response = await api.post("/ai/predict-risk", claimData);
    return response.data;
  },

  chat: async (message: string, context?: any) => {
    const response = await api.post("/ai/chat", { message, context });
    return response.data;
  },
};
