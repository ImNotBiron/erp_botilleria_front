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
} from "@mui/material";

import { api } from "../../api/api";

interface DevolucionVentaModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void; // se llama cuando la devolución se registra OK
}

interface VentaDetalleCabecera {
  id: number;
  fecha: string;
}

interface VentaDetalleItem {
  id_producto: number;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
}

interface VentaDetalleResponse {
  cabecera: VentaDetalleCabecera;
  items: VentaDetalleItem[];
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
  const [cantidadesDev, setCantidadesDev] = useState<
    Record<number, number>
  >({});
  const [metodoDev, setMetodoDev] = useState<
    "EFECTIVO" | "GIRO" | "DEBITO" | "CREDITO" | "TRANSFERENCIA"
  >("EFECTIVO");
  const [motivoDev, setMotivoDev] = useState("");
  const [errorDev, setErrorDev] = useState<string | null>(null);
  const [loadingDev, setLoadingDev] = useState(false);

  const handleClose = () => {
    if (loadingDev) return;
    // limpiar estados al cerrar
    setVentaBusqueda("");
    setVentaDetalle(null);
    setCantidadesDev({});
    setMetodoDev("EFECTIVO");
    setMotivoDev("");
    setErrorDev(null);
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

  const confirmarDevolucion = async () => {
    if (!ventaDetalle) return;

    const itemsADevolver = Object.entries(cantidadesDev)
      .filter(([_, cant]) => Number(cant) > 0)
      .map(([id_producto, cantidad]) => ({
        id_producto: Number(id_producto),
        cantidad: Number(cantidad),
      }));

    if (itemsADevolver.length === 0) {
      setErrorDev("Debes seleccionar al menos un producto con cantidad mayor a 0.");
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
            />
            <Button
              variant="contained"
              onClick={buscarVentaParaDevolucion}
              disabled={loadingDev}
            >
              Buscar
            </Button>
          </Stack>

          {/* DETALLE DE VENTA */}
          {ventaDetalle && (
            <>
              <Typography variant="subtitle1" fontWeight={600}>
                Venta N° {ventaDetalle.cabecera.id}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Fecha:{" "}
                {new Date(
                  ventaDetalle.cabecera.fecha
                ).toLocaleString("es-CL")}
              </Typography>

              <Table size="small" sx={{ mt: 2 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right">Vendidos</TableCell>
                    <TableCell align="right">Devolver</TableCell>
                    <TableCell align="right">Precio</TableCell>
                    <TableCell align="right">Subtotal dev.</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ventaDetalle.items.map((it) => {
                    const cant = cantidadesDev[it.id_producto] || 0;
                    return (
                      <TableRow key={it.id_producto}>
                        <TableCell>{it.nombre_producto}</TableCell>

                        <TableCell align="right">{it.cantidad}</TableCell>

                        <TableCell align="right">
                          <TextField
                            type="number"
                            inputProps={{ min: 0, max: it.cantidad }}
                            value={cant}
                            sx={{ width: 80 }}
                            onChange={(e) => {
                              const raw = Number(e.target.value);
                              const limpio = isNaN(raw) ? 0 : raw;
                              const ajustado = Math.max(
                                0,
                                Math.min(limpio, it.cantidad)
                              );
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

              {/* METODO + MOTIVO + TOTAL */}
              <Stack spacing={2} mt={2}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Total devolución: {formatCLP(totalDevueltoPreview())}
                </Typography>

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
