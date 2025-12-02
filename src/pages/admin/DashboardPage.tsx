import { Box, Typography, Grid, Paper } from "@mui/material";
import {
  IconPackage,
  IconUsers,
  IconTruck,
  IconAlertTriangle
} from "@tabler/icons-react";
import { useTheme } from "@mui/material/styles";

export default function DashboardPage() {
  const theme = useTheme();

  const stats = [
    { label: "Productos", value: "0", icon: <IconPackage size={28} stroke={1.7} /> },
    { label: "Usuarios", value: "0", icon: <IconUsers size={28} stroke={1.7} /> },
    { label: "Proveedores", value: "0", icon: <IconTruck size={28} stroke={1.7} /> },
    {
      label: "Stock Crítico",
      value: "0",
      icon: <IconAlertTriangle size={28} stroke={1.7} color={theme.palette.warning.main} />,
    },
  ];

  return (
    <Box>
      {/* HEADER */}
      <Typography variant="h4" fontWeight={700} mb={1}>
        Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        Resumen general del sistema.
      </Typography>

      {/* CARDS */}
      <Grid container spacing={3}>
        {stats.map((s) => (
          <Grid item xs={12} sm={6} md={3} key={s.label}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 4,
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                transition: "0.25s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 4px 16px rgba(0,0,0,0.35)"
                      : "0 4px 16px rgba(0,0,0,0.12)",
                },
              }}
            >
              {/* Icono */}
              <Box sx={{ color: theme.palette.text.secondary }}>{s.icon}</Box>

              {/* Nombre */}
              <Typography variant="body2" color="text.secondary">
                {s.label}
              </Typography>

              {/* Valor */}
              <Typography variant="h5" fontWeight={700}>
                {s.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* BLOQUE FUTURO: GRÁFICOS Y REPORTES */}
      <Box mt={5}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 4,
            border: `1px solid ${theme.palette.divider}`,
            textAlign: "center",
          }}
        >
          <Typography variant="h6" fontWeight={600} mb={1}>
            Gráficos de Ventas (próximamente)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Aquí mostraremos las ventas por día, semana y mes.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
