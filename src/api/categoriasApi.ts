import { api } from "./api";

export interface CategoriaPayload {
  nombre: string;
}

export const categoriasApi = {
  getAll: async () => {
    const res = await api.get("/categorias");
    return res.data;
  },

  create: async (data: CategoriaPayload) => {
    const res = await api.post("/categorias", data);
    return res.data;
  },

  update: async (id: number, data: CategoriaPayload) => {
    const res = await api.put(`/categorias/${id}`, data);
    return res.data;
  },

  cambiarEstado: async (id: number, activo: boolean | number) => {
    const res = await api.patch(`/categorias/${id}/estado`, { activo });
    return res.data;
  },
};
