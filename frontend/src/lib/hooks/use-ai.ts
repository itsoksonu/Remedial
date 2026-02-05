import { useMutation } from '@tanstack/react-query';
import { aiApi } from '@/lib/api/ai.api';

export const useAnalyzeClaim = () => {
  return useMutation({
    mutationFn: aiApi.analyzeClaim,
  });
};

export const useGenerateAppeal = () => {
  return useMutation({
    mutationFn: ({ claimId, appealType }: { claimId: string; appealType?: 'first' | 'second' }) =>
      aiApi.generateAppealLetter(claimId, appealType),
  });
};

export const useAIChat = () => {
  return useMutation({
    mutationFn: ({ query, context }: { query: string; context?: any }) =>
      aiApi.chat(query, context),
  });
};
