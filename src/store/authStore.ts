import { create } from "zustand";
import { authApi } from "../api/authApi";

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
  loading: boolean;

  login: (rut: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuth: false,
  usuario: null,
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
        loading: false,
      });

      return true;
    } catch (error) {
      console.error("Error login:", error);
      set({ loading: false });
      return false;
    }
  },

  logout: () => {
    set({
      isAuth: false,
      usuario: null,
    });
  },
}));
