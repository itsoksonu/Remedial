import api from "@/lib/api";

export interface FileUpload {
  id: string;
  originalFilename: string;
  fileType: string;
  sizeBytes: number;
  uploadedBy: string;
  createdAt: string;
}

export const fileService = {
  getFiles: async () => {
    const response = await api.get("/files");
    return response.data;
  },

  uploadFile: async (formData: FormData) => {
    const response = await api.post("/files/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  deleteFile: async (id: string) => {
    const response = await api.delete(`/files/${id}`);
    return response.data;
  },
};
