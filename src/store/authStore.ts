import { create } from "zustand";
import { authApi } from "../api/authApi";

type Rol = "admin" | "vendedor";

interface AuthState {
  isAuth: boolean;
  rol: Rol | null;
  nombre_usuario: string | null;
  loading: boolean;

  login: (rut: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuth: false,
  rol: null,
  nombre_usuario: null,
  loading: false,

  login: async (rut) => {
    try {
      set({ loading: true });

      const data = await authApi.login(rut);

      set({
        isAuth: true,
        rol: data.usuario.tipo_usuario,
        nombre_usuario: data.usuario.nombre_usuario,
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
      rol: null,
      nombre_usuario: null,
    });
  },
}));
