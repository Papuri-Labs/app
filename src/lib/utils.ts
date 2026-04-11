import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Ensures a URL has a protocol (http/https). 
 * If it doesn't, prepends https://.
 */
export function formatUrl(url: string | undefined): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  // Check if it already has a protocol or is a mailto/tel/sms link
  if (/^(https?:\/\/|mailto:|tel:|sms:)/i.test(trimmed)) {
    return trimmed;
  }

  // If it starts with //, just add https:
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  return `https://${trimmed}`;
}

/**
 * Safely opens an external link in a new tab.
 */
export function openExternalLink(url: string | undefined) {
  const formatted = formatUrl(url);
  if (formatted) {
    window.open(formatted, "_blank", "noopener,noreferrer");
  }
}
/**
 * Returns the current local date in YYYY-MM-DD format, 
 * correctly adjusted for timezone offset.
 */
export function getLocalSysDate(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
}
