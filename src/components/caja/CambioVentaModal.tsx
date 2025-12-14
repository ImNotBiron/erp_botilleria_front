// src/components/caja/CambioVentaModal.tsx
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  Button,
  Alert,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  MenuItem,
  Divider,
  Box,
  Chip,
} from "@mui/material";

import { api } from "../../api/api";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => Promise<void> | void;
}

type MetodoPago =
  | "EFECTIVO"
  | "GIRO"
  | "DEBITO"
  | "CREDITO"
  | "TRANSFERENCIA";

interface VentaDetalleItem {
  id_producto: number;
  nombre_producto: string;
  cantidad: number; // vendida
  precio_unitario: number;
  cantidad_devuelta?: number;
  cantidad_disponible?: number;
}

interface VentaDetalleResponse {
  cabecera: { id: number; fecha: string };
  items: VentaDetalleItem[];
  devolucion?: { total_devuelto: number; completa: boolean };
}

type EntregadoItem = {
  id_producto: number;
  codigo_producto?: string;
  nombre_producto: string;
  precio_unitario: number; // estimado (backend recalcula)
  cantidad: number;
  exento_iva?: 0 | 1;
};

const formatCLP = (value: number | null | undefined) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

export default function CambioVentaModal({ open, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar venta
  const [ventaId, setVentaId] = useState("");
  const [ventaDetalle, setVentaDetalle] = useState<VentaDetalleResponse | null>(
    null
  );

  // Devolver (de la venta)
  const [cantidadesDev, setCantidadesDev] = useState<Record<number, number>>(
    {}
  );

  // Entregar (scanner admin)
  const [codigoEntregar, setCodigoEntregar] = useState("");
  const [cantEntregar, setCantEntregar] = useState("1");
  const [entregados, setEntregados] = useState<EntregadoItem[]>([]);

  // Pago diferencia + motivo
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("EFECTIVO");
  const [motivo, setMotivo] = useState("");

  const resetAll = () => {
    setLoading(false);
    setError(null);
    setVentaId("");
    setVentaDetalle(null);
    setCantidadesDev({});
    setCodigoEntregar("");
    setCantEntregar("1");
    setEntregados([]);
    setMetodoPago("EFECTIVO");
    setMotivo("");
  };

  const handleClose = () => {
    if (loading) return;
    resetAll();
    onClose();
  };

  const buscarVenta = async () => {
    if (!ventaId.trim()) {
      setError("Ingresa un ID de venta.");
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const res = await api.get(`/ventas/${ventaId}/detalle`);
      const data = res.data as VentaDetalleResponse;

      // Si está devolución completa, igual se puede CAMBIAR? (depende regla)
      // Por defecto: NO permitir porque ya no hay disponible para devolver.
      const sinDisponible =
        data.items?.length > 0 &&
        data.items.every((x) => (x.cantidad_disponible ?? x.cantidad) === 0);

      if (sinDisponible) {
        setVentaDetalle(null);
        setCantidadesDev({});
        setError(
          "Esta venta ya no tiene productos disponibles para devolver (devolución completa)."
        );
        return;
      }

      setVentaDetalle(data);
      setCantidadesDev({});
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || "No se encontró la venta.");
      setVentaDetalle(null);
    } finally {
      setLoading(false);
    }
  };

  // ===== Totales =====
  const totalDevuelto = useMemo(() => {
    if (!ventaDetalle) return 0;
    return ventaDetalle.items.reduce((acc, it) => {
      const cant = cantidadesDev[it.id_producto] || 0;
      return acc + cant * it.precio_unitario;
    }, 0);
  }, [ventaDetalle, cantidadesDev]);

  const totalNuevoEstimado = useMemo(() => {
    return entregados.reduce(
      (acc, it) => acc + it.precio_unitario * it.cantidad,
      0
    );
  }, [entregados]);

  const diferencia = totalNuevoEstimado - totalDevuelto;

  const puedeConfirmar =
    !!ventaDetalle &&
    totalDevuelto > 0 &&
    entregados.length > 0 &&
    totalNuevoEstimado >= totalDevuelto &&
    (diferencia === 0 || (diferencia > 0 && !!metodoPago));

  // ===== Entregar: agregar por código (admin) =====
  const agregarEntregadoPorCodigo = async () => {
    const codigo = codigoEntregar.trim();
    const cantidad = Number(cantEntregar) || 1;

    if (!codigo) return;
    if (cantidad <= 0) {
      setError("La cantidad a entregar debe ser mayor a 0.");
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const res = await api.get(`/productos/admin/codigo/${codigo}`);
      const prod = res.data?.producto;

      if (!prod) {
        setError("Producto no encontrado.");
        return;
      }

      setEntregados((prev) => {
        const idx = prev.findIndex((p) => p.id_producto === prod.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], cantidad: copy[idx].cantidad + cantidad };
          return copy;
        }

        return [
          ...prev,
          {
            id_producto: prod.id,
            codigo_producto: prod.codigo_producto,
            nombre_producto: prod.nombre_producto ?? prod.nombre,
            precio_unitario: Number(prod.precio_venta) || 0, // estimado
            cantidad,
            exento_iva: prod.exento_iva,
          },
        ];
      });

      setCodigoEntregar("");
      setCantEntregar("1");
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || "Error buscando el producto.");
    } finally {
      setLoading(false);
    }
  };

  const quitarEntregado = (id_producto: number) => {
    setEntregados((prev) => prev.filter((x) => x.id_producto !== id_producto));
  };

  const actualizarCantEntregado = (id_producto: number, cant: number) => {
    setEntregados((prev) =>
      prev.map((x) =>
        x.id_producto === id_producto
          ? { ...x, cantidad: Math.max(1, cant) }
          : x
      )
    );
  };

  const devolverTodoDisponible = () => {
    if (!ventaDetalle) return;
    const next: Record<number, number> = {};
    for (const it of ventaDetalle.items) {
      const disponible = it.cantidad_disponible ?? it.cantidad;
      if (disponible > 0) next[it.id_producto] = disponible;
    }
    setCantidadesDev(next);
  };

  const confirmarCambio = async () => {
    if (!ventaDetalle) return;

    // Devueltos
    const devueltos = Object.entries(cantidadesDev)
      .filter(([_, c]) => Number(c) > 0)
      .map(([id_producto, cantidad]) => ({
        id_producto: Number(id_producto),
        cantidad: Number(cantidad),
      }));

    if (devueltos.length === 0) {
      setError("Debes seleccionar al menos 1 producto a devolver.");
      return;
    }

    if (entregados.length === 0) {
      setError("Debes agregar al menos 1 producto a entregar.");
      return;
    }

    if (totalNuevoEstimado < totalDevuelto) {
      setError(
        "El total de los productos a entregar debe ser igual o mayor al total devuelto."
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await api.post(`/ventas/${ventaDetalle.cabecera.id}/cambio`, {
        devueltos,
        entregados: entregados.map((x) => ({
          id_producto: x.id_producto,
          cantidad: x.cantidad,
        })),
        metodo_pago_diferencia: diferencia > 0 ? metodoPago : null,
        motivo: motivo || null,
      });

      if (onSuccess) await onSuccess();

      alert("Cambio registrado correctamente.");
      handleClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || "Error registrando el cambio.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
      <DialogTitle>Cambio (Devolución + Entrega)</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* Buscar venta */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="ID de venta"
              value={ventaId}
              onChange={(e) => setVentaId(e.target.value)}
              fullWidth
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  buscarVenta();
                }
              }}
            />
            <Button variant="contained" onClick={buscarVenta} disabled={loading}>
              Buscar
            </Button>
          </Stack>

          {!ventaDetalle ? (
            <Typography variant="body2" color="text.secondary">
              Busca una venta para comenzar el cambio.
            </Typography>
          ) : (
            <>
              <Box>
                <Typography fontWeight={700}>
                  Venta N° {ventaDetalle.cabecera.id}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Fecha:{" "}
                  {new Date(ventaDetalle.cabecera.fecha).toLocaleString("es-CL")}
                </Typography>
              </Box>

              <Divider />

              {/* ===== Sección DEVOLVER ===== */}
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight={700}>
                  1) Productos devueltos por el cliente
                </Typography>

                <Button
                  variant="outlined"
                  onClick={devolverTodoDisponible}
                  disabled={loading}
                >
                  Devolver todo disponible
                </Button>
              </Stack>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right">Vendidos</TableCell>
                    <TableCell align="right">Devuelto</TableCell>
                    <TableCell align="right">Disponible</TableCell>
                    <TableCell align="right">Devolver</TableCell>
                    <TableCell align="right">Precio venta</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {ventaDetalle.items.map((it) => {
                    const devuelto = it.cantidad_devuelta ?? 0;
                    const disponible = it.cantidad_disponible ?? it.cantidad;
                    const maxDev = disponible;
                    const disabled = maxDev <= 0;

                    const cant = cantidadesDev[it.id_producto] || 0;

                    return (
                      <TableRow key={it.id_producto} hover>
                        <TableCell>
                          <Typography fontWeight={600}>
                            {it.nombre_producto}
                          </Typography>
                          {disabled && (
                            <Typography variant="caption" color="text.secondary">
                              Sin disponible para devolver
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">{it.cantidad}</TableCell>
                        <TableCell align="right">{devuelto}</TableCell>
                        <TableCell align="right">{disponible}</TableCell>

                        <TableCell align="right">
                          <TextField
                            type="number"
                            disabled={disabled}
                            inputProps={{ min: 0, max: maxDev }}
                            value={cant}
                            sx={{ width: 90 }}
                            onChange={(e) => {
                              const raw = Number(e.target.value);
                              const limpio = isNaN(raw) ? 0 : raw;
                              const ajustado = Math.max(0, Math.min(limpio, maxDev));
                              setCantidadesDev((prev) => ({
                                ...prev,
                                [it.id_producto]: ajustado,
                              }));
                            }}
                          />
                        </TableCell>

                        <TableCell align="right">
                          {formatCLP(it.precio_unitario)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCLP(cant * it.precio_unitario)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <Stack direction="row" justifyContent="flex-end">
                <Chip
                  label={`Total devuelto: ${formatCLP(totalDevuelto)}`}
                  color={totalDevuelto > 0 ? "warning" : "default"}
                  variant="outlined"
                />
              </Stack>

              <Divider />

              {/* ===== Sección ENTREGAR ===== */}
              <Typography variant="subtitle1" fontWeight={700}>
                2) Productos entregados (escáner admin)
              </Typography>

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems="center"
              >
                <TextField
                  label="Código de barras / producto"
                  value={codigoEntregar}
                  onChange={(e) => setCodigoEntregar(e.target.value)}
                  fullWidth
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      agregarEntregadoPorCodigo();
                    }
                  }}
                />
                <TextField
                  label="Cantidad"
                  value={cantEntregar}
                  onChange={(e) => setCantEntregar(e.target.value)}
                  sx={{ width: 140 }}
                  inputProps={{ inputMode: "numeric" }}
                />
                <Button
                  variant="contained"
                  onClick={agregarEntregadoPorCodigo}
                  disabled={loading}
                >
                  Agregar
                </Button>
              </Stack>

              {entregados.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Aún no agregas productos a entregar.
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                      <TableCell align="right">Precio (estimado)</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {entregados.map((it) => (
                      <TableRow key={it.id_producto} hover>
                        <TableCell>
                          <Typography fontWeight={600}>{it.nombre_producto}</Typography>
                          {it.codigo_producto && (
                            <Typography variant="caption" color="text.secondary">
                              Código: {it.codigo_producto}
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell align="right">
                          <TextField
                            type="number"
                            value={it.cantidad}
                            sx={{ width: 90 }}
                            inputProps={{ min: 1 }}
                            onChange={(e) =>
                              actualizarCantEntregado(
                                it.id_producto,
                                Number(e.target.value || 1)
                              )
                            }
                          />
                        </TableCell>

                        <TableCell align="right">
                          {formatCLP(it.precio_unitario)}
                        </TableCell>

                        <TableCell align="right">
                          {formatCLP(it.precio_unitario * it.cantidad)}
                        </TableCell>

                        <TableCell align="right">
                          <Button
                            size="small"
                            color="error"
                            onClick={() => quitarEntregado(it.id_producto)}
                          >
                            Quitar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <Stack direction="row" justifyContent="flex-end">
                <Chip
                  label={`Total nuevo (estimado): ${formatCLP(totalNuevoEstimado)}`}
                  color={totalNuevoEstimado > 0 ? "info" : "default"}
                  variant="outlined"
                />
              </Stack>

              <Divider />

              {/* ===== Diferencia + Pago ===== */}
              <Typography variant="subtitle1" fontWeight={700}>
                3) Diferencia a pagar
              </Typography>

              <Stack spacing={1}>
                <Typography>
                  <strong>Diferencia (estimada):</strong>{" "}
                  {formatCLP(Math.max(0, diferencia))}
                </Typography>

                {totalNuevoEstimado < totalDevuelto && (
                  <Alert severity="warning">
                    El total nuevo debe ser <strong>igual o mayor</strong> al total
                    devuelto.
                  </Alert>
                )}

                {diferencia > 0 && (
                  <TextField
                    select
                    label="Método de pago para la diferencia"
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                    fullWidth
                  >
                    <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                    <MenuItem value="GIRO">Giro / Caja vecina</MenuItem>
                    <MenuItem value="DEBITO">Débito</MenuItem>
                    <MenuItem value="CREDITO">Crédito</MenuItem>
                    <MenuItem value="TRANSFERENCIA">Transferencia</MenuItem>
                  </TextField>
                )}

                <TextField
                  label="Motivo (opcional)"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  multiline
                  minRows={2}
                  fullWidth
                />

                <Alert severity="info">
                  Nota: los montos mostrados en este modal son <strong>estimados</strong>.
                  El backend recalcula totales con precios reales y validaciones.
                </Alert>
              </Stack>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={!puedeConfirmar || loading}
          onClick={confirmarCambio}
        >
          {loading ? "Guardando..." : "Confirmar cambio"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
