// src/App.tsx
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "./store/authStore";

import AdminLayout from "./layouts/AdminLayout";
import VendedorLayout from "./layouts/VendedorLayout";

import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import PosVentaPage from "./pages/vendedor/PosVentaPage";
import MisVentasPage from "./pages/vendedor/MisVentasPage";
import ProductosPage from "./pages/admin/ProductosPage";
import PromocionesPage from "./pages/admin/PromocionesPage";
import CajaPage from "./pages/admin/CajaPage";
import ProveedoresPage from "./pages/admin/ProveedoresPage";
import CategoriasPage from "./pages/admin/CategoriasPage";
import UsuariosPage from "./pages/admin/UsuariosPage";
import StockPage from "./pages/admin/StockPage";
import ReportesPage from "./pages/admin/ReportesPage";
import { useHeartbeat } from "./hooks/useHeartBeat";



export default function App() {
  const { isAuth, usuario } = useAuthStore();
  const rol = usuario?.tipo_usuario ?? null;
  useHeartbeat();

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
            <Route path="/admin/productos" element={<ProductosPage />} />
            <Route path="/admin/promociones" element={<PromocionesPage />} />
            <Route path="/admin/caja" element={<CajaPage />} />
            <Route path="/admin/proveedores" element={<ProveedoresPage />} />
            <Route path="/admin/categorias" element={<CategoriasPage />} />
            <Route path="/admin/usuarios" element={<UsuariosPage />} />
            <Route path="/admin/stock" element={<StockPage />} />
            <Route path="/admin/reportes" element={<ReportesPage />} />
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
