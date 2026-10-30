import { useState, useRef, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Stack,
  Divider,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";

import SearchIcon from "@mui/icons-material/Search";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteIcon from "@mui/icons-material/DeleteForever";
import CalculateIcon from "@mui/icons-material/Calculate";

import { api } from "../../api/api";

import { CalculadoraModalPOS } from "../../components/pos/CalculadoraModalPOS";
import {
  PromoScannerModalPOS,
  type PromoCartItem,
} from "../../components/pos/PromoScannerModalPOS";
import {
  PromoArmadaModalPOS,
  type PromoArmada,
} from "../../components/pos/PromoArmadaModalPOS";
import { buildVoucherText, type VoucherData } from "../../utils/voucherText";
import { VoucherPrintButtons } from "../../components/voucher/VoucherPrintButtons";
import { QuantityModalPOS } from "../../components/pos/QuantityModalPOS";

type MedioPago = "EFECTIVO" | "GIRO" | "DEBITO" | "CREDITO" | "TRANSFERENCIA";
export type PromoTipo = "ARMADA" | "NORMAL" | "SCANNER";

type ItemCarrito = {
  id: string;
  id_producto: number;
  codigo: string;
  nombre: string;
  precio: number; // precio unitario que se está usando en el POS
  cantidad: number;
  exento: boolean;
  esPromo?: boolean;
  promoId?: number;
  // --- datos para mayorista ---
  precioBase?: number; // precio_venta normal
  precioMayorista?: number | null;
  cantidadMayorista?: number | null;
  esMayorista?: boolean;
  promoTipo?: PromoTipo;
};

interface ProductoApi {
  id: number;
  codigo_producto: string;
  nombre_producto: string;
  precio_venta: number;
  exento_iva: 0 | 1;
  capacidad_ml?: number | null;
  id_categoria?: number | null;

  // mayorista (vienen desde la API)
  cantidad_mayorista?: number | null;
  precio_mayorista?: number | null;
}

type ProductoBase = Omit<ProductoApi, "id_categoria"> & {
  id_categoria?: number; // sin null
};

type Pago = {
  id: string;
  tipo: MedioPago;
  monto: number;
};

// ====================
// Helpers de formato
// ====================

const formatMilesCL = (n: number) =>
  new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(n);

const parseMontoCLP = (s: string) => {
  const digits = (s || "").replace(/\D/g, "");
  return digits ? Number(digits) : 0;
};

const formatCLP = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);

// ====================
// Lógica de pagos (función pura)
// ====================

/**
 * Medios que pueden pagar productos EXENTOS (y generar vuelto).
 */
const esEfectivo = (t: MedioPago) => t === "EFECTIVO" || t === "GIRO";

/**
 * Evalúa el estado completo de los pagos contra el carrito.
 *
 * Reglas de negocio:
 *  1) Los medios NO efectivo (débito, crédito, transferencia) solo pueden
 *     cubrir el monto AFECTO. Es decir: sum(noEfectivo) <= totalAfecto.
 *     Esto equivale a que el efectivo/giro neto cubra todo el exento.
 *  2) El vuelto solo puede salir de EFECTIVO/GIRO: vuelto <= efectivo.
 *
 * No depende del orden en que se ingresaron los pagos y se puede
 * recalcular siempre que cambie el carrito o los pagos.
 */
const evaluarPagos = (pagos: Pago[], total: number, totalAfecto: number) => {
  const efectivo = pagos
    .filter((p) => esEfectivo(p.tipo))
    .reduce((acc, p) => acc + p.monto, 0);

  const noEfectivo = pagos
    .filter((p) => !esEfectivo(p.tipo))
    .reduce((acc, p) => acc + p.monto, 0);

  const totalPagos = efectivo + noEfectivo;
  const saldo = total - totalPagos;
  const vuelto = Math.max(0, -saldo);

  let error: string | null = null;

  if (noEfectivo > totalAfecto) {
    error =
      totalAfecto > 0
        ? `Con débito/crédito/transferencia solo puedes pagar hasta ${formatCLP(
            totalAfecto
          )} (monto afecto). El resto, incluidos los productos exentos, debe pagarse con EFECTIVO o GIRO.`
        : "Todos los productos del carrito son exentos: deben pagarse únicamente con EFECTIVO o GIRO.";
  } else if (vuelto > efectivo) {
    error =
      "El exceso de pago no se puede devolver: el vuelto solo puede salir de pagos en EFECTIVO o GIRO.";
  }

  return { efectivo, noEfectivo, totalPagos, saldo, vuelto, error };
};

