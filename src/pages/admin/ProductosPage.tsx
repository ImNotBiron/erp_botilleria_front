import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Chip,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PercentIcon from "@mui/icons-material/Percent";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";

import { productosApi } from "../../api/productosApi";
import { categoriasApi } from "../../api/categoriasApi";
import { proveedoresApi } from "../../api/proveedoresApi";
import ProductoModal from "../../components/productos/ProductoModal";
import ProductoMayoristaModal from "../../components/productos/ProductoMayoristaModal";

interface OpcionSimple {
  id: number;
  nombre: string;
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<any[]>([]);
  const [filtrados, setFiltrados] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");

  const [categorias, setCategorias] = useState<OpcionSimple[]>([]);
  const [proveedores, setProveedores] = useState<OpcionSimple[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [productoEditar, setProductoEditar] = useState<any | null>(null);

  const [modalMayoristaOpen, setModalMayoristaOpen] = useState(false);
  const [productoMayorista, setProductoMayorista] = useState<any | null>(null);



  const cargarProductos = async () => {
    try {
      const data = await productosApi.getAll();
      setProductos(data);
      setFiltrados(data);
    } catch (error) {
      console.error("Error cargando productos:", error);
    }
  };

  const cargarListas = async () => {
    try {
      const [cats, provs] = await Promise.all([
        categoriasApi.getAll(),
        proveedoresApi.getAll(),
      ]);

      setCategorias(cats);
      setProveedores(provs);
    } catch (error) {
      console.error("Error cargando categorías/proveedores:", error);
    }
  };

  const handleConfigMayorista = (producto: any) => {
  setProductoMayorista(producto);
  setModalMayoristaOpen(true);
};

const tieneMayorista = (p: any) =>
  p?.precio_mayorista > 0 && p?.cantidad_mayorista > 0;


  useEffect(() => {
    cargarProductos();
    cargarListas();
  }, []);

  // Buscar por nombre o código
  useEffect(() => {
    const txt = busqueda.trim().toLowerCase();

    if (!txt) {
      setFiltrados(productos);
      return;
    }

    setFiltrados(
      productos.filter(
        (p) =>
          p.nombre_producto.toLowerCase().includes(txt) ||
          (p.codigo_producto || "").toLowerCase().includes(txt) ||
          (p.categoria || "").toLowerCase().includes(txt) ||
          (p.proveedor || "").toLowerCase().includes(txt)
      )
    );
  }, [busqueda, productos]);

  const handleCrear = () => {
    setProductoEditar(null);
    setModalOpen(true);
  };

  const handleGuardar = async (data: any) => {
    try {
      if (productoEditar) {
        await productosApi.update(productoEditar.id, data);
      } else {
        await productosApi.create(data);
      }
      setModalOpen(false);
      cargarProductos();
    } catch (error) {
      console.error("Error guardando producto:", error);
    }
  };

  const handleEditar = (producto: any) => {
    setProductoEditar(producto);
    setModalOpen(true);
  };

  const handleToggleEstado = async (producto: any) => {
    try {
      const nuevoEstado = producto.activo ? 0 : 1;
      await productosApi.cambiarEstado(producto.id, nuevoEstado);
      cargarProductos();
    } catch (error) {
      console.error("Error cambiando estado:", error);
    }
  };

  const handleEliminar = async (producto: any) => {
    if (!confirm("¿Eliminar producto?")) return;

    try {
      await productosApi.remove(producto.id);
      cargarProductos();
    } catch (error) {
      console.error("Error eliminando producto:", error);
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Productos
      </Typography>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 2,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Button variant="contained" onClick={handleCrear}>
          Nuevo Producto
        </Button>

        <TextField
          label="Buscar por nombre, código, categoría o proveedor"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          fullWidth
        />
      </Box>

      <Paper sx={{ p: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Proveedor</TableCell>
              <TableCell align="right">Precio venta</TableCell>
              <TableCell align="right">Stock</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filtrados.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.codigo_producto || "—"}</TableCell>
                <TableCell>{p.nombre_producto}</TableCell>
                <TableCell>{p.categoria || "—"}</TableCell>
                <TableCell>{p.proveedor || "—"}</TableCell>
                <TableCell align="right">
                  ${p.precio_venta?.toLocaleString("es-CL")}
                </TableCell>
                <TableCell align="right">{p.stock}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={p.activo ? "Activo" : "Inactivo"}
                    color={p.activo ? "success" : "default"}
                    variant={p.activo ? "filled" : "outlined"}
                  />
                </TableCell>
                <TableCell align="right">
                    <Tooltip
    title={
      tieneMayorista(p)
        ? "Editar oferta mayorista"
        : "Configurar oferta mayorista"
    }
  >
    <IconButton
      size="small"
      onClick={() => handleConfigMayorista(p)}
      sx={{
        ml: 1,
        borderRadius: 2,
        border: 1,
        borderColor: tieneMayorista(p) ? "success.main" : "divider",
        bgcolor: tieneMayorista(p) ? "success.light" : "transparent",
        color: tieneMayorista(p) ? "success.main" : "text.secondary",
      }}
    >
      <PercentIcon fontSize="small" />
    </IconButton>
  </Tooltip>

                  <Tooltip title="Editar">
                    <IconButton onClick={() => handleEditar(p)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title={p.activo ? "Desactivar" : "Activar"}>
                    <IconButton onClick={() => handleToggleEstado(p)}>
                      <PowerSettingsNewIcon
                        color={p.activo ? "error" : "success"}
                      />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Eliminar">
                    <IconButton onClick={() => handleEliminar(p)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}

            {filtrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  No se encontraron productos
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
      
      <ProductoMayoristaModal
  open={modalMayoristaOpen}
  onClose={() => setModalMayoristaOpen(false)}
  producto={productoMayorista}
  onSave={async (data) => {
    if (!productoMayorista) return;
    await productosApi.update(productoMayorista.id, {
      ...productoMayorista,
      ...data, // actualiza precio_mayorista y cantidad_mayorista
    });
    setModalMayoristaOpen(false);
    cargarProductos(); // ya lo tienes para refrescar la lista
  }}
/>


      <ProductoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleGuardar}
        producto={productoEditar}
        categorias={categorias}
        proveedores={proveedores}
      />
    </Box>
  );
}
