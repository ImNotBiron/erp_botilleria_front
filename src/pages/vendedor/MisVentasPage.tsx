// src/pages/vendedor/MisVentasPage.tsx
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
  TextField,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

import { api } from "../../api/api";

interface Venta {
  id: number;
  fecha: string;
  tipo_venta: "NORMAL" | "INTERNA";
  total_general: number;
  total_afecto: number;
  total_exento: number;
  id_caja_sesion: number;
  estado: "ACTIVA" | "ANULADA";
}

interface DetalleItem {
  id_producto: number;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  precio_final: number;
  exento_iva: 0 | 1;
  es_promo: 0 | 1;
}

interface DetallePago {
  tipo_pago: "EFECTIVO" | "GIRO" | "DEBITO" | "CREDITO" | "TRANSFERENCIA";
  monto: number;
}

interface VentaDetalleResponse {
  cabecera: Venta;
  items: DetalleItem[];
  pagos: DetallePago[];
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

  // Filtros
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [idCaja, setIdCaja] = useState("");

  // Detalle
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [detalleError, setDetalleError] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<VentaDetalleResponse | null>(null);

  // =======================
  // Cargar ventas con filtros
  // =======================
  const cargarVentas = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get("/ventas/mis", {
        params: {
          desde: fechaDesde || undefined,
          hasta: fechaHasta || undefined,
          id_caja: idCaja || undefined,
        },
      });

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

  useEffect(() => {
    cargarVentas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAplicarFiltros = () => {
    cargarVentas();
  };

  const handleLimpiarFiltros = () => {
    setFechaDesde("");
    setFechaHasta("");
    setIdCaja("");
    setTimeout(() => {
      cargarVentas();
    }, 0);
  };

  // =======================
  // Detalle de venta
  // =======================
  const handleVerDetalle = async (venta: Venta) => {
    try {
      setDetalleOpen(true);
      setDetalle(null);
      setDetalleError(null);
      setDetalleLoading(true);

      const res = await api.get(`/ventas/mis/${venta.id}`);
      setDetalle(res.data as VentaDetalleResponse);
    } catch (err: any) {
      console.error(err);
      setDetalleError(
        err?.response?.data?.error || "No se pudo cargar el detalle."
      );
    } finally {
      setDetalleLoading(false);
    }
  };

  const totalPagosDetalle =
    detalle?.pagos?.reduce((acc, p) => acc + p.monto, 0) ?? 0;

  return (
    <Box>
      {/* Título */}
      <Box
        mb={2}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Mis ventas
          </Typography>
          <Typography color="text.secondary">
            Historial reciente de ventas registradas con tu usuario.
          </Typography>
        </Box>
        <IconButton onClick={cargarVentas} title="Actualizar listado">
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", md: "flex-end" }}
        >
          <TextField
            label="Desde"
            type="date"
            size="small"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Hasta"
            type="date"
            size="small"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="ID caja sesión"
            size="small"
            value={idCaja}
            onChange={(e) => setIdCaja(e.target.value)}
            placeholder="Opcional"
          />

          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              size="small"
              startIcon={<SearchIcon />}
              onClick={handleAplicarFiltros}
            >
              Filtrar
            </Button>
            <Button variant="text" size="small" onClick={handleLimpiarFiltros}>
              Limpiar
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Contenido */}
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
                <TableCell>Estado</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Afecto</TableCell>
                <TableCell align="right">Exento</TableCell>
                <TableCell align="right">Caja sesión</TableCell>
                <TableCell align="center">Detalle</TableCell>
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
                  <TableCell>
                    <Chip
                      label={v.estado === "ACTIVA" ? "Activa" : "Anulada"}
                      size="small"
                      color={v.estado === "ACTIVA" ? "success" : "default"}
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
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleVerDetalle(v)}
                      title="Ver detalle"
                    >
                      <ReceiptLongIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}

              {ventas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 3 }}
                    >
                      No se encontraron ventas con los filtros aplicados.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Modal detalle */}
      <Dialog
        open={detalleOpen}
        onClose={() => setDetalleOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Detalle de venta
            </Typography>
            {detalle && (
              <Typography variant="body2" color="text.secondary">
                Venta #{detalle.cabecera.id} · Caja sesión{" "}
                {detalle.cabecera.id_caja_sesion}
              </Typography>
            )}
          </Box>
          {detalle && (
            <Chip
              label={detalle.cabecera.estado}
              size="small"
              color={
                detalle.cabecera.estado === "ACTIVA" ? "success" : "default"
              }
            />
          )}
        </DialogTitle>
        <DialogContent dividers>
          {detalleLoading && (
            <Box display="flex" justifyContent="center" my={3}>
              <CircularProgress />
            </Box>
          )}

          {detalleError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {detalleError}
            </Alert>
          )}

          {detalle && !detalleLoading && !detalleError && (
            <>
              {/* Resumen cabecera */}
              <Box
                display="flex"
                flexDirection={{ xs: "column", sm: "row" }}
                gap={2}
                mb={2}
              >
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">
                    Fecha
                  </Typography>
                  <Typography variant="body2">
                    {new Date(
                      detalle.cabecera.fecha
                    ).toLocaleString("es-CL")}
                  </Typography>
                </Box>
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">
                    Totales
                  </Typography>
                  <Typography variant="body2">
                    Total:{" "}
                    <strong>
                      {formatCLP(detalle.cabecera.total_general)}
                    </strong>
                  </Typography>
                  <Typography variant="body2">
                    Afecto: {formatCLP(detalle.cabecera.total_afecto)} ·
                    Exento: {formatCLP(detalle.cabecera.total_exento)}
                  </Typography>
                </Box>
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">
                    Pagos
                  </Typography>
                  <Typography variant="body2">
                    Total pagos: <strong>{formatCLP(totalPagosDetalle)}</strong>
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Productos */}
              <Typography variant="subtitle2" gutterBottom>
                Productos
              </Typography>
              <Paper sx={{ maxHeight: 250, overflow: "auto", mb: 2 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell align="right">Cant.</TableCell>
                      <TableCell align="right">Precio</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detalle.items.map((it, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Typography variant="body2">
                            {it.nombre_producto}
                            {it.es_promo === 1 && (
                              <Chip
                                label="Promo"
                                size="small"
                                color="secondary"
                                sx={{ ml: 1, fontSize: "0.7rem", height: 18 }}
                              />
                            )}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {it.exento_iva === 1 ? "Exento" : "Afecto"}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{it.cantidad}</TableCell>
                        <TableCell align="right">
                          {formatCLP(it.precio_unitario)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCLP(it.precio_final)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>

              {/* Pagos */}
              <Typography variant="subtitle2" gutterBottom>
                Medios de pago
              </Typography>
              <Paper sx={{ maxHeight: 180, overflow: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Medio</TableCell>
                      <TableCell align="right">Monto</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detalle.pagos.map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Chip label={p.tipo_pago} size="small" />
                        </TableCell>
                        <TableCell align="right">
                          {formatCLP(p.monto)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetalleOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
