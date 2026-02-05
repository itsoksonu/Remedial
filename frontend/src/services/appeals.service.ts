import api from "@/lib/api";
import { Claim } from "./claims.service";

export interface Appeal {
  id: string;
  claimId: string;
  appealNumber: string;
  status: "draft" | "submitted" | "pending_review" | "approved" | "denied";
  level: number;
  letterContent?: string;
  outcome?: string;
  createdAt: string;
  submittedAt?: string;
  claim?: Claim;
}

export const appealsService = {
  getAppeals: async (filters?: any) => {
    const response = await api.get("/appeals", { params: filters });
    return response.data;
  },

  getAppealById: async (id: string) => {
    const response = await api.get(`/appeals/${id}`);
    return response.data;
  },

  createAppeal: async (data: Partial<Appeal>) => {
    const response = await api.post("/appeals", data);
    return response.data;
  },

  updateAppeal: async (id: string, data: Partial<Appeal>) => {
    const response = await api.put(`/appeals/${id}`, data);
    return response.data;
  },

  submitAppeal: async (id: string) => {
    const response = await api.post(`/appeals/${id}/submit`);
    return response.data;
  },
};
