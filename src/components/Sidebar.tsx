import {
  Box,
  Typography,
  useTheme,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Switch,
} from "@mui/material";
import { NavLink } from "react-router-dom";
import { useThemeStore } from "../store/themeStore";

// Íconos Tabler (delgados)
import {
  IconLayoutDashboard,
  IconBottle,
  IconReceipt2,
  IconSettings,
} from "@tabler/icons-react";

export default function Sidebar() {
  const theme = useTheme();
  const mode = useThemeStore((s) => s.mode);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const menu = [
    { label: "Dashboard", path: "/dashboard", icon: <IconLayoutDashboard size={22} stroke={1.5} /> },
    { label: "Punto de Venta", path: "/pos", icon: <IconLayoutDashboard size={22} stroke={1.5} /> },
    { label: "Productos", path: "/productos", icon: <IconBottle size={22} stroke={1.5} /> },
    { label: "Ventas", path: "/ventas", icon: <IconReceipt2 size={22} stroke={1.5} /> },
    { label: "Configuración", path: "/config", icon: <IconSettings size={22} stroke={1.5} /> },
  ];

  return (
    <Box
      sx={{
        width: 250,
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        display: "flex",
        flexDirection: "column",
        p: 2.5,
        bgcolor: theme.palette.background.paper,
        borderRight: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* LOGO */}
      <Typography
        variant="h6"
        fontWeight={700}
        sx={{
          mb: 3,
          letterSpacing: 0.5,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        Botillería CRM
      </Typography>

      {/* MENÚ */}
      <List sx={{ flexGrow: 1 }}>
        {menu.map((item, i) => (
          <ListItemButton
            key={i}
            component={NavLink}
            to={item.path}
            sx={{
              borderRadius: "12px",
              mb: 0.5,
              px: 2,
              py: 1,
              transition: "0.2s",
              "&.active": {
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.06)",
              },
              "&:hover": {
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(0,0,0,0.04)",
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 32,
                color: theme.palette.text.primary,
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: "0.95rem",
                fontWeight: 500,
                fontFamily: "'Inter', sans-serif",
              }}
            />
          </ListItemButton>
        ))}
      </List>

      {/* FOOTER - TOGGLE TEMA */}
      <Box
        sx={{
          mt: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 1.2,
          borderRadius: 2,
          bgcolor:
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.06)"
              : "rgba(0,0,0,0.04)",
        }}
      >
        <Typography fontSize="0.8rem" fontWeight={600}>
          {mode === "light" ? "Claro" : "Oscuro"}
        </Typography>
        <Switch
          checked={mode === "dark"}
          onChange={toggleTheme}
          sx={{
            transform: "scale(0.8)",
          }}
        />
      </Box>
    </Box>
  );
}
