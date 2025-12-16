import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PaymentsIcon from "@mui/icons-material/Payments";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

type DetalleVenta = {
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
  pagos?: Array<{
    tipo_pago: string;
    monto: number;
  }>;
  boletas?: Array<{
    tipo: "AFECTA" | "EXENTA";
    folio_sii: number;
    fecha: string;
  }>;
};

const formatCLP = (value: number | null | undefined) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

// Helpers: sumar pagos si el backend no trae monto_efectivo_total / monto_no_efectivo_total
const normTipo = (t: any) => String(t || "").trim().toUpperCase();
const isEfectivoTipo = (t: string) => {
  const x = normTipo(t);
  return x === "EFECTIVO" || x === "EFECTIVO_GIRO" || x === "GIRO";
};
const sumPagos = (pagos?: Array<{ tipo_pago: string; monto: number }>) => {
  let efectivo = 0;
  let noEfectivo = 0;

  for (const p of pagos || []) {
    const tipo = normTipo(p?.tipo_pago);
    const monto = Number(p?.monto) || 0;
    if (!monto) continue;

    if (isEfectivoTipo(tipo)) efectivo += monto;
    else noEfectivo += monto;
  }

  return { efectivo, noEfectivo };
};

// Componente auxiliar para mostrar datos clave con diseño limpio
const StatBox = ({
  label,
  value,
  active = false,
}: {
  label: string;
  value: string;
  active?: boolean;
}) => (
  <Box
    sx={{
      flex: 1,
      p: 1.5,
      borderRadius: 2,
      bgcolor: active ? "primary.50" : "grey.50",
      border: "1px solid",
      borderColor: active ? "primary.100" : "grey.200",
      minWidth: "120px",
    }}
  >
    <Typography
      variant="caption"
      color="text.secondary"
      fontWeight={600}
      display="block"
      mb={0.5}
    >
      {label}
    </Typography>
    <Typography
      variant="h6"
      fontWeight={700}
      color={active ? "primary.main" : "text.primary"}
    >
      {value}
    </Typography>
  </Box>
);

