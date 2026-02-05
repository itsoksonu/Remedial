import api from "@/lib/api";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role:
    | "admin"
    | "manager"
    | "biller"
    | "rcm_specialist"
    | "appeals_specialist";
  organizationId: string;
  createdAt: string;
}

export const userService = {
  getUsers: async (role?: string) => {
    const response = await api.get("/users", { params: { role } });
    return response.data.data;
  },

  createUser: async (userData: Partial<User>) => {
    const response = await api.post("/users", userData);
    return response.data;
  },

  getUserById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  updateUser: async (id: string, userData: Partial<User>) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};
