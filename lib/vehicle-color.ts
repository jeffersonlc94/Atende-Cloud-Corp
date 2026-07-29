// Paleta de cores determinística por veículo, usada para diferenciar
// visualmente veículos com marca/modelo iguais (ex: duas HONDA POP 100)
// em listagens onde vários veículos aparecem misturados.
const VEHICLE_COLOR_PALETTE = [
  "bg-blue-100 text-blue-800 border-blue-300",
  "bg-emerald-100 text-emerald-800 border-emerald-300",
  "bg-amber-100 text-amber-800 border-amber-300",
  "bg-purple-100 text-purple-800 border-purple-300",
  "bg-pink-100 text-pink-800 border-pink-300",
  "bg-cyan-100 text-cyan-800 border-cyan-300",
  "bg-orange-100 text-orange-800 border-orange-300",
  "bg-indigo-100 text-indigo-800 border-indigo-300",
  "bg-teal-100 text-teal-800 border-teal-300",
  "bg-rose-100 text-rose-800 border-rose-300",
] as const;

/** Gera um índice estável a partir de uma string (hash simples, não criptográfico). */
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Classes Tailwind (bg/text/border) determinísticas a partir do id do veículo. */
export function vehicleColorClasses(vehicleId: string): string {
  return VEHICLE_COLOR_PALETTE[hashString(vehicleId) % VEHICLE_COLOR_PALETTE.length];
}
