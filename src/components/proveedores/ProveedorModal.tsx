import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";

export interface ProveedorFormValues {
  nombre: string;
  rut?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}


interface ProveedorModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (values: ProveedorFormValues) => void;
  proveedor?: {
    id: number;
    nombre: string;
    rut?: string | null;
    telefono?: string | null;
    email?: string | null;
    direccion?: string | null;
  } | null;
}

export default function ProveedorModal({
  open,
  onClose,
  onSave,
  proveedor,
}: ProveedorModalProps) {
  const [values, setValues] = useState<ProveedorFormValues>({
    nombre: "",
    rut: "",
    telefono: "",
    email: "",
    direccion: "",
  });

  const [nombreError, setNombreError] = useState(false);

  useEffect(() => {
    if (proveedor) {
      setValues({
        nombre: proveedor.nombre || "",
        rut: proveedor.rut || "",
        telefono: proveedor.telefono || "",
        email: proveedor.email || "",
        direccion: proveedor.direccion || "",
      });
    } else {
      setValues({
        nombre: "",
        rut: "",
        telefono: "",
        email: "",
        direccion: "",
      });
    }
    setNombreError(false);
  }, [proveedor, open]);

  const handleChange =
    (field: keyof ProveedorFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
      if (field === "nombre") setNombreError(false);
    };

  const handleSaveClick = () => {
    const nombreValido = values.nombre.trim().length > 0;
    if (!nombreValido) {
      setNombreError(true);
      return;
    }

    onSave({
      nombre: values.nombre.trim(),
      rut: values.rut?.trim() || "",
      telefono: values.telefono?.trim() || "",
      email: values.email?.trim() || "",
      direccion: values.direccion?.trim() || "",
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {proveedor ? "Editar proveedor" : "Nuevo proveedor"}
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            columnGap: 2,
            rowGap: 2,
            mt: 1,
          }}
        >
          {/* 1. Identificación */}
          <TextField
            label="Nombre del proveedor *"
            fullWidth
            value={values.nombre}
            onChange={handleChange("nombre")}
            error={nombreError}
            helperText={nombreError ? "El nombre es obligatorio" : ""}
          />

          <TextField
            label="RUT (opcional)"
            fullWidth
            value={values.rut}
            onChange={handleChange("rut")}
          />

          {/* 2. Contacto */}
          <TextField
            label="Teléfono"
            fullWidth
            value={values.telefono}
            onChange={handleChange("telefono")}
          />

          <TextField
            label="Email"
            type="email"
            fullWidth
            value={values.email}
            onChange={handleChange("email")}
          />

          {/* 3. Dirección: ocupa las 2 columnas */}
          <TextField
            label="Dirección"
            fullWidth
            multiline
            minRows={2}
            sx={{ gridColumn: { xs: "1 / -1", sm: "1 / -1" } }}
            value={values.direccion}
            onChange={handleChange("direccion")}
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
