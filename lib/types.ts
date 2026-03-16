// Shared types for HAD Management
// Source of truth: docs/specs/TSD-*.md

export type DealStage = "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost"
export type Currency = "HUF" | "EUR" | "USD"
export type ContactSource = "email" | "referral" | "linkedin" | "other"
export type ActivityType = "note" | "email" | "call" | "meeting"

export interface AppUser {
  id: string
  name: string
}

export interface Contact {
  id: string
  name: string
  title: string
  email: string
  phone: string
  company: string
  source: ContactSource
  kamUserId: string
  referredByUserId: string
  notes: string
  lastInteractionDate: string
  isArchived: boolean
}

export interface Deal {
  id: string
  title: string
  contactId: string
  stage: DealStage
  value: number
  currency: Currency
  ownerId: string
  expectedClose: string
  description: string
  notes: string
  nextStepOwnerId: string
  nextStepDue: string
  projectStartExpected: string
  projectStartActual: string
  projectEnd: string
  closeReason?: string
  createdAt: string
}

export interface StageHistoryEntry {
  id: string
  fromStage: DealStage
  toStage: DealStage
  actorName: string
  timestamp: string
}

export interface Activity {
  id: string
  type: ActivityType
  content: string
  authorName: string
  contactId?: string
  dealId?: string
  createdAt: string
  updatedAt?: string
}

export interface KpiCard {
  label: string
  value: string
  sub: string
  icon: React.ReactNode
  trend?: "up" | "down" | "neutral"
}

export interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}
