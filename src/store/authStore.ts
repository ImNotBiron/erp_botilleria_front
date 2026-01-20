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

      logout: async () => {
        try {
          const { token } = get();
          if (token) {
            await api.post("/auth/logout");
          }
        } catch (error) {
          console.warn("Logout backend error:", error);
        } finally {
          set({
            isAuth: false,
            usuario: null,
            token: null,
          });
        }
      },
    }),
    {
      name: "erp-auth", // storage key
    }
  )
);
