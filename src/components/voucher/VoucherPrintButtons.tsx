import React from "react";
import { Stack, Button, Tooltip } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import SmartphoneIcon from "@mui/icons-material/Smartphone";

interface Props {
  voucherText: string;
}

/**
 * Detecta si el navegador corre en Android
 */
const isAndroid = () => /Android/i.test(navigator.userAgent || "");

const encodeBase64 = (str: string) =>
  btoa(unescape(encodeURIComponent(str)));

export const VoucherPrintButtons: React.FC<Props> = ({ voucherText }) => {
  // PC: abre una ventana nueva con <pre> y dispara window.print()
const handlePrintPC = () => {
  // Eliminamos caracteres de control ESC/POS para que en PC
  // no se vean símbolos raros.
  const printable = voucherText.replace(/[^\x20-\x7E\n]/g, "");

  const win = window.open("", "_blank", "width=600,height=800");
  if (!win) return;

  win.document.write(`
    <html>
      <head>
        <title>Voucher</title>
        <style>
          body { font-family: monospace; padding: 8px; }
          pre { font-family: monospace; font-size: 11px; }
        </style>
      </head>
      <body>
        <pre>${printable.replace(/</g, "&lt;")}</pre>
        <script>
          window.print();
        </script>
      </body>
    </html>
  `);
  win.document.close();
};


  // Android: dispara RawBT usando su esquema de URL
  // (RawBT interpreta el texto como ESC/POS simple/RAW).
  const handlePrintAndroid = () => {
    const base64 = encodeBase64(voucherText + "\n\n\n");

    // Muchos navegadores móviles abren RawBT con este esquema:
    // rawbt:base64,<data>
    // Si tu config es distinta, solo ajustar esta línea.
    const url = `rawbt:base64,${base64}`;
    window.location.href = url;
  };

  const android = isAndroid();

  return (
    <Stack direction="row" spacing={1}>
      {/* Botón genérico PC (si estás en Android igual funciona, abre el print normal) */}
      <Tooltip title="Imprimir con el sistema de impresión del navegador">
        <span>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PrintIcon />}
            onClick={handlePrintPC}
          >
            Imprimir PC
          </Button>
        </span>
      </Tooltip>

      {/* Botón RawBT visible solo en Android */}
      {android && (
        <Tooltip title="Enviar a RawBT (impresora térmica)">
          <span>
            <Button
              variant="contained"
              color="secondary"
              size="small"
              startIcon={<SmartphoneIcon />}
              onClick={handlePrintAndroid}
            >
              Imprimir RawBT
            </Button>
          </span>
        </Tooltip>
      )}
    </Stack>
  );
};
