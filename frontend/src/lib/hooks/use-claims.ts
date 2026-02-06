import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { claimsApi } from "@/lib/api/claims.api";
import { ClaimFilters } from "../../types/claim.types";
import { toast } from "sonner";

export const useClaims = (filters: ClaimFilters) => {
  return useQuery({
    queryKey: ["claims", filters],
    queryFn: () => claimsApi.getClaims(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useClaim = (id: string) => {
  return useQuery({
    queryKey: ["claim", id],
    queryFn: () => claimsApi.getClaimById(id),
    enabled: !!id,
  });
};

export const useCreateClaim = () => {
  const queryClient = useQueryClient();
  // const { toast } = useToast();

  return useMutation({
    mutationFn: claimsApi.createClaim,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      toast.success("Claim created successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create claim");
    },
  });
};

export const useUpdateClaim = () => {
  const queryClient = useQueryClient();
  // const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      claimsApi.updateClaim(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      queryClient.invalidateQueries({ queryKey: ["claim", variables.id] });
      toast.success("Claim updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update claim");
    },
  });
};

export const useAssignClaim = () => {
  const queryClient = useQueryClient();
  // const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      claimsApi.assignClaim(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      toast.success("Claim assigned successfully");
    },
  });
};

export const useImportClaims = () => {
  const queryClient = useQueryClient();
  // const { toast } = useToast();

  return useMutation({
    mutationFn: claimsApi.importClaims,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      toast.success(`Successfully imported ${result.imported} claims`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to import claims");
    },
  });
};
