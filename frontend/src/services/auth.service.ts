import api from "@/lib/api";

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
  };
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post("/auth/forgot-password", { email });
  },

  // Add more auth methods as needed
};
