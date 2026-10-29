import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi } from "../api/authApi";
import { api } from "../api/api";

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
  token: string | null;
  loading: boolean;

  login: (rut: string) => Promise<boolean>;
  logout: () => Promise<void>;
  limpiarSesion: () => void; 
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuth: false,
      usuario: null,
      token: null,
      loading: false,

      login: async (rut: string) => {
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
            token: data.token,
            loading: false,
          });

          return true;
        } catch (error) {
          console.error("Error login:", error);
          set({ loading: false });
          return false;
        }
      },

      // 👈 nuevo: limpia solo el estado local, sin llamar al backend
      limpiarSesion: () => {
        set({ isAuth: false, usuario: null, token: null });
      },

      // 👈 cambiado: limpia primero, avisa al backend después
      logout: async () => {
        const { token } = get();

        // 1. Limpiar local primero
        get().limpiarSesion();

        // 2. Avisar al backend con el token guardado a mano
        if (token) {
          try {
            await api.post("/auth/logout", null, {
              headers: { Authorization: `Bearer ${token}` },
            });
          } catch (error) {
            console.warn("Logout backend error:", error);
          }
        }
      },
    }),
    {
      name: "erp-auth",
    }
  )
);