// Centralized mock data for HAD Management prototype
// Replace with real API calls when backend is ready (Stage 5.2+)

import type { AppUser, Contact, Deal, Activity, StageHistoryEntry } from "./types"

export const MOCK_USERS: AppUser[] = [
  { id: "u1", name: "Kovács Péter" },
  { id: "u2", name: "Szabó Ágnes" },
  { id: "u3", name: "Juhász János" },
]

export const MOCK_CONTACTS: Contact[] = [
  {
    id: "c1",
    name: "Nagy Balázs",
    title: "Beszerzési igazgató",
    email: "nagy.balazs@example.hu",
    phone: "+36 20 123 4567",
    company: "TechCorp Zrt.",
    source: "linkedin",
    kamUserId: "u1",
    referredByUserId: "",
    notes: "Budapest Tech Summit-on találkoztunk",
    lastInteractionDate: "2026-03-10",
    isArchived: false,
  },
  {
    id: "c2",
    name: "Varga Katalin",
    title: "Pénzügyi igazgató",
    email: "varga.katalin@industrialco.hu",
    phone: "+36 30 987 6543",
    company: "Industrial Co. Kft.",
    source: "referral",
    kamUserId: "u1",
    referredByUserId: "u2",
    notes: "",
    lastInteractionDate: "2026-03-05",
    isArchived: false,
  },
  {
    id: "c3",
    name: "Horváth Gábor",
    title: "Technológiai igazgató",
    email: "horvath.gabor@startup.io",
    phone: "",
    company: "Startup.io",
    source: "email",
    kamUserId: "u2",
    referredByUserId: "",
    notes: "Enterprise csomagot preferálja",
    lastInteractionDate: "2026-02-28",
    isArchived: false,
  },
]

export const MOCK_DEALS: Deal[] = [
  {
    id: "d1",
    title: "TechCorp ERP integráció",
    contactId: "c1",
    stage: "negotiation",
    value: 4500000,
    currency: "HUF",
    ownerId: "u1",
    expectedClose: "2026-04-30",
    description: "Teljes ERP integrációs projekt",
    notes: "Az ügyfél fázisos megközelítést preferál",
    nextStepOwnerId: "u1",
    nextStepDue: "2026-03-20",
    projectStartExpected: "2026-05-01",
    projectStartActual: "",
    projectEnd: "2026-09-30",
    createdAt: "2026-01-15",
  },
  {
    id: "d2",
    title: "Industrial Co. adatplatform",
    contactId: "c2",
    stage: "proposal",
    value: 25000,
    currency: "EUR",
    ownerId: "u1",
    expectedClose: "2026-05-15",
    description: "Adatelemzési platform kiépítése",
    notes: "",
    nextStepOwnerId: "u2",
    nextStepDue: "2026-03-25",
    projectStartExpected: "2026-06-01",
    projectStartActual: "",
    projectEnd: "",
    createdAt: "2026-02-01",
  },
  {
    id: "d3",
    title: "Startup.io MVP tanácsadás",
    contactId: "c3",
    stage: "qualified",
    value: 8000,
    currency: "USD",
    ownerId: "u2",
    expectedClose: "2026-03-31",
    description: "",
    notes: "Korai fázis — technikai értékelés szükséges",
    nextStepOwnerId: "u2",
    nextStepDue: "2026-03-18",
    projectStartExpected: "",
    projectStartActual: "",
    projectEnd: "",
    createdAt: "2026-02-20",
  },
  {
    id: "d4",
    title: "TechCorp biztonsági audit",
    contactId: "c1",
    stage: "lead",
    value: 1200000,
    currency: "HUF",
    ownerId: "u2",
    expectedClose: "2026-06-30",
    description: "Éves biztonsági audit",
    notes: "",
    nextStepOwnerId: "",
    nextStepDue: "",
    projectStartExpected: "",
    projectStartActual: "",
    projectEnd: "",
    createdAt: "2026-03-01",
  },
  {
    id: "d5",
    title: "Industrial Co. legacy migráció",
    contactId: "c2",
    stage: "won",
    value: 12000000,
    currency: "HUF",
    ownerId: "u1",
    expectedClose: "2026-01-31",
    description: "Legacy rendszer migráció",
    notes: "Q1 2026-ban lezárva",
    nextStepOwnerId: "",
    nextStepDue: "",
    projectStartExpected: "2026-02-01",
    projectStartActual: "2026-02-03",
    projectEnd: "2026-04-30",
    createdAt: "2025-10-01",
  },
]

export const MOCK_STAGE_HISTORY: StageHistoryEntry[] = [
  { id: "sh1", fromStage: "lead", toStage: "qualified", actorName: "Kovács Péter", timestamp: "2026-01-20T10:30:00Z" },
  { id: "sh2", fromStage: "qualified", toStage: "proposal", actorName: "Kovács Péter", timestamp: "2026-02-10T14:15:00Z" },
  { id: "sh3", fromStage: "proposal", toStage: "negotiation", actorName: "Szabó Ágnes", timestamp: "2026-03-01T09:00:00Z" },
]

export const MOCK_ACTIVITIES: Activity[] = [
  {
    id: "a1",
    type: "meeting",
    content: "Kickoff meeting a TechCorp csapattal. Megbeszéltük az ERP integrációs ütemtervet.",
    authorName: "Kovács Péter",
    dealId: "d1",
    contactId: "c1",
    createdAt: "2026-03-10T14:00:00Z",
  },
  {
    id: "a2",
    type: "email",
    content: "Ajánlat elküldve az Industrial Co. részére az adatplatform projektről.",
    authorName: "Kovács Péter",
    dealId: "d2",
    contactId: "c2",
    createdAt: "2026-03-08T11:00:00Z",
  },
  {
    id: "a3",
    type: "call",
    content: "Telefonos egyeztetés Horváth Gáborral a technikai követelményekről.",
    authorName: "Szabó Ágnes",
    dealId: "d3",
    contactId: "c3",
    createdAt: "2026-03-05T16:30:00Z",
  },
  {
    id: "a4",
    type: "note",
    content: "Az ügyfél megerősítette a költségkeretet, továbbléphetünk az ajánlati fázisba.",
    authorName: "Kovács Péter",
    dealId: "d1",
    contactId: "c1",
    createdAt: "2026-03-01T09:00:00Z",
  },
]

// Helpers
export function getUserName(userId: string): string {
  return MOCK_USERS.find((u) => u.id === userId)?.name ?? "—"
}

export function getContact(contactId: string): Contact | undefined {
  return MOCK_CONTACTS.find((c) => c.id === contactId)
}

export function getDeal(dealId: string): Deal | undefined {
  return MOCK_DEALS.find((d) => d.id === dealId)
}

export function getActivitiesForDeal(dealId: string): Activity[] {
  return MOCK_ACTIVITIES.filter((a) => a.dealId === dealId)
}

export function getActivitiesForContact(contactId: string): Activity[] {
  return MOCK_ACTIVITIES.filter((a) => a.contactId === contactId)
}

export function getDealsForContact(contactId: string): Deal[] {
  return MOCK_DEALS.filter((d) => d.contactId === contactId)
}
