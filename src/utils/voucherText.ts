const LINE_WIDTH = 32;

// ---- ESC/POS helpers para RawBT ----
const ESC = "\x1b";
const GS = "\x1d";
const REVERSE_ON = GS + "B" + "\x01";  // reverse-print mode ON
const REVERSE_OFF = GS + "B" + "\x00"; // reverse-print mode OFF

export interface VoucherCabecera {
  id: number;
  fecha: string;
  tipo_venta: "NORMAL" | "INTERNA";
  total_general: number;
  total_afecto: number;
  total_exento: number;
  id_caja_sesion: number;
}

export interface VoucherItem {
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  precio_final: number;
  exento_iva: 0 | 1;
  es_promo?: 0 | 1;
}

export interface VoucherPago {
  tipo_pago: "EFECTIVO" | "GIRO" | "DEBITO" | "CREDITO" | "TRANSFERENCIA";
  monto: number;
}

export interface VoucherData {
  cabecera: VoucherCabecera;
  items: VoucherItem[];
  pagos: VoucherPago[];
}

const formatCLP = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);

const padRight = (txt: string, width: number) =>
  txt.length > width ? txt.slice(0, width) : txt + " ".repeat(width - txt.length);

const padLeft = (txt: string, width: number) =>
  txt.length > width ? txt.slice(0, width) : " ".repeat(width - txt.length) + txt;

const separator = (char = "-") => char.repeat(LINE_WIDTH);

const centerText = (txt: string) => {
  if (txt.length >= LINE_WIDTH) return txt.slice(0, LINE_WIDTH);
  const spaces = Math.floor((LINE_WIDTH - txt.length) / 2);
  return " ".repeat(spaces) + txt;
};

/**
 * Devuelve un string pensado para ESC/POS (RawBT).
 * Para PC limpiamos los bytes de control antes de mostrar/imprimir.
 */
export function buildVoucherText(data: VoucherData, nombreLocal = "Botillería El Paraíso") {
  const { cabecera, items, pagos } = data;

  const lineas: string[] = [];

  // HEADER
  lineas.push(padRight(nombreLocal.toUpperCase(), LINE_WIDTH));
  lineas.push(separator("="));
  lineas.push(`Venta N° ${cabecera.id || "(PREVIEW)"}`);
  lineas.push(
    new Date(cabecera.fecha).toLocaleString("es-CL", {
      dateStyle: "short",
      timeStyle: "short",
    })
  );
  lineas.push(`Caja sesión: ${cabecera.id_caja_sesion}`);
  lineas.push(`Tipo: ${cabecera.tipo_venta === "NORMAL" ? "NORMAL" : "INTERNA"}`);
  lineas.push(separator());

  // ITEMS
  lineas.push("DETALLE");
  lineas.push(separator());

  items.forEach((it) => {
    const etiquetaExento = it.exento_iva === 1 ? " (EX)" : "";
    const etiquetaPromo = it.es_promo === 1 ? " [PROMO]" : "";

    const nombre = `${it.nombre_producto}${etiquetaExento}${etiquetaPromo}`;
    if (nombre.length <= LINE_WIDTH) {
      lineas.push(nombre);
    } else {
      for (let i = 0; i < nombre.length; i += LINE_WIDTH) {
        lineas.push(nombre.slice(i, i + LINE_WIDTH));
      }
    }

    const cantStr = `${it.cantidad}x`;
    const precioStr = formatCLP(it.precio_unitario);
    const subTotalStr = formatCLP(it.precio_final);

    const left = `${cantStr} ${precioStr}`;
    const line = padRight(left, LINE_WIDTH - subTotalStr.length) + subTotalStr;
    lineas.push(line);
  });

  lineas.push(separator());

  // TOTALES
  lineas.push(
    padRight("TOTAL:", LINE_WIDTH - formatCLP(cabecera.total_general).length) +
      formatCLP(cabecera.total_general)
  );
  lineas.push(
    padRight("Afecto:", LINE_WIDTH - formatCLP(cabecera.total_afecto).length) +
      formatCLP(cabecera.total_afecto)
  );
  lineas.push(
    padRight("Exento:", LINE_WIDTH - formatCLP(cabecera.total_exento).length) +
      formatCLP(cabecera.total_exento)
  );

  lineas.push(separator());

  // PAGOS
  lineas.push("PAGOS");
  lineas.push(separator());

  pagos.forEach((p) => {
    const etiqueta =
      p.tipo_pago === "EFECTIVO"
        ? "Efectivo"
        : p.tipo_pago === "GIRO"
        ? "Giro"
        : p.tipo_pago === "DEBITO"
        ? "Débito"
        : p.tipo_pago === "CREDITO"
        ? "Crédito"
        : "Transfer.";
    const montoStr = formatCLP(p.monto);
    lineas.push(
      padRight(etiqueta, LINE_WIDTH - montoStr.length) + montoStr
    );
  });

  const totalPagos = pagos.reduce((acc, p) => acc + p.monto, 0);
  const vuelto = Math.max(totalPagos - cabecera.total_general, 0);

  lineas.push(separator());
  lineas.push(
    padRight("Total Pagos:", LINE_WIDTH - formatCLP(totalPagos).length) +
      formatCLP(totalPagos)
  );

  // ==== BLOQUE VUELTO EN NEGRO (REVERSE MODE ESC/POS) ====
  if (vuelto > 0) {
    const vueltoStr = formatCLP(vuelto);

    lineas.push(""); // pequeña separación

    // línea título
    lineas.push(
      REVERSE_ON +
        centerText(" VUELTO AL CLIENTE ") +
        REVERSE_OFF
    );

    // línea monto
    const lineaVuelto =
      REVERSE_ON +
      (padRight("VUELTO:", LINE_WIDTH - vueltoStr.length) + vueltoStr) +
      REVERSE_OFF;

    lineas.push(lineaVuelto);
    lineas.push(""); // espacio después del bloque
  }

  // Footer
  lineas.push(separator());
  lineas.push(
    centerText("Gracias por su compra")
  );
  lineas.push("");
  lineas.push("");
  lineas.push(""); // espacio final

  return lineas.join("\n");
}
