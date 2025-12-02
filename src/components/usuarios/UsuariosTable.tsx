import {
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";

import EstadoChip from "./EstadoChip";

export default function UsuariosTable({
  usuarios,
  onEditar,
  onToggleEstado,
  onEliminar,
}: any) {
  return (
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
        {usuarios.map((u: any) => (
          <TableRow key={u.id}>
            <TableCell>{u.rut}</TableCell>
            <TableCell>{u.nombre_usuario}</TableCell>
            <TableCell>{u.tipo_usuario}</TableCell>

            <TableCell>
              <EstadoChip online={u.en_linea} active={u.activo} />
            </TableCell>

            <TableCell align="right">
              <Tooltip title="Editar">
                <IconButton onClick={() => onEditar(u)}>
                  <EditIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title={u.activo ? "Desactivar" : "Activar"}>
                <IconButton onClick={() => onToggleEstado(u)}>
                  <PowerSettingsNewIcon color={u.activo ? "error" : "success"} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Eliminar">
                <IconButton onClick={() => onEliminar(u)}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
