import {
  Box,
  Modal,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  Fade,
  Backdrop,
  FormControlLabel,
  Switch,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useState } from "react";

interface ProductoMayoristaData {
  precio_mayorista: number;
  cantidad_mayorista: number;
}

interface ProductoSimple {
  nombre_producto?: string;
  precio_mayorista?: number | null;
  cantidad_mayorista?: number | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: ProductoMayoristaData) => void;
  producto?: ProductoSimple;
}

const styleModalMayorista = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90vw",
  maxWidth: 480,
  maxHeight: "85vh",
  bgcolor: "background.paper",
  borderRadius: 3,
  boxShadow: 24,
  display: "flex",
  flexDirection: "column" as const,
  overflow: "hidden",
};

export default function ProductoMayoristaModal({
  open,
  onClose,
  onSave,
  producto,
}: Props) {
  const [precioMayorista, setPrecioMayorista] = useState<string>("");
  const [cantidadMayorista, setCantidadMayorista] = useState<string>("");
  const [habilitado, setHabilitado] = useState(false);

  const [precioError, setPrecioError] = useState(false);
  const [cantidadError, setCantidadError] = useState(false);

  useEffect(() => {
    const precio = producto?.precio_mayorista ?? 0;
    const cantidad = producto?.cantidad_mayorista ?? 0;

    setPrecioMayorista(precio ? precio.toString() : "");
    setCantidadMayorista(cantidad ? cantidad.toString() : "");
    setHabilitado(precio > 0 && cantidad > 0);

    setPrecioError(false);
    setCantidadError(false);
  }, [producto, open]);

  const handleSave = () => {
    // si está deshabilitado, seteamos a 0
    if (!habilitado) {
      onSave({
        precio_mayorista: 0,
        cantidad_mayorista: 0,
      });
      return;
    }

    const precioNumber = Number(precioMayorista);
    const cantidadNumber = Number(cantidadMayorista);

    const precioValido = precioNumber > 0;
    const cantidadValida = cantidadNumber > 0;

    setPrecioError(!precioValido);
    setCantidadError(!cantidadValida);

    if (!precioValido || !cantidadValida) return;

    onSave({
      precio_mayorista: precioNumber,
      cantidad_mayorista: cantidadNumber,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 500 } }}
    >
      <Fade in={open}>
        <Box sx={styleModalMayorista}>
          {/* HEADER */}
          <Box
            sx={{
              px: 3,
              py: 2,
              borderBottom: "1px solid",
              borderColor: "divider",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              Condiciones mayoristas
            </Typography>
            <IconButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* BODY */}
          <Box sx={{ px: 3, py: 2, overflowY: "auto" }}>
            {producto?.nombre_producto && (
              <Typography variant="body2" sx={{ mb: 1.5 }} color="text.secondary">
                Producto:&nbsp;
                <strong>{producto.nombre_producto}</strong>
              </Typography>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={habilitado}
                  onChange={(e) => setHabilitado(e.target.checked)}
                />
              }
              label="Habilitar venta mayorista"
              sx={{ mb: 2 }}
            />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                columnGap: 2,
                rowGap: 2,
              }}
            >
              <TextField
                label="Precio mayorista"
                fullWidth
                disabled={!habilitado}
                value={precioMayorista}
                onChange={(e) => {
                  setPrecioMayorista(e.target.value);
                  setPrecioError(false);
                }}
                error={precioError}
                helperText={
                  precioError ? "Debe ser un valor mayor a 0" : ""
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Cantidad mínima (unidades)"
                fullWidth
                disabled={!habilitado}
                value={cantidadMayorista}
                onChange={(e) => {
                  setCantidadMayorista(e.target.value);
                  setCantidadError(false);
                }}
                error={cantidadError}
                helperText={
                  cantidadError ? "Debe ser una cantidad mayor a 0" : ""
                }
              />
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
              * Si deshabilitas la venta mayorista, el producto se venderá solo a precio normal en el punto de venta.
            </Typography>
          </Box>

          {/* FOOTER */}
          <Box
            sx={{
              p: 2,
              borderTop: "1px solid",
              borderColor: "divider",
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
            }}
          >
            <Button onClick={onClose} color="inherit">
              Cancelar
            </Button>
            <Button variant="contained" onClick={handleSave}>
              Guardar
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}