export function DetalleVentaModal(props: {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  detalle: DetalleVenta | null;
}) {
  const { open, onClose, loading, detalle } = props;
  const theme = useTheme();

  const pagosSuma = sumPagos(detalle?.pagos);

  const efectivoMostrar =
    Number(detalle?.venta?.monto_efectivo_total) > 0
      ? Number(detalle?.venta?.monto_efectivo_total)
      : pagosSuma.efectivo;

  const noEfectivoMostrar =
    Number(detalle?.venta?.monto_no_efectivo_total) > 0
      ? Number(detalle?.venta?.monto_no_efectivo_total)
      : pagosSuma.noEfectivo;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: { borderRadius: 3, boxShadow: theme.shadows[10] },
      }}
    >
      {/* Header Minimalista */}
      <DialogTitle sx={{ p: 3, pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32 }}>
                <ReceiptLongIcon fontSize="small" />
              </Avatar>
              <Typography variant="h6" fontWeight={800}>
                Detalle de Venta #{detalle?.venta?.id ?? "—"}
              </Typography>
              {detalle?.venta?.tipo_venta === "INTERNA" && (
                <Chip
                  label="INTERNA"
                  size="small"
                  color="secondary"
                  variant="filled"
                  sx={{ fontWeight: 700 }}
                />
              )}
            </Stack>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ bgcolor: "grey.100" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <LinearProgress sx={{ borderRadius: 1 }} />
        ) : !detalle ? (
          <Box sx={{ p: 4, textAlign: "center", bgcolor: "grey.50", borderRadius: 2 }}>
            <Typography color="text.secondary">Sin información disponible.</Typography>
          </Box>
        ) : (
          <Stack spacing={4}>
            {/* Sección 1: Datos Generales y Totales */}
            <Stack spacing={2}>
              {/* Info de contexto */}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={3}
                alignItems="center"
                sx={{ px: 1 }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <PersonIcon fontSize="small" color="action" />
                  <Typography variant="body2" fontWeight={500}>
                    {detalle.venta.nombre_usuario || "Usuario desconocido"}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CalendarTodayIcon fontSize="small" color="action" />
                  <Typography variant="body2" fontWeight={500}>
                    {new Date(detalle.venta.fecha).toLocaleString()}
                  </Typography>
                </Stack>
              </Stack>

              {/* Estadísticas Visuales */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ width: "100%" }}>
                <StatBox label="Total General" value={formatCLP(detalle.venta.total_general)} active />
                <StatBox label="Total Afecto" value={formatCLP(detalle.venta.total_afecto)} />
                <StatBox label="Total Exento" value={formatCLP(detalle.venta.total_exento)} />
              </Stack>

              {/* Desglose de pagos compacto */}
              <Box sx={{ bgcolor: "grey.50", p: 1.5, borderRadius: 2 }}>
                <Stack
                  direction="row"
                  justifyContent="space-around"
                  divider={<Divider orientation="vertical" flexItem />}
                >
                  <Box textAlign="center">
                    <Typography variant="caption" color="text.secondary">
                      Efectivo
                    </Typography>
                    <Typography fontWeight={700} color="success.main">
                      {formatCLP(efectivoMostrar)}
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="caption" color="text.secondary">
                      Tarjetas / Otros
                    </Typography>
                    <Typography fontWeight={700} color="info.main">
                      {formatCLP(noEfectivoMostrar)}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              {/* Aviso si no hay pagos */}
              {!detalle.pagos?.length ? (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                  Esta venta no trae pagos en el detalle (no se puede calcular efectivo/tarjetas).
                </Alert>
              ) : null}
            </Stack>

            <Divider />

            {/* Sección 2: Lista de Productos */}
            <Box>
              <Typography
                variant="overline"
                color="text.secondary"
                fontWeight={700}
                sx={{ letterSpacing: 1, mb: 1, display: "block" }}
              >
                PRODUCTOS VENDIDOS
              </Typography>

              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "grey.200",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                {detalle.items?.length ? (
                  <Stack divider={<Divider />}>
                    {detalle.items.map((it, idx) => (
                      <Stack
                        key={idx}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{
                          p: 2,
                          bgcolor: "background.paper",
                          "&:hover": { bgcolor: "grey.50" },
                        }}
                      >
                        <Box>
                          <Typography fontWeight={600} variant="body1">
                            {it.nombre_producto}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                            <Chip
                              label={it.exento_iva ? "EXENTO" : "AFECTO"}
                              size="small"
                              color={it.exento_iva ? "warning" : "default"}
                              variant={it.exento_iva ? "filled" : "outlined"}
                              sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {it.cantidad} unidad(es) x {formatCLP(it.precio_unitario)}
                            </Typography>
                          </Stack>
                        </Box>
                        <Typography fontWeight={700} variant="body1">
                          {formatCLP(it.precio_final)}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Box p={3} textAlign="center">
                    <Typography color="text.secondary">Sin items.</Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Sección 3: Pagos y Boletas */}
            <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
              {/* Pagos */}
              <Box flex={1}>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <PaymentsIcon fontSize="small" color="action" />
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    fontWeight={700}
                    sx={{ letterSpacing: 1 }}
                  >
                    DETALLE PAGOS
                  </Typography>
                </Stack>

                <Stack spacing={1}>
                  {detalle.pagos?.length ? (
                    detalle.pagos.map((p, i) => (
                      <Stack
                        key={i}
                        direction="row"
                        justifyContent="space-between"
                        sx={{
                          p: 1.5,
                          bgcolor: "grey.50",
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "grey.100",
                        }}
                      >
                        <Typography variant="body2" fontWeight={600}>
                          {p.tipo_pago}
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {formatCLP(p.monto)}
                        </Typography>
                      </Stack>
                    ))
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Sin pagos registrados.
                    </Typography>
                  )}
                </Stack>
              </Box>

              {/* Boletas */}
              <Box flex={1}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  fontWeight={700}
                  sx={{ letterSpacing: 1, mb: 1, display: "block" }}
                >
                  DOCUMENTOS TRIBUTARIOS
                </Typography>
                {detalle.boletas?.length ? (
                  <Stack spacing={1}>
                    {detalle.boletas.map((b, i) => (
                      <Stack
                        key={i}
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{
                          p: 1.5,
                          border: "1px dashed",
                          borderColor: "grey.300",
                          borderRadius: 2,
                        }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight={700}>
                            Folio {b.folio_sii}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {new Date(b.fecha).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Chip
                          label={b.tipo}
                          size="small"
                          color={b.tipo === "AFECTA" ? "success" : "warning"}
                          sx={{ fontWeight: 700, height: 24 }}
                        />
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Alert
                    severity="info"
                    icon={<InfoOutlinedIcon fontSize="small" />}
                    sx={{ borderRadius: 2, py: 0 }}
                  >
                    No hay boletas.
                  </Alert>
                )}
              </Box>
            </Stack>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          variant="contained"
          disableElevation
          sx={{
            borderRadius: 2,
            px: 4,
            py: 1,
            bgcolor: "grey.900",
            fontWeight: 700,
            "&:hover": { bgcolor: "grey.800" },
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
