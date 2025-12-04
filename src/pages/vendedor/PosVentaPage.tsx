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
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteIcon from "@mui/icons-material/DeleteForever";

import { api } from "../../api/api"; // ← ajusta la ruta si es distinta

import { PromoScannerModalPOS } from "../../components/pos/PromoScannerModalPos";
import type { PromoCartItem } from "../../components/pos/PromoScannerModalPos";

type MedioPago = "EFECTIVO" | "DEBITO" | "CREDITO" | "TRANSFERENCIA";

type ItemCarrito = {
  id: string;          // id interno del carrito
  id_producto: number; // id real de la BD
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

// Lo que devuelve el backend al buscar un producto
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

  // Modal promo scanner
  const [promoOpen, setPromoOpen] = useState(false);

  // ====================
  // Totales
  // ====================

  const subtotalItem = (item: ItemCarrito): number =>
    item.precio * item.cantidad;

  const total = carrito.reduce((acc, item) => acc + subtotalItem(item), 0);
  const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);

  const totalPagos = pagos.reduce((acc, p) => acc + p.monto, 0);
  const saldo = total - totalPagos; // puede ser < 0 si se pasa

  const totalExento = carrito.reduce(
  (acc, item) => (item.exento ? acc + subtotalItem(item) : acc),
  0
);
const totalAfecto = total - totalExento;


  // ====================
  // Focus para la pistola
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
  // Buscar producto en el back
  // ====================

  const buscarProductoPorCodigo = async (codigo: string): Promise<ProductoApi> => {
    // Ajusta la ruta a tu API real de productos
    const res = await api.get(`/productos/codigo/${codigo}`);
    return res.data as ProductoApi;
  };

  // ====================
  // Manejo carrito
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

  // 🔹 Cuando el modal de promo devuelve los productos del combo
  const handlePromoAddToCart = (promoItems: PromoCartItem[]) => {
    setCarrito((prev) => [
      ...prev,
      ...promoItems.map((p) => ({
        id: crypto.randomUUID(),
        id_producto: p.id, // importante para el back
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
  // Pagos múltiples
  // ====================

  const handleAgregarPago = () => {
    setError(null);
    setSuccess(null);

    const monto = Number(nuevoMontoPago);
    if (!monto || monto <= 0) {
      setError("Ingresa un monto válido para el pago.");
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

  // ⚡ Botón "Llenar con total"
 const handleLlenarConTotal = () => {
  const saldoPendiente = total - totalPagos;
  if (saldoPendiente <= 0) {
    setNuevoMontoPago("");
    refocusScanner();
    return;
  }

  // Si es efectivo o giro, puede pagar todo
  if (nuevoTipoPago === "EFECTIVO" || nuevoTipoPago === "GIRO") {
    setNuevoMontoPago(String(saldoPendiente));
    refocusScanner();
    return;
  }

  // Medios NO efectivos (débito, crédito, transferencia, etc.)
  const pagosNoEfectivo = pagos
    .filter((p) => p.tipo !== "EFECTIVO" && p.tipo !== "GIRO")
    .reduce((acc, p) => acc + p.monto, 0);

  // Máximo que se puede pagar con tarjeta/transfer: solo lo afecto
  const maxNoEfectivo = totalAfecto;
  const maxExtraNoEfectivo = maxNoEfectivo - pagosNoEfectivo;

  const sugerido = Math.min(saldoPendiente, maxExtraNoEfectivo);

  if (sugerido > 0) {
    setNuevoMontoPago(String(sugerido));
  } else {
    setNuevoMontoPago("");
  }

  refocusScanner();
};


  // ====================
  // Cobrar (ahora contra el back)
  // ====================

  const handleCobrar = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!carrito.length) {
        setError("No hay productos en el carrito.");
        refocusScanner();
        return;
      }

      if (!pagos.length) {
        setError("Debes agregar al menos un medio de pago.");
        refocusScanner();
        return;
      }

      // La validación fina (pagos = total, exentos, etc)
      // la hace el back con validarPagos / validarProductos
      setEnviando(true);

      const payloadItems = carrito.map((item) => ({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        es_promo: item.esPromo ? 1 : 0,
        promo_id: item.promoId ?? null,
      }));

      const payloadPagos = pagos.map((p) => ({
        tipo: p.tipo,
        monto: p.monto,
      }));

      const res = await api.post("/ventas/crear", {
        items: payloadItems,
        pagos: payloadPagos,
        tipo_venta: "NORMAL",
      });

      console.log("Respuesta venta:", res.data);

      setSuccess(`Venta registrada. ID: ${res.data.id_venta}`);
      setCarrito([]);
      setPagos([]);
      setNuevoMontoPago("");
      refocusScanner();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.error ||
          "Error al registrar la venta POS."
      );
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
        {/* IZQUIERDA: Carrito grande */}
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

            {/* Tabla carrito */}
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
                                  fontWeight: "bold",
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

        {/* DERECHA: resumen + pagos + promo */}
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

            {/* Pagos múltiples */}
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
                    disabled={!nuevoMontoPago}
                  >
                    +
                  </Button>
                </Stack>
              </Stack>

              <Box sx={{ maxHeight: 150, overflow: "auto" }}>
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
              </Box>
            </Box>

            <Divider />

            {/* Promo combo licores */}
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
              disabled={enviando || !carrito.length}
              onClick={handleCobrar}
              sx={{ borderRadius: 2, py: 1.2 }}
            >
              {enviando ? "Procesando..." : "Cobrar"}
            </Button>
          </Paper>
        </Box>
      </Box>

      {/* Modal scanner de promo */}
      <PromoScannerModalPOS
        open={promoOpen}
        onClose={() => setPromoOpen(false)}
        onPromoAdd={handlePromoAddToCart}
        buscarProductoPorCodigo={buscarProductoPorCodigo}
      />
    </Box>
  );
}
