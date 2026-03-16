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

export const STAGE_BADGE_VARIANTS: Record<DealStage, "default" | "secondary" | "outline" | "destructive"> = {
  lead: "outline",
  qualified: "secondary",
  proposal: "default",
  negotiation: "default",
  won: "secondary",
  lost: "destructive",
}

export const SOURCE_LABELS: Record<ContactSource, string> = {
  email: "Email",
  referral: "Ajánlás",
  linkedin: "LinkedIn",
  other: "Egyéb",
}

export const SOURCE_BADGE_VARIANTS: Record<ContactSource, "default" | "secondary" | "outline"> = {
  email: "secondary",
  referral: "default",
  linkedin: "outline",
  other: "outline",
}

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  note: "Feljegyzés",
  email: "Email",
  call: "Hívás",
  meeting: "Találkozó",
}
