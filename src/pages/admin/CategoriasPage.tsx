import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Chip,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import { categoriasApi } from "../../api/categoriasApi";
import type { CategoriaPayload } from "../../api/categoriasApi";

import CategoriaModal from "../../components/categorias/CategoriaModal";
import type { CategoriaFormValues } from "../../components/categorias/CategoriaModal";

interface Categoria extends CategoriaPayload {
  id: number;
  activo: 0 | 1;
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filtradas, setFiltradas] = useState<Categoria[]>([]);
  const [busqueda, setBusqueda] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [categoriaEditar, setCategoriaEditar] = useState<Categoria | null>(
    null
  );

  const cargarCategorias = async () => {
    const data = await categoriasApi.getAll();
    setCategorias(data);
    setFiltradas(data);
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  useEffect(() => {
    const texto = busqueda.toLowerCase();
    setFiltradas(
      categorias.filter((c) =>
        c.nombre.toLowerCase().includes(texto)
      )
    );
  }, [busqueda, categorias]);

  const abrirNuevo = () => {
    setCategoriaEditar(null);
    setModalOpen(true);
  };

  const abrirEditar = (cat: Categoria) => {
    setCategoriaEditar(cat);
    setModalOpen(true);
  };

  const handleGuardar = async (values: CategoriaFormValues) => {
    const payload: CategoriaPayload = { nombre: values.nombre.trim() };
    if (!payload.nombre) return;

    if (categoriaEditar) {
      await categoriasApi.update(categoriaEditar.id, payload);
    } else {
      await categoriasApi.create(payload);
    }

    setModalOpen(false);
    await cargarCategorias();
  };

  const toggleEstado = async (cat: Categoria) => {
    const nuevoEstado = cat.activo ? 0 : 1;
    await categoriasApi.cambiarEstado(cat.id, nuevoEstado);
    await cargarCategorias();
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={2}>
        Categorías
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
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          sx={{ maxWidth: 300, flex: 1 }}
        />

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={abrirNuevo}
        >
          Nueva categoría
        </Button>
      </Box>

      <Paper sx={{ width: "100%", overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell align="center">Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtradas.map((cat) => (
              <TableRow key={cat.id} hover>
                <TableCell>{cat.nombre}</TableCell>
                <TableCell align="center">
                  {cat.activo ? (
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
                  <IconButton size="small" onClick={() => abrirEditar(cat)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => toggleEstado(cat)}
                    sx={{ ml: 1 }}
                  >
                    {cat.activo ? (
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
                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No hay categorías que coincidan con la búsqueda.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <CategoriaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleGuardar}
        categoria={categoriaEditar}
      />
    </Box>
  );
}
