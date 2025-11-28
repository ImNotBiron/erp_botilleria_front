import { Box, Grid, Paper, Typography, Stack, Button } from "@mui/material";

export default function DashboardPage() {
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
        Resumen del día
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2">Ventas totales</Typography>
            <Typography variant="h5">$ 0</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2">Tickets</Typography>
            <Typography variant="h5">0</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2">Caja</Typography>
            <Typography variant="h5">$ 0</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2">Stock crítico</Typography>
            <Typography variant="h5">0</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
        Accesos rápidos
      </Typography>

      <Stack direction="row" spacing={1.5} flexWrap="wrap">
        <Button variant="contained">Caja</Button>
        <Button variant="outlined">Productos</Button>
        <Button variant="outlined">Promociones</Button>
        <Button variant="outlined">Usuarios</Button>
      </Stack>
    </Box>
  );
}
