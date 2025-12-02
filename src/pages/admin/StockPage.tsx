import { Box, Typography } from "@mui/material";

export default function StockPage() {
  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={2}>
        Stock
      </Typography>

      <Typography color="text.secondary">
        Aquí verás existencias y actualizaciones de stock.
      </Typography>
    </Box>
  );
}
