import { memo, useCallback, useEffect, useRef, useState } from "react";
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
  CircularProgress,
  LinearProgress,
  TablePagination,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PercentIcon from "@mui/icons-material/Percent";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";

import { productosApi } from "../../api/productosApi";
import { categoriasApi } from "../../api/categoriasApi";
import { proveedoresApi } from "../../api/proveedoresApi";
import { useDebounce } from "../../hooks/useDebounce";
import ProductoModal from "../../components/productos/ProductoModal";
import ProductoMayoristaModal from "../../components/productos/ProductoMayoristaModal";

interface OpcionSimple {
  id: number;
  nombre: string;
}

const tieneMayorista = (p: any) =>
  p?.precio_mayorista > 0 && p?.cantidad_mayorista > 0;

/* ---------- Fila memoizada ---------- */
interface RowProps {
  p: any;
  onMayorista: (p: any) => void;
  onEditar: (p: any) => void;
  onToggle: (p: any) => void;
  onEliminar: (p: any) => void;
}

const ProductoRow = memo(function ProductoRow({
  p,
  onMayorista,
  onEditar,
  onToggle,
  onEliminar,
}: RowProps) {
  const mayorista = tieneMayorista(p);

  return (
    <TableRow hover>
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
            mayorista
              ? "Editar oferta mayorista"
              : "Configurar oferta mayorista"
          }
        >
          <IconButton
            size="small"
            onClick={() => onMayorista(p)}
            sx={{
              ml: 1,
              borderRadius: 2,
              border: 1,
              borderColor: mayorista ? "success.main" : "divider",
              bgcolor: mayorista ? "success.light" : "transparent",
              color: mayorista ? "success.main" : "text.secondary",
            }}
          >
            <PercentIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Editar">
          <IconButton onClick={() => onEditar(p)}>
            <EditIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title={p.activo ? "Desactivar" : "Activar"}>
          <IconButton onClick={() => onToggle(p)}>
            <PowerSettingsNewIcon color={p.activo ? "error" : "success"} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Eliminar">
          <IconButton onClick={() => onEliminar(p)}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
});

/* ---------------------------------- Página ---------------------------------- */
export default function ProductosPage() {
  const [productos, setProductos] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0); // MUI usa base 0
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [busqueda, setBusqueda] = useState("");
  const busquedaDebounced = useDebounce(busqueda, 400);
  const [cargando, setCargando] = useState(true);

  const [categorias, setCategorias] = useState<OpcionSimple[]>([]);
  const [proveedores, setProveedores] = useState<OpcionSimple[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [productoEditar, setProductoEditar] = useState<any | null>(null);
  const [modalMayoristaOpen, setModalMayoristaOpen] = useState(false);
  const [productoMayorista, setProductoMayorista] = useState<any | null>(null);

  // Evita que una respuesta lenta y vieja pise a una más reciente
  const requestId = useRef(0);

  const cargarProductos = useCallback(async () => {
    const id = ++requestId.current;
    try {
      setCargando(true);
      const res = await productosApi.getPaginated({
        page: page + 1,
        limit: rowsPerPage,
        search: busquedaDebounced.trim(),
      });
      if (id !== requestId.current) return; // respuesta obsoleta
      setProductos(res.data);
      setTotal(res.total);
    } catch (error) {
      console.error("Error cargando productos:", error);
    } finally {
      if (id === requestId.current) setCargando(false);
    }
  }, [page, rowsPerPage, busquedaDebounced]);

  // Se recarga solo cuando cambia página, tamaño o búsqueda
  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  // Categorías y proveedores: una sola vez
  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  /* ---- Handlers estables para que memo() funcione ---- */
  const handleCrear = () => {
    setProductoEditar(null);
    setModalOpen(true);
  };

  const handleEditar = useCallback((p: any) => {
    setProductoEditar(p);
    setModalOpen(true);
  }, []);

  const handleConfigMayorista = useCallback((p: any) => {
    setProductoMayorista(p);
    setModalMayoristaOpen(true);
  }, []);

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

  const handleToggleEstado = useCallback(
    async (p: any) => {
      try {
        await productosApi.cambiarEstado(p.id, p.activo ? 0 : 1);
        cargarProductos();
      } catch (error) {
        console.error("Error cambiando estado:", error);
      }
    },
    [cargarProductos]
  );

  const handleEliminar = useCallback(
    async (p: any) => {
      if (!confirm("¿Eliminar producto?")) return;
      try {
        await productosApi.remove(p.id);
        // si era el último de la página, retrocede una
        if (productos.length === 1 && page > 0) setPage((x) => x - 1);
        else cargarProductos();
      } catch (error) {
        console.error("Error eliminando producto:", error);
      }
    },
    [cargarProductos, productos.length, page]
  );

  const primeraCarga = cargando && productos.length === 0;

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
          onChange={(e) => {
            setBusqueda(e.target.value);
            setPage(0); // al buscar, vuelve a la primera página
          }}
          fullWidth
        />
      </Box>

      <Paper sx={{ p: 2 }}>
        {primeraCarga ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              py: 8,
            }}
          >
            <CircularProgress size={48} />
            <Typography variant="h6" color="text.secondary">
              Cargando productos...
            </Typography>
          </Box>
        ) : (
          <>
            {/* Barra fina: la tabla no desaparece al cambiar de página o buscar */}
            <Box sx={{ height: 4 }}>{cargando && <LinearProgress />}</Box>

            <Box sx={{ opacity: cargando ? 0.6 : 1, transition: "opacity .15s" }}>
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
                  {productos.map((p) => (
                    <ProductoRow
                      key={p.id}
                      p={p}
                      onMayorista={handleConfigMayorista}
                      onEditar={handleEditar}
                      onToggle={handleToggleEstado}
                      onEliminar={handleEliminar}
                    />
                  ))}

                  {!cargando && productos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                        No se encontraron productos
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>

            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50, 100]}
              labelRowsPerPage="Filas por página"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}–${to} de ${count}`
              }
            />
          </>
        )}
      </Paper>

      <ProductoMayoristaModal
        open={modalMayoristaOpen}
        onClose={() => setModalMayoristaOpen(false)}
        producto={productoMayorista}
        onSave={async (data) => {
          if (!productoMayorista) return;
          await productosApi.update(productoMayorista.id, {
            ...productoMayorista,
            ...data,
          });
          setModalMayoristaOpen(false);
          cargarProductos();
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