export default function PosVentaPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Escáner
  const [codigo, setCodigo] = useState("");
  const codigoInputRef = useRef<HTMLInputElement | null>(null);

  // Carrito
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);

  const [calcOpen, setCalcOpen] = useState(false);

  // Pagos múltiples
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [nuevoTipoPago, setNuevoTipoPago] = useState<MedioPago>("EFECTIVO");
  const [nuevoMontoPago, setNuevoMontoPago] = useState<string>("");

  // Estados generales
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Promo / confirmación
  const [promoOpen, setPromoOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Promo Armada
  const [promoArmadaOpen, setPromoArmadaOpen] = useState(false);

  const POS_STORAGE_KEY = "pos_venta_borrador_v1";

  // Flag para no sobreescribir el storage antes de cargar
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Voucher
  const [voucherPreviewOpen, setVoucherPreviewOpen] = useState(false);
  const [voucherPreviewText, setVoucherPreviewText] = useState<string>("");

  // Modal cantidad
  const [cantidadModalOpen, setCantidadModalOpen] = useState(false);
  const [itemCantidadTarget, setItemCantidadTarget] =
    useState<ItemCarrito | null>(null);

  const aplicarMayorista = (
    item: ItemCarrito,
    nuevaCantidad: number,
    prodInfo?: ProductoApi
  ): ItemCarrito => {
    const base = item.precioBase ?? prodInfo?.precio_venta ?? item.precio;

    const cantMay = item.cantidadMayorista ?? prodInfo?.cantidad_mayorista ?? 0;

    const precioMay = item.precioMayorista ?? prodInfo?.precio_mayorista ?? 0;

    let precioUnit = base;
    let esMayorista = false;

    if (cantMay && precioMay && nuevaCantidad >= cantMay) {
      precioUnit = precioMay;
      esMayorista = true;
    }

    return {
      ...item,
      cantidad: nuevaCantidad,
      precio: precioUnit,
      precioBase: base,
      cantidadMayorista: cantMay || undefined,
      precioMayorista: precioMay || undefined,
      esMayorista,
    };
  };

  // ====================
  // Totales (todo derivado del estado)
  // ====================

  const subtotalItem = (item: ItemCarrito): number =>
    item.precio * item.cantidad;

  const total = carrito.reduce((acc, item) => acc + subtotalItem(item), 0);
  const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);

  const totalExento = carrito.reduce(
    (acc, item) => (item.exento ? acc + subtotalItem(item) : acc),
    0
  );
  const totalAfecto = total - totalExento;

  // Estado de pagos: se recalcula en cada render, así si el carrito cambia
  // después de ingresar pagos (o se restaura un borrador) queda validado.
  const resumenPagos = evaluarPagos(pagos, total, totalAfecto);
  const { totalPagos, saldo, vuelto } = resumenPagos;
  const tieneEfectivoOGiro = resumenPagos.efectivo > 0;

  const puedeCobrar =
    carrito.length > 0 && pagos.length > 0 && saldo <= 0 && !resumenPagos.error;

  // Cargar borrador de venta al montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem(POS_STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);

        if (data.carrito && Array.isArray(data.carrito)) {
          setCarrito(data.carrito);
        }
        if (data.pagos && Array.isArray(data.pagos)) {
          setPagos(data.pagos);
        }
        if (data.nuevoTipoPago) {
          setNuevoTipoPago(data.nuevoTipoPago);
        }
        if (typeof data.nuevoMontoPago === "string") {
          setNuevoMontoPago(data.nuevoMontoPago);
        }
      }
    } catch (e) {
      console.warn("No se pudo cargar borrador POS", e);
    } finally {
      // Marcamos que ya intentamos cargar
      setDraftLoaded(true);
    }
  }, []);

  // Guardar borrador en localStorage cuando cambian datos clave
  useEffect(() => {
    // Si aún no cargamos el borrador inicial, NO guardamos
    if (!draftLoaded) return;

    const borrador = {
      carrito,
      pagos,
      nuevoTipoPago,
      nuevoMontoPago,
    };

    try {
      localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(borrador));
    } catch (e) {
      console.warn("No se pudo guardar borrador POS", e);
    }
  }, [carrito, pagos, nuevoTipoPago, nuevoMontoPago, draftLoaded]);

  // ====================
  // Focus pistola
  // ====================

  useEffect(() => {
    codigoInputRef.current?.focus();
  }, []);

  const refocusScanner = () => {
    setTimeout(() => {
      codigoInputRef.current?.focus();
    }, 50);
  };

  const handleGlobalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const tag = target.tagName.toLowerCase();

    // Si el click fue en un control interactivo, NO forzamos el focus
    if (
      tag === "input" ||
      tag === "textarea" ||
      tag === "button" ||
      target.closest("button, [role='button'], [data-no-scanner-focus]")
    ) {
      return;
    }

    codigoInputRef.current?.focus();
  };

  // ====================
  // API productos
  // ====================

  const buscarProductoPorCodigo = async (
    codigo: string
  ): Promise<ProductoBase> => {
    const res = await api.get(`/productos/codigo/${codigo}`);
    const p = res.data as ProductoApi;

    return {
      ...p,
      id_categoria: p.id_categoria ?? undefined, // null -> undefined
    };
  };

  // ====================
  // Carrito
  // ====================

  const handleAgregarProductoPorCodigo = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cod = codigo.trim();

    // Si no hay código, igual refocus y salimos
    if (!cod) {
      refocusScanner();
      return;
    }

    // Limpia SIEMPRE el input antes de hacer la búsqueda
    setCodigo("");

    try {
      const prod = await buscarProductoPorCodigo(cod);

      setCarrito((prev) => {
        // ¿ya existe este producto (no promo) en el carrito?
        const idx = prev.findIndex(
          (it) => !it.esPromo && it.id_producto === prod.id
        );

        // Si ya existe → solo sumamos cantidad y recalculamos mayorista
        if (idx >= 0) {
          const updated = [...prev];
          const actual = updated[idx];
          const nuevaCant = actual.cantidad + 1;
          updated[idx] = aplicarMayorista(actual, nuevaCant, prod);
          return updated;
        }

        // Si no existe → lo agregamos nuevo
        const nuevo: ItemCarrito = aplicarMayorista(
          {
            id: crypto.randomUUID(),
            id_producto: prod.id,
            codigo: prod.codigo_producto,
            nombre: prod.nombre_producto,
            precio: prod.precio_venta,
            cantidad: 1,
            exento: prod.exento_iva === 1,
            precioBase: prod.precio_venta,
            cantidadMayorista: prod.cantidad_mayorista ?? undefined,
            precioMayorista: prod.precio_mayorista ?? undefined,
            esMayorista: false,
          },
          1,
          prod
        );

        return [...prev, nuevo];
      });
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.error ||
          `No se pudo encontrar el producto para el código: ${cod}`
      );
    } finally {
      refocusScanner();
    }
  };

  const handleEliminarItem = (id: string) => {
    setCarrito((prev) => {
      const item = prev.find((it) => it.id === id);
      if (!item) return prev;

      // Si es parte de un combo → eliminamos todo el combo
      if (item.esPromo && item.promoId != null) {
        return prev.filter((it) => it.promoId !== item.promoId);
      }

      // Producto normal → elimina solo esa fila
      return prev.filter((it) => it.id !== id);
    });

    refocusScanner();
  };

  const cambiarCantidad = (id: string, delta: number) => {
    setCarrito((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        // NO permitir editar cantidades de ítems de promoción (combos)
        if (item.esPromo) {
          return item;
        }

        const nuevaCant = Math.max(1, item.cantidad + delta);
        return aplicarMayorista(item, nuevaCant);
      })
    );
    refocusScanner();
  };

  const handleOpenCantidadModal = (item: ItemCarrito) => {
    // No permitir editar combos
    if (item.esPromo) return;
    setItemCantidadTarget(item);
    setCantidadModalOpen(true);
  };

  const handleConfirmCantidadModal = (nuevaCantidad: number) => {
    if (!itemCantidadTarget) {
      setCantidadModalOpen(false);
      return;
    }

    setCarrito((prev) =>
      prev.map((it) => {
        if (it.id !== itemCantidadTarget.id) return it;
        return aplicarMayorista(it, nuevaCantidad);
      })
    );

    setCantidadModalOpen(false);
    setItemCantidadTarget(null);
    refocusScanner();
  };

  const handleCloseCantidadModal = () => {
    setCantidadModalOpen(false);
    setItemCantidadTarget(null);
    refocusScanner();
  };

  const handlePromoAddToCart = (promoItems: PromoCartItem[]) => {
    setCarrito((prev) => {
      const mapped: ItemCarrito[] = promoItems.map((p) => ({
        id: crypto.randomUUID(),
        id_producto: p.id,
        codigo: p.codigo_producto,
        nombre: p.nombre_producto,
        precio: p.precio_venta,
        precioBase: p.precio_venta,
        cantidad: p.cantidad,
        exento: p.exento_iva === 1,
        esPromo: !!p.es_promo,
        promoId: p.promoId,
        promoTipo: "SCANNER", // combo escáner
        cantidadMayorista: null,
        precioMayorista: null,
        esMayorista: false,
      }));

      return [...prev, ...mapped];
    });

    refocusScanner();
  };

  const handleAgregarPromoArmadaAlCarrito = (promo: PromoArmada) => {
    const promoId = promo.id;
    const precioPromo = Number(promo.precio_promocion) || 0;

    const itemsToAdd: ItemCarrito[] = [];
    let precioAsignado = false;

    for (const it of promo.items) {
      let precio = it.precio_venta;

      // Promo armada:
      //  - el primero NO gratis lleva el precio_promocion completo
      //  - los demás van a $0
      //
      // OJO: esto concentra todo el precio de la promo en un solo producto,
      // por lo que el split afecto/exento depende de cuál sea el "primero".
      // Si la promo mezcla productos exentos y afectos, conviene definir una
      // regla de prorrateo (idealmente calculada en el backend).
      if (!it.es_gratis) {
        if (!precioAsignado && precioPromo > 0) {
          precio = precioPromo;
          precioAsignado = true;
        } else {
          precio = 0;
        }
      } else {
        // si en BD está marcado como gratis, siempre $0
        precio = 0;
      }

      itemsToAdd.push({
        id: crypto.randomUUID(),
        id_producto: it.id_producto,
        codigo: it.codigo_producto,
        nombre: it.nombre_producto,
        precio,
        cantidad: it.cantidad,
        exento: it.exento_iva === 1,
        esPromo: true,
        promoId,
        promoTipo: "ARMADA", // diferenciamos promo armada
      });
    }

    setCarrito((prev) => [...prev, ...itemsToAdd]);
    setPromoArmadaOpen(false);
    refocusScanner();
  };

  // ====================
  // Validación del pago que se está tipeando
  // ====================

  // Simulamos agregar el pago actual y evaluamos el estado FINAL.
  // Así la regla es una sola y no depende del orden de ingreso.
  const montoNuevo = parseMontoCLP(nuevoMontoPago);

  const errorPagoActual: string | null = !montoNuevo
    ? null
    : saldo <= 0
    ? "No hay saldo pendiente por cobrar."
    : // Débito / crédito / transferencia NUNCA pueden generar vuelto:
    // no pueden superar el saldo pendiente al momento de ingresarlos.
    // Solo EFECTIVO / GIRO pueden exceder el saldo (el exceso es el vuelto).
    !esEfectivo(nuevoTipoPago) && montoNuevo > saldo
    ? `Con ${nuevoTipoPago} no se puede dar vuelto: el máximo es ${formatCLP(
        saldo
      )} (saldo pendiente). Si el cliente entrega más, ingrésalo en EFECTIVO.`
    : evaluarPagos(
        [...pagos, { id: "tmp", tipo: nuevoTipoPago, monto: montoNuevo }],
        total,
        totalAfecto
      ).error;

  const montoIngresadoValido = montoNuevo > 0 && !errorPagoActual;

  // ====================
  // Pagos múltiples
  // ====================

  const handleLlenarConTotal = () => {
    if (saldo <= 0) {
      setNuevoMontoPago("");
      refocusScanner();
      return;
    }

    // Efectivo / giro: puede cubrir todo el saldo
    if (esEfectivo(nuevoTipoPago)) {
      setNuevoMontoPago(formatMilesCL(saldo));
      refocusScanner();
      return;
    }

    // Medios no efectivo: solo hasta lo que quede del monto afecto
    const maxExtraNoEfectivo = totalAfecto - resumenPagos.noEfectivo;
    const sugerido = Math.min(saldo, maxExtraNoEfectivo);

    setNuevoMontoPago(sugerido > 0 ? formatMilesCL(sugerido) : "");
    refocusScanner();
  };

  const handleAgregarPago = () => {
    setSuccess(null);
    setError(null);

    if (!montoNuevo || montoNuevo <= 0) {
      setError("Ingresa un monto válido para el pago.");
      return;
    }

    if (errorPagoActual) {
      setError(errorPagoActual);
      return;
    }

    setPagos((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        tipo: nuevoTipoPago,
        monto: montoNuevo,
      },
    ]);
    setNuevoMontoPago("");
    refocusScanner();
  };

  const handleEliminarPago = (id: string) => {
    setPagos((prev) => prev.filter((p) => p.id !== id));
    refocusScanner();
  };

  // ====================
  // Confirmación y Cobro
  // ====================

  const handleAbrirConfirmacion = () => {
    setError(null);
    setSuccess(null);

    if (!carrito.length) {
      setError("No hay productos en el carrito.");
      return;
    }

    if (!pagos.length) {
      setError("Debes agregar al menos un medio de pago.");
      return;
    }

    // Falta plata → no se puede avanzar
    if (saldo > 0) {
      setError(
        "Los pagos no cubren el total de la venta. Revisa el saldo antes de cobrar."
      );
      return;
    }

    // Regla de negocio (exentos / vuelto)
    if (resumenPagos.error) {
      setError(resumenPagos.error);
      return;
    }

    setConfirmOpen(true);
  };

  const handleGenerarVoucherPreview = () => {
    setError(null);
    setSuccess(null);

    if (!carrito.length) {
      setError("No hay productos en el carrito para generar el voucher.");
      return;
    }

    if (!pagos.length) {
      setError(
        "Debes ingresar al menos un medio de pago antes de generar el voucher."
      );
      return;
    }

    if (resumenPagos.error) {
      setError(resumenPagos.error);
      return;
    }

    // Armamos una "cabecera" temporal (sin id de venta real)
    const cabecera = {
      id: 0, // aún no se registra la venta
      fecha: new Date().toISOString(),
      tipo_venta: "NORMAL" as const,
      total_general: total,
      total_afecto: totalAfecto,
      total_exento: totalExento,
      id_caja_sesion: 0, // si quieres, luego lo puedes reemplazar por el real
    };

    const itemsVoucher = carrito.map((it) => ({
      nombre_producto: it.nombre,
      cantidad: it.cantidad,
      precio_unitario: it.precio,
      precio_final: it.precio * it.cantidad,
      exento_iva: (it.exento ? 1 : 0) as 0 | 1,
      es_promo: (it.esPromo ? 1 : 0) as 0 | 1,
    }));

    const pagosVoucher = pagos.map((p) => ({
      tipo_pago: p.tipo,
      monto: p.monto,
    }));

    const data: VoucherData = {
      cabecera,
      items: itemsVoucher,
      pagos: pagosVoucher,
    };

    const texto = buildVoucherText(data, "Botillería El Paraíso");

    setVoucherPreviewText(texto);
    setVoucherPreviewOpen(true);
  };

  const handleConfirmarVenta = async () => {
    try {
      setError(null);
      setSuccess(null);
      setEnviando(true);

      // Revalidación final por seguridad (estado puede haber cambiado)
      if (resumenPagos.error || saldo > 0) {
        throw new Error(
          resumenPagos.error ||
            "Los pagos no cubren el total de la venta."
        );
      }

      const payloadItems = carrito.map((item) => ({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        es_promo: item.esPromo ? 1 : 0,
        promo_id: item.promoId ?? null,
      }));

      // Clonamos pagos para ajustar vuelto
      const pagosAjustados: Pago[] = pagos.map((p) => ({ ...p }));

      let excesoPagos = totalPagos - total; // si es <= 0, no hay vuelto

      if (excesoPagos > 0) {
        // Restamos exceso solo de EFECTIVO / GIRO
        for (const p of pagosAjustados) {
          if (excesoPagos <= 0) break;
          if (esEfectivo(p.tipo)) {
            const reducible = Math.min(excesoPagos, p.monto);
            p.monto -= reducible;
            excesoPagos -= reducible;
          }
        }

        // Si aún queda exceso, el vuelto no se pudo descontar de efectivo/giro:
        // NO seguimos (antes solo había un console.warn).
        if (excesoPagos > 0) {
          throw new Error(
            "El vuelto no se pudo descontar de los pagos en EFECTIVO o GIRO. Revisa los medios de pago."
          );
        }
      }

      const payloadPagos = pagosAjustados
        .filter((p) => p.monto > 0)
        .map((p) => ({
          tipo: p.tipo,
          monto: p.monto,
        }));

      const res = await api.post("/ventas/crear", {
        items: payloadItems,
        pagos: payloadPagos,
        tipo_venta: "NORMAL",
      });

      setSuccess(`Venta registrada. ID: ${res.data.id_venta}`);
      setCarrito([]);
      setPagos([]);
      setNuevoMontoPago("");
      localStorage.removeItem(POS_STORAGE_KEY);
      setConfirmOpen(false);
      refocusScanner();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Error al registrar la venta POS."
      );
      setConfirmOpen(false);
      refocusScanner();
    } finally {
      setEnviando(false);
    }
  };

  // ====================
  // Render
  // ====================

  return (
    <Box sx={{ height: "calc(100vh - 50px)" }} onClick={handleGlobalClick}>
      <Box
        display="flex"
        flexDirection={{ xs: "column", md: "row" }}
        gap={2}
        sx={{ height: "100%" }}
      >
        {/* IZQUIERDA: Carrito */}
        <Box flex={{ xs: 1, md: 3 }}>
          <Paper
            sx={{
              p: 2,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {/* Escáner */}
            <Box component="form" onSubmit={handleAgregarProductoPorCodigo}>
              <Typography variant="subtitle2" color="text.secondary" mb={0.5}>
                Escáner / Código de barras
              </Typography>
              <Stack direction="row" spacing={1}>
                <TextField
                  autoFocus
                  inputRef={codigoInputRef}
                  placeholder="Escanea o escribe el código..."
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  fullWidth
                  size="small"
                />
                <Button
                  variant="contained"
                  type="submit"
                  startIcon={<SearchIcon />}
                >
                  Agregar
                </Button>
              </Stack>
            </Box>

            <Divider />

            {/* Carrito tabla */}
            <Box sx={{ flex: 1, overflow: "auto" }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right">Cant.</TableCell>
                    <TableCell align="right">Precio</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {carrito.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Box>
                          <Typography fontWeight={500}>
                            {item.nombre}
                            {item.esPromo && (
                              <Chip
                                label={
                                  item.promoTipo === "ARMADA"
                                    ? "Combo armado"
                                    : "Combo"
                                }
                                size="small"
                                color="secondary"
                                sx={{
                                  ml: 1,
                                  height: 18,
                                  fontSize: "0.7rem",
                                }}
                              />
                            )}
                            {item.esMayorista && (
                              <Chip
                                label="Mayorista"
                                size="small"
                                color="success"
                                sx={{
                                  ml: 0.5,
                                  height: 18,
                                  fontSize: "0.7rem",
                                }}
                              />
                            )}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            component="div"
                          >
                            {item.codigo}
                            {item.exento && (
                              <Chip
                                label="Exento"
                                size="small"
                                sx={{
                                  ml: 1,
                                  height: 18,
                                  fontSize: "0.7rem",
                                }}
                              />
                            )}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {item.esPromo ? (
                          // Combos: solo mostramos la cantidad, sin interacción
                          <Typography
                            variant="body2"
                            sx={{ minWidth: 24, textAlign: "center" }}
                          >
                            {item.cantidad}
                          </Typography>
                        ) : (
                          <Stack
                            direction="row"
                            spacing={0.5}
                            justifyContent="flex-end"
                            alignItems="center"
                          >
                            <IconButton
                              size="small"
                              onClick={() => cambiarCantidad(item.id, -1)}
                            >
                              <RemoveIcon fontSize="small" />
                            </IconButton>

                            {/* Clic en el número abre el modal con teclado */}
                            <Typography
                              variant="body2"
                              sx={{
                                minWidth: 24,
                                textAlign: "center",
                                cursor: "pointer",
                                textDecoration: "underline",
                              }}
                              onClick={() => handleOpenCantidadModal(item)}
                            >
                              {item.cantidad}
                            </Typography>

                            <IconButton
                              size="small"
                              onClick={() => cambiarCantidad(item.id, 1)}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        )}
                      </TableCell>

                      <TableCell align="right">
                        {formatCLP(item.precio)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCLP(subtotalItem(item))}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleEliminarItem(item.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}

                  {!carrito.length && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          align="center"
                          sx={{ py: 3, fontStyle: "italic" }}
                        >
                          No hay productos en el carrito. Escanea un código o
                          usa la promo de combo licores.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Box>

        {/* DERECHA: resumen + pagos + promos */}
        <Box flex={{ xs: 1, md: 2 }}>
          <Paper
            sx={{
              p: 2,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 2,
              overflow: "auto",
            }}
          >
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" onClose={() => setSuccess(null)}>
                {success}
              </Alert>
            )}

            {/* Resumen */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Resumen
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ítems: {totalItems}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Afecto: <strong>{formatCLP(totalAfecto)}</strong> · Exento:{" "}
                <strong>{formatCLP(totalExento)}</strong>
              </Typography>
              <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>
                {formatCLP(total)}
              </Typography>
            </Box>

            <Divider />

            {/* Pagos */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" mb={0.5}>
                Pagos
              </Typography>

              <Stack direction="row" spacing={1} mb={1}>
                <TextField
                  select
                  size="small"
                  sx={{ minWidth: 130 }}
                  value={nuevoTipoPago}
                  onChange={(e) =>
                    setNuevoTipoPago(e.target.value as MedioPago)
                  }
                >
                  <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                  <MenuItem value="GIRO">Giro</MenuItem>
                  <MenuItem value="DEBITO">Débito</MenuItem>
                  <MenuItem value="CREDITO">Crédito</MenuItem>
                  <MenuItem value="TRANSFERENCIA">Transferencia</MenuItem>
                </TextField>

                <TextField
                  size="small"
                  type="text"
                  inputMode="numeric"
                  placeholder="Monto"
                  value={nuevoMontoPago}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const digits = raw.replace(/\D/g, "");

                    if (!digits) {
                      setNuevoMontoPago("");
                      return;
                    }

                    // limita largo para evitar montos gigantes
                    const capped = digits.slice(0, 9); // hasta 999.999.999
                    setNuevoMontoPago(formatMilesCL(Number(capped)));
                  }}
                  fullWidth
                  error={!!errorPagoActual && !!nuevoMontoPago}
                  helperText={
                    !!nuevoMontoPago && errorPagoActual ? errorPagoActual : ""
                  }
                />

                <Stack spacing={0.5}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleLlenarConTotal}
                  >
                    Total
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleAgregarPago}
                    disabled={!montoIngresadoValido}
                  >
                    +
                  </Button>
                </Stack>
              </Stack>

              <Stack direction="row" spacing={1} mt={1}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CalculateIcon />}
                  onClick={() => setCalcOpen(true)}
                >
                  Calculadora
                </Button>
              </Stack>

              {/* Advertencia contextual exentos + tarjeta */}
              {totalExento > 0 && !esEfectivo(nuevoTipoPago) && (
                <Typography
                  variant="caption"
                  color="error"
                  display="block"
                  sx={{ mt: 0.5 }}
                >
                  Hay productos exentos por {formatCLP(totalExento)}. Ese monto
                  solo puede pagarse con <strong>EFECTIVO o GIRO</strong>. Este
                  medio se aplicará solo al monto afecto.
                </Typography>
              )}

              {/* Error de estado final (ej: el carrito cambió después de pagar) */}
              {resumenPagos.error && pagos.length > 0 && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  {resumenPagos.error} Revisa los pagos ingresados (puede que el
                  carrito haya cambiado).
                </Alert>
              )}

              <Box sx={{ maxHeight: 150, overflow: "auto", mt: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Medio</TableCell>
                      <TableCell align="right">Monto</TableCell>
                      <TableCell align="center">Acción</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagos.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Chip
                            label={p.tipo}
                            size="small"
                            sx={{ fontSize: "0.7rem" }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {formatCLP(p.monto)}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleEliminarPago(p.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!pagos.length && (
                      <TableRow>
                        <TableCell colSpan={3}>
                          <Typography variant="caption" color="text.secondary">
                            Aún no hay pagos agregados.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>

              <Box mt={1} textAlign="right">
                <Typography variant="body2">
                  Total pagos: <strong>{formatCLP(totalPagos)}</strong>
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color:
                      saldo === 0
                        ? "success.main"
                        : saldo > 0
                        ? "error.main"
                        : "warning.main",
                  }}
                >
                  Saldo: <strong>{formatCLP(saldo)}</strong>
                </Typography>

                {saldo > 0 && (
                  <Typography variant="caption" color="warning.main">
                    Falta por cobrar {formatCLP(saldo)} para completar el
                    total.
                  </Typography>
                )}
                {saldo === 0 && !!pagos.length && !resumenPagos.error && (
                  <Typography variant="caption" color="success.main">
                    Pagos correctos, puedes continuar a la confirmación.
                  </Typography>
                )}
                {saldo < 0 && (
                  <Typography variant="caption" color="warning.main">
                    Hay un vuelto pendiente de {formatCLP(vuelto)}.
                  </Typography>
                )}
              </Box>

              {/* Mensaje fijo sobre exentos */}
              {totalExento > 0 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  sx={{ mt: 1 }}
                >
                  Recuerda: los productos <strong>exentos</strong> solo pueden
                  pagarse con <strong>EFECTIVO o GIRO</strong>. Los pagos con
                  tarjeta o transferencia se aplican únicamente al monto
                  afecto.
                </Typography>
              )}
            </Box>

            {/* Bloque verde de vuelto (solo si hay efectivo/giro) */}
            {vuelto > 0 && tieneEfectivoOGiro && (
              <Box
                mt={2}
                p={2}
                borderRadius={2}
                sx={{
                  bgcolor: "success.main",
                  color: "white",
                  textAlign: "center",
                }}
              >
                <Typography variant="subtitle1" fontWeight={700}>
                  VUELTO AL CLIENTE
                </Typography>
                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{ mt: 0.5, letterSpacing: 1 }}
                >
                  {formatCLP(vuelto)}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Entregar en efectivo / giro.
                </Typography>
              </Box>
            )}

            <Divider sx={{ mt: 2 }} />

            {/* Promos */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" mb={0.5}>
                Promociones
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<LocalOfferIcon />}
                onClick={() => setPromoOpen(true)}
              >
                Combo licores (licor + bebida + hielo)
              </Button>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mt: 0.5 }}
              >
                El licor y la bebida se cobran normal. El hielo 1kg va de
                regalo.
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<LocalOfferIcon />}
                sx={{ mt: 1 }}
                onClick={() => setPromoArmadaOpen(true)}
              >
                Seleccionar promoción armada
              </Button>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mt: 0.5 }}
              >
                Selecciona una promocion creada por el Administrador.
              </Typography>
            </Box>

            <Box sx={{ flex: 1 }} />

            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              startIcon={<PointOfSaleIcon />}
              disabled={enviando || !puedeCobrar}
              onClick={handleAbrirConfirmacion}
              sx={{ borderRadius: 2, py: 1.2 }}
            >
              {enviando ? "Procesando..." : "Cobrar"}
            </Button>
          </Paper>
        </Box>
      </Box>

      {/* Modal scanner promos */}
      <PromoScannerModalPOS
        open={promoOpen}
        onClose={() => setPromoOpen(false)}
        onPromoAdd={handlePromoAddToCart}
        buscarProductoPorCodigo={buscarProductoPorCodigo}
      />

      {/* Modal de promociones armadas */}
      <PromoArmadaModalPOS
        open={promoArmadaOpen}
        onClose={() => setPromoArmadaOpen(false)}
        onSelectPromo={handleAgregarPromoArmadaAlCarrito}
      />

      <CalculadoraModalPOS
        open={calcOpen}
        onClose={() => setCalcOpen(false)}
        onResult={(_valor) => {
          // usar el resultado para llenar el monto de pago
          setCalcOpen(false);
        }}
      />

      <QuantityModalPOS
        open={cantidadModalOpen}
        initialValue={itemCantidadTarget?.cantidad ?? 1}
        onClose={handleCloseCantidadModal}
        onConfirm={handleConfirmCantidadModal}
      />

      {/* Modal de confirmación de venta */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            bgcolor: "background.paper",
          },
        }}
      >
        {/* HEADER */}
        <DialogTitle
          sx={{
            px: 3,
            py: 2,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Confirmación de venta POS
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              Revisa el resumen antes de guardar
            </Typography>
          </Box>
          <Box textAlign="right">
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Total a cobrar
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              {formatCLP(total)}
            </Typography>
          </Box>
        </DialogTitle>

        {/* CONTENIDO */}
        <DialogContent
          dividers
          sx={{
            p: 3,
            bgcolor: "background.default",
          }}
        >
          {/* RESUMEN ARRIBA */}
          <Box
            sx={{
              mb: 2,
              p: 2,
              borderRadius: 1,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              bgcolor: (t) =>
                isDark
                  ? alpha(t.palette.background.paper, 0.9)
                  : t.palette.background.paper,
              boxShadow: isDark
                ? "0 0 0 1px rgba(148,163,184,0.25)"
                : "0 0 0 1px rgba(15,23,42,0.06)",
            }}
          >
            <Box flex={1}>
              <Typography variant="caption" color="text.secondary">
                Ítems
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {totalItems}
              </Typography>
            </Box>

            <Box flex={1}>
              <Typography variant="caption" color="text.secondary">
                Afecto
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {formatCLP(totalAfecto)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Exento:{" "}
                <Box component="span" fontWeight={600}>
                  {formatCLP(totalExento)}
                </Box>
              </Typography>
            </Box>

            <Box flex={1} sx={{ textAlign: { xs: "left", sm: "right" } }}>
              <Typography variant="caption" color="text.secondary">
                Total pagos
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {formatCLP(totalPagos)}
              </Typography>
              {vuelto > 0 && tieneEfectivoOGiro && (
                <Typography variant="caption" color="success.main">
                  Vuelto:{" "}
                  <Box component="span" fontWeight={700}>
                    {formatCLP(vuelto)}
                  </Box>
                </Typography>
              )}
            </Box>
          </Box>

          {/* DOS COLUMNAS: PRODUCTOS / PAGOS */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
            }}
          >
            {/* PRODUCTOS */}
            <Box flex={3}>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ display: "flex", justifyContent: "space-between" }}
              >
                Productos
                <Typography variant="caption" color="text.secondary">
                  {carrito.length} líneas
                </Typography>
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  maxHeight: 220,
                  overflow: "auto",
                  borderRadius: 0.5,
                  bgcolor: "background.paper",
                }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell align="right">Cant.</TableCell>
                      <TableCell align="right">Precio</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {carrito.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {item.nombre}
                            {item.esPromo && (
                              <Chip
                                label="Combo"
                                size="small"
                                color="secondary"
                                sx={{
                                  ml: 1,
                                  fontSize: "0.7rem",
                                  height: 18,
                                }}
                              />
                            )}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.codigo}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{item.cantidad}</TableCell>
                        <TableCell align="right">
                          {formatCLP(item.precio)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCLP(subtotalItem(item))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Box>

            {/* PAGOS */}
            <Box flex={2}>
              <Typography variant="subtitle2" gutterBottom>
                Medios de pago
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  maxHeight: 220,
                  overflow: "auto",
                  borderRadius: 0.5,
                  bgcolor: "background.paper",
                  mb: 1,
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Medio</TableCell>
                      <TableCell align="right">Monto</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagos.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Chip
                            label={p.tipo}
                            size="small"
                            sx={{ fontSize: "0.7rem" }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {formatCLP(p.monto)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>

              <Box>
                <Typography variant="body2">
                  Total pagos:{" "}
                  <Box component="span" fontWeight={700}>
                    {formatCLP(totalPagos)}
                  </Box>
                </Typography>

                {vuelto > 0 && tieneEfectivoOGiro && (
                  <Box
                    sx={{
                      mt: 1,
                      p: 1.2,
                      borderRadius: 3,
                      bgcolor: "success.main",
                      color: "success.contrastText",
                      textAlign: "center",
                    }}
                  >
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Vuelto al cliente
                    </Typography>
                    <Typography variant="h6" fontWeight={800}>
                      {formatCLP(vuelto)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

          <Box mt={2}>
            <Typography variant="caption" color="text.secondary">
              Revisa que productos, totales y medios de pago coincidan con lo
              entregado por el cliente antes de confirmar la venta.
            </Typography>
          </Box>
        </DialogContent>

        {/* ACCIONES */}
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setConfirmOpen(false)}>Seguir editando</Button>
          <Button variant="outlined" onClick={handleGenerarVoucherPreview}>
            Generar voucher
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmarVenta}
            disabled={enviando}
          >
            Confirmar venta
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de pre-voucher (antes de confirmar venta) */}
      <Dialog
        open={voucherPreviewOpen}
        onClose={() => setVoucherPreviewOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle>Voucher preliminar</DialogTitle>

        <DialogContent
          dividers
          sx={{
            bgcolor: "background.default",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Este es un comprobante previo. Aún no se ha guardado la venta en el
            sistema.
          </Typography>

          <Box
            component="pre"
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 1,
              bgcolor: "background.paper",
              fontFamily: "monospace",
              fontSize: "0.75rem",
              maxHeight: 320,
              overflow: "auto",
              whiteSpace: "pre",
            }}
          >
            {voucherPreviewText}
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 2.5,
            py: 1.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Solo vista previa. Usa estos botones si quieres imprimir ahora.
          </Typography>

          {voucherPreviewText && (
            <VoucherPrintButtons voucherText={voucherPreviewText} />
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
