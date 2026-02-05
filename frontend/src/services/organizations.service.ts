import api from "@/lib/api";

export interface Organization {
  id: string;
  name: string;
  taxId?: string;
  subscriptionTier: string;
  isActive: boolean;
  createdAt: string;
}

export const organizationService = {
  getOrganization: async () => {
    const response = await api.get("/organizations/me"); // Assuming endpoint
    return response.data;
  },

  updateOrganization: async (data: Partial<Organization>) => {
    const response = await api.put("/organizations/me", data);
    return response.data;
  },
};
