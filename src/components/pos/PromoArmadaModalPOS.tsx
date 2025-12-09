// src/components/pos/PromoArmadaModalPOS.tsx

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  Divider,
  Chip,
  CircularProgress,
} from "@mui/material";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";

import { api } from "../../api/api";

export interface PromoArmadaItem {
  id_producto: number;
  nombre_producto: string;
  codigo_producto: string;
  cantidad: number;
  es_gratis: boolean;
  es_variable: boolean;
  precio_venta: number;
  exento_iva: 0 | 1;
}

export interface PromoArmada {
  id: number;
  nombre: string;
  descripcion?: string | null;
  tipo_promocion: "FIJA" | "REGLA";
  precio_promocion: number;
  items: PromoArmadaItem[];
}

interface PromoArmadaModalPOSProps {
  open: boolean;
  onClose: () => void;
  onSelectPromo: (promo: PromoArmada) => void;
}

const formatCLP = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);

export const PromoArmadaModalPOS: React.FC<PromoArmadaModalPOSProps> = ({
  open,
  onClose,
  onSelectPromo,
}) => {
  const [loading, setLoading] = useState(false);
  const [promos, setPromos] = useState<PromoArmada[]>([]);
  const [error, setError] = useState<string | null>(null);

  const cargarPromos = async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await api.get("/promociones/pos/activas");
      const data = res.data;

      if (!data?.success) {
        throw new Error(data?.error || "No se pudieron cargar las promociones.");
      }

      setPromos(data.promociones || []);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.error ||
          "Ocurrió un error al cargar las promociones."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      cargarPromos();
    }
  }, [open]);

  const handleSelect = (promo: PromoArmada) => {
    onSelectPromo(promo);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          pb: 1,
        }}
      >
        <LocalOfferIcon fontSize="small" />
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Promociones armadas
          </Typography>
          <Typography variant="h6" fontWeight={700}>
            Selecciona un combo para agregar al carrito
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        {loading && (
          <Box
            sx={{
              py: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={32} />
          </Box>
        )}

        {error && !loading && (
          <Typography color="error" variant="body2" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {!loading && !error && promos.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No hay promociones armadas activas en este momento.
          </Typography>
        )}

        {!loading &&
          !error &&
          promos.map((promo) => (
            <Paper
              key={promo.id}
              variant="outlined"
              sx={{
                p: 2,
                mb: 2,
                borderRadius: 2,
                cursor: "pointer",
                "&:hover": {
                  boxShadow: 2,
                  borderColor: "primary.main",
                },
              }}
              onClick={() => handleSelect(promo)}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 1,
                }}
              >
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {promo.nombre}
                  </Typography>
                  {promo.descripcion && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      {promo.descripcion}
                    </Typography>
                  )}
                </Box>

                <Box textAlign="right">
                  <Chip
                    label="Combo armado"
                    size="small"
                    color="primary"
                    sx={{ mb: 0.5 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Precio promoción
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {formatCLP(promo.precio_promocion)}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 0.5, display: "block" }}
              >
                Productos incluidos:
              </Typography>

              {promo.items.map((it) => (
                <Box
                  key={`${promo.id}-${it.id_producto}-${it.codigo_producto}`}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.85rem",
                    mb: 0.3,
                  }}
                >
                  <Box>
                    <Typography variant="body2">
                      {it.cantidad} x {it.nombre_producto}
                      {it.es_gratis && (
                        <Chip
                          label="Gratis"
                          size="small"
                          color="success"
                          sx={{ ml: 0.5, height: 18, fontSize: "0.7rem" }}
                        />
                      )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {it.codigo_producto}
                    </Typography>
                  </Box>

                  {!it.es_gratis && (
                    <Typography variant="body2" color="text.secondary">
                      {formatCLP(it.precio_venta)}
                    </Typography>
                  )}
                </Box>
              ))}

              <Box textAlign="right" sx={{ mt: 1.5 }}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(promo);
                  }}
                >
                  Agregar combo
                </Button>
              </Box>
            </Paper>
          ))}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};
