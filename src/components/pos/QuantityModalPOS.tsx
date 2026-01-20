// src/components/pos/QuantityModalPOS.tsx
import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
} from "@mui/material";

interface QuantityModalPOSProps {
  open: boolean;
  initialValue: number;
  onClose: () => void;
  onConfirm: (value: number) => void;
}

export const QuantityModalPOS: React.FC<QuantityModalPOSProps> = ({
  open,
  initialValue,
  onClose,
  onConfirm,
}) => {
  const [valor, setValor] = useState<string>(String(initialValue));
  const valorRef = useRef(valor);
  useEffect(() => {
    valorRef.current = valor;
  }, [valor]);

  useEffect(() => {
    if (open) setValor(String(initialValue));
  }, [open, initialValue]);

  const agregarNumero = (n: string) => {
    setValor((prev) => {
      const nuevo = prev === "0" ? n : prev + n;
      if (nuevo.length > 4) return prev;
      return nuevo;
    });
  };

  const borrar = () => {
    setValor((prev) => {
      const nuevo = prev.slice(0, -1);
      return nuevo === "" ? "0" : nuevo;
    });
  };

  const limpiar = () => setValor("0");

  const aceptar = () => {
    let num = Number(valorRef.current);
    if (!num || num < 1) num = 1;
    onConfirm(num);
  };

  // ✅ Soporte de teclado físico (solo cuando open = true)
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key;

      // cerrar
      if (k === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      // aceptar
      if (k === "Enter") {
        e.preventDefault();
        aceptar();
        return;
      }

      // limpiar
      if (k === "c" || k === "C") {
        e.preventDefault();
        limpiar();
        return;
      }

      // borrar
      if (k === "Backspace") {
        e.preventDefault();
        borrar();
        return;
      }

      // dígitos (incluye teclado numérico)
      if (/^\d$/.test(k)) {
        e.preventDefault();
        agregarNumero(k);
        return;
      }
    };

    // capture=true para que funcione aunque haya foco en botones del Dialog
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose]);

  const keypadStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    width: "100%",
    marginTop: "10px",
  };

  const btn = {
    borderRadius: "14px",
    padding: "14px 0",
    fontSize: "1.2rem",
    fontWeight: 600,
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 4, overflow: "hidden" },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Cantidad de ítems
        </Typography>
        <Typography variant="h6" fontWeight={700}>
          Ingresar cantidad
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 1.5 }}>
        {/* DISPLAY */}
        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            bgcolor: "background.default",
            border: "1px solid",
            borderColor: "divider",
            textAlign: "right",
            mb: 2,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Nueva cantidad
          </Typography>
          <Typography variant="h3" fontWeight={800}>
            {valor}
          </Typography>
        </Box>

        {/* TECLADO */}
        <Box sx={keypadStyle}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
            <Button
              key={n}
              variant="contained"
              sx={btn}
              onClick={() => agregarNumero(n)}
            >
              {n}
            </Button>
          ))}

          <Button variant="outlined" color="warning" sx={btn} onClick={limpiar}>
            C
          </Button>
          <Button variant="contained" sx={btn} onClick={() => agregarNumero("0")}>
            0
          </Button>
          <Button variant="outlined" color="error" sx={btn} onClick={borrar}>
            ⌫
          </Button>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          Tip: puedes usar teclado numérico · Enter = Aceptar · Esc = Cerrar
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={aceptar}>
          Aceptar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
