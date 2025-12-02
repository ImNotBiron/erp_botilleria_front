// src/api/proveedoresApi.ts
import { api } from "./api";

export interface ProveedorPayload {
  nombre: string;
  rut?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
}

export const proveedoresApi = {
  getAll: async () => {
    const res = await api.get("/proveedores");
    return res.data;
  },

  create: async (data: ProveedorPayload) => {
    const res = await api.post("/proveedores", data);
    return res.data;
  },

  update: async (id: number, data: ProveedorPayload) => {
    const res = await api.put(`/proveedores/${id}`, data);
    return res.data;
  },

  cambiarEstado: async (id: number, activo: boolean | number) => {
    const res = await api.patch(`/proveedores/${id}/estado`, { activo });
    return res.data;
  },
};
