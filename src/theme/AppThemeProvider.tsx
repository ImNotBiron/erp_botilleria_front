import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import { useMemo } from "react";
import { deepmerge } from "@mui/utils";
import { useThemeStore } from "../store/themeStore";

export default function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((s) => s.mode);

  const lightPalette = {
    palette: {
      mode: "light",
      primary: { main: "#4f46e5" },
      secondary: { main: "#0ea5e9" },
      background: {
        default: "#f3f4f6",
        paper: "#ffffff",
      },
      text: {
        primary: "#1e293b",
        secondary: "#475569",
      },
      divider: "rgba(0,0,0,0.12)",
    },
  };

  const darkPalette = {
    palette: {
      mode: "dark",
      primary: { main: "#818cf8" },
      secondary: { main: "#38bdf8" },
      background: {
        default: "#0f172a",
        paper: "#1e293b",
      },
      text: {
        primary: "#e2e8f0",
        secondary: "#94a3b8",
      },
      divider: "rgba(255,255,255,0.18)",
    },
  };

  const baseTheme = {
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: `"Inter", "Roboto", sans-serif`,
      button: { textTransform: "none", fontWeight: 600 },
    },
    components: {
      MuiCssBaseline: {
  styleOverrides: {
    body: {
      transition: "background-color 0.25s ease, color 0.25s ease",
    },

    /* Firefox */
    "*": {
      scrollbarWidth: "thin",
      scrollbarColor: "rgba(148,163,184,0.7) transparent",
    },

    /* Chrome, Edge, Safari */
    "*::-webkit-scrollbar": {
      width: 6,   // antes 8
      height: 6,  // antes 8
    },
    "*::-webkit-scrollbar-track": {
      backgroundColor: "transparent",
    },
    "*::-webkit-scrollbar-thumb": {
      backgroundColor: "rgba(148,163,184,0.7)",
      borderRadius: 999,
      border: "3px solid transparent", // más borde para que se vea aún más delgada
      backgroundClip: "content-box",
    },
    "*::-webkit-scrollbar-thumb:hover": {
      backgroundColor: "rgba(148,163,184,0.9)",
    },
  },
},

      MuiDrawer: {
        styleOverrides: {
          paper: {
            transition: "background-color 0.25s ease, width 0.25s ease",
          },
        },
      },

      MuiPaper: {
        styleOverrides: {
          root: {
            transition: "background-color 0.25s ease, border-color 0.25s ease",
          },
        },
      },

      MuiListItemButton: {
        styleOverrides: {
          root: {
            transition: "background-color 0.2s ease, color 0.2s ease",
            borderRadius: "10px",
          },
        },
      },
    },
  };

  const finalTheme = useMemo(() => {
    const palette = mode === "light" ? lightPalette : darkPalette;
    const merged = deepmerge(baseTheme, palette);

    // 🎨 BACKDROP real (sin romper tipado)
    merged.components!.MuiDrawer!.styleOverrides!.paper = {
      ...merged.components!.MuiDrawer!.styleOverrides!.paper,
      ...(mode === "dark"
        ? { backdropFilter: "blur(6px)", backgroundColor: "rgba(15,23,42,0.55)" }
        : { backdropFilter: "none", backgroundColor: "rgba(255,255,255,0.75)" }),
    };

    merged.components!.MuiPaper!.styleOverrides!.root = {
      ...merged.components!.MuiPaper!.styleOverrides!.root,
      ...(mode === "dark"
        ? { backdropFilter: "blur(3px)" }
        : { backdropFilter: "none" }),
    };

    return createTheme(merged);
  }, [mode]);

  return (
    <ThemeProvider theme={finalTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
