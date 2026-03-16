// Shared constants for HAD Management — Hungarian UI labels
// English in code, Hungarian in UI (per CLAUDE.md terminology)

import type { DealStage, ContactSource, ActivityType } from "./types"

export const STAGES: DealStage[] = ["lead", "qualified", "proposal", "negotiation", "won", "lost"]

export const STAGE_LABELS: Record<DealStage, string> = {
  lead: "Lead",
  qualified: "Minősített",
  proposal: "Ajánlat",
  negotiation: "Tárgyalás",
  won: "Megnyert",
  lost: "Elvesztett",
}

export const STAGE_DESCRIPTIONS: Record<DealStage, string> = {
  lead: "Kezdeti kapcsolatfelvétel — lehetőség azonosítva, de még nem minősített",
  qualified: "Igény megerősítve, költségkeret és döntéshozó azonosítva",
  proposal: "Formális ajánlat elküldve az ügyfélnek",
  negotiation: "Feltételek és árazás aktív egyeztetés alatt",
  won: "Ügylet lezárva — szerződés aláírva",
  lost: "A lehetőség nem valósult meg",
}

export const STAGE_BADGE_CLASSES: Record<DealStage, string> = {
  lead:        "bg-[var(--stage-lead-bg)] text-[var(--stage-lead-fg)] border-transparent",
  qualified:   "bg-[var(--stage-qualified-bg)] text-[var(--stage-qualified-fg)] border-transparent",
  proposal:    "bg-[var(--stage-proposal-bg)] text-[var(--stage-proposal-fg)] border-transparent",
  negotiation: "bg-[var(--stage-negotiation-bg)] text-[var(--stage-negotiation-fg)] border-transparent",
  won:         "bg-[var(--stage-won-bg)] text-[var(--stage-won-fg)] border-transparent",
  lost:        "bg-[var(--stage-lost-bg)] text-[var(--stage-lost-fg)] border-transparent",
}

export const SOURCE_LABELS: Record<ContactSource, string> = {
  email: "Email",
  referral: "Ajánlás",
  linkedin: "LinkedIn",
  other: "Egyéb",
}

export const SOURCE_BADGE_CLASSES: Record<ContactSource, string> = {
  email:    "bg-[var(--stage-qualified-bg)] text-[var(--stage-qualified-fg)] border-transparent",
  referral: "bg-[var(--stage-proposal-bg)] text-[var(--stage-proposal-fg)] border-transparent",
  linkedin: "bg-[var(--stage-proposal-bg)] text-[var(--stage-proposal-fg)] border-transparent",
  other:    "bg-[var(--stage-lead-bg)] text-[var(--stage-lead-fg)] border-transparent",
}

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  note: "Feljegyzés",
  email: "Email",
  call: "Hívás",
  meeting: "Találkozó",
}
