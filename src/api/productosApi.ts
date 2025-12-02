// src/api/productosApi.ts
import {api} from "./api";

const base = "/productos";

export const productosApi = {
  getAll: async () => {
    const res = await api.get(base);
    return res.data;
  },

  getById: async (id: number) => {
    const res = await api.get(`${base}/${id}`);
    return res.data;
  },

  create: async (producto: any) => {
    const res = await api.post(base, producto);
    return res.data;
  },

  update: async (id: number, producto: any) => {
    const res = await api.put(`${base}/${id}`, producto);
    return res.data;
  },

  cambiarEstado: async (id: number, activo: number) => {
    const res = await api.patch(`${base}/${id}/estado`, { activo });
    return res.data;
  },

  remove: async (id: number) => {
    const res = await api.delete(`${base}/${id}`);
    return res.data;
  },
};
