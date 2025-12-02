import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function AdminLayout() {
  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      <Sidebar variant="admin" />

      <Box
        component="main"
        sx={{
          flex: 1,
          p: 3,
          overflowY: "auto",
          bgcolor: "background.default",
          display: "flex",
          flexDirection: "column",
          gap: 2,

          /* === OCULTAR SCROLL PERO MANTENERLO FUNCIONAL === */
          scrollbarWidth: "none", // Firefox
          "&::-webkit-scrollbar": {
            width: 0,             // Chrome, Edge, Safari → ancho 0 = invisible
            height: 0,
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "transparent",
          },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
