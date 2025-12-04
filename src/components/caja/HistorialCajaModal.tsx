import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardHeader,
  CardContent,
  Divider,
} from "@mui/material";

import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PaymentsIcon from "@mui/icons-material/Payments";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

import { api } from "../../api/api";

interface CajaSesion {
  id: number;
  fecha_apertura: string;
  fecha_cierre: string | null;
  id_usuario_apertura: number;
  id_usuario_cierre: number | null;
  inicial_local: number;
  inicial_vecina: number;
  total_efectivo_giro: number;
  total_debito: number;
  total_credito: number;
  total_transferencia: number;
  total_exento: number;
  ingresos_extra: number;
  egresos: number;
  movimientos_vecina: number;
  total_esperado_local: number | null;
  total_esperado_vecina: number | null;
  total_real_local: number | null;
  total_real_vecina: number | null;
  diferencia_local: number | null;
  diferencia_vecina: number | null;
  tickets_efectivo: number;
  tickets_debito: number;
  tickets_credito: number;
  tickets_transferencia: number;
  estado: "ABIERTA" | "CERRADA";
  usuario_apertura?: string | null;
  usuario_cierre?: string | null;
}

interface MovimientoCaja {
  id: number;
  tipo: "INGRESO" | "EGRESO" | "VECINA";
  categoria: string;
  monto: number;
  descripcion: string | null;
  fecha: string;
}

type Props = {
  open: boolean;
  onClose: () => void;
};

const formatCLP = (value: number | null | undefined) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const formatFechaTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString("es-CL") : "-";

const n = (v: number | null | undefined): number => v ?? 0;

