import { useEffect, useState, useMemo } from "react";
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
  MenuItem,
  Stack,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";

import { usuariosApi } from "../../api/usuariosApi";
import UsuarioModal from "../../components/usuarios/UsuarioModal";
import EstadoChip from "../../components/usuarios/EstadoChip";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<any[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState<any>(null);

  // FILTROS
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const cargarUsuarios = async () => {
    try {
      const { data } = await usuariosApi.getUsuarios();
      setUsuarios(data);
      setUsuariosFiltrados(data);
    } catch (err) {
      console.error("Error cargando usuarios:", err);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // ----------------------------
  // 🔍 FILTRADO AVANZADO
  // ----------------------------
  useEffect(() => {
    let filtrados = [...usuarios];

    // 1) Filtro búsqueda (nombre, rut, rol)
    if (busqueda.trim() !== "") {
      const txt = busqueda.toLowerCase();

      filtrados = filtrados.filter(
        (u) =>
          u.nombre_usuario.toLowerCase().includes(txt) ||
          u.rut.toLowerCase().includes(txt) ||
          u.tipo_usuario.toLowerCase().includes(txt)
      );
    }

    // 2) Filtro rol
    if (filtroRol !== "todos") {
      filtrados = filtrados.filter((u) => u.tipo_usuario === filtroRol);
    }

    // 3) Filtro estado
    if (filtroEstado === "activos") {
      filtrados = filtrados.filter((u) => u.activo === 1);
    } else if (filtroEstado === "inactivos") {
      filtrados = filtrados.filter((u) => u.activo === 0);
    }

    setUsuariosFiltrados(filtrados);
  }, [busqueda, filtroRol, filtroEstado, usuarios]);

  // ----------------------------
  // HANDLERS CRUD
  // ----------------------------

  const handleCrear = () => {
    setUsuarioEditar(null);
    setModalOpen(true);
  };

  const handleGuardar = async (data: any) => {
    try {
      if (usuarioEditar) {
        await usuariosApi.actualizarUsuario(usuarioEditar.id, data);
      } else {
        await usuariosApi.crearUsuario(data);
      }
      setModalOpen(false);
      cargarUsuarios();
    } catch (err) {
      console.error("Error guardando usuario:", err);
    }
  };

  const handleEditar = (usuario: any) => {
    setUsuarioEditar(usuario);
    setModalOpen(true);
  };

  const handleToggleEstado = async (usuario: any) => {
    try {
      const nuevoEstado = usuario.activo ? 0 : 1;
      await usuariosApi.cambiarEstado(usuario.id, nuevoEstado);
      cargarUsuarios();
    } catch (err) {
      console.error("Error cambiando estado:", err);
    }
  };

  const handleEliminar = async (usuario: any) => {
    if (!confirm("¿Eliminar usuario?")) return;

    try {
      await usuariosApi.eliminarUsuario(usuario.id);
      cargarUsuarios();
    } catch (err) {
      console.error("Error eliminando usuario:", err);
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Usuarios
      </Typography>

      {/* BOTÓN CREAR */}
      <Button variant="contained" onClick={handleCrear} sx={{ mb: 2 }}>
        Nuevo Usuario
      </Button>

      {/* FILTROS */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={"row"} spacing={2}>

          {/* BUSQUEDA */}
          <TextField
            label="Buscar..."
            fullWidth
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          {/* FILTRO ROL */}
          <TextField
            select
            label="Rol"
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            sx={{ width: 160 }}
          >
            <MenuItem value="todos">Todos</MenuItem>
            <MenuItem value="admin">Administrador</MenuItem>
            <MenuItem value="vendedor">Vendedor</MenuItem>
          </TextField>

          {/* FILTRO ESTADO */}
          <TextField
            select
            label="Estado"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            sx={{ width: 160 }}
          >
            <MenuItem value="todos">Todos</MenuItem>
            <MenuItem value="activos">Activos</MenuItem>
            <MenuItem value="inactivos">Inactivos</MenuItem>
          </TextField>
        </Stack>
      </Paper>

      {/* TABLA */}
      <Paper sx={{ p: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>RUT</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {usuariosFiltrados.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.rut}</TableCell>
                <TableCell>{u.nombre_usuario}</TableCell>
                <TableCell>{u.tipo_usuario}</TableCell>

                <TableCell>
                  <EstadoChip online={u.en_linea} active={u.activo} />
                </TableCell>

                <TableCell align="right">
                  <Tooltip title="Editar">
                    <IconButton onClick={() => handleEditar(u)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title={u.activo ? "Desactivar" : "Activar"}>
                    <IconButton onClick={() => handleToggleEstado(u)}>
                      <PowerSettingsNewIcon
                        color={u.activo ? "error" : "success"}
                      />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Eliminar">
                    <IconButton onClick={() => handleEliminar(u)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}

            {usuariosFiltrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  No se encontraron usuarios
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <UsuarioModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleGuardar}
        usuario={usuarioEditar}
      />
    </Box>
  );
}
