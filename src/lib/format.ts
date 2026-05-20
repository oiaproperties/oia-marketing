export function fmtMicros(micros: number): string {
  return (micros / 1_000_000).toLocaleString("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  });
}

export function fmtNum(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function fmtPct(n: number): string {
  return `${(n * 100).toFixed(2)}%`;
}

export function fmtCpc(micros: number): string {
  return (micros / 1_000_000).toLocaleString("en-AE", {
    style: "currency",
    currency: "AED",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-AE", {
    day: "numeric",
    month: "short",
  });
}