const HistorialCajaModal: React.FC<Props> = ({ open, onClose }) => {
  const [historial, setHistorial] = useState<CajaSesion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // filtros por fecha (calendario)
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  // detalle de una sesión
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [detalleSesion, setDetalleSesion] = useState<CajaSesion | null>(null);
  const [detalleMovimientos, setDetalleMovimientos] = useState<MovimientoCaja[]>([]);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [detalleError, setDetalleError] = useState<string | null>(null);

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/caja/historial");
      const lista = (res.data && res.data.historial) || [];
      setHistorial(lista);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.error || "Error al cargar historial de cajas."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      cargarHistorial();
      // opcional reset filtros
      // setDesde("");
      // setHasta("");
    }
  }, [open]);

  const filtrarPorFecha = (lista: CajaSesion[]) => {
    if (!desde && !hasta) return lista;

    return lista.filter((caja) => {
      const fecha = new Date(caja.fecha_apertura);
      const fDesde = desde ? new Date(desde) : null;
      const fHasta = hasta ? new Date(hasta + "T23:59:59") : null;

      if (fDesde && fecha < fDesde) return false;
      if (fHasta && fecha > fHasta) return false;
      return true;
    });
  };

  const sesionesFiltradas = filtrarPorFecha(historial);

  const abrirDetalle = async (id: number) => {
    setDetalleOpen(true);
    setDetalleLoading(true);
    setDetalleError(null);
    setDetalleSesion(null);
    setDetalleMovimientos([]);

    try {
      const res = await api.get(`/caja/${id}`);
      setDetalleSesion(res.data.caja as CajaSesion);
      setDetalleMovimientos(res.data.movimientos || []);
    } catch (err: any) {
      console.error(err);
      setDetalleError(
        err?.response?.data?.error ||
          "Error al cargar detalles de la sesión de caja."
      );
    } finally {
      setDetalleLoading(false);
    }
  };

  const esperadoLocal = (s: CajaSesion | null) =>
    s
      ? n(s.total_esperado_local) ||
        (n(s.inicial_local) +
          n(s.total_efectivo_giro) +
          n(s.ingresos_extra) -
          n(s.egresos) -
          n(s.total_exento))
      : 0;

  const esperadoVecina = (s: CajaSesion | null) =>
    s
      ? n(s.total_esperado_vecina) ||
        (n(s.inicial_vecina) + n(s.movimientos_vecina))
      : 0;

  return (
    <>
      {/* MODAL LISTA + CALENDARIO */}
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
        <DialogTitle>Historial de cajas</DialogTitle>
        <DialogContent dividers>
          {/* Filtros por fecha */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ mb: 2 }}
          >
            <TextField
              label="Desde"
              type="date"
              size="small"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Hasta"
              type="date"
              size="small"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          {loading ? (
            <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : sesionesFiltradas.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No hay sesiones de caja para el rango seleccionado.
            </Typography>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Apertura</TableCell>
                    <TableCell>Cierre</TableCell>
                    <TableCell>Abierta por</TableCell>
                    <TableCell>Cerrada por</TableCell>
                    <TableCell align="right">Real local</TableCell>
                    <TableCell align="right">Real vecina</TableCell>
                    <TableCell align="right">Dif. local</TableCell>
                    <TableCell align="right">Dif. vecina</TableCell>
                    <TableCell>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sesionesFiltradas.map((caja) => (
                    <TableRow
                      key={caja.id}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() => abrirDetalle(caja.id)}
                    >
                      <TableCell>{caja.id}</TableCell>
                      <TableCell>
                        {formatFechaTime(caja.fecha_apertura)}
                      </TableCell>
                      <TableCell>
                        {formatFechaTime(caja.fecha_cierre)}
                      </TableCell>
                      <TableCell>{caja.usuario_apertura || "-"}</TableCell>
                      <TableCell>{caja.usuario_cierre || "-"}</TableCell>
                      <TableCell align="right">
                        {formatCLP(caja.total_real_local)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCLP(caja.total_real_vecina)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCLP(caja.diferencia_local)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCLP(caja.diferencia_vecina)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={caja.estado}
                          color={
                            caja.estado === "ABIERTA" ? "success" : "default"
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL DETALLE COMPLETO */}
      <Dialog
        open={detalleOpen}
        onClose={() => setDetalleOpen(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>
          Detalle sesión de caja{" "}
          {detalleSesion ? `#${detalleSesion.id}` : ""}
        </DialogTitle>
        <DialogContent dividers>
          {detalleLoading ? (
            <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : detalleError ? (
            <Alert severity="error">{detalleError}</Alert>
          ) : !detalleSesion ? (
            <Typography variant="body2" color="text.secondary">
              No se encontró información de la sesión.
            </Typography>
          ) : (
            <Stack spacing={3}>
              {/* Resumen estado + fechas */}
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                spacing={2}
              >
                <Box>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="h6" fontWeight={700}>
                      Estado de la caja
                    </Typography>
                    <Chip
                      label={detalleSesion.estado}
                      color={
                        detalleSesion.estado === "ABIERTA"
                          ? "success"
                          : "default"
                      }
                      size="small"
                    />
                  </Stack>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    mt={1}
                  >
                    Apertura:{" "}
                    {formatFechaTime(detalleSesion.fecha_apertura)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cierre: {formatFechaTime(detalleSesion.fecha_cierre)}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    mt={1}
                  >
                    Abierta por:{" "}
                    <strong>{detalleSesion.usuario_apertura || "-"}</strong>
                    <br />
                    Cerrada por:{" "}
                    <strong>{detalleSesion.usuario_cierre || "-"}</strong>
                  </Typography>
                </Box>

                <Stack spacing={1}>
                  <Chip
                    icon={<AttachMoneyIcon />}
                    label={`Inicial local: ${formatCLP(
                      detalleSesion.inicial_local
                    )}`}
                    variant="outlined"
                  />
                  <Chip
                    icon={<AccountBalanceIcon />}
                    label={`Inicial vecina: ${formatCLP(
                      detalleSesion.inicial_vecina
                    )}`}
                    variant="outlined"
                  />
                </Stack>
              </Stack>

              <Divider />

              {/* Caja local + vecina, igual que cuando está abierta */}
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Card sx={{ flex: 1, borderRadius: 3 }}>
                  <CardHeader
                    title="Caja local"
                    subheader="Efectivo, ventas y diferencias"
                  />
                  <CardContent>
                    <Stack spacing={1}>
                      <Typography variant="body2">
                        Efectivo esperado:{" "}
                        <strong>{formatCLP(esperadoLocal(detalleSesion))}</strong>
                      </Typography>
                      <Typography variant="body2">
                        Efectivo real (cierre):{" "}
                        <strong>
                          {formatCLP(detalleSesion.total_real_local)}
                        </strong>
                      </Typography>
                      <Typography variant="body2">
                        Diferencia:{" "}
                        <strong>
                          {formatCLP(detalleSesion.diferencia_local)}
                        </strong>
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2">
                        Ventas efectivo/giro:{" "}
                        <strong>
                          {formatCLP(detalleSesion.total_efectivo_giro)}
                        </strong>
                      </Typography>
                      <Typography variant="body2">
                        Ventas exentas:{" "}
                        <strong>
                          {formatCLP(detalleSesion.total_exento)}
                        </strong>
                      </Typography>
                      <Typography variant="body2">
                        Ingresos extra:{" "}
                        <strong>
                          {formatCLP(detalleSesion.ingresos_extra)}
                        </strong>
                      </Typography>
                      <Typography variant="body2">
                        Egresos:{" "}
                        <strong>{formatCLP(detalleSesion.egresos)}</strong>
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>

                <Card sx={{ flex: 1, borderRadius: 3 }}>
                  <CardHeader
                    title="Caja Vecina"
                    subheader="Cupo y movimientos"
                  />
                  <CardContent>
                    <Stack spacing={1}>
                      <Typography variant="body2">
                        Cupo inicial:{" "}
                        <strong>
                          {formatCLP(detalleSesion.inicial_vecina)}
                        </strong>
                      </Typography>
                      <Typography variant="body2">
                        Movimientos registrados:{" "}
                        <strong>
                          {formatCLP(detalleSesion.movimientos_vecina)}
                        </strong>
                      </Typography>
                      <Typography variant="body2">
                        Esperado vecina:{" "}
                        <strong>{formatCLP(esperadoVecina(detalleSesion))}</strong>
                      </Typography>
                      <Typography variant="body2">
                        Real vecina (cierre):{" "}
                        <strong>
                          {formatCLP(detalleSesion.total_real_vecina)}
                        </strong>
                      </Typography>
                      <Typography variant="body2">
                        Diferencia:{" "}
                        <strong>
                          {formatCLP(detalleSesion.diferencia_vecina)}
                        </strong>
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>

              {/* Tarjetas y transferencias */}
              <Card sx={{ borderRadius: 3 }}>
                <CardHeader
                  title="Tarjetas & Transferencias"
                  subheader="Medios de pago no efectivo"
                />
                <CardContent>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    divider={<Divider orientation="vertical" flexItem />}
                  >
                    <Box flex={1}>
                      <Typography variant="body2">
                        Débito:{" "}
                        <strong>
                          {formatCLP(detalleSesion.total_debito)}
                        </strong>
                      </Typography>
                      <Typography variant="body2">
                        Crédito:{" "}
                        <strong>
                          {formatCLP(detalleSesion.total_credito)}
                        </strong>
                      </Typography>
                      <Typography variant="body2">
                        Transferencias:{" "}
                        <strong>
                          {formatCLP(
                            detalleSesion.total_transferencia
                          )}
                        </strong>
                      </Typography>
                    </Box>
                    <Box flex={1}>
                      <Typography variant="body2">
                        Tickets efectivo:{" "}
                        <strong>
                          {detalleSesion.tickets_efectivo}
                        </strong>
                      </Typography>
                      <Typography variant="body2">
                        Tickets débito:{" "}
                        <strong>{detalleSesion.tickets_debito}</strong>
                      </Typography>
                      <Typography variant="body2">
                        Tickets crédito:{" "}
                        <strong>
                          {detalleSesion.tickets_credito}
                        </strong>
                      </Typography>
                      <Typography variant="body2">
                        Tickets transferencia:{" "}
                        <strong>
                          {detalleSesion.tickets_transferencia}
                        </strong>
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Movimientos de caja */}
              <Card sx={{ borderRadius: 3 }}>
                <CardHeader title="Movimientos de caja" />
                <CardContent>
                  {detalleMovimientos.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No hay movimientos registrados para esta sesión.
                    </Typography>
                  ) : (
                    <Box sx={{ maxHeight: 260, overflowY: "auto" }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Fecha</TableCell>
                            <TableCell>Tipo</TableCell>
                            <TableCell>Categoría</TableCell>
                            <TableCell>Descripción</TableCell>
                            <TableCell align="right">Monto</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {detalleMovimientos.map((m) => (
                            <TableRow key={m.id}>
                              <TableCell>
                                {formatFechaTime(m.fecha)}
                              </TableCell>
                              <TableCell>{m.tipo}</TableCell>
                              <TableCell>{m.categoria}</TableCell>
                              <TableCell>{m.descripcion || "-"}</TableCell>
                              <TableCell align="right">
                                {formatCLP(m.monto)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetalleOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default HistorialCajaModal;
