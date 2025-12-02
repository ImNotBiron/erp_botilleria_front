import { Chip } from "@mui/material";

export default function EstadoChip({ online, active }: { online: number; active: number }) {
  if (!active) {
    return <Chip label="Inactivo" color="error" size="small" />;
  }

  return online
    ? <Chip label="En línea" color="success" size="small" />
    : <Chip label="Offline" color="default" size="small" />;
}
