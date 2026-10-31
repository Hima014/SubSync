import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Indian Rupee (INR) currency
 */
export function formatINR(amount: number, options: { minimumFractionDigits?: number; maximumFractionDigits?: number } = {}) {
  const { minimumFractionDigits = 2, maximumFractionDigits = 2 } = options;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}

/**
 * Format a date string (YYYY-MM-DD) into readable text
 */
export function formatDate(dateString: string) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Generate a clean prefixed identifier
 */
export function generateId(prefix: string): string {
  const random = Math.floor(1000 + Math.random() * 9000);
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${random}`;
}

