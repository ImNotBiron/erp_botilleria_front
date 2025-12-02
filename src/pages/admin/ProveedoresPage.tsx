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
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddIcon from "@mui/icons-material/Add";

import { proveedoresApi } from "../../api/proveedoresApi";
import type { ProveedorPayload } from "../../api/proveedoresApi";

import ProveedorModal from "../../components/proveedores/ProveedorModal";
import type { ProveedorFormValues } from "../../components/proveedores/ProveedorModal";


interface Proveedor extends ProveedorPayload {
  id: number;
  activo: 0 | 1;
}

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [filtrados, setFiltrados] = useState<Proveedor[]>([]);
  const [busqueda, setBusqueda] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [proveedorEditar, setProveedorEditar] = useState<Proveedor | null>(
    null
  );

  const cargarProveedores = async () => {
    const data = await proveedoresApi.getAll();
    setProveedores(data);
    setFiltrados(data);
  };

  useEffect(() => {
    cargarProveedores();
  }, []);

  useEffect(() => {
    const texto = busqueda.toLowerCase();
    setFiltrados(
      proveedores.filter((p) =>
        (
          p.nombre +
          " " +
          (p.rut || "") +
          " " +
          (p.telefono || "") +
          " " +
          (p.email || "")
        )
          .toLowerCase()
          .includes(texto)
      )
    );
  }, [busqueda, proveedores]);

  const abrirNuevo = () => {
    setProveedorEditar(null);
    setModalOpen(true);
  };

  const abrirEditar = (prov: Proveedor) => {
    setProveedorEditar(prov);
    setModalOpen(true);
  };

  const handleGuardar = async (values: ProveedorFormValues) => {
    const payload: ProveedorPayload = {
      nombre: values.nombre.trim(),
      rut: values.rut?.trim() || undefined,
      telefono: values.telefono?.trim() || undefined,
      email: values.email?.trim() || undefined,
      direccion: values.direccion?.trim() || undefined,
    };

    if (!payload.nombre) return;

    if (proveedorEditar) {
      await proveedoresApi.update(proveedorEditar.id, payload);
    } else {
      await proveedoresApi.create(payload);
    }

    setModalOpen(false);
    await cargarProveedores();
  };

  const toggleEstado = async (prov: Proveedor) => {
    const nuevoEstado = prov.activo ? 0 : 1;
    await proveedoresApi.cambiarEstado(prov.id, nuevoEstado);
    await cargarProveedores();
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={2}>
        Proveedores
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
          placeholder="Buscar por nombre, RUT, teléfono o email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          sx={{ maxWidth: 400, flex: 1 }}
        />

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={abrirNuevo}
        >
          Nuevo proveedor
        </Button>
      </Box>

      <Paper sx={{ width: "100%", overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>RUT</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Dirección</TableCell>
              <TableCell align="center">Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtrados.map((prov) => (
              <TableRow key={prov.id} hover>
                <TableCell>{prov.nombre}</TableCell>
                <TableCell>{prov.rut || "-"}</TableCell>
                <TableCell>{prov.telefono || "-"}</TableCell>
                <TableCell>{prov.email || "-"}</TableCell>
                <TableCell>{prov.direccion || "-"}</TableCell>
                <TableCell align="center">
                  {prov.activo ? (
                    <Chip
                      label="Activo"
                      color="success"
                      size="small"
                      icon={<CheckCircleIcon fontSize="small" />}
                    />
                  ) : (
                    <Chip
                      label="Inactivo"
                      size="small"
                      icon={<BlockIcon fontSize="small" />}
                    />
                  )}
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => abrirEditar(prov)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => toggleEstado(prov)}
                    sx={{ ml: 1 }}
                  >
                    {prov.activo ? (
                      <BlockIcon fontSize="small" color="error" />
                    ) : (
                      <CheckCircleIcon fontSize="small" color="success" />
                    )}
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}

            {filtrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No hay proveedores que coincidan con la búsqueda.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* MODAL CREAR / EDITAR */}
      <ProveedorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleGuardar}
        proveedor={proveedorEditar}
      />
    </Box>
  );
}
