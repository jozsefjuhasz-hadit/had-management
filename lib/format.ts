// Format utilities for HAD Management — Hungarian locale

import type { Currency } from "./types"

export function formatCurrency(value: number, currency: Currency): string {
  return `${value.toLocaleString("hu-HU")} ${currency}`
}

export function formatHuf(value: number): string {
  return formatCurrency(value, "HUF")
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—"
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

export function formatRelativeDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—"
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return "—"

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Ma"
  if (diffDays === 1) return "Tegnap"
  if (diffDays > 1 && diffDays <= 30) return `${diffDays} napja`
  return formatDate(dateStr)
}
