import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaymentsIcon from "@mui/icons-material/Payments";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import GroupsIcon from "@mui/icons-material/Groups";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import { api } from "../../api/api";
import { DetalleVentaModal } from "../../components/admin/DetalleVentaModal";

type Venta = {
  id: number;
  fecha: string;
  tipo_venta: "NORMAL" | "INTERNA";
  total_general: number;
  total_afecto: number;
  total_exento: number;
  monto_efectivo_total: number;
  monto_no_efectivo_total: number;
  boleteado: 0 | 1;
  estado: "ACTIVA" | "ANULADA";
  id_usuario: number;
  nombre_usuario: string;

  tiene_boleta_afecta?: 0 | 1;
  tiene_boleta_exenta?: 0 | 1;
};

type UsuarioOnline = {
  id: number;
  nombre_usuario: string;
  ventasCount: number;
  totalGeneral: number;
  totalAfecto: number;
  totalExento: number;
  efectivo: number;
  noEfectivo: number;
};

type PendienteVenta = {
  id: number;
  fecha: string;
  total_general: number;
  total_afecto: number;
  total_exento: number;
  monto_efectivo_total: number;
  nombre_usuario: string;

  tiene_boleta_afecta: 0 | 1;
  tiene_boleta_exenta: 0 | 1;

  // ✅ nuevo: montos que realmente corresponden a EFECTIVO
  afecto_efectivo: number;
  exento_efectivo: number;
};

type DashboardResponse = {
  caja_activa: boolean;
  caja: any | null;

  resumenVentas: {
    totalVentas: number;
    totalGeneral: number;
    totalAfecto: number;
    totalExento: number;
    totalEfectivo: number;
    totalNoEfectivo: number;
  } | null;

  metodosPago: {
    efectivo_giro: number;
    debito: number;
    credito: number;
    transferencia: number;
    tarjetas_total: number;
    exento: number;
    tickets: {
      efectivo: number;
      debito: number;
      credito: number;
      transferencia: number;
    };
  } | null;

  usuariosOnline: UsuarioOnline[];
  pendientesBoletear: {
    count: number;
    ventas: PendienteVenta[];
  };

  ventas: Venta[];
  ultimaVenta: Venta | null;
};

type DetalleVentaResponse = {
  venta: {
    id: number;
    fecha: string;
    tipo_venta: "NORMAL" | "INTERNA";
    total_general: number;
    total_afecto: number;
    total_exento: number;
    monto_efectivo_total: number;
    monto_no_efectivo_total: number;
    nombre_usuario: string;
  };
  items: Array<{
    nombre_producto: string;
    cantidad: number;
    precio_unitario: number;
    precio_final: number;
    exento_iva: 0 | 1;
  }>;
  pagos?: Array<{ tipo_pago: string; monto: number }>;
  boletas?: Array<{ tipo: "AFECTA" | "EXENTA"; folio_sii: number; fecha: string }>;
};

