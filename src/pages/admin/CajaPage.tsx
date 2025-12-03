import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Card,
  CardHeader,
  CardContent,
  Grid,
  Stack,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Divider,
  Alert,
} from "@mui/material";

import PaymentsIcon from "@mui/icons-material/Payments";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";

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
}

interface MovimientoCaja {
  id: number;
  tipo: "INGRESO" | "EGRESO" | "VECINA";
  categoria: string;
  monto: number;
  descripcion: string | null;
  fecha: string;
}

export default function CajaPage() {
  const [loading, setLoading] = useState(true);
  const [cajaActiva, setCajaActiva] = useState<CajaSesion | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);

  // Apertura
  const [initLocal, setInitLocal] = useState("");
  const [initVecina, setInitVecina] = useState("");

  // Modal Movimiento
  const [openMov, setOpenMov] = useState(false);
  const [movTipo, setMovTipo] = useState<"INGRESO" | "EGRESO" | "VECINA">(
    "INGRESO"
  );
  const [movCategoria, setMovCategoria] = useState("");
  const [movMonto, setMovMonto] = useState("");
  const [movDesc, setMovDesc] = useState("");

  // Modal Cierre
  const [openCierre, setOpenCierre] = useState(false);
  const [realLocal, setRealLocal] = useState("");
  const [realVecina, setRealVecina] = useState("");

  const cargarEstado = async () => {
    setLoading(true);
    try {
      const res = await api.get("/caja/estado");
      const caja = res.data.caja as CajaSesion | null;
      setCajaActiva(caja);

      if (caja) {
        const detalle = await api.get(`/caja/${caja.id}`);
        setMovimientos(detalle.data.movimientos || []);
      } else {
        setMovimientos([]);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarEstado();
  }, []);

  /* ========== APERTURA ========== */
  const abrirCaja = async () => {
    try {
      await api.post("/caja/abrir", {
        inicial_local: initLocal || 0,
        inicial_vecina: initVecina || 0,
      });
      setInitLocal("");
      setInitVecina("");
      await cargarEstado();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error al abrir caja.");
    }
  };

  /* ========== MOVIMIENTO ========== */
  const guardarMovimiento = async () => {
    try {
      await api.post("/caja/movimiento", {
        tipo: movTipo,
        categoria: movCategoria,
        monto: movMonto,
        descripcion: movDesc,
      });
      setOpenMov(false);
      setMovCategoria("");
      setMovMonto("");
      setMovDesc("");
      setMovTipo("INGRESO");
      await cargarEstado();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error registrando movimiento.");
    }
  };

  /* ========== CIERRE ========== */
  const cerrarCaja = async () => {
    try {
      await api.post("/caja/cerrar", {
        total_real_local: realLocal,
        total_real_vecina: realVecina,
      });
      setOpenCierre(false);
      setRealLocal("");
      setRealVecina("");
      await cargarEstado();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error cerrando caja.");
    }
  };

  /* ========== RENDER ========== */

  if (loading) {
    return <Typography>Cargando caja...</Typography>;
  }

  /* ========== SIN CAJA ABIERTA → SOLO APERTURA ========== */
  if (!cajaActiva) {
    return (
      <Box>
        <Typography variant="h4" fontWeight={700} mb={2}>
          Apertura de Caja
        </Typography>

        <Grid container justifyContent="flex-start">
          <Grid item xs={12} md={5}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: "0 4px 18px rgba(0,0,0,0.04)",
              }}
            >
              <CardHeader
                title="Configurar apertura"
                subheader="Ingresa los montos iniciales del turno."
              />
              <CardContent>
                <Stack spacing={2}>
                  <TextField
                    label="Efectivo inicial local"
                    type="number"
                    value={initLocal}
                    onChange={(e) => setInitLocal(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Cupo inicial Caja Vecina"
                    type="number"
                    value={initVecina}
                    onChange={(e) => setInitVecina(e.target.value)}
                    fullWidth
                  />

                  <Alert
                    icon={<InfoOutlinedIcon fontSize="small" />}
                    severity="info"
                    sx={{ mt: 1 }}
                  >
                    Una vez abierta, todas las ventas y movimientos quedarán
                    vinculados a esta sesión.
                  </Alert>

                  <Box mt={1}>
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      onClick={abrirCaja}
                      startIcon={<PointOfSaleIcon />}
                    >
                      Abrir caja
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  /* ========== CAJA ABIERTA ========== */

  const totalTarjetas =
    (cajaActiva.total_debito || 0) +
    (cajaActiva.total_credito || 0) +
    (cajaActiva.total_transferencia || 0);

  const totalTicketsTarjeta =
    (cajaActiva.tickets_debito || 0) +
    (cajaActiva.tickets_credito || 0) +
    (cajaActiva.tickets_transferencia || 0);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={2}>
        Caja del Local
      </Typography>

      <Grid container spacing={3}>
        {/* ========= SECCIÓN 1: RESUMEN GENERAL ========= */}
        <Grid item xs={12}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: "0 4px 18px rgba(0,0,0,0.05)",
            }}
          >
            <CardContent>
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
                spacing={2}
              >
                {/* Columna izquierda: info básica */}
                <Box>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="h6" fontWeight={700}>
                      Estado de la caja
                    </Typography>
                    <Chip
                      label="ABIERTA"
                      color="success"
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </Stack>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    Apertura:{" "}
                    {new Date(
                      cajaActiva.fecha_apertura
                    ).toLocaleString()}
                  </Typography>

                  <Stack direction="row" spacing={2} mt={2}>
                    <Chip
                      icon={<AttachMoneyIcon />}
                      label={`Inicial local: $${cajaActiva.inicial_local}`}
                      variant="outlined"
                    />
                    <Chip
                      icon={<AccountBalanceIcon />}
                      label={`Inicial vecina: $${cajaActiva.inicial_vecina}`}
                      variant="outlined"
                    />
                  </Stack>
                </Box>

                {/* Columna derecha: acciones */}
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  width={{ xs: "100%", md: "auto" }}
                >
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<SwapHorizIcon />}
                    onClick={() => setOpenMov(true)}
                  >
                    Registrar movimiento
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    color="error"
                    startIcon={<ReceiptLongIcon />}
                    onClick={() => setOpenCierre(true)}
                  >
                    Cerrar caja
                  </Button>
                </Stack>
              </Stack>

              <Alert
                icon={<InfoOutlinedIcon fontSize="small" />}
                severity="info"
                sx={{ mt: 2 }}
              >
                Todas las ventas y movimientos del día quedan vinculados a esta
                sesión de caja. La cuadratura se registra al momento del cierre.
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* ========= SECCIÓN 2: CAJA LOCAL / CAJA VECINA ========= */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: "0 4px 18px rgba(0,0,0,0.05)",
            }}
          >
            <CardHeader
              title="Caja local"
              subheader="Resumen de efectivo y movimientos internos."
              avatar={<AttachMoneyIcon color="success" />}
            />
            <CardContent>
              <Stack spacing={0.5}>
                <Typography variant="body2">
                  <strong>Efectivo + giro:</strong> $
                  {cajaActiva.total_efectivo_giro || 0}
                </Typography>
                <Typography variant="body2">
                  <strong>Ventas exentas (ej. cigarros):</strong> $
                  {cajaActiva.total_exento || 0}
                </Typography>
                <Typography variant="body2">
                  <strong>Ingresos extra:</strong> $
                  {cajaActiva.ingresos_extra || 0}
                </Typography>
                <Typography variant="body2">
                  <strong>Egresos:</strong> ${cajaActiva.egresos || 0}
                </Typography>

                <Divider sx={{ my: 1.5 }} />

                <Typography variant="body2">
                  <strong>Total esperado en caja local:</strong>{" "}
                  {cajaActiva.total_esperado_local != null
                    ? `$${cajaActiva.total_esperado_local}`
                    : "Se calcula al cierre."}
                </Typography>

                {cajaActiva.total_real_local != null && (
                  <>
                    <Typography variant="body2">
                      <strong>Total real contado:</strong> $
                      {cajaActiva.total_real_local}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Diferencia:</strong>{" "}
                      {cajaActiva.diferencia_local === 0
                        ? "$0 (cuadrado)"
                        : `$${cajaActiva.diferencia_local}`}
                    </Typography>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: "0 4px 18px rgba(0,0,0,0.05)",
            }}
          >
            <CardHeader
              title="Caja vecina"
              subheader="Control del cupo y movimientos asociados."
              avatar={<AccountBalanceWalletIcon color="primary" />}
            />
            <CardContent>
              <Stack spacing={0.5}>
                <Typography variant="body2">
                  <strong>Cupo inicial:</strong> ${cajaActiva.inicial_vecina}
                </Typography>
                <Typography variant="body2">
                  <strong>Movimientos netos:</strong> $
                  {cajaActiva.movimientos_vecina || 0}
                </Typography>

                <Divider sx={{ my: 1.5 }} />

                <Typography variant="body2">
                  <strong>Total esperado Caja Vecina:</strong>{" "}
                  {cajaActiva.total_esperado_vecina != null
                    ? `$${cajaActiva.total_esperado_vecina}`
                    : "Se calcula al cierre."}
                </Typography>

                {cajaActiva.total_real_vecina != null && (
                  <>
                    <Typography variant="body2">
                      <strong>Saldo real reportado:</strong> $
                      {cajaActiva.total_real_vecina}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Diferencia:</strong>{" "}
                      {cajaActiva.diferencia_vecina === 0
                        ? "$0 (cuadrado)"
                        : `$${cajaActiva.diferencia_vecina}`}
                    </Typography>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* ========= SECCIÓN 3: MÉTODOS DE PAGO ========= */}
        <Grid item xs={12}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: "0 4px 18px rgba(0,0,0,0.04)",
            }}
          >
            <CardHeader
              title="Métodos de pago"
              subheader="Totales acumulados durante la sesión."
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    sx={{
                      borderRadius: 2,
                      boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                    }}
                  >
                    <CardContent>
                      <Stack spacing={0.5}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <PaymentsIcon color="success" fontSize="small" />
                          <Typography variant="body2">
                            Efectivo + giro
                          </Typography>
                        </Stack>
                        <Typography variant="h6">
                          ${cajaActiva.total_efectivo_giro || 0}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Tickets: {cajaActiva.tickets_efectivo || 0}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    sx={{
                      borderRadius: 2,
                      boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                    }}
                  >
                    <CardContent>
                      <Stack spacing={0.5}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <CreditCardIcon color="primary" fontSize="small" />
                          <Typography variant="body2">Débito</Typography>
                        </Stack>
                        <Typography variant="h6">
                          ${cajaActiva.total_debito || 0}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Tickets: {cajaActiva.tickets_debito || 0}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    sx={{
                      borderRadius: 2,
                      boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                    }}
                  >
                    <CardContent>
                      <Stack spacing={0.5}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <CreditCardIcon color="secondary" fontSize="small" />
                          <Typography variant="body2">Crédito</Typography>
                        </Stack>
                        <Typography variant="h6">
                          ${cajaActiva.total_credito || 0}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Tickets: {cajaActiva.tickets_credito || 0}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    sx={{
                      borderRadius: 2,
                      boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                    }}
                  >
                    <CardContent>
                      <Stack spacing={0.5}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <AccountBalanceIcon color="info" fontSize="small" />
                          <Typography variant="body2">
                            Transferencia
                          </Typography>
                        </Stack>
                        <Typography variant="h6">
                          ${cajaActiva.total_transferencia || 0}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Tickets: {cajaActiva.tickets_transferencia || 0}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                spacing={1}
              >
                <Typography variant="body2">
                  <strong>Total tarjetas:</strong> ${totalTarjetas}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tickets con tarjeta: {totalTicketsTarjeta}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* ========= SECCIÓN 4: MOVIMIENTOS ========= */}
        <Grid item xs={12}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: "0 4px 18px rgba(0,0,0,0.05)",
            }}
          >
            <CardHeader
              title="Movimientos del turno"
              subheader="Ingresos, egresos y movimientos de Caja Vecina."
            />
            <CardContent>
              {movimientos.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No hay movimientos registrados en esta sesión.
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Categoría</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell>Monto</TableCell>
                      <TableCell>Fecha</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {movimientos.map((m) => (
                      <TableRow key={m.id} hover>
                        <TableCell>
                          <Chip
                            size="small"
                            label={m.tipo}
                            color={
                              m.tipo === "INGRESO"
                                ? "success"
                                : m.tipo === "EGRESO"
                                ? "error"
                                : "info"
                            }
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{m.categoria}</TableCell>
                        <TableCell>{m.descripcion || "-"}</TableCell>
                        <TableCell>${m.monto}</TableCell>
                        <TableCell>
                          {new Date(m.fecha).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ===== MODAL MOVIMIENTO ===== */}
      <Dialog
        open={openMov}
        onClose={() => setOpenMov(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Registrar movimiento de caja</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} mt={1}>
            <TextField
              select
              label="Tipo de movimiento"
              value={movTipo}
              onChange={(e) =>
                setMovTipo(e.target.value as "INGRESO" | "EGRESO" | "VECINA")
              }
              fullWidth
            >
              <MenuItem value="INGRESO">Ingreso</MenuItem>
              <MenuItem value="EGRESO">Egreso</MenuItem>
              <MenuItem value="VECINA">Caja Vecina</MenuItem>
            </TextField>

            <TextField
              label="Categoría"
              placeholder={
                movTipo === "VECINA"
                  ? 'Ej: "A_VECINA" o "DESDE_VECINA"'
                  : "Ej: Pago proveedor, retiro, depósito..."
              }
              value={movCategoria}
              onChange={(e) => setMovCategoria(e.target.value)}
              fullWidth
            />

            <TextField
              label="Monto"
              type="number"
              value={movMonto}
              onChange={(e) => setMovMonto(e.target.value)}
              fullWidth
            />

            <TextField
              label="Descripción"
              multiline
              minRows={2}
              value={movDesc}
              onChange={(e) => setMovDesc(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMov(false)}>Cancelar</Button>
          <Button variant="contained" onClick={guardarMovimiento}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== MODAL CIERRE ===== */}
      <Dialog
        open={openCierre}
        onClose={() => setOpenCierre(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Cierre de caja</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Ingresa los montos reales contados al final del turno.
          </Typography>

          <Stack spacing={2} mt={2}>
            <TextField
              label="Efectivo total en caja (real)"
              type="number"
              value={realLocal}
              onChange={(e) => setRealLocal(e.target.value)}
              fullWidth
            />
            <TextField
              label="Saldo real Caja Vecina"
              type="number"
              value={realVecina}
              onChange={(e) => setRealVecina(e.target.value)}
              fullWidth
            />

            <Alert
              icon={<InfoOutlinedIcon fontSize="small" />}
              severity="info"
            >
              El sistema registrará las diferencias entre lo esperado y lo real
              tanto en la caja local como en Caja Vecina.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCierre(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={cerrarCaja}>
            Confirmar cierre
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
