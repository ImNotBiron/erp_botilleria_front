import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  useMediaQuery,
  Typography,
  Avatar,
  alpha,
  Divider,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

// Iconos
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft"; // Icono más limpio para cerrar
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import InventoryIcon from "@mui/icons-material/Inventory2";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import PeopleIcon from "@mui/icons-material/People";
import ReceiptIcon from "@mui/icons-material/Receipt";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import StoreIcon from "@mui/icons-material/Store";
import BarChartIcon from "@mui/icons-material/BarChart";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import HistoryIcon from "@mui/icons-material/History";
import LogoutIcon from "@mui/icons-material/Logout";
import LocalBarIcon from '@mui/icons-material/LocalBar';
import { useAuthStore } from "../store/authStore";

interface SidebarProps {
  variant: "admin" | "vendedor";
  onToggleSidebar?: () => void;
}

export default function Sidebar({ variant, onToggleSidebar }: SidebarProps) {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));
  const [open, setOpen] = useState(true);
  const location = useLocation();
  const { usuario, logout } = useAuthStore();


  const adminItems = [
    { label: "Dashboard", icon: <DashboardIcon />, to: "/admin/dashboard" },
    { label: "Productos", icon: <InventoryIcon />, to: "/admin/productos" },
    { label: "Promociones", icon: <LocalOfferIcon />, to: "/admin/promociones" },
    { label: "Caja", icon: <ReceiptIcon />, to: "/admin/caja" },
    { label: "Proveedores", icon: <StoreIcon />, to: "/admin/proveedores" },
    { label: "Usuarios", icon: <PeopleIcon />, to: "/admin/usuarios" },
    { label: "Stock", icon: <AssignmentTurnedInIcon />, to: "/admin/stock" },
    { label: "Reportes", icon: <BarChartIcon />, to: "/admin/reportes" },
  ];

  const vendedorItems = [
    { label: "Venta", icon: <ShoppingCartIcon />, to: "/venta" },
    { label: "Mis ventas", icon: <HistoryIcon />, to: "/mis-ventas" },
  ];

  const items = variant === "admin" ? adminItems : vendedorItems;
  const drawerWidth = open ? 260 : 80;

  const handleToggle = () => {
    setOpen(!open);
    onToggleSidebar?.();
  };

  return (
    <>
      <Drawer
        variant={isSmall ? "temporary" : "permanent"}
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: drawerWidth,
            borderRight: "1px dashed",
            borderColor: theme.palette.divider,
            bgcolor: theme.palette.background.default,
            transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            overflowX: "hidden",
          },
        }}
      >
        {/* === HEADER REDISEÑADO === */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column", // Apilamos verticalmente
            alignItems: "center",     // Centramos todo
            position: "relative",     // Para posicionar el botón de toggle absoluto
            pt: 4,
            pb: 3,
            px: 2,
            transition: "0.2s",
          }}
        >
          {/* Botón de toggle flotante (absolute) para no romper el centro */}
          <IconButton 
            onClick={handleToggle} 
            size="small" 
            sx={{ 
                position: open ? "absolute" : "relative", 
                right: open ? 12 : "auto", 
                top: open ? 12 : "auto",
                color: "text.secondary",
                mb: open ? 0 : 2 // Margen si está cerrado y el icono queda arriba
            }}
          >
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>

          {/* Icono Central Grande */}
          <Avatar
            sx={{
              width: open ? 56 : 40,
              height: open ? 56 : 40,
              bgcolor: theme.palette.primary.main,
              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.25)}`,
              transition: "all 0.3s ease",
              mb: open ? 1.5 : 0,
            }}
          >
            <LocalBarIcon sx={{ fontSize: open ? 28 : 20 }} />
          </Avatar>

          {/* Textos Branding */}
          {open && (
            <Box sx={{ textAlign: "center", animation: "fadeIn 0.5s ease" }}>
               {/* Usamos una animación simple de fade-in o transition opacity */}
              <Typography 
                variant="h6" 
                sx={{ 
                    fontWeight: 800, 
                    lineHeight: 1.2,
                    letterSpacing: "-0.5px",
                    color: theme.palette.text.primary 
                }}
              >
                El Paraiso
              </Typography>
              
              <Typography 
                variant="caption" 
                sx={{ 
                    color: theme.palette.text.secondary, 
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    fontSize: "0.7rem",
                    mt: 0.5,
                    display: "block"
                }}
              >
                Botillería & ERP
              </Typography>
            </Box>
          )}
        </Box>

        {open && <Divider sx={{ borderStyle: "dashed", mx: 3, mb: 1, opacity: 0.6 }} />}

        {/* === LISTA DE NAVEGACIÓN === */}
        <Box sx={{ flexGrow: 1, px: 1.5, mt: 1 }}>
          <List sx={{ gap: 0.5, display: "flex", flexDirection: "column" }}>
            {items.map((item) => {
              const selected = location.pathname.startsWith(item.to);
              return (
                <Tooltip key={item.to} title={!open ? item.label : ""} placement="right" arrow>
                  <ListItemButton
                    component={Link}
                    to={item.to}
                    selected={selected}
                    sx={{
                      minHeight: 44,
                      borderRadius: 1.5,
                      justifyContent: open ? "initial" : "center",
                      px: 2,
                      mb: 0.5,
                      "&.Mui-selected": {
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        "& .MuiListItemIcon-root": { color: theme.palette.primary.main },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: open ? 2 : "auto",
                        justifyContent: "center",
                        color: theme.palette.text.secondary,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {open && (
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{ fontSize: 14, fontWeight: selected ? 600 : 500 }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              );
            })}
          </List>
        </Box>

        {/* === FOOTER USUARIO (Mantenemos el diseño limpio anterior) === */}
       {/* === FOOTER USUARIO (con nombre real abajo) === */}
<Box sx={{ p: 1.5 }}>
    <Box
        sx={{
            p: open ? 1.5 : 1,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            bgcolor: alpha(theme.palette.text.primary, 0.03),
            borderRadius: 3,
            transition: "all 0.3s ease"
        }}
    >
        {/* Avatar con inicial del nombre real */}
        <Avatar
            sx={{
                width: 32,
                height: 32,
                bgcolor: theme.palette.secondary.main,
                fontSize: 14,
            }}
        >
            {usuario?.nombre_usuario?.charAt(0).toUpperCase() ?? "U"}
        </Avatar>

        {/* Nombre real, solo si está expandido */}
        {open && (
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2" noWrap fontWeight={600}>
                    {usuario?.nombre_usuario ?? "Usuario"}
                </Typography>
            </Box>
        )}

        {/* Botón logout */}
        {open && (
            <IconButton size="small" sx={{ color: theme.palette.error.main }} onClick={logout}>
                <LogoutIcon fontSize="small" />
            </IconButton>
        )}
    </Box>
</Box>

      </Drawer>
      
      {/* Spacer Main Content */}
      <Box sx={{ width: { xs: 0, md: drawerWidth }, flexShrink: 0, transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }} />
    </>
  );
}