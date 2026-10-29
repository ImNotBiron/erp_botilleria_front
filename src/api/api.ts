import axios from "axios";
import { useAuthStore } from "../store/authStore";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  withCredentials: true,
});

/**
 * 👉 Request interceptor
 * Adjunta el JWT a cada request si existe
 */
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let sesionExpirada = false;

/**
 * 👉 Response interceptor
 * Si el token expira o es inválido → logout automático
 */
api.interceptors.response.use(
  (response) => response,
   (error) => {
    const status = error.response?.status;
    const url: string = error.config?.url ?? "";
    const esAuth = url.includes("/auth/login") || url.includes("/auth/logout");

    if (status === 401 && !esAuth && !sesionExpirada){
      sesionExpirada = true;

      useAuthStore.getState().limpiarSesion();

      if(window.location.pathname !== "/login"){
        window.location.href = "/login";
      }
    }
   

    return Promise.reject(error);
  }
);
