import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatUsage(value: string | number | null | undefined, unit: string): string {
  if (!value) return `0 ${unit}`;
  const num = typeof value === "string" ? parseFloat(value) : value;
  return `${num.toFixed(1)} ${unit}`;
}

export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function getUsageStatus(current: number, threshold: number): "normal" | "warning" | "alert" {
  const ratio = current / threshold;
  if (ratio >= 1.2) return "alert";
  if (ratio >= 0.9) return "warning";
  return "normal";
}
