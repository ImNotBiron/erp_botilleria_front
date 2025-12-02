// src/api/promocionesApi.ts
import { api } from "./api";

export interface ComboDetalleInput {
  id_producto: number;
  cantidad: number;
}

export interface PromocionPayload {
  nombre: string;
  descripcion?: string | null;
  precio_promocion: number;
  activa: boolean | number;
  detalle: ComboDetalleInput[];
}

export const promocionesApi = {
  // Lista resumida de promociones (para la tabla)
  getAll: async () => {
    const res = await api.get("/promociones");
    return res.data as any[];
  },

  // Detalle de una promo (para editar, incl. productos)
  getById: async (id: number) => {
    const res = await api.get(`/promociones/${id}`);
    return res.data as any;
  },

  create: async (data: PromocionPayload) => {
    const res = await api.post("/promociones", data);
    return res.data;
  },

  update: async (id: number, data: PromocionPayload) => {
    const res = await api.put(`/promociones/${id}`, data);
    return res.data;
  },

  cambiarEstado: async (id: number, activa: boolean | number) => {
    const res = await api.patch(`/promociones/${id}/estado`, { activa });
    return res.data;
  },
};
