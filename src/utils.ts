import { StatusColor } from "./types.ts";

export const STATUS_EMOJI: Record<StatusColor, string> = {
  green: "🟢",
  yellow: "🟡",
  red: "🔴",
  grey: "⚪️",
};

export function clampText(text: string | null | undefined, max: number): string {
  if (!text) return "";
  return text.slice(0, max).trim();
}

export function parseListInput(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    )
  ).slice(0, 7);
}

export function formatList(list: string[] | null | undefined): string {
  if (!list || list.length === 0) return "—";
  return list.join(", ");
}

export function safeUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return url.toString();
  } catch {
    return value.trim();
  }
}

export function availabilityOrderExpr(column = "custom_1"): string {
  // Order: green, yellow, grey, red by default
  return `CASE ${column} WHEN 'green' THEN 1 WHEN 'yellow' THEN 2 WHEN 'grey' THEN 3 WHEN 'red' THEN 4 ELSE 5 END`;
}

export function escapeHtml(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

