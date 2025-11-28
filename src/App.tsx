import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "./store/authStore";

import AdminLayout from "./layouts/AdminLayout";
import VendedorLayout from "./layouts/VendedorLayout";

import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import PosVentaPage from "./pages/vendedor/PosVentaPage";
import MisVentasPage from "./pages/vendedor/MisVentasPage";

export default function App() {
  const { isAuth, rol } = useAuthStore();

  // Si NO está autenticado → login
  if (!isAuth) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Si es ADMIN
  if (rol === "admin") {
    return (
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
      </Routes>
    );
  }

  // Si es VENDEDOR
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

  return null;
}
