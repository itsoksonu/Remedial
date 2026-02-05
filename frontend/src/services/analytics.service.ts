import api from "@/lib/api";

export interface DashboardMetrics {
  totalClaims: number;
  deniedClaims: number;
  denialRate: number;
  totalDenialAmount: number;
  recoveredAmount: number;
  recoveryRate: number;
  avgDaysToResolve: number;
  trends: {
    denialRate: {
      current: number;
      previous: number;
      change: number;
    };
  };
}

export const analyticsService = {
  getDashboardMetrics: async (
    period: "daily" | "weekly" | "monthly" | "yearly" = "monthly",
  ): Promise<DashboardMetrics> => {
    // Passing period as query param
    const response = await api.get("/analytics/dashboard", {
      params: { period },
    });
    return response.data.data;
  },

  getDenialTrends: async (period = "monthly") => {
    const response = await api.get("/analytics/denial-trends", {
      params: { period },
    });
    return response.data.data;
  },

  getPayerPerformance: async (period = "monthly") => {
    const response = await api.get("/analytics/payer-performance", {
      params: { period },
    });
    return response.data.data;
  },

  getProviderPerformance: async (period = "monthly") => {
    const response = await api.get("/analytics/provider-performance", {
      params: { period },
    });
    return response.data.data;
  },
};
