import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { claimsApi } from '@/lib/api/claims.api';
import { ClaimFilters } from '@/types/claim.types';
import { useToast } from './use-toast';

export const useClaims = (filters: ClaimFilters) => {
  return useQuery({
    queryKey: ['claims', filters],
    queryFn: () => claimsApi.getClaims(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useClaim = (id: string) => {
  return useQuery({
    queryKey: ['claim', id],
    queryFn: () => claimsApi.getClaimById(id),
    enabled: !!id,
  });
};

export const useCreateClaim = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: claimsApi.createClaim,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      toast({
        title: 'Success',
        description: 'Claim created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create claim',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateClaim = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      claimsApi.updateClaim(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      queryClient.invalidateQueries({ queryKey: ['claim', variables.id] });
      toast({
        title: 'Success',
        description: 'Claim updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update claim',
        variant: 'destructive',
      });
    },
  });
};

export const useAssignClaim = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      claimsApi.assignClaim(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      toast({
        title: 'Success',
        description: 'Claim assigned successfully',
      });
    },
  });
};

export const useImportClaims = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: claimsApi.importClaims,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      toast({
        title: 'Import Complete',
        description: `Successfully imported ${result.imported} claims`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Import Failed',
        description: error.response?.data?.message || 'Failed to import claims',
        variant: 'destructive',
      });
    },
  });
};