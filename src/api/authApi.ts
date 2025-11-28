import { api } from "./api";

export const authApi = {
  login: async (rut: string) => {
    const { data } = await api.post("/auth/login", { rut });
    return data;
  },
};
