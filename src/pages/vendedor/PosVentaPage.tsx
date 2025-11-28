import { Box, Grid, Paper, Typography } from "@mui/material";

export default function PosVentaPage() {
  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Punto de Venta
      </Typography>

      <Grid container spacing={2}>
        {/* Productos */}
        <Grid item xs={12} md={7} lg={8}>
          <Paper sx={{ p: 2, minHeight: "70vh" }}>
            <Typography variant="subtitle1">Productos</Typography>
          </Paper>
        </Grid>

        {/* Carrito */}
        <Grid item xs={12} md={5} lg={4}>
          <Paper sx={{ p: 2, minHeight: "70vh" }}>
            <Typography variant="subtitle1">Carrito</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
