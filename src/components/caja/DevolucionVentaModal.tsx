// src/components/caja/DevolucionVentaModal.tsx
import { useState } from "react";
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
  Box,
} from "@mui/material";
import { api } from "../../api/api";

interface DevolucionVentaModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => Promise<void> | void;
}

interface VentaDetalleCabecera {
  id: number;
  fecha: string;
}

interface VentaDetalleItem {
  id_producto: number;
  nombre_producto: string;
  cantidad: number; // vendida
  precio_unitario: number;
  cantidad_devuelta?: number; // ya devuelta
  cantidad_disponible?: number; // vendida - devuelta
}

interface VentaDetalleResponse {
  cabecera: VentaDetalleCabecera;
  items: VentaDetalleItem[];
  devolucion?: {
    total_devuelto: number;
    completa: boolean;
  };
}

const formatCLP = (value: number | null | undefined) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

export default function DevolucionVentaModal({
  open,
  onClose,
  onSuccess,
}: DevolucionVentaModalProps) {
  const [ventaBusqueda, setVentaBusqueda] = useState("");
  const [ventaDetalle, setVentaDetalle] = useState<VentaDetalleResponse | null>(
    null
  );
  const [cantidadesDev, setCantidadesDev] = useState<Record<number, number>>(
    {}
  );
  const [metodoDev, setMetodoDev] = useState<
    "EFECTIVO" | "GIRO" | "DEBITO" | "CREDITO" | "TRANSFERENCIA"
  >("EFECTIVO");
  const [motivoDev, setMotivoDev] = useState("");
  const [errorDev, setErrorDev] = useState<string | null>(null);
  const [loadingDev, setLoadingDev] = useState(false);

  const resetState = () => {
    setVentaBusqueda("");
    setVentaDetalle(null);
    setCantidadesDev({});
    setMetodoDev("EFECTIVO");
    setMotivoDev("");
    setErrorDev(null);
    setLoadingDev(false);
  };

  const handleClose = () => {
    if (loadingDev) return;
    resetState();
    onClose();
  };

  const buscarVentaParaDevolucion = async () => {
    if (!ventaBusqueda.trim()) {
      setErrorDev("Debes ingresar un ID de venta.");
      return;
    }

    try {
      setErrorDev(null);
      setLoadingDev(true);

      const res = await api.get(`/ventas/${ventaBusqueda}/detalle`);
      const data = res.data as VentaDetalleResponse;

      // ✅ Bloquear si ya está completamente devuelta
      if (data?.devolucion?.completa) {
        setVentaDetalle(null);
        setCantidadesDev({});
        setErrorDev(
          "Esta venta ya tiene devolución completa. No se puede devolver nuevamente."
        );
        return;
      }

      setVentaDetalle(data);
      setCantidadesDev({});
    } catch (err: any) {
      console.error(err);
      setErrorDev(err?.response?.data?.error || "No se encontró la venta.");
      setVentaDetalle(null);
    } finally {
      setLoadingDev(false);
    }
  };

  const totalDevueltoPreview = () => {
    if (!ventaDetalle) return 0;

    return ventaDetalle.items.reduce((acc, item) => {
      const cant = cantidadesDev[item.id_producto] || 0;
      return acc + cant * item.precio_unitario;
    }, 0);
  };

  const handleDevolverTodoDisponible = () => {
    if (!ventaDetalle) return;

    const next: Record<number, number> = {};
    for (const it of ventaDetalle.items) {
      const disponible = it.cantidad_disponible ?? it.cantidad;
      if (disponible > 0) next[it.id_producto] = disponible;
    }
    setCantidadesDev(next);
  };

  const confirmarDevolucion = async () => {
    if (!ventaDetalle) return;

    const itemsADevolver = Object.entries(cantidadesDev)
      .filter(([_, cant]) => Number(cant) > 0)
      .map(([id_producto, cantidad]) => ({
        id_producto: Number(id_producto),
        cantidad: Number(cantidad),
      }));

    if (itemsADevolver.length === 0) {
      setErrorDev(
        "Debes seleccionar al menos un producto con cantidad mayor a 0."
      );
      return;
    }

    try {
      setLoadingDev(true);
      setErrorDev(null);

      await api.post(`/ventas/${ventaDetalle.cabecera.id}/devolucion`, {
        items: itemsADevolver,
        metodo_pago: metodoDev,
        motivo: motivoDev || null,
      });

      if (onSuccess) {
        await onSuccess();
      }

      handleClose();
      alert("Devolución registrada correctamente.");
    } catch (err: any) {
      console.error(err);
      setErrorDev(
        err?.response?.data?.error || "Error al registrar la devolución."
      );
    } finally {
      setLoadingDev(false);
    }
  };

  const hasDevPrev = (ventaDetalle?.devolucion?.total_devuelto ?? 0) > 0;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>Devolución de venta</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          {errorDev && <Alert severity="error">{errorDev}</Alert>}

          {/* BUSCAR VENTA */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems="center"
          >
            <TextField
              label="ID de venta"
              value={ventaBusqueda}
              onChange={(e) => setVentaBusqueda(e.target.value)}
              fullWidth
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  buscarVentaParaDevolucion();
                }
              }}
            />
            <Button
              variant="contained"
              onClick={buscarVentaParaDevolucion}
              disabled={loadingDev}
            >
              Buscar
            </Button>
          </Stack>

          {/* DETALLE */}
          {ventaDetalle && (
            <>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Venta N° {ventaDetalle.cabecera.id}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Fecha:{" "}
                  {new Date(ventaDetalle.cabecera.fecha).toLocaleString("es-CL")}
                </Typography>
              </Box>

              {hasDevPrev && (
                <Alert severity="info">
                  Esta venta ya tiene devoluciones previas por{" "}
                  {formatCLP(ventaDetalle.devolucion?.total_devuelto || 0)}. Revisa
                  “Devuelto” y “Disponible” antes de confirmar.
                </Alert>
              )}

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  variant="outlined"
                  onClick={handleDevolverTodoDisponible}
                  disabled={loadingDev}
                >
                  Devolver todo disponible
                </Button>

                <Box flex={1} />

                <Typography variant="subtitle1" fontWeight={700}>
                  Total devolución: {formatCLP(totalDevueltoPreview())}
                </Typography>
              </Stack>

              <Table size="small" sx={{ mt: 1 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right">Vendidos</TableCell>
                    <TableCell align="right">Devuelto</TableCell>
                    <TableCell align="right">Disponible</TableCell>
                    <TableCell align="right">Devolver</TableCell>
                    <TableCell align="right">Precio</TableCell>
                    <TableCell align="right">Subtotal dev.</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ventaDetalle.items.map((it) => {
                    const devuelto = it.cantidad_devuelta ?? 0;
                    const disponible = it.cantidad_disponible ?? it.cantidad;

                    const cant = cantidadesDev[it.id_producto] || 0;
                    const maxDev = disponible;
                    const disabled = maxDev <= 0;

                    const rowHasPrev = devuelto > 0;
                    const rowBg = rowHasPrev ? "rgba(255, 193, 7, 0.10)" : "inherit";

                    return (
                      <TableRow key={it.id_producto} hover sx={{ backgroundColor: rowBg }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
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

              {/* MÉTODO + MOTIVO */}
              <Stack spacing={2} mt={2}>
                <TextField
                  select
                  label="Método de devolución"
                  value={metodoDev}
                  onChange={(e) =>
                    setMetodoDev(
                      e.target.value as
                        | "EFECTIVO"
                        | "GIRO"
                        | "DEBITO"
                        | "CREDITO"
                        | "TRANSFERENCIA"
                    )
                  }
                  fullWidth
                >
                  <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                  <MenuItem value="GIRO">Giro / Caja vecina</MenuItem>
                  <MenuItem value="DEBITO">Débito</MenuItem>
                  <MenuItem value="CREDITO">Crédito</MenuItem>
                  <MenuItem value="TRANSFERENCIA">Transferencia</MenuItem>
                </TextField>

                <TextField
                  label="Motivo (opcional)"
                  value={motivoDev}
                  onChange={(e) => setMotivoDev(e.target.value)}
                  multiline
                  minRows={2}
                  fullWidth
                />
              </Stack>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loadingDev}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={confirmarDevolucion}
          disabled={loadingDev || !ventaDetalle}
          color="error"
        >
          {loadingDev ? "Procesando..." : "Confirmar devolución"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
