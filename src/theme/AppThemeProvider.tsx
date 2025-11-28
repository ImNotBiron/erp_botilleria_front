import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import { useMemo, useState } from "react";

export default function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<"light" | "dark">("light");

  // Futuro: mover este toggle a un store global
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === "light"
            ? {
                primary: { main: "#4f46e5" },     // Indigo moderno
                secondary: { main: "#0ea5e9" },   // Celestito minimal
                background: {
                  default: "#f3f4f6",            // Gris claro minimal
                  paper: "#ffffff",              // Papel clásico
                },
              }
            : {
                primary: { main: "#818cf8" },    // Indigo suave
                secondary: { main: "#38bdf8" },  // Azul eléctrico minimal
                background: {
                  default: "#0f172a",            // Azul muy oscuro
                  paper: "#1e293b",              // Azul gráfico
                },
                text: {
                  primary: "#e2e8f0",
                  secondary: "#94a3b8",
                },
              }),
        },
        shape: {
          borderRadius: 14,
        },
      }),
    [mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
