// src/components/promociones/ComboModal.tsx
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useEffect, useState, type ChangeEvent } from "react";

export interface ProductoOpcion {
  id: number;
  nombre: string;
}

export interface ComboItemRow {
  productoId: number | null;
  cantidad: string;
}

export interface ComboFormValues {
  nombre: string;
  descripcion: string;
  precio: string;
  activa: boolean;
  items: ComboItemRow[];
}

interface ComboModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (values: ComboFormValues) => void;
  productos: ProductoOpcion[];
  // viene desde GET /promociones/:id
  promocion?: any | null;
}

export default function ComboModal({
  open,
  onClose,
  onSave,
  productos,
  promocion,
}: ComboModalProps) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [activa, setActiva] = useState(true);
  const [items, setItems] = useState<ComboItemRow[]>([
    { productoId: null, cantidad: "1" },
  ]);

  const [nombreError, setNombreError] = useState(false);
  const [precioError, setPrecioError] = useState(false);
  const [itemsError, setItemsError] = useState(false);

  useEffect(() => {
    if (promocion) {
      setNombre(promocion.nombre ?? "");
      setDescripcion(promocion.descripcion ?? "");
      setPrecio(
        promocion.precio_promocion
          ? String(promocion.precio_promocion)
          : ""
      );
      setActiva(promocion.activa === 1 || promocion.activa === true);

      if (Array.isArray(promocion.detalle) && promocion.detalle.length > 0) {
        setItems(
          promocion.detalle.map((d: any) => ({
            productoId: d.id_producto ?? null,
            cantidad: d.cantidad ? String(d.cantidad) : "1",
          }))
        );
      } else {
        setItems([{ productoId: null, cantidad: "1" }]);
      }
    } else {
      setNombre("");
      setDescripcion("");
      setPrecio("");
      setActiva(true);
      setItems([{ productoId: null, cantidad: "1" }]);
    }

    setNombreError(false);
    setPrecioError(false);
    setItemsError(false);
  }, [promocion, open]);

  const handlePrecioChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, "");
    setPrecio(value);
    setPrecioError(false);
  };

  const handleItemProductoChange = (
    index: number,
    value: ProductoOpcion | null
  ) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, productoId: value ? value.id : null } : item
      )
    );
    setItemsError(false);
  };

  const handleItemCantidadChange =
    (index: number) => (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/[^\d]/g, "");
      setItems((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, cantidad: value } : item
        )
      );
      setItemsError(false);
    };

  const handleAddItem = () => {
    setItems((prev) => [...prev, { productoId: null, cantidad: "1" }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveClick = () => {
    const nombreOk = nombre.trim().length > 0;
    const precioNumber = Number(precio);
    const precioOk = !Number.isNaN(precioNumber) && precioNumber > 0;

    const itemsValidos = items.filter(
      (it) => it.productoId && Number(it.cantidad) > 0
    );
    const itemsOk = itemsValidos.length > 0;

    setNombreError(!nombreOk);
    setPrecioError(!precioOk);
    setItemsError(!itemsOk);

    if (!nombreOk || !precioOk || !itemsOk) return;

    onSave({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      precio,
      activa,
      items,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {promocion ? "Editar combo armado" : "Nuevo combo armado"}
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {/* 1. Identificación */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            1. Identificación del combo
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" },
              gap: 2,
            }}
          >
            <TextField
              label="Nombre del combo *"
              fullWidth
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                setNombreError(false);
              }}
              error={nombreError}
              helperText={nombreError ? "El nombre es obligatorio" : ""}
            />

            <TextField
              label="Precio promoción *"
              fullWidth
              value={precio}
              onChange={handlePrecioChange}
              error={precioError}
              helperText={
                precioError ? "Debe ser un monto mayor a 0" : "Solo números"
              }
              InputProps={{
                startAdornment: <span style={{ marginRight: 4 }}>$</span>,
              }}
            />
          </Box>

          <TextField
            label="Descripción (opcional)"
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 2 }}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 2. Productos del combo */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            2. Productos del combo
          </Typography>

          {itemsError && (
            <Typography
              variant="caption"
              color="error"
              sx={{ mb: 1, display: "block" }}
            >
              Debes agregar al menos un producto con cantidad mayor a 0.
            </Typography>
          )}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {items.map((item, index) => {
              const selectedProducto =
                productos.find((p) => p.id === item.productoId) ?? null;

              return (
                <Box
                  key={index}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "3fr 1fr auto" },
                    gap: 1,
                    alignItems: "center",
                  }}
                >
                  <Autocomplete
                    options={productos}
                    getOptionLabel={(option) => option.nombre}
                    value={selectedProducto}
                    onChange={(_, val) =>
                      handleItemProductoChange(index, val)
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Producto" size="small" />
                    )}
                  />

                  <TextField
                    label="Cantidad"
                    size="small"
                    value={item.cantidad}
                    onChange={handleItemCantidadChange(index)}
                  />

                  <IconButton
                    size="small"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length === 1}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              );
            })}
          </Box>

          <Button
            startIcon={<AddIcon />}
            size="small"
            sx={{ mt: 1.5 }}
            onClick={handleAddItem}
          >
            Agregar producto
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 3. Estado */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            3. Estado
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={activa}
                onChange={(e) => setActiva(e.target.checked)}
              />
            }
            label="Promoción activa"
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSaveClick}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
