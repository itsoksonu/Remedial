export const aiApi = {
  analyzeClaim: async (claimId: string) => {
    const { data } = await apiClient.post(`/ai/analyze/${claimId}`);
    return data.data;
  },

  batchAnalyze: async (claimIds: string[]) => {
    const { data } = await apiClient.post('/ai/batch-analyze', { claimIds });
    return data;
  },

  generateAppealLetter: async (claimId: string, appealType: 'first' | 'second' = 'first') => {
    const { data } = await apiClient.post(`/ai/appeal-letter/${claimId}`, { appealType });
    return data.data.letter;
  },

  predictRisk: async (claimData: any) => {
    const { data } = await apiClient.post('/ai/predict-risk', claimData);
    return data.data;
  },

  chat: async (query: string, context?: any) => {
    const { data } = await apiClient.post('/ai/chat', { query, context });
    return data.data.response;
  },
};