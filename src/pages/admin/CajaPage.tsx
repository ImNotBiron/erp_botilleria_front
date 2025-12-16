import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Card,
  CardHeader,
  CardContent,
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
import HistorialCajaModal from "../../components/caja/HistorialCajaModal";
import DevolucionVentaModal from "../../components/caja/DevolucionVentaModal";
import CambioVentaModal from "../../components/caja/CambioVentaModal";

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

const formatCLP = (value: number | null | undefined) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

  const formatInputCLP = (value: string) => {
  const numeric = value.replace(/\D/g, ""); // Solo números
  if (!numeric) return "";
  return new Intl.NumberFormat("es-CL").format(Number(numeric));
};

const parseCLPToNumber = (value: string): number => {
  const numeric = value.replace(/\D/g, ""); // deja solo dígitos
  return numeric ? Number(numeric) : 0;
};

// Mensaje para diferencias de caja en el modal de cierre
const getDiffMessage = (diff: number) => {
  if (diff === 0) {
    return "Caja cuadrada ✅";
  }
  if (diff > 0) {
    return `Hay dinero a favor (+${formatCLP(diff)})`;
  }
  return `Hay faltante (-${formatCLP(Math.abs(diff))})`;
};

export default function CajaPage() {
  const [loading, setLoading] = useState(true);
  const [cajaActiva, setCajaActiva] = useState<CajaSesion | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);

  // Apertura
  const [initLocal, setInitLocal] = useState("");
  const [initVecina, setInitVecina] = useState("");

  // Modal Movimiento
  const [openMov, setOpenMov] = useState(false);
  const [movTipo, setMovTipo] = useState<"INGRESO" | "EGRESO">("INGRESO");
  const [movMonto, setMovMonto] = useState("");
  const [movDesc, setMovDesc] = useState("");

  // Modal Cierre
  const [openCierre, setOpenCierre] = useState(false);
  const [realLocal, setRealLocal] = useState("");
  const [realVecina, setRealVecina] = useState("");

  // Modal Historial Sesiones Cajas 
  const [openHistorial, setOpenHistorial] = useState(false);
  // Modal Devolución
  const [openDevolucion, setOpenDevolucion] = useState(false);

  // ===== VENTA INTERNA =====
  type ItemVentaInterna = {
    id_producto: number;
    nombre_producto: string;
    precio_unitario: number;
    cantidad: number;
    exento_iva: 0 | 1;
  };

  const [openVentaInterna, setOpenVentaInterna] = useState(false);
  const [itemsVentaInterna, setItemsVentaInterna] = useState<ItemVentaInterna[]>([]);
  const [codigoInterno, setCodigoInterno] = useState("");
  const [cantInterna, setCantInterna] = useState("1");
  const [notaInterna, setNotaInterna] = useState("");
  const [loadingVentaInterna, setLoadingVentaInterna] = useState(false);
  const [errorVentaInterna, setErrorVentaInterna] = useState<string | null>(null);

   const totalSugeridoInterna = itemsVentaInterna.reduce(
    (acc, it) => acc + it.precio_unitario * it.cantidad,
    0
  );

    const [metodoPagoInterna, setMetodoPagoInterna] = useState<
    "EFECTIVO" | "GIRO" | "DEBITO" | "CREDITO" | "TRANSFERENCIA"
  >("EFECTIVO");

  const [totalFinalInterna, setTotalFinalInterna] = useState("");
  const [openCambio, setOpenCambio] = useState(false);



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

  /* ===== APERTURA ===== */
 const abrirCaja = async () => {
  try {
    await api.post("/caja/abrir", {
      inicial_local: parseCLPToNumber(initLocal),
      inicial_vecina: parseCLPToNumber(initVecina),
    });
    setInitLocal("");
    setInitVecina("");
    await cargarEstado();
  } catch (err: any) {
    alert(err.response?.data?.error || "Error al abrir caja.");
  }
};


  /* ===== MOVIMIENTO ===== */
  const guardarMovimiento = async () => {
    try {
      const categoriaAuto = movTipo; // usamos el tipo como categoría genérica
      await api.post("/caja/movimiento", {
        tipo: movTipo,
        categoria: categoriaAuto,
        monto: movMonto,
        descripcion: movDesc,
      });
      setOpenMov(false);
      setMovMonto("");
      setMovDesc("");
      setMovTipo("INGRESO");
      await cargarEstado();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error registrando movimiento.");
    }
  };

  /* ===== CIERRE ===== */
 const cerrarCaja = async () => {
  try {
    await api.post("/caja/cerrar", {
      total_real_local: parseCLPToNumber(realLocal),
      total_real_vecina: parseCLPToNumber(realVecina),
    });
    setOpenCierre(false);
    setRealLocal("");
    setRealVecina("");
    await cargarEstado();
  } catch (err: any) {
    alert(err.response?.data?.error || "Error cerrando caja.");
  }
};

  const handleAgregarItemInterna = async () => {
  const codigo = codigoInterno.trim();
  const cantidad = Number(cantInterna) || 1;

  if (!codigo) return;
  if (cantidad <= 0) {
    setErrorVentaInterna("La cantidad debe ser mayor a cero.");
    return;
  }

  try {
    setErrorVentaInterna(null);

    // Normalizamos el código (ej: "lic001" -> "LIC001")
    const codigoLimpio = codigo.toUpperCase();

    // Usamos la ruta que YA tienes en el backend:
    // GET /productos/codigo/:codigo
    const res = await api.get(
      `/productos/codigo/${encodeURIComponent(codigoLimpio)}`
    );

    const prod = res.data?.producto ?? res.data;
    if (!prod) {
      setErrorVentaInterna("Producto no encontrado.");
      return;
    }

    setItemsVentaInterna((prev) => {
      const idx = prev.findIndex((p) => p.id_producto === prod.id);
      if (idx >= 0) {
        const copia = [...prev];
        copia[idx] = {
          ...copia[idx],
          cantidad: copia[idx].cantidad + cantidad,
        };
        return copia;
      }

      return [
        ...prev,
        {
          id_producto: prod.id,
          nombre_producto: prod.nombre_producto,
          precio_unitario: prod.precio_venta,
          cantidad,
          exento_iva: prod.exento_iva,
        },
      ];
    });

    setCodigoInterno("");
    setCantInterna("1");
  } catch (err: any) {
    console.error(err);
    setErrorVentaInterna(
      err?.response?.data?.error || "Error al buscar el producto."
    );
  }
};


  const handleEliminarItemInterna = (id_producto: number) => {
    setItemsVentaInterna((prev) =>
      prev.filter((it) => it.id_producto !== id_producto)
    );
  };

    const handleCerrarVentaInterna = () => {
    if (loadingVentaInterna) return;
    setOpenVentaInterna(false);
    setItemsVentaInterna([]);
    setCodigoInterno("");
    setCantInterna("1");
    setNotaInterna("");
    setTotalFinalInterna("");         // 👈 nuevo
    setMetodoPagoInterna("EFECTIVO"); // 👈 nuevo
    setErrorVentaInterna(null);
  };


    const handleConfirmarVentaInterna = async () => {
    if (itemsVentaInterna.length === 0) {
      setErrorVentaInterna("Agrega al menos un producto a la venta interna.");
      return;
    }

    if (!totalFinalInterna.trim()) {
      setErrorVentaInterna("Debes ingresar el total final de la venta interna.");
      return;
    }

    const total = parseCLPToNumber(totalFinalInterna);
    if (total <= 0) {
      setErrorVentaInterna("El total final debe ser mayor a cero.");
      return;
    }

    const itemsPayload = itemsVentaInterna.map((it) => ({
      id_producto: it.id_producto,
      cantidad: it.cantidad,
    }));

    const pagosPayload = [
      {
        tipo: metodoPagoInterna,
        monto: total,
      },
    ];

    try {
      setLoadingVentaInterna(true);
      setErrorVentaInterna(null);

      await api.post("/ventas/crear", {
        items: itemsPayload,
        pagos: pagosPayload,
        tipo_venta: "INTERNA",
        nota_interna: notaInterna || null,
        monto_total_interno: total, // 👈 clave: total final definido por admin
      });

      await cargarEstado();
      handleCerrarVentaInterna();
    } catch (err: any) {
      console.error(err);
      setErrorVentaInterna(
        err?.response?.data?.error ||
          "Ocurrió un error al registrar la venta interna."
      );
    } finally {
      setLoadingVentaInterna(false);
    }
  };




  /* ===== RENDER ===== */

  if (loading) {
    return <Typography>Cargando caja...</Typography>;
  }

  // ===== SIN CAJA ABIERTA → PANTALLA DE APERTURA CENTRADA =====
  if (!cajaActiva) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "70vh",
        }}
      >

        <Typography variant="h4" fontWeight={700} mb={3} textAlign="center">
          Apertura de Caja
        </Typography>

        <Card
          sx={{
            width: "100%",
            maxWidth: 480,
            borderRadius: 1,
            boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
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
              value={initLocal}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, ""); // solo números
                const formatted = raw
                  ? new Intl.NumberFormat("es-CL").format(Number(raw))
                  : "";
                setInitLocal(formatted);
              }}
              fullWidth
            />

            <TextField
              label="Cupo inicial Caja Vecina"
              value={initVecina}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "");
                const formatted = raw
                  ? new Intl.NumberFormat("es-CL").format(Number(raw))
                  : "";
                setInitVecina(formatted);
              }}
              fullWidth
            />
              <Alert
                icon={<InfoOutlinedIcon fontSize="small" />}
                severity="info"
                sx={{ mt: 1 }}
              >
                Una vez abierta, todas las ventas, movimientos y ventas internas
                quedarán vinculadas a esta sesión.
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

                <Button
                  variant="text"
                  fullWidth
                  sx={{ mt: 1, fontSize: "0.8rem" }}
                  onClick={() => setOpenHistorial(true)}
                >
                  Ver historial de cajas
                </Button>

              </Box>
            </Stack>
          </CardContent>
        </Card>
             <HistorialCajaModal
              open={openHistorial}
              onClose={() => setOpenHistorial(false)}
            />
      </Box>
    );
  }

  // ===== CAJA ABIERTA =====

  const n = (v: number | null | undefined): number => v ?? 0;