const formatCLP = (value: number | null | undefined) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const safeNum = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function KpiCard(props: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  tone?: "primary" | "success" | "warning" | "info";
}) {
  const { title, value, subtitle, icon, tone = "primary" } = props;

  const toneColor =
    tone === "success"
      ? "success.main"
      : tone === "warning"
      ? "warning.main"
      : tone === "info"
      ? "info.main"
      : "primary.main";

  return (
    <Card
      sx={{
        borderRadius: 2,
        flex: "1 1 260px",
        overflow: "hidden",
        position: "relative",
        boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
      }}
    >
      <Box sx={{ height: 6, bgcolor: toneColor, opacity: 0.9 }} />
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="caption" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h6" fontWeight={900} sx={{ mt: 0.25 }}>
              {value}
            </Typography>
            {subtitle ? (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            ) : null}
          </Box>
          <Box sx={{ opacity: 0.9 }}>{icon}</Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState<"all" | "last">("all");
  const [data, setData] = useState<DashboardResponse | null>(null);

  const intervalRef = useRef<number | null>(null);

  // Boletear modal
  const [openBoletear, setOpenBoletear] = useState(false);
  const [boletearVentaId, setBoletearVentaId] = useState<number | null>(null);
  const [boletearTipo, setBoletearTipo] = useState<"AFECTA" | "EXENTA" | null>(null);
  const [folioInterno, setFolioInterno] = useState("");
  const [boleteando, setBoleteando] = useState(false);

  // Detalle modal
  const [openDetalle, setOpenDetalle] = useState(false);
  const [detalleVenta, setDetalleVenta] = useState<DetalleVentaResponse | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const abrirBoletear = (idVenta: number, tipo: "AFECTA" | "EXENTA") => {
    setBoletearVentaId(idVenta);
    setBoletearTipo(tipo);
    setFolioInterno("");
    setOpenBoletear(true);
  };

  const cerrarBoletear = () => {
    setOpenBoletear(false);
    setBoletearVentaId(null);
    setBoletearTipo(null);
    setFolioInterno("");
  };

  const normalizeDetalle = (raw: any): DetalleVentaResponse => {
    const cab = raw?.venta || raw?.cabecera || {};
    const pagosRaw = Array.isArray(raw?.pagos) ? raw.pagos : [];

    const sumEfectivo = pagosRaw.reduce((acc: number, p: any) => {
      const t = String(p?.tipo_pago || p?.tipo || "").toUpperCase();
      const m = safeNum(p?.monto);
      if (["EFECTIVO", "GIRO", "EFECTIVO_GIRO"].includes(t)) return acc + m;
      return acc;
    }, 0);

    const sumNoEfectivo = pagosRaw.reduce((acc: number, p: any) => {
      const t = String(p?.tipo_pago || p?.tipo || "").toUpperCase();
      const m = safeNum(p?.monto);
      if (!["EFECTIVO", "GIRO", "EFECTIVO_GIRO"].includes(t)) return acc + m;
      return acc;
    }, 0);

    const venta = {
      id: safeNum(cab?.id),
      fecha: cab?.fecha || new Date().toISOString(),
      tipo_venta: (cab?.tipo_venta || cab?.tipoVenta || "NORMAL") as "NORMAL" | "INTERNA",
      total_general: safeNum(cab?.total_general),
      total_afecto: safeNum(cab?.total_afecto),
      total_exento: safeNum(cab?.total_exento),
      monto_efectivo_total: safeNum(cab?.monto_efectivo_total) || sumEfectivo,
      monto_no_efectivo_total: safeNum(cab?.monto_no_efectivo_total) || sumNoEfectivo,
      nombre_usuario: cab?.nombre_usuario || cab?.vendedor || cab?.usuario || "",
    };

    const items = Array.isArray(raw?.items)
      ? raw.items.map((it: any) => {
          const cantidad = safeNum(it?.cantidad);
          const precio_unitario = safeNum(it?.precio_unitario);
          const precio_final = safeNum(it?.precio_final) || cantidad * precio_unitario;

          return {
            nombre_producto: it?.nombre_producto || it?.nombre || "",
            cantidad,
            precio_unitario,
            precio_final,
            exento_iva: (Number(it?.exento_iva) === 1 ? 1 : 0) as 0 | 1,
          };
        })
      : [];

    const pagos = pagosRaw.map((p: any) => ({
      tipo_pago: String(p?.tipo_pago || p?.tipo || ""),
      monto: safeNum(p?.monto),
    }));

    const boletas = Array.isArray(raw?.boletas) ? raw.boletas : [];

    return { venta, items, pagos, boletas };
  };

  const abrirDetalle = async (idVenta: number) => {
    if (!idVenta || !Number.isFinite(Number(idVenta))) return;

    setOpenDetalle(true);
    setLoadingDetalle(true);
    setDetalleVenta(null);

    try {
      const res = await api.get(`/ventas/${idVenta}/detalle`);
      setDetalleVenta(normalizeDetalle(res.data));
    } catch (err) {
      console.error(err);
      alert("Error al cargar el detalle de la venta.");
      setOpenDetalle(false);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const verDetalleSafe = (id: number | null | undefined) => {
    if (!id) return;
    abrirDetalle(id);
  };

  const cerrarDetalle = () => {
    setOpenDetalle(false);
    setDetalleVenta(null);
    setLoadingDetalle(false);
  };

  const fetchDashboard = async (opts?: { silent?: boolean }) => {
    const silent = !!opts?.silent;
    if (!silent) setRefreshing(true);

    try {
      const qs =
        mode === "last"
          ? "/dashboard/resumen?mode=last"
          : "/dashboard/resumen?mode=all&limite=200";

      const res = await api.get(qs);
      // tu backend responde {success:true,...}
      setData((res.data?.success ? res.data : res.data) as DashboardResponse);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchDashboard({ silent: true });

    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      fetchDashboard({ silent: true });
    }, 5000);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const confirmarBoleteo = async () => {
    if (!boletearVentaId || !boletearTipo) return;

    const folio = Number(folioInterno);
    if (!Number.isFinite(folio) || folio <= 0) {
      alert("Folio SII inválido.");
      return;
    }

    setBoleteando(true);
    try {
      await api.post("/boletas/marcar", {
        id_venta: boletearVentaId,
        tipo: boletearTipo,
        folio_sii: folio,
      });

      cerrarBoletear();
      await fetchDashboard({ silent: false });
    } catch (err: any) {
      alert(err?.response?.data?.error || "Error al marcar boleta.");
    } finally {
      setBoleteando(false);
    }
  };

  const cajaActiva = data?.caja_activa && data?.caja;
  const resumen = data?.resumenVentas;
  const mp = data?.metodosPago;
  const pendientes = data?.pendientesBoletear;

  // ✅ Totales pendientes SOLO EFECTIVO (no usar total_afecto/exento completos)
  const pendientesTotales = useMemo(() => {
    const list = pendientes?.ventas || [];
    let totalPendAfectoEfectivo = 0;
    let totalPendExentoEfectivo = 0;

    for (const v of list) {
      const faltaAfecta =
        safeNum(v.afecto_efectivo) > 0 && Number(v.tiene_boleta_afecta) === 0;
      const faltaExenta =
        safeNum(v.exento_efectivo) > 0 && Number(v.tiene_boleta_exenta) === 0;

      if (faltaAfecta) totalPendAfectoEfectivo += safeNum(v.afecto_efectivo);
      if (faltaExenta) totalPendExentoEfectivo += safeNum(v.exento_efectivo);
    }

    return { totalPendAfectoEfectivo, totalPendExentoEfectivo };
  }, [pendientes?.ventas]);

  const kpis = useMemo(() => {
    if (!cajaActiva || !resumen || !mp) return null;

    return {
      totalVentas: safeNum(resumen.totalVentas),
      totalGeneral: safeNum(resumen.totalGeneral),
      efectivo: safeNum(mp.efectivo_giro),
      tarjetas: safeNum(mp.tarjetas_total),
      exento: safeNum(resumen.totalExento),
      afecto: safeNum(resumen.totalAfecto),
      online: data?.usuariosOnline?.length || 0,
      pendientes: pendientes?.count || 0,
    };
  }, [cajaActiva, resumen, mp, data?.usuariosOnline?.length, pendientes?.count]);

  if (loading) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={900} mb={2}>
          Dashboard (Admin)
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack spacing={2.25}>
        {/* HERO HEADER */}
        <Card
          sx={{
            borderRadius: 1,
            overflow: "hidden",
            boxShadow: "0 12px 35px rgba(0,0,0,0.08)",
          }}
        >
          <Box
            sx={{
              p: 2.25,
              background:
                "linear-gradient(135deg, rgba(25,118,210,0.18), rgba(46,125,50,0.12))",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={1.5}
            >
              <Box>
                <Typography variant="h5" fontWeight={950}>
                  Dashboard (Admin)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Caja activa, ventas en sesión, usuarios conectados y pendientes SII.
                </Typography>

                <Stack direction="row" spacing={1} mt={1.5} flexWrap="wrap" useFlexGap>
                  {cajaActiva ? (
                    <Chip
                      icon={<PointOfSaleIcon />}
                      label="Caja ABIERTA"
                      color="success"
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />
                  ) : (
                    <Chip label="Sin caja activa" color="warning" variant="outlined" />
                  )}

                  <Chip
                    icon={<GroupsIcon />}
                    label={`Online: ${kpis?.online ?? 0}`}
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />

                  <Chip
                    icon={<ReceiptLongIcon />}
                    label={`Pendientes: ${kpis?.pendientes ?? 0}`}
                    color={kpis?.pendientes ? "error" : "success"}
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                </Stack>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={() => fetchDashboard({ silent: false })}
                  disabled={refreshing}
                  sx={{ borderRadius: 1, fontWeight: 800 }}
                >
                  Actualizar
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Card>

        {!cajaActiva ? (
          <Alert icon={<InfoOutlinedIcon />} severity="info" sx={{ borderRadius: 2 }}>
            No hay una caja abierta. Cuando se abra una sesión, aquí verás el resumen en tiempo real.
          </Alert>
        ) : (
          <>
            {/* PENDIENTES */}
            <Card sx={{ borderRadius: 2, boxShadow: "0 10px 30px rgba(0,0,0,0.06)" }}>
              <CardHeader
                title={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ReceiptLongIcon />
                    <Typography fontWeight={950}>Pendientes de boletear (solo EFECTIVO):</Typography>
                    <Badge color="error" badgeContent={pendientes?.count || 0} sx={{ ml: 1 }} />
                  </Stack>
                }
                action={
                  <Chip
                    label={`Pend. Afecto (efec): ${formatCLP(
                      pendientesTotales.totalPendAfectoEfectivo
                    )} | Pend. Exento (efec): ${formatCLP(pendientesTotales.totalPendExentoEfectivo)}`}
                    color={pendientes?.count ? "error" : "success"}
                    variant="outlined"
                    sx={{ fontWeight: 800 }}
                  />
                }
              />

              <CardContent>
                {pendientes?.count ? (
                  <Stack spacing={1}>
                    {pendientes.ventas.slice(0, 8).map((v) => {
                      const faltaAfecta =
                        safeNum(v.afecto_efectivo) > 0 && Number(v.tiene_boleta_afecta) === 0;
                      const faltaExenta =
                        safeNum(v.exento_efectivo) > 0 && Number(v.tiene_boleta_exenta) === 0;

                      return (
                        <Card key={v.id} variant="outlined" sx={{ borderRadius: 2 }}>
                          <CardContent sx={{ py: 1.25 }}>
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              justifyContent="space-between"
                              alignItems={{ xs: "flex-start", sm: "center" }}
                              spacing={1}
                            >
                              <Box>
                                <Typography variant="body2" fontWeight={900}>
                                  Venta #{v.id} — {v.nombre_usuario}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(v.fecha).toLocaleString()}
                                </Typography>

                                <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" useFlexGap>
                                  {faltaAfecta ? (
                                    <Chip size="small" color="warning" label="AFECTA pendiente" />
                                  ) : safeNum(v.afecto_efectivo) > 0 ? (
                                    <Chip size="small" color="success" label="AFECTA ok" />
                                  ) : (
                                    <Chip size="small" variant="outlined" label="AFECTA 0" />
                                  )}

                                  {faltaExenta ? (
                                    <Chip size="small" color="warning" label="EXENTA pendiente" />
                                  ) : safeNum(v.exento_efectivo) > 0 ? (
                                    <Chip size="small" color="success" label="EXENTA ok" />
                                  ) : (
                                    <Chip size="small" variant="outlined" label="EXENTA 0" />
                                  )}
                                </Stack>
                              </Box>

                              <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1.5}
                                alignItems={{ xs: "flex-start", sm: "center" }}
                              >
                                <Typography variant="body2" color="text.secondary">
                                  Afecto efectivo: <strong>{formatCLP(v.afecto_efectivo)}</strong>
                                  {"  "}| Exento efectivo: <strong>{formatCLP(v.exento_efectivo)}</strong>
                                </Typography>

                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => verDetalleSafe(v?.id)}
                                    sx={{ borderRadius: 2, fontWeight: 900 }}
                                  >
                                    Ver detalle
                                  </Button>

                                  {faltaAfecta ? (
                                    <Button
                                      size="small"
                                      variant="contained"
                                      color="warning"
                                      onClick={() => abrirBoletear(v.id, "AFECTA")}
                                      sx={{ borderRadius: 2, fontWeight: 900 }}
                                    >
                                      Boletear AFECTA
                                    </Button>
                                  ) : null}

                                  {faltaExenta ? (
                                    <Button
                                      size="small"
                                      variant="contained"
                                      color="warning"
                                      onClick={() => abrirBoletear(v.id, "EXENTA")}
                                      sx={{ borderRadius: 2, fontWeight: 900 }}
                                    >
                                      Boletear EXENTA
                                    </Button>
                                  ) : null}
                                </Stack>
                              </Stack>
                            </Stack>
                          </CardContent>
                        </Card>
                      );
                    })}

                    {pendientes.ventas.length > 8 ? (
                      <Typography variant="caption" color="text.secondary">
                        Mostrando 8 de {pendientes.ventas.length}.
                      </Typography>
                    ) : null}
                  </Stack>
                ) : (
                  <Alert severity="success" icon={<CheckCircleIcon />} sx={{ borderRadius: 2 }}>
                    No hay pendientes de boletear 👌
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* KPIs */}
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <KpiCard
                title="Total ventas (sesión)"
                value={`${kpis?.totalVentas ?? 0}`}
                subtitle={`Total: ${formatCLP(kpis?.totalGeneral ?? 0)}`}
                icon={<PointOfSaleIcon />}
                tone="primary"
              />

              <KpiCard
                title="Efectivo + giro"
                value={formatCLP(kpis?.efectivo ?? 0)}
                subtitle={`Tickets: ${mp?.tickets?.efectivo ?? 0}`}
                icon={<PaymentsIcon />}
                tone="success"
              />

              <KpiCard
                title="Tarjetas (débito+crédito+transf.)"
                value={formatCLP(kpis?.tarjetas ?? 0)}
                subtitle={`Débito: ${formatCLP(mp?.debito ?? 0)} · Crédito: ${formatCLP(
                  mp?.credito ?? 0
                )} · Transf: ${formatCLP(mp?.transferencia ?? 0)}`}
                icon={<CreditCardIcon />}
                tone="info"
              />

              <KpiCard
                title="Afecto / Exento"
                value={`${formatCLP(kpis?.afecto ?? 0)} / ${formatCLP(kpis?.exento ?? 0)}`}
                subtitle="(Afecto se declara distinto a Exento en SII)"
                icon={<AccountBalanceIcon />}
                tone="warning"
              />
            </Stack>

            {/* USUARIOS ONLINE */}
            <Card sx={{ borderRadius: 2, boxShadow: "0 10px 30px rgba(0,0,0,0.06)" }}>
              <CardHeader
                title={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <GroupsIcon />
                    <Typography fontWeight={950}>Usuarios conectados</Typography>
                    <Chip size="small" label={data?.usuariosOnline?.length || 0} variant="outlined" />
                  </Stack>
                }
                subheader="Ventas dentro de la caja activa."
              />
              <CardContent>
                {data?.usuariosOnline?.length ? (
                  <Stack spacing={1.25}>
                    {data.usuariosOnline.map((u) => (
                      <Card key={u.id} variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", sm: "center" }}
                            spacing={1}
                          >
                            <Box>
                              <Typography fontWeight={950}>{u.nombre_usuario}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                Ventas: <strong>{u.ventasCount}</strong>
                              </Typography>
                            </Box>

                            <Stack spacing={0.25} alignItems={{ xs: "flex-start", sm: "flex-end" }}>
                              <Typography variant="body2">
                                Total: <strong>{formatCLP(u.totalGeneral)}</strong>
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Efectivo: {formatCLP(u.efectivo)} | Tarjetas: {formatCLP(u.noEfectivo)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Afecto: {formatCLP(u.totalAfecto)} | Exento: {formatCLP(u.totalExento)}
                              </Typography>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No hay usuarios en línea ahora mismo.
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* VENTAS */}
            <Card sx={{ borderRadius: 2, boxShadow: "0 10px 30px rgba(0,0,0,0.06)" }}>
              <CardHeader
                title={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography fontWeight={950}>Ventas de la sesión</Typography>
                    <Chip size="small" label={mode === "last" ? "Última" : "Todas"} variant="outlined" />
                  </Stack>
                }
                action={
                  <Tabs
                    value={mode}
                    onChange={(_, v) => setMode(v)}
                    textColor="inherit"
                    indicatorColor="primary"
                  >
                    <Tab value="all" label="Ver todas" />
                    <Tab value="last" label="Ver última" />
                  </Tabs>
                }
              />
              <CardContent>
                {mode === "last" ? (
                  data?.ultimaVenta ? (
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Stack spacing={0.75}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            flexWrap="wrap"
                            useFlexGap
                            spacing={1}
                          >
                            <Typography fontWeight={950}>
                              Venta #{data.ultimaVenta.id} — {data.ultimaVenta.nombre_usuario}
                              {data.ultimaVenta.tipo_venta === "INTERNA" ? (
                                <Chip size="small" label="INTERNA" sx={{ ml: 1 }} />
                              ) : null}
                            </Typography>

                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => verDetalleSafe(data?.ultimaVenta?.id)}
                              sx={{ borderRadius: 2, fontWeight: 900 }}
                            >
                              Ver detalle
                            </Button>
                          </Stack>

                          <Typography variant="body2" color="text.secondary">
                            {new Date(data.ultimaVenta.fecha).toLocaleString()}
                          </Typography>

                          <Divider />

                          <Typography variant="body2">
                            Total: <strong>{formatCLP(data.ultimaVenta.total_general)}</strong>
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Efectivo: {formatCLP(data.ultimaVenta.monto_efectivo_total)} | Tarjetas:{" "}
                            {formatCLP(data.ultimaVenta.monto_no_efectivo_total)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Afecto: {formatCLP(data.ultimaVenta.total_afecto)} | Exento:{" "}
                            {formatCLP(data.ultimaVenta.total_exento)}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Aún no hay ventas activas en esta sesión.
                    </Typography>
                  )
                ) : data?.ventas?.length ? (
                  <Stack spacing={1}>
                    {data.ventas.slice(0, 30).map((v) => (
                      <Card key={v.id} variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ py: 1.25 }}>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", sm: "center" }}
                            spacing={1}
                          >
                            <Box>
                              <Typography fontWeight={950}>
                                #{v.id} — {v.nombre_usuario}
                                {v.tipo_venta === "INTERNA" ? (
                                  <Chip size="small" label="INTERNA" sx={{ ml: 1 }} />
                                ) : null}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(v.fecha).toLocaleString()}
                              </Typography>
                            </Box>

                            <Stack spacing={0.5} alignItems={{ xs: "flex-start", sm: "flex-end" }}>
                              <Typography variant="body2">
                                Total: <strong>{formatCLP(v.total_general)}</strong>
                              </Typography>

                              <Typography variant="caption" color="text.secondary">
                                Efec: {formatCLP(v.monto_efectivo_total)} | Tarj:{" "}
                                {formatCLP(v.monto_no_efectivo_total)}
                              </Typography>

                              <Typography variant="caption" color="text.secondary">
                                Afecto: {formatCLP(v.total_afecto)} | Exento: {formatCLP(v.total_exento)}
                              </Typography>

                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => verDetalleSafe(v?.id)}
                                sx={{ borderRadius: 2, fontWeight: 900, mt: 0.5 }}
                              >
                                Ver detalle
                              </Button>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}

                    {data.ventas.length > 30 ? (
                      <Typography variant="caption" color="text.secondary">
                        Mostrando 30 de {data.ventas.length}.
                      </Typography>
                    ) : null}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No hay ventas activas en esta sesión.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </Stack>

      {/* MODAL BOLETEAR */}
      <Dialog open={openBoletear} onClose={cerrarBoletear} fullWidth maxWidth="sm">
        <DialogTitle>Registrar boleta SII</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={1.5} mt={1}>
            <Alert severity="info" icon={<InfoOutlinedIcon />}>
              {boletearTipo ? (
                <>
                  Ingresa el <strong>folio de boleta SII</strong> para marcar{" "}
                  <strong>{boletearTipo}</strong> en esta venta.
                </>
              ) : (
                <>Ingresa el folio de boleta SII para registrar boleteo.</>
              )}
            </Alert>

            <TextField
              label={`Folio boleta SII${boletearTipo ? ` (${boletearTipo})` : ""}`}
              value={folioInterno}
              onChange={(e) => setFolioInterno(e.target.value.replace(/\D/g, ""))}
              inputProps={{ inputMode: "numeric" }}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarBoletear}>Cancelar</Button>
          <Button variant="contained" onClick={confirmarBoleteo} disabled={boleteando}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL DETALLE */}
      <DetalleVentaModal open={openDetalle} onClose={cerrarDetalle} loading={loadingDetalle} detalle={detalleVenta} />
    </Box>
  );
}
