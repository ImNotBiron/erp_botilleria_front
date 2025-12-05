import { useState, useRef, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Stack,
  Divider,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteIcon from "@mui/icons-material/DeleteForever";

import { api } from "../../api/api";

import { PromoScannerModalPOS } from "../../components/pos/PromoScannerModalPos";
import type { PromoCartItem } from "../../components/pos/PromoScannerModalPos";

type MedioPago = "EFECTIVO" | "GIRO" | "DEBITO" | "CREDITO" | "TRANSFERENCIA";

type ItemCarrito = {
  id: string;
  id_producto: number;
  codigo: string;
  nombre: string;
  precio: number;
  cantidad: number;
  exento: boolean;
  esPromo?: boolean;
  promoId?: number;
};

type Pago = {
  id: string;
  tipo: MedioPago;
  monto: number;
};

interface ProductoApi {
  id: number;
  codigo_producto: string;
  nombre_producto: string;
  precio_venta: number;
  exento_iva: 0 | 1;
  capacidad_ml?: number | null;
  id_categoria?: number | null;
}

const formatCLP = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);

export default function PosVentaPage() {
  // Escáner
  const [codigo, setCodigo] = useState("");
  const codigoInputRef = useRef<HTMLInputElement | null>(null);

  // Carrito
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);

  // Pagos múltiples
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [nuevoTipoPago, setNuevoTipoPago] =
    useState<MedioPago>("EFECTIVO");
  const [nuevoMontoPago, setNuevoMontoPago] = useState<string>("");

  // Estados generales
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Promo / confirmación
  const [promoOpen, setPromoOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ====================
  // Totales
  // ====================

  const subtotalItem = (item: ItemCarrito): number =>
    item.precio * item.cantidad;

  const total = carrito.reduce((acc, item) => acc + subtotalItem(item), 0);
  const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);

  const totalPagos = pagos.reduce((acc, p) => acc + p.monto, 0);
  const saldo = total - totalPagos;

  const totalExento = carrito.reduce(
    (acc, item) => (item.exento ? acc + subtotalItem(item) : acc),
    0
  );
  const totalAfecto = total - totalExento;

  const vuelto = saldo < 0 ? Math.abs(saldo) : 0;
  const tieneEfectivoOGiro = pagos.some(
    (p) => p.tipo === "EFECTIVO" || p.tipo === "GIRO"
  );

  const puedeCobrar =
  carrito.length > 0 &&
  pagos.length > 0 &&
  // saldo <= 0  → cubre el total o se pasó (hay vuelto)
  saldo <= 0 &&
  // si hay vuelto (saldo < 0), DEBE existir efectivo o giro
  (saldo >= 0 || tieneEfectivoOGiro);

  // ====================
  // Focus pistola
  // ====================

  useEffect(() => {
    codigoInputRef.current?.focus();
  }, []);

  const refocusScanner = () => {
    setTimeout(() => {
      codigoInputRef.current?.focus();
    }, 50);
  };

  // ====================
  // API productos
  // ====================

  const buscarProductoPorCodigo = async (codigo: string): Promise<ProductoApi> => {
    const res = await api.get(`/productos/codigo/${codigo}`);
    return res.data as ProductoApi;
  };

  // ====================
  // Carrito
  // ====================

  const handleAgregarProductoPorCodigo = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cod = codigo.trim();
    if (!cod) {
      refocusScanner();
      return;
    }

    try {
      const prod = await buscarProductoPorCodigo(cod);

      setCarrito((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          id_producto: prod.id,
          codigo: prod.codigo_producto,
          nombre: prod.nombre_producto,
          precio: prod.precio_venta,
          cantidad: 1,
          exento: prod.exento_iva === 1,
        },
      ]);

      setCodigo("");
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.error ||
          "No se pudo encontrar el producto para ese código."
      );
    } finally {
      refocusScanner();
    }
  };

  const handleEliminarItem = (id: string) => {
    setCarrito((prev) => prev.filter((it) => it.id !== id));
    refocusScanner();
  };

  const cambiarCantidad = (id: string, delta: number) => {
    setCarrito((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nueva = item.cantidad + delta;
        return { ...item, cantidad: nueva <= 0 ? 1 : nueva };
      })
    );
    refocusScanner();
  };

  const handlePromoAddToCart = (promoItems: PromoCartItem[]) => {
    setCarrito((prev) => [
      ...prev,
      ...promoItems.map((p) => ({
        id: crypto.randomUUID(),
        id_producto: p.id,
        codigo: p.codigo_producto,
        nombre: p.nombre_producto,
        precio: p.precio_venta,
        cantidad: p.cantidad,
        exento: p.exento_iva === 1,
        esPromo: !!p.es_promo,
        promoId: p.promoId,
      })),
    ]);
    refocusScanner();
  };

  // ====================
  // Validación de pago actual (para input rojo y deshabilitar "+")
  // ====================

  const obtenerErrorPagoActual = (): string | null => {
    const monto = Number(nuevoMontoPago);
    if (!monto || monto <= 0) return null; // no molestamos si no hay monto

    const saldoPendiente = total - totalPagos;
    if (saldoPendiente <= 0) {
      return "No hay saldo pendiente por cobrar.";
    }

    if (nuevoTipoPago === "EFECTIVO" || nuevoTipoPago === "GIRO") {
      // efectivo/giro siempre OK, aunque genere vuelto
      return null;
    }

    // Medios NO efectivos (débito/crédito/transferencia)

    // 1) No puede pagar más que el saldo pendiente
    if (monto > saldoPendiente) {
      return "Con débito/crédito/transferencia no puedes ingresar un monto mayor al saldo pendiente ni generar vuelto.";
    }

    // 2) No puede superar el monto afecto
    const pagosNoEfectivoPrevios = pagos
      .filter((p) => p.tipo !== "EFECTIVO" && p.tipo !== "GIRO")
      .reduce((acc, p) => acc + p.monto, 0);

    const maxNoEfectivo = totalAfecto;
    const nuevoTotalNoEfectivo = pagosNoEfectivoPrevios + monto;

    if (nuevoTotalNoEfectivo > maxNoEfectivo) {
      const maxDisponible = Math.max(
        maxNoEfectivo - pagosNoEfectivoPrevios,
        0
      );

      if (maxDisponible > 0) {
        return `No puedes pagar todo con ${nuevoTipoPago} porque hay productos exentos. El máximo que puedes pagar con este medio es ${formatCLP(
          maxDisponible
        )}.`;
      }
      return "Ya no puedes pagar más con débito/crédito/transferencia: el resto debe ser EFECTIVO o GIRO porque hay productos exentos.";
    }

    return null;
  };

  const errorPagoActual = obtenerErrorPagoActual();
  const montoIngresadoValido =
    !!nuevoMontoPago && (!errorPagoActual || nuevoTipoPago === "EFECTIVO" || nuevoTipoPago === "GIRO");

  // ====================
  // Pagos múltiples
  // ====================

  const handleLlenarConTotal = () => {
    const saldoPendiente = total - totalPagos;
    if (saldoPendiente <= 0) {
      setNuevoMontoPago("");
      refocusScanner();
      return;
    }

    if (nuevoTipoPago === "EFECTIVO" || nuevoTipoPago === "GIRO") {
      setNuevoMontoPago(String(saldoPendiente));
      refocusScanner();
      return;
    }

    const pagosNoEfectivoPrevios = pagos
      .filter((p) => p.tipo !== "EFECTIVO" && p.tipo !== "GIRO")
      .reduce((acc, p) => acc + p.monto, 0);

    const maxNoEfectivo = totalAfecto;
    const maxExtraNoEfectivo = maxNoEfectivo - pagosNoEfectivoPrevios;
    const sugerido = Math.min(saldoPendiente, maxExtraNoEfectivo);

    if (sugerido > 0) {
      setNuevoMontoPago(String(sugerido));
    } else {
      setNuevoMontoPago("");
    }

    refocusScanner();
  };

  const handleAgregarPago = () => {
    setSuccess(null);
    const monto = Number(nuevoMontoPago);
    if (!monto || monto <= 0) {
      setError("Ingresa un monto válido para el pago.");
      return;
    }

    const msg = obtenerErrorPagoActual();
    if (msg) {
      setError(msg);
      return;
    }

    setPagos((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        tipo: nuevoTipoPago,
        monto,
      },
    ]);
    setNuevoMontoPago("");
    refocusScanner();
  };

  const handleEliminarPago = (id: string) => {
    setPagos((prev) => prev.filter((p) => p.id !== id));
    refocusScanner();
  };

  // ====================
  // Confirmación y Cobro
  // ====================

  const handleAbrirConfirmacion = () => {
    setError(null);
    setSuccess(null);

    if (!carrito.length) {
      setError("No hay productos en el carrito.");
      return;
    }

    if (!pagos.length) {
      setError("Debes agregar al menos un medio de pago.");
      return;
    }

   // Falta plata → no se puede avanzar
if (saldo > 0) {
  setError(
    "Los pagos no cubren el total de la venta. Revisa el saldo antes de cobrar."
  );
  return;
}

// Hay vuelto pero NO hay efectivo/giro → algo raro
if (saldo < 0 && !tieneEfectivoOGiro) {
  setError(
    "Hay vuelto, pero no hay pagos en EFECTIVO o GIRO. Revisa los medios de pago."
  );
  return;
}


    setConfirmOpen(true);
  };

  const handleGenerarVoucherPreview = () => {
    // Aquí podrías abrir un modal de voucher real, o una nueva ventana, etc.
    console.log("Generar voucher preliminar (simulado)", {
      carrito,
      pagos,
      total,
      totalAfecto,
      totalExento,
      vuelto,
    });
  };

  const handleConfirmarVenta = async () => {
  try {
    setError(null);
    setSuccess(null);
    setEnviando(true);

    const payloadItems = carrito.map((item) => ({
      id_producto: item.id_producto,
      cantidad: item.cantidad,
      es_promo: item.esPromo ? 1 : 0,
      promo_id: item.promoId ?? null,
    }));

    // 🔹 Clonamos los pagos para poder ajustarlos sin perder la info original
    const pagosAjustados: Pago[] = pagos.map((p) => ({ ...p }));

    // Exceso = cuánto se pasó el cliente (vuelto)
    let excesoPagos = totalPagos - total; // si es <= 0, no hay vuelto

    if (excesoPagos > 0) {
      // Restamos el exceso SOLO de pagos EFECTIVO / GIRO
      for (const p of pagosAjustados) {
        if (excesoPagos <= 0) break;
        if (p.tipo === "EFECTIVO" || p.tipo === "GIRO") {
          const reducible = Math.min(excesoPagos, p.monto);
          p.monto -= reducible;
          excesoPagos -= reducible;
        }
      }

      // Si por alguna razón sobró, lo registramos en consola para revisar
      if (excesoPagos > 0) {
        console.warn(
          "Quedó exceso de pagos después de ajustar el vuelto. Revisar lógica.",
          excesoPagos
        );
      }
    }

    // No enviamos pagos de monto 0 al backend
    const payloadPagos = pagosAjustados
      .filter((p) => p.monto > 0)
      .map((p) => ({
        tipo: p.tipo,
        monto: p.monto,
      }));

    const res = await api.post("/ventas/crear", {
      items: payloadItems,
      pagos: payloadPagos,
      tipo_venta: "NORMAL",
    });

    setSuccess(`Venta registrada. ID: ${res.data.id_venta}`);
    setCarrito([]);
    setPagos([]);
    setNuevoMontoPago("");
    setConfirmOpen(false);
    refocusScanner();
  } catch (err: any) {
    console.error(err);
    setError(
      err?.response?.data?.error || "Error al registrar la venta POS."
    );
    setConfirmOpen(false);
    refocusScanner();
  } finally {
    setEnviando(false);
  }
};


  // ====================
  // Render
  // ====================

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={2}>
        Punto de Venta
      </Typography>

      <Box
        display="flex"
        flexDirection={{ xs: "column", md: "row" }}
        gap={2}
      >
        {/* IZQUIERDA: Carrito */}
        <Box flex={{ xs: 1, md: 3 }}>
          <Paper
            sx={{
              p: 2,
              minHeight: "75vh",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {/* Escáner */}
            <Box component="form" onSubmit={handleAgregarProductoPorCodigo}>
              <Typography variant="subtitle2" color="text.secondary" mb={0.5}>
                Escáner / Código de barras
              </Typography>
              <Stack direction="row" spacing={1}>
                <TextField
                  autoFocus
                  inputRef={codigoInputRef}
                  placeholder="Escanea o escribe el código..."
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  fullWidth
                  size="small"
                />
                <Button
                  variant="contained"
                  type="submit"
                  startIcon={<SearchIcon />}
                >
                  Agregar
                </Button>
              </Stack>
            </Box>

            <Divider />

            {/* Carrito tabla */}
            <Box sx={{ flex: 1, overflow: "auto" }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right">Cant.</TableCell>
                    <TableCell align="right">Precio</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {carrito.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Box>
                          <Typography fontWeight={500}>
                            {item.nombre}
                            {item.esPromo && (
                              <Chip
                                label="Combo"
                                size="small"
                                color="secondary"
                                sx={{
                                  ml: 1,
                                  height: 18,
                                  fontSize: "0.7rem",
                                }}
                              />
                            )}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            component="div"
                          >
                            {item.codigo}
                            {item.exento && (
                              <Chip
                                label="Exento"
                                size="small"
                                sx={{
                                  ml: 1,
                                  height: 18,
                                  fontSize: "0.7rem",
                                }}
                              />
                            )}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={0.5}
                          justifyContent="flex-end"
                          alignItems="center"
                        >
                          <IconButton
                            size="small"
                            onClick={() => cambiarCantidad(item.id, -1)}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <Typography
                            variant="body2"
                            sx={{ minWidth: 24, textAlign: "center" }}
                          >
                            {item.cantidad}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => cambiarCantidad(item.id, 1)}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        {formatCLP(item.precio)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCLP(subtotalItem(item))}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleEliminarItem(item.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}

                  {!carrito.length && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          align="center"
                          sx={{ py: 3, fontStyle: "italic" }}
                        >
                          No hay productos en el carrito. Escanea un código o
                          usa la promo de combo licores.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Box>

        {/* DERECHA: resumen + pagos + promos */}
        <Box flex={{ xs: 1, md: 2 }}>
          <Paper
            sx={{
              p: 2,
              minHeight: "75vh",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" onClose={() => setSuccess(null)}>
                {success}
              </Alert>
            )}

            {/* Resumen */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Resumen
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ítems: {totalItems}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Afecto: <strong>{formatCLP(totalAfecto)}</strong> · Exento:{" "}
                <strong>{formatCLP(totalExento)}</strong>
              </Typography>
              <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>
                {formatCLP(total)}
              </Typography>
            </Box>

            <Divider />

            {/* Pagos */}
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                mb={0.5}
              >
                Pagos
              </Typography>

              <Stack direction="row" spacing={1} mb={1}>
                <TextField
                  select
                  size="small"
                  sx={{ minWidth: 130 }}
                  value={nuevoTipoPago}
                  onChange={(e) =>
                    setNuevoTipoPago(e.target.value as MedioPago)
                  }
                >
                  <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                  <MenuItem value="GIRO">Giro</MenuItem>
                  <MenuItem value="DEBITO">Débito</MenuItem>
                  <MenuItem value="CREDITO">Crédito</MenuItem>
                  <MenuItem value="TRANSFERENCIA">
                    Transferencia
                  </MenuItem>
                </TextField>

                <TextField
                  size="small"
                  type="number"
                  placeholder="Monto"
                  value={nuevoMontoPago}
                  onChange={(e) => setNuevoMontoPago(e.target.value)}
                  fullWidth
                  error={!!errorPagoActual && !!nuevoMontoPago}
                  helperText={
                    !!nuevoMontoPago && errorPagoActual
                      ? errorPagoActual
                      : ""
                  }
                />

                <Stack spacing={0.5}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleLlenarConTotal}
                  >
                    Total
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleAgregarPago}
                    disabled={!montoIngresadoValido}
                  >
                    +
                  </Button>
                </Stack>
              </Stack>

              {/* Advertencia contextual exentos + tarjeta */}
              {totalExento > 0 &&
                nuevoTipoPago !== "EFECTIVO" &&
                nuevoTipoPago !== "GIRO" && (
                  <Typography
                    variant="caption"
                    color="error"
                    display="block"
                    sx={{ mt: 0.5 }}
                  >
                    Hay productos exentos por {formatCLP(totalExento)}. Ese monto
                    solo puede pagarse con <strong>EFECTIVO o GIRO</strong>. Este
                    medio se aplicará solo al monto afecto.
                  </Typography>
                )}

              <Box sx={{ maxHeight: 150, overflow: "auto", mt: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Medio</TableCell>
                      <TableCell align="right">Monto</TableCell>
                      <TableCell align="center">Acción</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagos.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Chip
                            label={p.tipo}
                            size="small"
                            sx={{ fontSize: "0.7rem" }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {formatCLP(p.monto)}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleEliminarPago(p.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!pagos.length && (
                      <TableRow>
                        <TableCell colSpan={3}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Aún no hay pagos agregados.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>

              <Box mt={1} textAlign="right">
                <Typography variant="body2">
                  Total pagos:{" "}
                  <strong>{formatCLP(totalPagos)}</strong>
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color:
                      saldo === 0
                        ? "success.main"
                        : saldo > 0
                        ? "error.main"
                        : "warning.main",
                  }}
                >
                  Saldo: <strong>{formatCLP(saldo)}</strong>
                </Typography>

                {saldo > 0 && (
                  <Typography variant="caption" color="warning.main">
                    Falta por cobrar {formatCLP(saldo)} para completar el
                    total.
                  </Typography>
                )}
                {saldo === 0 && !!pagos.length && (
                  <Typography variant="caption" color="success.main">
                    Pagos correctos, puedes continuar a la confirmación.
                  </Typography>
                )}
                {saldo < 0 && (
                  <Typography variant="caption" color="warning.main">
                    Hay un vuelto pendiente de {formatCLP(vuelto)}.
                  </Typography>
                )}
              </Box>

              {/* Mensaje fijo sobre exentos */}
              {totalExento > 0 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  sx={{ mt: 1 }}
                >
                  Recuerda: los productos <strong>exentos</strong> solo pueden
                  pagarse con <strong>EFECTIVO o GIRO</strong>. Los pagos con
                  tarjeta o transferencia se aplican únicamente al monto
                  afecto.
                </Typography>
              )}
            </Box>

            {/* Bloque verde de vuelto (solo si hay efectivo/giro) */}
            {vuelto > 0 && tieneEfectivoOGiro && (
              <Box
                mt={2}
                p={2}
                borderRadius={2}
                sx={{
                  bgcolor: "success.main",
                  color: "white",
                  textAlign: "center",
                }}
              >
                <Typography variant="subtitle1" fontWeight={700}>
                  VUELTO AL CLIENTE
                </Typography>
                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{ mt: 0.5, letterSpacing: 1 }}
                >
                  {formatCLP(vuelto)}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Entregar en efectivo / giro.
                </Typography>
              </Box>
            )}

            <Divider sx={{ mt: 2 }} />

            {/* Promos */}
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                mb={0.5}
              >
                Promociones
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<LocalOfferIcon />}
                onClick={() => setPromoOpen(true)}
              >
                Combo licores (licor + bebida + hielo)
              </Button>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mt: 0.5 }}
              >
                El licor y la bebida se cobran normal. El hielo 1kg va de
                regalo.
              </Typography>
            </Box>

            <Box sx={{ flex: 1 }} />

            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              startIcon={<PointOfSaleIcon />}
              disabled={enviando || !puedeCobrar}
              onClick={handleAbrirConfirmacion}
              sx={{ borderRadius: 2, py: 1.2 }}
            >
              {enviando ? "Procesando..." : "Cobrar"}
            </Button>
          </Paper>
        </Box>
      </Box>

      {/* Modal scanner promos */}
      <PromoScannerModalPOS
        open={promoOpen}
        onClose={() => setPromoOpen(false)}
        onPromoAdd={handlePromoAddToCart}
        buscarProductoPorCodigo={buscarProductoPorCodigo}
      />

      {/* Modal de confirmación de venta */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Confirmar venta POS</DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle1" gutterBottom>
            Resumen de la venta
          </Typography>

          <Box mb={2}>
            <Typography variant="body2" color="text.secondary">
              Ítems: {totalItems}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Afecto: <strong>{formatCLP(totalAfecto)}</strong> · Exento:{" "}
              <strong>{formatCLP(totalExento)}</strong>
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>
              Total: {formatCLP(total)}
            </Typography>
          </Box>

          <Divider sx={{ my: 1 }} />

          <Typography variant="subtitle2" gutterBottom>
            Productos
          </Typography>
          <Box sx={{ maxHeight: 200, overflow: "auto", mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell align="right">Cant.</TableCell>
                  <TableCell align="right">Precio</TableCell>
                  <TableCell align="right">Subtotal</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {carrito.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Typography variant="body2">
                        {item.nombre}
                        {item.esPromo && (
                          <Chip
                            label="Combo"
                            size="small"
                            sx={{ ml: 1, fontSize: "0.7rem" }}
                          />
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{item.cantidad}</TableCell>
                    <TableCell align="right">
                      {formatCLP(item.precio)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCLP(subtotalItem(item))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          <Typography variant="subtitle2" gutterBottom>
            Medios de pago
          </Typography>
          <Box sx={{ maxHeight: 150, overflow: "auto", mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Medio</TableCell>
                  <TableCell align="right">Monto</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.tipo}</TableCell>
                    <TableCell align="right">
                      {formatCLP(p.monto)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          <Box>
            <Typography variant="body2">
              Total pagos: <strong>{formatCLP(totalPagos)}</strong>
            </Typography>
            {vuelto > 0 && tieneEfectivoOGiro && (
              <Typography variant="body2" color="success.main">
                Vuelto al cliente: <strong>{formatCLP(vuelto)}</strong>
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Seguir editando</Button>
          <Button onClick={handleGenerarVoucherPreview}>
            Generar voucher
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmarVenta}
            disabled={enviando}
          >
            Confirmar venta
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
