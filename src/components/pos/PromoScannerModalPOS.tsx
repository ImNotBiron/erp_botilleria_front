import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Paper,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LocalBarIcon from "@mui/icons-material/LocalBar";
import LocalDrinkIcon from "@mui/icons-material/LocalDrink";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";

// =============================
// TIPOS
// =============================

export interface ProductoBase {
  id: number;
  codigo_producto: string;
  nombre_producto: string;
  precio_producto: number;
  exento_iva: 0 | 1;
  capacidad?: number;
  id_categoria?: number;
}

export interface PromoCartItem extends ProductoBase {
  cantidad: number;
  es_promo?: boolean;
  promoId?: number;
}

interface PromoScannerModalPOSProps {
  open: boolean;
  onClose: () => void;
  onPromoAdd: (items: PromoCartItem[]) => void;
  // 👉 Esta función la implementas en PosVentaPage
  buscarProductoPorCodigo: (codigo: string) => Promise<ProductoBase>;
}

// Config local – adapta a tu realidad si quieres
const FORMATOS_BEBIDA = [1500, 1750, 2000, 2250, 2500, 3000];
const CAT_LICORES = [3, 4, 5];
const CAT_BEBIDAS = [2];

export const PromoScannerModalPOS: React.FC<PromoScannerModalPOSProps> = ({
  open,
  onClose,
  onPromoAdd,
  buscarProductoPorCodigo,
}) => {
  const [paso, setPaso] = useState<0 | 1 | 2>(0);
  const [licor, setLicor] = useState<ProductoBase | null>(null);
  const [scanBuffer, setScanBuffer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Mantener foco mientras esté abierto
  useEffect(() => {
    if (open && paso !== 2) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [open, paso, scanBuffer, error]);

  // Reset al abrir
  useEffect(() => {
    if (open) {
      setPaso(0);
      setLicor(null);
      setScanBuffer("");
      setError("");
    }
  }, [open]);

  // =============================
  // PROCESAR CÓDIGO DE BARRAS
  // =============================

  const procesarCodigo = async (codigo: string) => {
    setLoading(true);
    setError("");

    try {
      const producto = await buscarProductoPorCodigo(codigo);
      if (!producto) throw new Error("Producto no encontrado");

      // PASO 1: LICOR
      if (paso === 0) {
        if (!producto.id_categoria || !CAT_LICORES.includes(producto.id_categoria)) {
          throw new Error(`"${producto.nombre_producto}" no es un licor válido.`);
        }
        setLicor(producto);
        setPaso(1);
        setScanBuffer("");
        return;
      }

      // PASO 2: BEBIDA
      if (paso === 1) {
        if (!producto.id_categoria || !CAT_BEBIDAS.includes(producto.id_categoria)) {
          throw new Error(`"${producto.nombre_producto}" no es una bebida válida.`);
        }
        if (!producto.capacidad || !FORMATOS_BEBIDA.includes(producto.capacidad)) {
          throw new Error(
            `Formato inválido (${producto.capacidad} cc). Solo se aceptan entre 1.5L y 3L.`
          );
        }

        if (!licor) throw new Error("Primero debe seleccionarse un licor.");

        armarCombo(licor, producto);
      }
    } catch (err: any) {
      setError(err?.message || "Error al procesar código");
      setScanBuffer("");
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // ARMAR COMBO
  // =============================

  const armarCombo = (prodLicor: ProductoBase, prodBebida: ProductoBase) => {
    const promoId = Date.now();

    const items: PromoCartItem[] = [
      {
        ...prodLicor,
        cantidad: 1,
        es_promo: true,
        promoId,
      },
      {
        ...prodBebida,
        cantidad: 1,
        es_promo: true,
        promoId,
      },
      {
        // ❗ Ajusta este producto de hielo según tu BD real
        id: 11,
        codigo_producto: "HIELO01",
        nombre_producto: "Hielo 1KG (Regalo)",
        precio_producto: 0,
        exento_iva: 0,
        cantidad: 1,
        es_promo: true,
        promoId,
      },
    ];

    onPromoAdd(items);
    setPaso(2);

    // Cerrar solo después de mostrar “combo agregado”
    setTimeout(() => onClose(), 1500);
  };

  // =============================
  // INPUT INVISIBLE
  // =============================

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScanBuffer(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scanBuffer.trim()) procesarCodigo(scanBuffer.trim());
  };

  // =============================
  // RENDER
  // =============================

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4, overflow: "hidden" } }}
    >
      {/* CABECERA */}
      <Box
        sx={{
          bgcolor: paso === 2 ? "success.main" : "secondary.main",
          color: "white",
          p: 2.5,
          textAlign: "center",
          transition: "0.3s",
          position: "relative",
        }}
      >
        <Typography variant="h6" fontWeight="bold" sx={{ letterSpacing: 1 }}>
          {paso === 0 && "PASO 1: ESCANEE LICOR 🥃"}
          {paso === 1 && "PASO 2: ESCANEE BEBIDA 🥤"}
          {paso === 2 && "¡COMBO AGREGADO! 🎉"}
        </Typography>

        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 10, top: 10, color: "white" }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* CONTENIDO */}
      <DialogContent
        sx={{
          p: 4,
          textAlign: "center",
          minHeight: 300,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* ICONO CENTRAL */}
        <Box sx={{ mb: 3 }}>
          <Paper
            elevation={4}
            sx={{
              width: 140,
              height: 140,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: paso === 2 ? "#e8f5e9" : "#f3e5f5",
              transition: "all 0.3s ease",
            }}
          >
            {loading ? (
              <CircularProgress color="secondary" />
            ) : paso === 0 ? (
              <LocalBarIcon sx={{ fontSize: 72, color: "#7b1fa2" }} />
            ) : paso === 1 ? (
              <LocalDrinkIcon sx={{ fontSize: 72, color: "#d81b60" }} />
            ) : (
              <CheckCircleIcon sx={{ fontSize: 72, color: "#2e7d32" }} />
            )}
          </Paper>
        </Box>

        {/* INFO LICOR SELECCIONADO */}
        {paso === 1 && licor && (
          <Box
            sx={{
              mb: 2,
              p: 1,
              bgcolor: "background.default",
              borderRadius: 2,
              width: "100%",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              LICOR SELECCIONADO:
            </Typography>
            <Typography variant="h6" color="primary.main" fontWeight="bold">
              {licor.nombre_producto}
            </Typography>
          </Box>
        )}

        {/* INPUT INVISIBLE PARA LA PISTOLA */}
        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <input
            ref={inputRef}
            value={scanBuffer}
            onChange={handleInput}
            onBlur={() => {
              if (open && paso !== 2) inputRef.current?.focus();
            }}
            style={{
              opacity: 0,
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: "100%",
              cursor: "default",
              zIndex: 1,
            }}
            autoFocus
            autoComplete="off"
          />
        </form>

        {/* FEEDBACK */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            opacity: 0.6,
            mt: "auto",
          }}
        >
          <QrCodeScannerIcon fontSize="small" />
          <Typography variant="body2">
            Esperando lectura de código de barras...
          </Typography>
        </Box>

        {/* ERRORES */}
        {error && (
          <Alert
            severity="error"
            variant="filled"
            sx={{ mt: 3, width: "100%", borderRadius: 2 }}
          >
            {error}
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
};