const totalTicketsTarjeta =
  n(cajaActiva.tickets_debito) +
  n(cajaActiva.tickets_credito);

 // Total tarjetas ($) igual que antes (débito + crédito + transferencia)
const totalTarjetas =
  n(cajaActiva.total_debito) +
  n(cajaActiva.total_credito) +
  n(cajaActiva.total_transferencia);

// ✅ Efectivo afecto (efectivo - exento)
const efectivoAfecto =
  n(cajaActiva.total_efectivo_giro) - n(cajaActiva.total_exento);

// 🔹 Esperado LOCAL (regla nueva, sin exento, sin caja vecina)
const esperadoLocalCalc =
  n(cajaActiva.inicial_local) +
  n(cajaActiva.total_efectivo_giro) +
  n(cajaActiva.ingresos_extra) -
  n(cajaActiva.egresos);

// 🔹 Esperado VECINA = solo saldo inicial
const esperadoVecinaCalc = n(cajaActiva.inicial_vecina);


  const realLocalNumber = parseCLPToNumber(realLocal);
  const realVecinaNumber = parseCLPToNumber(realVecina);

  const diffLocalPreview =
    realLocal === "" ? null : realLocalNumber - esperadoLocalCalc;
  const diffVecinaPreview =
    realVecina === "" ? null : realVecinaNumber - esperadoVecinaCalc;

  return (
    <Box>

      {/* Layout principal: cards en una columna ordenada */}
      <Stack spacing={3}>
        {/* === CARD 1: RESUMEN GENERAL + ACCIONES === */}
        <Card
  sx={{
    borderRadius: 1,
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
      {/* IZQUIERDA: info de la sesión */}
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
          {new Date(cajaActiva.fecha_apertura).toLocaleString()}
        </Typography>

        <Stack direction="row" spacing={2} mt={2}>
          <Chip
            icon={<AttachMoneyIcon />}
            label={`Inicial local: ${formatCLP(cajaActiva.inicial_local)}`}
            variant="outlined"
          />
          <Chip
            icon={<AccountBalanceIcon />}
            label={`Inicial vecina: ${formatCLP(cajaActiva.inicial_vecina)}`}
            variant="outlined"
          />
        </Stack>
      </Box>

      {/* DERECHA: acciones */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        width={{ xs: "100%", md: "auto" }}
      >
        <Button
          fullWidth
          variant="outlined"
          onClick={() => setOpenHistorial(true)}
        >
          Historial
        </Button>

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
          variant="outlined"
          onClick={() => setOpenCambio(true)}
        >
          Registrar cambio
        </Button>

        <Button
          fullWidth
          variant="outlined"
          onClick={() => setOpenDevolucion(true)}
        >
          Registrar devolución
        </Button>
        <Button
            fullWidth
            variant="outlined"
            onClick={() => setOpenVentaInterna(true)}
          >
            Venta interna
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

    {/* 🔹 NUEVO: recuadro de efectivo esperado en caja local */}
    <Box
      sx={{
        mt: 2,
        p: 1.5,
        borderRadius: 1,
        border: "1px dashed",
        borderColor: "divider",
        bgcolor: "background.default",
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}
      >
        Efectivo esperado actual en caja
      </Typography>
      <Typography variant="h6" fontWeight={700}>
        {formatCLP(esperadoLocalCalc)}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Se actualiza automáticamente con cada venta o movimiento registrado.
      </Typography>
    </Box>

    <Alert
      icon={<InfoOutlinedIcon fontSize="small" />}
      severity="info"
      sx={{ mt: 2 }}
    >
      Todas las ventas y movimientos del día quedan vinculados a esta sesión de
      caja. La cuadratura se registra al momento del cierre.
    </Alert>
  </CardContent>
</Card>


        {/* === CARD 2: CAJA LOCAL + CAJA VECINA === */}
        <Card
          sx={{
            borderRadius: 1,
            boxShadow: "0 4px 18px rgba(0,0,0,0.05)",
          }}
        >
          <CardContent>
            <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
              {/* Bloque Caja Local */}
              <Box flex={1}>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <AttachMoneyIcon color="success" fontSize="small" />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Caja local
                  </Typography>
                </Stack>
                <Stack spacing={0.5}>
                  <Typography variant="body2">
                    <strong>Efectivo + giro:</strong>{" "}
                    {formatCLP(cajaActiva.total_efectivo_giro)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Ventas exentas:</strong>{" "}
                    {formatCLP(cajaActiva.total_exento)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Ingresos extra:</strong>{" "}
                    {formatCLP(cajaActiva.ingresos_extra)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Egresos:</strong>{" "}
                    {formatCLP(cajaActiva.egresos)}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Typography variant="body2">
                    <strong>Total esperado en caja local:</strong>{" "}
                    {formatCLP(esperadoLocalCalc)}
                  </Typography>

                  {cajaActiva.total_real_local != null && (
                    <>
                      <Typography variant="body2">
                        <strong>Total real contado:</strong>{" "}
                        {formatCLP(cajaActiva.total_real_local)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Diferencia:</strong>{" "}
                        {cajaActiva.diferencia_local === 0
                          ? `${formatCLP(0)} (cuadrado)`
                          : formatCLP(cajaActiva.diferencia_local)}
                      </Typography>
                    </>
                  )}
                </Stack>
              </Box>

              {/* Bloque Caja Vecina */}
              <Box flex={1}>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <AccountBalanceWalletIcon
                    color="primary"
                    fontSize="small"
                  />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Caja vecina
                  </Typography>
                </Stack>
                <Stack spacing={0.5}>
                  <Typography variant="body2">
                    <strong>Cupo inicial / saldo inicial:</strong>{" "}
                    {formatCLP(cajaActiva.inicial_vecina)}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Typography variant="body2">
                    <strong>Total esperado Caja Vecina:</strong>{" "}
                    {formatCLP(esperadoVecinaCalc)}
                  </Typography>

                  {cajaActiva.total_real_vecina != null && (
                    <>
                      <Typography variant="body2">
                        <strong>Saldo real reportado:</strong>{" "}
                        {formatCLP(cajaActiva.total_real_vecina)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Diferencia:</strong>{" "}
                        {formatCLP(cajaActiva.diferencia_vecina)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {cajaActiva.diferencia_vecina! > 0
                          ? "Caja Vecina le debe a la Caja Local."
                          : cajaActiva.diferencia_vecina! < 0
                          ? "La Caja Local le debe a Caja Vecina."
                          : "Saldo de Caja Vecina cuadrado."}
                      </Typography>
                    </>
                  )}
                </Stack>

              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* === CARD 3: MÉTODOS DE PAGO === */}
        <Card
          sx={{
            borderRadius: 1,
            boxShadow: "0 4px 18px rgba(0,0,0,0.04)",
          }}
        >
          <CardHeader
            title="Métodos de pago"
            subheader="Totales acumulados durante la sesión."
          />
          <CardContent>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems="stretch"
            >
              <Box flex={1}>
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
                        {formatCLP(cajaActiva.total_efectivo_giro)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tickets: {cajaActiva.tickets_efectivo || 0}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>

              <Box flex={1}>
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
                        {formatCLP(cajaActiva.total_debito)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tickets: {cajaActiva.tickets_debito || 0}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>

              <Box flex={1}>
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
                        {formatCLP(cajaActiva.total_credito)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tickets: {cajaActiva.tickets_credito || 0}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>

              <Box flex={1}>
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
                        <Typography variant="body2">Transferencia</Typography>
                      </Stack>
                      <Typography variant="h6">
                        {formatCLP(cajaActiva.total_transferencia)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tickets: {cajaActiva.tickets_transferencia || 0}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              spacing={1}
            >
             <Typography variant="body2">
                <strong>Total tarjetas (monto):</strong> {formatCLP(totalTarjetas)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total tickets tarjeta (débito + crédito): {totalTicketsTarjeta}
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {/* === CARD 4: MOVIMIENTOS === */}
        <Card
          sx={{
            borderRadius: 1,
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
                      <TableCell>{formatCLP(m.monto)}</TableCell>
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
      </Stack>

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
                setMovTipo(e.target.value as "INGRESO" | "EGRESO")
              }
              fullWidth
            >
              <MenuItem value="INGRESO">Ingreso</MenuItem>
              <MenuItem value="EGRESO">Egreso</MenuItem>
            </TextField>

            <TextField
              label="Monto"
              type="number"
              value={movMonto}
              onChange={(e) => setMovMonto(e.target.value)}
              fullWidth
            />

            <TextField
              label="Comentario / detalle"
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
        maxWidth="md"
      >
        <DialogTitle>Cierre de caja</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {/* Resumen compacto del turno */}
          <Card
            variant="outlined"
            sx={{ mb: 2, borderRadius: 2, bgcolor: "background.default" }}
          >
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>
                Resumen del turno
              </Typography>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                justifyContent="space-between"
              >
                <Box flex={1}>
                  <Typography variant="body2" fontWeight={600}>
                    Caja local
                  </Typography>
                  <Typography variant="body2">
                    Esperado: {formatCLP(esperadoLocalCalc)}
                  </Typography>
                  <Typography variant="body2">
                    Ingresos extra: {formatCLP(cajaActiva.ingresos_extra)}
                  </Typography>
                  <Typography variant="body2">
                    Egresos: {formatCLP(cajaActiva.egresos)}
                  </Typography>
                  <Typography variant="body2">
                    Efectivo:{" "}
                    {formatCLP(cajaActiva.total_efectivo_giro)}
                  </Typography>
                  <Typography variant="body2">
                    Exentos: {formatCLP(cajaActiva.total_exento)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Efectivo afecto:</strong>{" "}
                    {formatCLP(efectivoAfecto)}
                  </Typography>
                </Box>

                <Box flex={1}>
                  <Typography variant="body2" fontWeight={600}>
                    Caja vecina
                  </Typography>
                  {/* <Typography variant="body2">
                    Esperado: {formatCLP(esperadoVecinaCalc)}
                  </Typography> */}
                  <Typography variant="body2">
                    Cupo inicial: {formatCLP(cajaActiva.inicial_vecina)}
                  </Typography>
                  {/* <Typography variant="body2">
                    Movimientos netos:{" "}
                    {formatCLP(cajaActiva.movimientos_vecina)}
                  </Typography> */}
                </Box>

                <Box flex={1}>
                  <Typography variant="body2" fontWeight={600}>
                    Tarjetas
                  </Typography>
                  <Typography variant="body2">
                    Débito: {formatCLP(cajaActiva.total_debito)} (
                    {cajaActiva.tickets_debito || 0} tickets)
                  </Typography>
                  <Typography variant="body2">
                    Crédito: {formatCLP(cajaActiva.total_credito)} (
                    {cajaActiva.tickets_credito || 0} tickets)
                  </Typography>
                  <Typography variant="body2">
                    Transferencia: {formatCLP(cajaActiva.total_transferencia)}{" "}
                    ({cajaActiva.tickets_transferencia || 0} tickets)
                  </Typography>
                  <Typography variant="body2">
                    Total tickets tarjeta: {totalTicketsTarjeta}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Typography variant="body2" color="text.secondary">
            Ingresa los montos reales contados al final del turno.
          </Typography>

          <Stack spacing={2} mt={2}>
           <TextField
                    fullWidth
                    label="Efectivo total en caja (real)"
                    value={realLocal}
                    onChange={(e) => {
                      const formatted = formatInputCLP(e.target.value);
                      setRealLocal(formatted);
                    }}
                    inputProps={{ inputMode: "numeric" }}
                  />


            {diffLocalPreview !== null && (
              <Alert
                severity={
                  diffLocalPreview === 0
                    ? "success"
                    : diffLocalPreview > 0
                    ? "info"
                    : "warning"
                }
              >
                {getDiffMessage(diffLocalPreview)}
              </Alert>
            )}

           <TextField
                    fullWidth
                    label="Saldo real Caja Vecina"
                    value={realVecina}
                    onChange={(e) => {
                      const formatted = formatInputCLP(e.target.value);
                      setRealVecina(formatted);
                    }}
                    inputProps={{ inputMode: "numeric" }}
                  />

            {diffVecinaPreview !== null && (
              <Alert
                severity={
                  diffVecinaPreview === 0
                    ? "success"
                    : diffVecinaPreview > 0
                    ? "info"
                    : "warning"
                }
              >
                {getDiffMessage(diffVecinaPreview)}
              </Alert>
            )}

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

      {/* MODAL VENTA INTERNA */}
          {/* MODAL VENTA INTERNA */}
      <Dialog
        open={openVentaInterna}
        onClose={handleCerrarVentaInterna}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Venta interna</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {errorVentaInterna && (
              <Alert severity="error">{errorVentaInterna}</Alert>
            )}

            {/* Buscar / agregar producto */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems="center"
            >
              <TextField
                label="Código de barras / producto"
                value={codigoInterno}
                onChange={(e) => setCodigoInterno(e.target.value)}
                fullWidth
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAgregarItemInterna();
                  }
                }}
              />
              <TextField
                label="Cantidad"
                value={cantInterna}
                onChange={(e) => setCantInterna(e.target.value)}
                sx={{ width: 120 }}
                inputProps={{ inputMode: "numeric" }}
              />
              <Button
                variant="contained"
                onClick={handleAgregarItemInterna}
                disabled={loadingVentaInterna}
              >
                Agregar
              </Button>
            </Stack>

            {/* Tabla de productos */}
            {itemsVentaInterna.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Aún no has agregado productos a la venta interna.
              </Typography>
            ) : (
              <Box sx={{ maxHeight: 260, overflowY: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                      <TableCell align="right">Precio unit.</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                      <TableCell align="center">Exento</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {itemsVentaInterna.map((it) => (
                      <TableRow key={it.id_producto}>
                        <TableCell>{it.nombre_producto}</TableCell>
                        <TableCell align="right">{it.cantidad}</TableCell>
                        <TableCell align="right">
                          {formatCLP(it.precio_unitario)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCLP(it.precio_unitario * it.cantidad)}
                        </TableCell>
                        <TableCell align="center">
                          {it.exento_iva === 1 ? "Sí" : "No"}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            color="error"
                            onClick={() =>
                              handleEliminarItemInterna(it.id_producto)
                            }
                          >
                            Quitar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}

            {/* Nota interna */}
            <TextField
              label="Nota interna (opcional)"
              value={notaInterna}
              onChange={(e) => setNotaInterna(e.target.value)}
              multiline
              minRows={2}
              fullWidth
            />

            {/* Total sugerido */}
            <Box
              sx={{
                p: 2,
                borderRadius: 1,
                border: "1px dashed",
                borderColor: "divider",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Total sugerido (suma de productos)
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {formatCLP(totalSugeridoInterna)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Este es el valor real según los precios del sistema. El total
                final lo defines tú abajo.
              </Typography>
            </Box>

            {/* Total final + método de pago */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems="flex-start"
            >
              <TextField
                label="Total final a registrar"
                value={totalFinalInterna}
                onChange={(e) =>
                  setTotalFinalInterna(formatInputCLP(e.target.value))
                }
                fullWidth
                inputProps={{ inputMode: "numeric" }}
                helperText="Monto que se registrará como total de la venta interna."
              />

              <TextField
                select
                label="Método de pago"
                value={metodoPagoInterna}
                onChange={(e) =>
                  setMetodoPagoInterna(
                    e.target.value as
                      | "EFECTIVO"
                      | "GIRO"
                      | "DEBITO"
                      | "CREDITO"
                      | "TRANSFERENCIA"
                  )
                }
                sx={{ minWidth: 220 }}
              >
                <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                <MenuItem value="GIRO">Caja Vecina / Giro</MenuItem>
                <MenuItem value="DEBITO">Débito</MenuItem>
                <MenuItem value="CREDITO">Crédito</MenuItem>
                <MenuItem value="TRANSFERENCIA">Transferencia</MenuItem>
              </TextField>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCerrarVentaInterna}
            disabled={loadingVentaInterna}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmarVentaInterna}
            disabled={loadingVentaInterna || itemsVentaInterna.length === 0}
          >
            {loadingVentaInterna ? "Guardando..." : "Confirmar venta interna"}
          </Button>
        </DialogActions>
      </Dialog>

      <DevolucionVentaModal
        open={openDevolucion}
        onClose={() => setOpenDevolucion(false)}
        onSuccess={async () => {
          // refrescamos la caja después de una devolución exitosa
          await cargarEstado();
        }}
      />

      <HistorialCajaModal
        open={openHistorial}
        onClose={() => setOpenHistorial(false)}
      />

      <CambioVentaModal
        open={openCambio}
        onClose={() => setOpenCambio(false)}
        onSuccess={async () => {
          await cargarEstado(); // refresca caja / movimientos
        }}
      />


    </Box>
  );
}
