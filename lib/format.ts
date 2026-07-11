export function formatCurrencyBRL(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(num) ? num : 0);
}

export function formatKM(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (num === null || num === undefined || !Number.isFinite(num)) return "";
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 0,
  }).format(num);
}

export const formatInteger = formatKM;

export function formatDateBR(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

export function parseNumberBR(value: string): number {
  if (!value) return 0;
  const normalized = value
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}
