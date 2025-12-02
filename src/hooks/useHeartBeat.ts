import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import {api} from "../api/api";

export function useHeartbeat() {
  const usuario = useAuthStore((s) => s.usuario);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!usuario || !token) return;

    const interval = setInterval(() => {
      api.patch(`/usuarios/${usuario.id}/en-linea`, { en_linea: 1 });
    }, 60000); // cada 60 segundos

    return () => clearInterval(interval);
  }, [usuario, token]);
}
