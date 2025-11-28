// src/App.tsx
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "./store/authStore";

import AdminLayout from "./layouts/AdminLayout";
import VendedorLayout from "./layouts/VendedorLayout";

import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import PosVentaPage from "./pages/vendedor/PosVentaPage";
import MisVentasPage from "./pages/vendedor/MisVentasPage";

export default function App() {
  const { isAuth, usuario } = useAuthStore();
  const rol = usuario?.tipo_usuario ?? null;

  // 1) Si NO está autenticado → solo login
  if (!isAuth) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // 2) ADMIN
  if (rol === "admin") {
    return (
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<DashboardPage />} />
          {/* aquí después agregas más rutas admin */}
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
      </Routes>
    );
  }

  // 3) VENDEDOR
  if (rol === "vendedor") {
    return (
      <Routes>
        <Route element={<VendedorLayout />}>
          <Route path="/venta" element={<PosVentaPage />} />
          <Route path="/mis-ventas" element={<MisVentasPage />} />
          <Route path="*" element={<Navigate to="/venta" replace />} />
        </Route>
      </Routes>
    );
  }

  // 4) Si por alguna razón no hay rol válido
  return (
    <Routes>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
