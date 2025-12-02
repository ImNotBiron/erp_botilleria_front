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
  Collapse,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import type { ReactNode } from "react";

// Iconos
import CategoryIcon from "@mui/icons-material/Category";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
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
import LocalBarIcon from "@mui/icons-material/LocalBar";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";

interface SidebarProps {
  variant: "admin" | "vendedor";
  onToggleSidebar?: () => void;
}

type AdminItem =
  | {
      type: "link";
      label: string;
      icon: ReactNode;
      to: string;
    }
  | {
      type: "group";
      label: string;
      icon: ReactNode;
      children: { label: string; icon: ReactNode; to: string }[];
    };

interface SimpleItem {
  label: string;
  icon: ReactNode;
  to: string;
}

export default function Sidebar({ variant, onToggleSidebar }: SidebarProps) {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));
  const [open, setOpen] = useState(true);
  const [openGroup, setOpenGroup] = useState<string | null>("Clasificación");
  const location = useLocation();
  const { usuario, logout } = useAuthStore();

  const mode = useThemeStore((s) => s.mode);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const adminItems: AdminItem[] = [
    { type: "link", label: "Dashboard", icon: <DashboardIcon />, to: "/admin/dashboard" },
    { type: "link", label: "Productos", icon: <InventoryIcon />, to: "/admin/productos" },
    { type: "link", label: "Promociones", icon: <LocalOfferIcon />, to: "/admin/promociones" },
    { type: "link", label: "Caja", icon: <ReceiptIcon />, to: "/admin/caja" },

    {
      type: "group",
      label: "Clasificación",
      icon: <CategoryIcon />,
      children: [
        { label: "Categorías", icon: <CategoryIcon />, to: "/admin/categorias" },
        { label: "Proveedores", icon: <StoreIcon />, to: "/admin/proveedores" },
      ],
    },

    { type: "link", label: "Usuarios", icon: <PeopleIcon />, to: "/admin/usuarios" },
    { type: "link", label: "Stock", icon: <AssignmentTurnedInIcon />, to: "/admin/stock" },
    { type: "link", label: "Reportes", icon: <BarChartIcon />, to: "/admin/reportes" },
  ];

  const vendedorItems: SimpleItem[] = [
    { label: "Venta", icon: <ShoppingCartIcon />, to: "/venta" },
    { label: "Mis ventas", icon: <HistoryIcon />, to: "/mis-ventas" },
  ];

  const drawerWidth = open ? 260 : 80;

  const handleToggle = () => {
    setOpen(!open);
    onToggleSidebar?.();
  };

  const isSelected = (to: string) => location.pathname.startsWith(to);

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
        {/* === HEADER === */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            pt: 4,
            pb: 3,
            px: 2,
            transition: "0.2s",
          }}
        >
          <IconButton
            onClick={handleToggle}
            size="small"
            sx={{
              position: open ? "absolute" : "relative",
              right: open ? 12 : "auto",
              top: open ? 12 : "auto",
              color: "text.secondary",
              mb: open ? 0 : 2,
            }}
          >
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>

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

          {open && (
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  lineHeight: 1.2,
                  letterSpacing: "-0.5px",
                  color: theme.palette.text.primary,
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
                  display: "block",
                }}
              >
                Botillería & ERP
              </Typography>
            </Box>
          )}
        </Box>

        {open && (
          <Divider sx={{ borderStyle: "dashed", mx: 3, mb: 1, opacity: 0.6 }} />
        )}

        {/* === LISTA DE NAVEGACIÓN === */}
        <Box sx={{ flexGrow: 1, px: 1.5, mt: 1 }}>
          <List sx={{ gap: 0.5, display: "flex", flexDirection: "column" }}>
            {variant === "admin" &&
              adminItems.map((item) => {
                if (item.type === "link") {
                  const selected = isSelected(item.to);
                  return (
                    <Tooltip
                      key={item.to}
                      title={!open ? item.label : ""}
                      placement="right"
                      arrow
                    >
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
                            "& .MuiListItemIcon-root": {
                              color: theme.palette.primary.main,
                            },
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
                            primaryTypographyProps={{
                              fontSize: 14,
                              fontWeight: selected ? 600 : 500,
                            }}
                          />
                        )}
                      </ListItemButton>
                    </Tooltip>
                  );
                }

                // item.type === "group"
                const anyChildSelected = item.children.some((c) =>
                  isSelected(c.to)
                );
                const groupOpen =
                  openGroup === item.label || (!openGroup && anyChildSelected);

                return (
                  <Box key={item.label}>
                    {/* Botón del grupo */}
                    <Tooltip
                      title={!open ? item.label : ""}
                      placement="right"
                      arrow
                    >
                      <ListItemButton
                        onClick={() =>
                          setOpenGroup((prev) =>
                            prev === item.label ? null : item.label
                          )
                        }
                        sx={{
                          minHeight: 44,
                          borderRadius: 1.5,
                          justifyContent: open ? "initial" : "center",
                          px: 2,
                          mb: 0.25,
                          bgcolor: anyChildSelected
                            ? alpha(theme.palette.primary.main, 0.06)
                            : "transparent",
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
                          <>
                            <ListItemText
                              primary={item.label}
                              primaryTypographyProps={{
                                fontSize: 14,
                                fontWeight: anyChildSelected ? 600 : 500,
                              }}
                            />
                            {groupOpen ? (
                              <ExpandLessIcon fontSize="small" />
                            ) : (
                              <ExpandMoreIcon fontSize="small" />
                            )}
                          </>
                        )}
                      </ListItemButton>
                    </Tooltip>

                    {/* Hijos del grupo */}
                    <Collapse in={groupOpen} timeout="auto" unmountOnExit>
                      <List
                        component="div"
                        disablePadding
                        sx={{ ml: open ? 3 : 0.5 }}
                      >
                        {item.children.map((child) => {
                          const selected = isSelected(child.to);
                          return (
                            <Tooltip
                              key={child.to}
                              title={!open ? child.label : ""}
                              placement="right"
                              arrow
                            >
                              <ListItemButton
                                component={Link}
                                to={child.to}
                                selected={selected}
                                sx={{
                                  minHeight: 38,
                                  borderRadius: 1.5,
                                  justifyContent: open ? "initial" : "center",
                                  px: 2,
                                  mb: 0.25,
                                  "&.Mui-selected": {
                                    bgcolor: alpha(
                                      theme.palette.primary.main,
                                      0.1
                                    ),
                                    color: theme.palette.primary.main,
                                    "& .MuiListItemIcon-root": {
                                      color: theme.palette.primary.main,
                                    },
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
                                  {child.icon}
                                </ListItemIcon>
                                {open && (
                                  <ListItemText
                                    primary={child.label}
                                    primaryTypographyProps={{
                                      fontSize: 13,
                                      fontWeight: selected ? 600 : 500,
                                    }}
                                  />
                                )}
                              </ListItemButton>
                            </Tooltip>
                          );
                        })}
                      </List>
                    </Collapse>
                  </Box>
                );
              })}

            {variant === "vendedor" &&
              vendedorItems.map((item) => {
                const selected = isSelected(item.to);
                return (
                  <Tooltip
                    key={item.to}
                    title={!open ? item.label : ""}
                    placement="right"
                    arrow
                  >
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
                          "& .MuiListItemIcon-root": {
                            color: theme.palette.primary.main,
                          },
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
                          primaryTypographyProps={{
                            fontSize: 14,
                            fontWeight: selected ? 600 : 500,
                          }}
                        />
                      )}
                    </ListItemButton>
                  </Tooltip>
                );
              })}
          </List>
        </Box>

        {/* FOOTER: Theme switch */}
        <Box sx={{ p: 2, pt: 0 }}>
          <Box
            sx={{
              p: open ? 1.3 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: open ? "space-between" : "center",
              bgcolor: alpha(theme.palette.text.primary, 0.04),
              borderRadius: 3,
              mb: 1.5,
              transition: "all 0.3s ease",
              cursor: "pointer",
              "&:hover": {
                bgcolor: alpha(theme.palette.text.primary, 0.08),
              },
            }}
            onClick={toggleTheme}
          >
            {open && (
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  letterSpacing: "0.3px",
                  color: theme.palette.text.secondary,
                }}
              >
                {mode === "light" ? "Modo Claro" : "Modo Oscuro"}
              </Typography>
            )}

            <Box
              sx={{
                width: 42,
                height: 22,
                position: "relative",
                borderRadius: 20,
                bgcolor:
                  mode === "dark"
                    ? alpha(theme.palette.primary.main, 0.5)
                    : alpha(theme.palette.text.primary, 0.3),
                transition: "all 0.25s ease",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  position: "absolute",
                  top: "50%",
                  left: mode === "dark" ? 22 : -6,
                  transform: "translateY(-50%)",
                  transition: "all 0.4s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: mode === "dark" ? 1 : 0,
                }}
              >
                <span style={{ fontSize: "14px" }}>🌙</span>
              </Box>

              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  position: "absolute",
                  top: "50%",
                  left: mode === "light" ? 4 : 22,
                  transform: "translateY(-50%)",
                  transition: "all 0.4s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: mode === "light" ? 1 : 0,
                }}
              >
                <span style={{ fontSize: "14px" }}>☀️</span>
              </Box>

              <Box
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  bgcolor: theme.palette.background.paper,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
                  position: "absolute",
                  top: "50%",
                  left: mode === "dark" ? 20 : 2,
                  transform: "translateY(-50%)",
                  transition: "all 0.25s ease",
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* FOOTER usuario */}
        <Box sx={{ p: 1.5 }}>
          <Box
            sx={{
              p: open ? 1.5 : 1,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              bgcolor: alpha(theme.palette.text.primary, 0.03),
              borderRadius: 3,
              transition: "all 0.3s ease",
            }}
          >
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

            {open && (
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2" noWrap fontWeight={600}>
                  {usuario?.nombre_usuario ?? "Usuario"}
                </Typography>
              </Box>
            )}

            {open && (
              <IconButton
                size="small"
                sx={{ color: theme.palette.error.main }}
                onClick={logout}
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>
      </Drawer>

      <Box
        sx={{
          width: { xs: 0, md: drawerWidth },
          flexShrink: 0,
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </>
  );
}
