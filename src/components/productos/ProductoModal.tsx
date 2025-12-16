import {
  Box,
  Modal,
  TextField,
  Button,
  Typography,
  FormControlLabel,
  Switch,
  IconButton,
  InputAdornment,
  Fade,
  Backdrop,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useEffect } from "react";

interface OpcionSimple {
  id: number;
  nombre: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  producto?: any;
  categorias: OpcionSimple[];
  proveedores: OpcionSimple[];
}

const styleModal = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "92vw",
  maxWidth: 640,          // 🔹 más compacto
  maxHeight: "90vh",
  bgcolor: "background.paper",
  borderRadius: 3,
  boxShadow: 24,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

export default function ProductoModal({
  open,
  onClose,
  onSave,
  producto,
  categorias,
  proveedores,
}: Props) {
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [precioVenta, setPrecioVenta] = useState<string>("");
  const [cantidadMayorista, setCantidadMayorista] = useState<string>("");
  const [precioMayorista, setPrecioMayorista] = useState<string>("");
  const [exentoIva, setExentoIva] = useState(false);
  const [stock, setStock] = useState<string>("");
  const [stockCritico, setStockCritico] = useState<string>("");
  const [capacidadMl, setCapacidadMl] = useState<string>("");
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [proveedorId, setProveedorId] = useState<number | null>(null);

  const [nombreError, setNombreError] = useState(false);
  const [precioError, setPrecioError] = useState(false);
  const [categoriaError, setCategoriaError] = useState(false);
  const [proveedorError, setProveedorError] = useState(false);

  const categoriaValue =
    categorias.find((c) => c.id === categoriaId) || null;
  const proveedorValue =
    proveedores.find((p) => p.id === proveedorId) || null;

  useEffect(() => {
    if (producto) {
      setCodigo(producto.codigo_producto || "");
      setNombre(producto.nombre_producto || "");
      setPrecioVenta(producto.precio_venta?.toString() ?? "");
      setCantidadMayorista(producto.cantidad_mayorista?.toString() ?? "");
      setPrecioMayorista(producto.precio_mayorista?.toString() ?? "");
      setExentoIva(!!producto.exento_iva);
      setStock(producto.stock?.toString() ?? "");
      setStockCritico(producto.stock_critico?.toString() ?? "");
      setCapacidadMl(producto.capacidad_ml?.toString() ?? "");
      setCategoriaId(producto.id_categoria ?? null);
      setProveedorId(producto.id_proveedor ?? null);
    } else {
      setCodigo("");
      setNombre("");
      setPrecioVenta("");
      setCantidadMayorista("");
      setPrecioMayorista("");
      setExentoIva(false);
      setStock("");
      setStockCritico("");
      setCapacidadMl("");
      setCategoriaId(null);
      setProveedorId(null);
    }

    setNombreError(false);
    setPrecioError(false);
    setCategoriaError(false);
    setProveedorError(false);
  }, [producto, open]);

  const handleSave = () => {
    const nombreValido = nombre.trim().length > 0;
    const precioValido = Number(precioVenta) > 0;
    const categoriaValida = !!categoriaId;
    const proveedorValido = !!proveedorId;

    setNombreError(!nombreValido);
    setPrecioError(!precioValido);
    setCategoriaError(!categoriaValida);
    setProveedorError(!proveedorValido);

    if (!nombreValido || !precioValido || !categoriaValida || !proveedorValido)
      return;

    onSave({
      codigo_producto: codigo || null,
      nombre_producto: nombre.trim(),
      precio_venta: Number(precioVenta),
      cantidad_mayorista: Number(cantidadMayorista) || 0,
      precio_mayorista: Number(precioMayorista) || 0,
      exento_iva: exentoIva ? 1 : 0,
      stock: Number(stock) || 0,
      stock_critico: Number(stockCritico) || 0,
      capacidad_ml: capacidadMl === "" ? null : Number(capacidadMl),
      id_categoria: categoriaId,
      id_proveedor: proveedorId,
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
        <Box sx={styleModal}>
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
              {producto ? "Editar Producto" : "Nuevo Producto"}
            </Typography>
            <IconButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* BODY */}
         {/* BODY */}
<Box sx={{ px: 3, py: 2, overflowY: "auto" }}>
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: {
        xs: "1fr",
        sm: "1fr 1fr", // 2 columnas desde sm+
      },
      columnGap: 2,
      rowGap: 2,
    }}
  >
    {/* 1. IDENTIFICACIÓN DEL PRODUCTO */}
    <Box sx={{ gridColumn: "1 / -1", mb: 0.5 }}>
      <Typography variant="subtitle2" fontWeight={600}>
        1. Identificación del producto
      </Typography>
    </Box>

    {/* Código | Nombre */}
    <TextField
      label="Código de barras"
      fullWidth
      value={codigo}
      onChange={(e) => setCodigo(e.target.value)}
    />

    <TextField
      label="Nombre del producto"
      fullWidth
      required
      value={nombre}
      onChange={(e) => {
        setNombre(e.target.value);
        setNombreError(false);
      }}
      error={nombreError}
      helperText={nombreError ? "Requerido" : ""}
    />

    {/* 2. CLASIFICACIÓN */}
    <Box sx={{ gridColumn: "1 / -1", mt: 1, mb: 0.5 }}>
      <Typography variant="subtitle2" fontWeight={600}>
        2. Clasificación
      </Typography>
    </Box>

    {/* Categoría | Proveedor */}
    <Autocomplete
      fullWidth
      options={categorias}
      getOptionLabel={(option) => option.nombre}
      value={categoriaValue}
      onChange={(_, val) => {
        setCategoriaId(val ? val.id : null);
        setCategoriaError(false);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Categoría del producto"
          required
          error={categoriaError}
          helperText={categoriaError ? "Requerido" : ""}
        />
      )}
    />

    <Autocomplete
      fullWidth
      options={proveedores}
      getOptionLabel={(option) => option.nombre}
      value={proveedorValue}
      onChange={(_, val) => {
        setProveedorId(val ? val.id : null);
        setProveedorError(false);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Proveedor del producto"
          required
          error={proveedorError}
          helperText={proveedorError ? "Requerido" : ""}
        />
      )}
    />

    {/* 3. VALOR Y CAPACIDAD */}
    <Box sx={{ gridColumn: "1 / -1", mt: 1, mb: 0.5 }}>
      <Typography variant="subtitle2" fontWeight={600}>
        3. Valor y capacidad
      </Typography>
    </Box>

    {/* Precio venta | Capacidad */}
    <TextField
      label="Precio de venta"
      fullWidth
      required
      value={precioVenta}
      onChange={(e) => {
        setPrecioVenta(e.target.value);
        setPrecioError(false);
      }}
      error={precioError}
      helperText={precioError ? "Debe ser mayor a 0" : ""}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">$</InputAdornment>
        ),
      }}
    />

    <TextField
      label="Capacidad del producto"
      fullWidth
      value={capacidadMl}
      onChange={(e) => setCapacidadMl(e.target.value)}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">ml</InputAdornment>
        ),
      }}
    />

    {/* 4. STOCK */}
    <Box sx={{ gridColumn: "1 / -1", mt: 1, mb: 0.5 }}>
      <Typography variant="subtitle2" fontWeight={600}>
        4. Stock
      </Typography>
    </Box>

    {/* Stock | Crítico */}
    <TextField
      label="Stock actual"
      fullWidth
      value={stock}
      onChange={(e) => setStock(e.target.value)}
    />

    <TextField
      label="Stock crítico"
      fullWidth
      value={stockCritico}
      onChange={(e) => setStockCritico(e.target.value)}
    />

    {/* IVA (fila completa) */}
    <Box
      sx={{
        gridColumn: { xs: "1 / -1", sm: "1 / -1" },
        mt: 1,
      }}
    >
      <FormControlLabel
        control={
          <Switch
            checked={exentoIva}
            onChange={(e) => setExentoIva(e.target.checked)}
          />
        }
        label="Producto exento de IVA"
      />
    </Box>
  </Box>
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
