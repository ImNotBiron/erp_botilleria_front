import {api} from "./api"; // tu instancia axios

export const usuariosApi = {
  getUsuarios: () => api.get("/usuarios"),
  getUsuario: (id: number) => api.get(`/usuarios/${id}`),
  crearUsuario: (data: any) => api.post("/usuarios", data),
  actualizarUsuario: (id: number, data: any) => api.put(`/usuarios/${id}`, data),
  cambiarEstado: (id: number, activo: number) =>
    api.patch(`/usuarios/${id}/estado`, { activo }),
  marcarEnLinea: (id: number, en_linea: number) =>
    api.patch(`/usuarios/${id}/en-linea`, { en_linea }),
  eliminarUsuario: (id: number) => api.delete(`/usuarios/${id}`),
};
