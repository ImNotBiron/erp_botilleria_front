import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useEffect, useState, type ChangeEvent } from "react";

export interface CategoriaFormValues {
  nombre: string;
}

interface CategoriaModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (values: CategoriaFormValues) => void;
  categoria?: {
    id: number;
    nombre: string;
    activo: 0 | 1;
  } | null;
}

export default function CategoriaModal({
  open,
  onClose,
  onSave,
  categoria,
}: CategoriaModalProps) {
  const [nombre, setNombre] = useState("");
  const [nombreError, setNombreError] = useState(false);

  useEffect(() => {
    if (categoria) {
      setNombre(categoria.nombre || "");
    } else {
      setNombre("");
    }
    setNombreError(false);
  }, [categoria, open]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNombre(e.target.value);
    setNombreError(false);
  };

  const handleSaveClick = () => {
    const valido = nombre.trim().length > 0;
    if (!valido) {
      setNombreError(true);
      return;
    }

    onSave({ nombre: nombre.trim() });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        {categoria ? "Editar categoría" : "Nueva categoría"}
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ mt: 1 }}>
          <TextField
            label="Nombre de la categoría *"
            fullWidth
            value={nombre}
            onChange={handleChange}
            error={nombreError}
            helperText={nombreError ? "El nombre es obligatorio" : ""}
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
