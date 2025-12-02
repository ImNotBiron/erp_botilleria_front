import { create } from "zustand";
import { authApi } from "../api/authApi";
import {api} from "../api/api";

type TipoUsuario = "admin" | "vendedor";

interface Usuario {
  id: number;
  nombre_usuario: string;
  rut: string;
  tipo_usuario: TipoUsuario;
}

interface AuthState {
  isAuth: boolean;
  usuario: Usuario | null;
  token: string | null;     // <--- NUEVO
  loading: boolean;

  login: (rut: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuth: false,
  usuario: null,
  token: null,              // <--- NUEVO
  loading: false,

  login: async (rut) => {
    try {
      set({ loading: true });

      const data = await authApi.login(rut);

      set({
        isAuth: true,
        usuario: {
          id: data.usuario.id,
          nombre_usuario: data.usuario.nombre_usuario,
          rut: data.usuario.rut,
          tipo_usuario: data.usuario.tipo_usuario,
        },
        token: data.token,    // <--- IMPORTANTE: guardar token
        loading: false,
      });

      return true;
    } catch (error) {
      console.error("Error login:", error);
      set({ loading: false });
      return false;
    }
  },

  logout: async () => {
  try {
    const { token } = useAuthStore.getState();

    if (token) {
      await api.post("/auth/logout"); // backend apaga en_linea
    }
  } catch (err) {
    console.error("Error al cerrar sesión:", err);
  }

  set({
    isAuth: false,
    usuario: null,
    token: null,
  });
},
}));
