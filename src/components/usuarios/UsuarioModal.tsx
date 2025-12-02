import {
  Box,
  Modal,
  TextField,
  Button,
  Typography,
  MenuItem,
} from "@mui/material";
import { useState, useEffect } from "react";
import {
  formatearRutTiempoReal,
  rutLimpioParaGuardar,
  validarRut,
} from "../../utils/rutUtils";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  usuario?: any;
}

export default function UsuarioModal({ open, onClose, onSave, usuario }: Props) {
  const [rut, setRut] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState("vendedor");

  const [rutError, setRutError] = useState(false);
  const [nombreError, setNombreError] = useState(false);

  // Cargar datos al editar usuario
  useEffect(() => {
    if (usuario) {
      setRut(formatearRutTiempoReal(usuario.rut)); // mostrar formateado
      setNombre(usuario.nombre_usuario);
      setRol(usuario.tipo_usuario);
      setRutError(false);
      setNombreError(false);
    } else {
      setRut("");
      setNombre("");
      setRol("vendedor");
      setRutError(false);
      setNombreError(false);
    }
  }, [usuario]);

  // Manejador del RUT escritura + formateo en tiempo real
  const handleRutChange = (value: string) => {
    const mostrado = formatearRutTiempoReal(value);
    setRut(mostrado);

    const limpio = rutLimpioParaGuardar(value);

    if (limpio.includes("-") && limpio.length >= 3) {
      setRutError(!validarRut(limpio));
    } else {
      setRutError(true);
    }
  };

  const handleSave = () => {
    const limpio = rutLimpioParaGuardar(rut);

    const nombreValido = nombre.trim().length > 0;
    setNombreError(!nombreValido);

    if (rutError || !nombreValido) return;

    onSave({
      rut: limpio, // <-- se guarda SIN puntos y CON guion
      nombre_usuario: nombre.trim(),
      tipo_usuario: rol,
    });
  };

  const disableSave = rutError || nombre.trim().length === 0;

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          width: 420,
          p: 3,
          bgcolor: "background.paper",
          borderRadius: 3,
          boxShadow: 6,
          mx: "auto",
          mt: "10vh",
        }}
      >
        <Typography variant="h6" fontWeight={600} mb={2}>
          {usuario ? "Editar Usuario" : "Nuevo Usuario"}
        </Typography>

        {/* RUT */}
        <TextField
          fullWidth
          label="RUT"
          value={rut}
          onChange={(e) => handleRutChange(e.target.value)}
          error={rutError}
          helperText={rutError ? "RUT inválido" : " "}
          sx={{ mb: 2 }}
        />

        {/* Nombre */}
        <TextField
          fullWidth
          label="Nombre"
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            setNombreError(false);
          }}
          error={nombreError}
          helperText={nombreError ? "El nombre es obligatorio" : " "}
          sx={{ mb: 2 }}
        />

        {/* Rol */}
        <TextField
          fullWidth
          select
          label="Rol"
          value={rol}
          onChange={(e) => setRol(e.target.value)}
        >
          <MenuItem value="admin">Administrador</MenuItem>
          <MenuItem value="vendedor">Vendedor</MenuItem>
        </TextField>

        {/* Botones */}
        <Box mt={3} display="flex" justifyContent="flex-end" gap={1}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={disableSave}>
            Guardar
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
