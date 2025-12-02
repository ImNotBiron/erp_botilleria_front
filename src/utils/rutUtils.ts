// Elimina todo menos números y K, sin guion
export function limpiarRutInput(valor: string) {
  return valor
    .replace(/\./g, "")
    .replace(/-/g, "")
    .replace(/[^0-9kK]/g, "")
    .toUpperCase();
}

// Devuelve el rut sin puntos PERO con guion (para guardar en BD)
export function rutLimpioParaGuardar(valor: string) {
  const limpio = limpiarRutInput(valor);

  if (limpio.length <= 1) return limpio;

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);

  return `${cuerpo}-${dv}`;
}

// Formatea mientras el usuario escribe
export function formatearRutTiempoReal(valor: string) {
  const limpio = limpiarRutInput(valor);

  if (limpio.length <= 1) return limpio;

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);

  const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${cuerpoFormateado}-${dv}`;
}

// Validación módulo 11
export function validarRut(rut: string) {
  rut = rut.replace(/\./g, "").replace(/-/g, "").toUpperCase();

  if (rut.length < 2) return false;

  const cuerpo = rut.slice(0, -1);
  const dv = rut.slice(-1);

  let suma = 0,
    multiplo = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * multiplo;
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }

  const dvEsperado = 11 - (suma % 11);
  const dvCalculado =
    dvEsperado === 11 ? "0" : dvEsperado === 10 ? "K" : dvEsperado.toString();

  return dv === dvCalculado;
}
