import {
  Box,
  Paper,
  TextField,
  Typography,
  Button,
  CircularProgress,
  Fade,
  Avatar,
  useTheme,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import { useState } from "react";
import { useAuthStore } from "../../store/authStore";

// ==== Formateador de RUT ====
function formatearRut(rut: string) {
  rut = rut.replace(/[^0-9kK]/g, "").toUpperCase();

  if (rut.length <= 1) return rut;

  const cuerpo = rut.slice(0, -1);
  const dv = rut.slice(-1);

  const cuerpoConPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${cuerpoConPuntos}-${dv}`;
}

export default function LoginPage() {
  const theme = useTheme();
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);

  const [rut, setRut] = useState("");
  const [rutFormateado, setRutFormateado] = useState("");
  const [error, setError] = useState("");

 const handleChangeRut = (value: string) => {
  const limpio = value.replace(/[^0-9kK]/g, "");
  setRut(limpio);
  setRutFormateado(formatearRut(limpio));
};


  const handleLogin = async () => {
  setError("");

  // limpiar todo menos números y K/k
  let limpio = rut.replace(/[.\-]/g, "").toUpperCase();

  if (limpio.length < 2) {
    setError("RUT incompleto");
    return;
  }

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);

  const rutParaBackend = `${cuerpo}-${dv}`;

  console.log("RUT enviado al backend:", rutParaBackend);

  const ok = await login(rutParaBackend);

  if (!ok) {
    setError("RUT incorrecto o no registrado");
  }
};

  return (
    <Box
      sx={{
        width: "100%",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        background: theme.palette.mode === "dark"
          ? "linear-gradient(135deg, #0e0e0e, #1c1c1c)"
          : "linear-gradient(135deg, #f0f4ff, #e8ecf5)",
      }}
    >
      <Fade in timeout={600}>
        <Paper
          elevation={4}
          sx={{
            p: 4,
            width: "100%",
            maxWidth: 400,
            borderRadius: 4,
            textAlign: "center",
            background: theme.palette.background.paper,
          }}
        >
          <Avatar
            sx={{
              bgcolor: theme.palette.primary.main,
              width: 64,
              height: 64,
              margin: "0 auto 16px auto",
            }}
          >
            <PersonIcon sx={{ fontSize: 34 }} />
          </Avatar>

          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            ERP Botillería
          </Typography>

          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
            Ingrese su RUT para continuar
          </Typography>

          <TextField
            label="RUT"
            fullWidth
            sx={{ mb: 3 }}
            value={rutFormateado}
            onChange={(e) => handleChangeRut(e.target.value)}
            autoFocus
          />

          {error && (
            <Typography
              variant="body2"
              sx={{ color: "error.main", mb: 2 }}
            >
              {error}
            </Typography>
          )}

          <Button
            variant="contained"
            fullWidth
            sx={{ py: 1.2, fontWeight: 600, borderRadius: 2 }}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? <CircularProgress size={22} /> : "Ingresar"}
          </Button>

          <Typography
            variant="body2"
            sx={{ mt: 3, color: "text.secondary" }}
          >
            © {new Date().getFullYear()} Botillería El Paraíso
          </Typography>
        </Paper>
      </Fade>
    </Box>
  );
}
