import api from "@/lib/api";

export interface Claim {
  id: string;
  claimNumber: string;
  patientId: string;
  providerId: string;
  payerId: string;
  dateOfService: string; // Date string
  totalCharge: number | string;
  allowedAmount?: number | string;
  paidAmount?: number | string;
  status:
    | "submitted"
    | "received"
    | "pending"
    | "rejected"
    | "paid"
    | "resolved"
    | "appealed"
    | "in_progress"
    | "partial_paid";
  denialCode?: string;
  denialReason?: string;
  priority?: "critical" | "high" | "medium" | "low";
  assignedTo?: string; // ID
  aiRecommendedAction?: string;
  aiConfidenceScore?: number | string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  patient?: {
    firstName: string;
    lastName: string;
  };
  payer?: {
    name: string;
  };
  provider?: {
    firstName: string;
    lastName: string;
  };
}

export const claimsService = {
  getClaims: async (filters?: any) => {
    const response = await api.get("/claims", { params: filters });
    return response.data;
  },

  getClaimById: async (id: string) => {
    const response = await api.get(`/claims/${id}`);
    return response.data;
  },

  createClaim: async (data: Partial<Claim>) => {
    const response = await api.post("/claims", data);
    return response.data;
  },

  updateClaim: async (id: string, data: Partial<Claim>) => {
    const response = await api.put(`/claims/${id}`, data);
    return response.data;
  },

  assignClaim: async (id: string, userId: string) => {
    const response = await api.post(`/claims/${id}/assign`, { userId });
    return response.data;
  },
};
