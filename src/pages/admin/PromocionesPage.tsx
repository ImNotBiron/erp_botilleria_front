// src/pages/admin/PromocionesPage.tsx
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import { promocionesApi } from "../../api/promocionesApi";
import type { PromocionPayload } from "../../api/promocionesApi";
import { productosApi } from "../../api/productosApi";

import ComboModal from "../../components/promociones/ComboModal";
import type {
  ComboFormValues,
  ProductoOpcion,
} from "../../components/promociones/ComboModal";

interface PromocionListaItem {
  id: number;
  nombre: string;
  precio_promocion: number;
  activa: 0 | 1;
  total_productos?: number;
  // otros campos que puedas tener...
}

export default function PromocionesPage() {
  const [promos, setPromos] = useState<PromocionListaItem[]>([]);
  const [filtradas, setFiltradas] = useState<PromocionListaItem[]>([]);
  const [busqueda, setBusqueda] = useState("");

  const [productosOpciones, setProductosOpciones] = useState<ProductoOpcion[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [promoEditar, setPromoEditar] = useState<any | null>(null);

  const cargarPromos = async () => {
    const data = await promocionesApi.getAll();
    // Asumimos que el backend trae algo como:
    // [{ id, nombre, precio_promocion, activa, total_productos }]
    setPromos(data);
    setFiltradas(data);
  };

  const cargarProductos = async () => {
    const data = await productosApi.getAll();
    // Asumimos que los productos vienen con id y nombre_producto
    const opciones: ProductoOpcion[] = data.map((p: any) => ({
      id: p.id,
      nombre: p.nombre_producto ?? p.nombre ?? `Producto ${p.id}`,
    }));
    setProductosOpciones(opciones);
  };

  useEffect(() => {
    void cargarPromos();
    void cargarProductos();
  }, []);

  useEffect(() => {
    const texto = busqueda.toLowerCase();
    setFiltradas(
      promos.filter((p) =>
        (p.nombre ?? "").toLowerCase().includes(texto)
      )
    );
  }, [busqueda, promos]);

  const abrirNuevo = () => {
    setPromoEditar(null);
    setModalOpen(true);
  };

  const abrirEditar = async (promo: PromocionListaItem) => {
    // Obtenemos la promo con detalle desde el backend
    const detalle = await promocionesApi.getById(promo.id);
    setPromoEditar(detalle);
    setModalOpen(true);
  };

  const handleGuardar = async (values: ComboFormValues) => {
    const precioNum = Number(values.precio);
    if (Number.isNaN(precioNum) || precioNum <= 0) return;

    const detalle = values.items
      .filter((it) => it.productoId && Number(it.cantidad) > 0)
      .map((it) => ({
        id_producto: it.productoId as number,
        cantidad: Number(it.cantidad),
      }));

    const payload: PromocionPayload = {
      nombre: values.nombre.trim(),
      descripcion: values.descripcion.trim() || null,
      precio_promocion: precioNum,
      activa: values.activa ? 1 : 0,
      detalle,
    };

    if (!payload.nombre || !payload.precio_promocion || detalle.length === 0) {
      return;
    }

    if (promoEditar && promoEditar.id) {
      await promocionesApi.update(promoEditar.id, payload);
    } else {
      await promocionesApi.create(payload);
    }

    setModalOpen(false);
    setPromoEditar(null);
    await cargarPromos();
  };

  const toggleEstado = async (promo: PromocionListaItem) => {
    const nuevoEstado = promo.activa ? 0 : 1;
    await promocionesApi.cambiarEstado(promo.id, nuevoEstado);
    await cargarPromos();
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={2}>
        Promociones — Combos armados
      </Typography>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 2,
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <TextField
          size="small"
          placeholder="Buscar por nombre de promoción..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          sx={{ maxWidth: 400, flex: 1 }}
        />

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={abrirNuevo}
        >
          Nueva promoción
        </Button>
      </Box>

      <Paper sx={{ width: "100%", overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell align="right">Precio promo</TableCell>
              <TableCell align="center"># Productos</TableCell>
              <TableCell align="center">Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtradas.map((promo) => (
              <TableRow key={promo.id} hover>
                <TableCell>{promo.nombre}</TableCell>
                <TableCell align="right">
                  {promo.precio_promocion?.toLocaleString("es-CL", {
                    style: "currency",
                    currency: "CLP",
                  })}
                </TableCell>
                <TableCell align="center">
                  {promo.total_productos ?? "-"}
                </TableCell>
                <TableCell align="center">
                  {promo.activa ? (
                    <Chip
                      label="Activa"
                      color="success"
                      size="small"
                      icon={<CheckCircleIcon fontSize="small" />}
                    />
                  ) : (
                    <Chip
                      label="Inactiva"
                      size="small"
                      icon={<BlockIcon fontSize="small" />}
                    />
                  )}
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => void abrirEditar(promo)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => void toggleEstado(promo)}
                    sx={{ ml: 1 }}
                  >
                    {promo.activa ? (
                      <BlockIcon fontSize="small" color="error" />
                    ) : (
                      <CheckCircleIcon fontSize="small" color="success" />
                    )}
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}

            {filtradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No hay promociones que coincidan con la búsqueda.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <ComboModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setPromoEditar(null);
        }}
        onSave={handleGuardar}
        productos={productosOpciones}
        promocion={promoEditar}
      />
    </Box>
  );
}
