import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import { api } from "../../api/api";

interface Venta {
  id: number;
  fecha: string;
  tipo_venta: "NORMAL" | "INTERNA";
  total_general: number;
  total_afecto: number;
  total_exento: number;
  id_caja_sesion: number;
}

const formatCLP = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);

export default function MisVentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get("/ventas/mis");
        setVentas(res.data.ventas || []);
      } catch (err: any) {
        console.error(err);
        setError(
          err?.response?.data?.error || "No se pudieron cargar tus ventas."
        );
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, []);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={2}>
        Mis ventas
      </Typography>

      <Typography color="text.secondary" mb={2}>
        Historial reciente de ventas registradas con tu usuario (últimas 100).
      </Typography>

      {loading && (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <Paper sx={{ overflow: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Afecto</TableCell>
                <TableCell align="right">Exento</TableCell>
                <TableCell align="right">Caja sesión</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ventas.map((v) => (
                <TableRow key={v.id} hover>
                  <TableCell>{v.id}</TableCell>
                  <TableCell>
                    {new Date(v.fecha).toLocaleString("es-CL")}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={v.tipo_venta === "NORMAL" ? "Normal" : "Interna"}
                      size="small"
                      color={v.tipo_venta === "NORMAL" ? "primary" : "secondary"}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {formatCLP(v.total_general)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCLP(v.total_afecto)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCLP(v.total_exento)}
                  </TableCell>
                  <TableCell align="right">{v.id_caja_sesion}</TableCell>
                </TableRow>
              ))}

              {ventas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 3 }}
                    >
                      Aún no tienes ventas registradas con tu usuario.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
