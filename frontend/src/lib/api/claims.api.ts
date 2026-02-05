import { apiClient } from './client';
import type { 
  Claim, 
  CreateClaimDTO, 
  UpdateClaimDTO, 
  ClaimFilters,
  PaginatedResponse 
} from '@/types/claim.types';

export const claimsApi = {
  getClaims: async (filters: ClaimFilters): Promise<PaginatedResponse<Claim>> => {
    const { data } = await apiClient.get('/claims', { params: filters });
    return data.data;
  },

  getClaimById: async (id: string): Promise<Claim> => {
    const { data } = await apiClient.get(`/claims/${id}`);
    return data.data;
  },

  createClaim: async (claim: CreateClaimDTO): Promise<Claim> => {
    const { data } = await apiClient.post('/claims', claim);
    return data.data;
  },

  updateClaim: async (id: string, updates: UpdateClaimDTO): Promise<Claim> => {
    const { data } = await apiClient.put(`/claims/${id}`, updates);
    return data.data;
  },

  assignClaim: async (id: string, userId: string): Promise<Claim> => {
    const { data } = await apiClient.post(`/claims/${id}/assign`, { userId });
    return data.data;
  },

  addNote: async (id: string, content: string, isInternal: boolean = true) => {
    const { data } = await apiClient.post(`/claims/${id}/notes`, { 
      content, 
      isInternal 
    });
    return data.data;
  },

  importClaims: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const { data } = await apiClient.post('/claims/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  exportClaims: async (filters: ClaimFilters): Promise<Blob> => {
    const { data } = await apiClient.get('/claims/export', {
      params: filters,
      responseType: 'blob',
    });
    return data;
  },
};
