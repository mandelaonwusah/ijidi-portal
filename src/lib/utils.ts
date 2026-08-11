import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes with clsx resolution.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats numeric values into currency representation for vault assets.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats ISO timestamps into 24-hour tactical time (HH:MM:SS).
 */
export function formatTacticalTime(dateString?: string): string {
  if (!dateString) return "JUST NOW";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "RECENT";
  
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Truncates hashes, public keys, or long UUIDs for dashboard display.
 */
export function truncateHash(hash: string, startChars = 6, endChars = 4): string {
  if (!hash || hash.length <= startChars + endChars) return hash;
  return `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`;
}

/**
 * Returns mapped Tailwind CSS status colors for Node and Governance states.
 */
export function getStatusStyle(
  status: "ONLINE" | "DEGRADED" | "OFFLINE" | "ACTIVE" | "PASSED" | "FAILED" | "PENDING" | string
): { text: string; badge: string; dot: string } {
  switch (status) {
    case "ONLINE":
    case "PASSED":
      return {
        text: "text-teal",
        badge: "border-teal/40 bg-teal/10 text-teal",
        dot: "bg-teal",
      };
    case "DEGRADED":
    case "ACTIVE":
    case "PENDING":
      return {
        text: "text-gold",
        badge: "border-gold/40 bg-gold/10 text-gold",
        dot: "bg-gold",
      };
    case "OFFLINE":
    case "FAILED":
      return {
        text: "text-danger",
        badge: "border-danger/40 bg-danger/10 text-danger",
        dot: "bg-danger",
      };
    default:
      return {
        text: "text-muted-foreground",
        badge: "border-border bg-background/50 text-muted-foreground",
        dot: "bg-muted-foreground",
      };
  }
}
