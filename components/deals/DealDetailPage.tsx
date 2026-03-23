"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import {
  EditIcon,
  SaveIcon,
  XIcon,
  PlusIcon,
  AlertCircleIcon,
  PhoneIcon,
  MailIcon,
  MessageSquareIcon,
  CalendarIcon,
  UsersIcon,
  TrashIcon,
  CheckCircleIcon,
} from "lucide-react"
import type { Deal, DealStage, Currency, ActivityType } from "@/lib/types"
import {
  STAGES,
  STAGE_LABELS,
  STAGE_DESCRIPTIONS,
  STAGE_BADGE_CLASSES,
  ACTIVITY_LABELS,
} from "@/lib/constants"
import { formatCurrency } from "@/lib/format"
import { MOCK_USERS, MOCK_CONTACTS, getUserName, getContact } from "@/lib/mock-data"

// ─── Local types for stage history (page-specific shape) ─────────────────────

interface StageHistoryEntry {
  id: string
  dealId: string
  actorDisplay: string
  fromStage: DealStage | null
  toStage: DealStage
  timestamp: string
  source: "human" | "agent"
}

interface Activity {
  id: string
  dealId: string
  contactId?: string
  type: ActivityType
  content: string
  authorDisplay: string
  createdAt: string
  editedAt?: string
}

// ─── Mock data ───────────────────────────────────────────────────────────────

const MOCK_DEAL: Deal = {
  id: "d1",
  title: "TechCorp ERP integráció",
  contactId: "c1",
  stage: "negotiation",
  value: 4500000,
  currency: "HUF",
  ownerId: "u1",
  expectedClose: "2026-04-30",
  description: "Teljes ERP integrációs projekt fázisos szállítással.",
  notes: "Az ügyfél fázisos megközelítést preferál; költségkeret a Q4 értékelésen megerősítve.",
  nextStepOwnerId: "u1",
  nextStepDue: "2026-03-20",
  projectStartExpected: "2026-05-01",
  projectStartActual: "",
  projectEnd: "2026-09-30",
  createdAt: "2026-01-15",
}

const MOCK_STAGE_HISTORY: StageHistoryEntry[] = [
  { id: "sh1", dealId: "d1", actorDisplay: "Szabó Ágnes", fromStage: null, toStage: "lead", timestamp: "2026-01-15T09:12:00Z", source: "human" },
  { id: "sh2", dealId: "d1", actorDisplay: "Kovács Péter", fromStage: "lead", toStage: "qualified", timestamp: "2026-01-22T14:30:00Z", source: "human" },
  { id: "sh3", dealId: "d1", actorDisplay: "AI Agent", fromStage: "qualified", toStage: "proposal", timestamp: "2026-02-05T10:00:00Z", source: "agent" },
  { id: "sh4", dealId: "d1", actorDisplay: "Kovács Péter", fromStage: "proposal", toStage: "negotiation", timestamp: "2026-03-01T16:45:00Z", source: "human" },
]

const MOCK_ACTIVITIES: Activity[] = [
  { id: "a1", dealId: "d1", contactId: "c1", type: "call", content: "Árazási modell és fázisok megbeszélése. Az ügyfél megerősítette a költségkeret elérhetőségét.", authorDisplay: "Kovács Péter", createdAt: "2026-03-10T11:30:00Z" },
  { id: "a2", dealId: "d1", contactId: "c1", type: "meeting", content: "Kickoff meeting a beszerzési csapattal. Megegyezés az ütemtervben.", authorDisplay: "Kovács Péter", createdAt: "2026-02-28T09:00:00Z" },
  { id: "a3", dealId: "d1", contactId: "c1", type: "email", content: "Módosított ajánlat v2 elküldve, a 3 nyitott kérdés megválaszolásával.", authorDisplay: "Szabó Ágnes", createdAt: "2026-02-20T15:00:00Z", editedAt: "2026-02-20T15:45:00Z" },
  { id: "a4", dealId: "d1", type: "note", content: "AI agent: next_step_due mező frissítve a meeting alapján.", authorDisplay: "AI Agent", createdAt: "2026-02-15T08:00:00Z" },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ACTIVITY_ICONS: Record<ActivityType, React.ReactNode> = {
  note: <MessageSquareIcon className="size-4" />,
  email: <MailIcon className="size-4" />,
  call: <PhoneIcon className="size-4" />,
  meeting: <UsersIcon className="size-4" />,
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts)
  return d.toLocaleString("hu-HU", { dateStyle: "medium", timeStyle: "short" })
}

// ─── Log Activity Form ───────────────────────────────────────────────────────

function LogActivityForm({
  dealId,
  defaultContactId,
  onSuccess,
  onCancel,
  existingActivity,
}: {
  dealId: string
  defaultContactId?: string
  onSuccess: (activity: Activity) => void
  onCancel: () => void
  existingActivity?: Activity | null
}) {
  const [type, setType] = useState<ActivityType>(existingActivity?.type ?? "call")
  const [content, setContent] = useState(existingActivity?.content ?? "")
  const [linkedContactId, setLinkedContactId] = useState(
    existingActivity?.contactId ?? defaultContactId ?? ""
  )
  const [contentError, setContentError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) {
      setContentError("A tartalom megadása kötelező")
      return
    }
    setIsSubmitting(true)
    setTimeout(() => {
      const activity: Activity = existingActivity
        ? { ...existingActivity, type, content: content.trim(), contactId: linkedContactId || undefined, editedAt: new Date().toISOString() }
        : { id: `a${Date.now()}`, dealId, contactId: linkedContactId || undefined, type, content: content.trim(), authorDisplay: "Kovács Péter", createdAt: new Date().toISOString() }
      setIsSubmitting(false)
      onSuccess(activity)
    }, 500)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="activity-type">Típus</Label>
        <Select value={type} onValueChange={(v) => { if (v !== null) setType(v as ActivityType) }}>
          <SelectTrigger id="activity-type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="note">{ACTIVITY_LABELS.note}</SelectItem>
            <SelectItem value="email">{ACTIVITY_LABELS.email}</SelectItem>
            <SelectItem value="call">{ACTIVITY_LABELS.call}</SelectItem>
            <SelectItem value="meeting">{ACTIVITY_LABELS.meeting}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="activity-contact">Kapcsolódó kapcsolat</Label>
        <Select value={linkedContactId} onValueChange={(v) => { if (v !== null) setLinkedContactId(v) }}>
          <SelectTrigger id="activity-contact" className="w-full">
            <SelectValue placeholder="Válassz kapcsolatot (opcionális)" />
          </SelectTrigger>
          <SelectContent>
            {MOCK_CONTACTS.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} · {c.company}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          A tevékenység megjelenik a kapcsolat idővonalán is.
        </p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="activity-content">
          Tartalom <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="activity-content"
          value={content}
          onChange={(e) => { setContent(e.target.value); if (contentError) setContentError("") }}
          placeholder="Tevékenység leírása..."
          aria-invalid={!!contentError}
        />
        {contentError && <p className="text-xs text-destructive">{contentError}</p>}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Mégse</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Mentés..." : existingActivity ? "Módosítások mentése" : "Tevékenység rögzítése"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ─── Close Deal Dialog ───────────────────────────────────────────────────────

function CloseDealDialog({
  open,
  onOpenChange,
  onClose,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClose: (outcome: "won" | "lost", reason: string) => void
}) {
  const [outcome, setOutcome] = useState<"won" | "lost" | "">("")
  const [reason, setReason] = useState("")
  const [outcomeError, setOutcomeError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!outcome) { setOutcomeError("Válassz eredményt"); return }
    setIsSubmitting(true)
    setTimeout(() => { setIsSubmitting(false); onClose(outcome, reason) }, 500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Ügylet lezárása</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Eredmény <span className="text-destructive">*</span></Label>
            <div className="flex gap-2">
              <Button type="button" variant={outcome === "won" ? "default" : "outline"} onClick={() => { setOutcome("won"); setOutcomeError("") }} className="flex-1">
                Megnyert
              </Button>
              <Button type="button" variant={outcome === "lost" ? "destructive" : "outline"} onClick={() => { setOutcome("lost"); setOutcomeError("") }} className="flex-1">
                Elvesztett
              </Button>
            </div>
            {outcomeError && <p className="text-xs text-destructive">{outcomeError}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="close-reason">Lezárás oka</Label>
            <Textarea id="close-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Miért nyertük meg vagy vesztettük el?" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Mégse</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Lezárás..." : "Megerősítés"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DealDetailPage() {
  const [deal, setDeal] = useState<Deal>(MOCK_DEAL)
  const [stageHistory, setStageHistory] = useState<StageHistoryEntry[]>(MOCK_STAGE_HISTORY)
  const [activities, setActivities] = useState<Activity[]>(MOCK_ACTIVITIES)

  const [isEditing, setIsEditing] = useState(false)
  const [editDraft, setEditDraft] = useState<Deal>(deal)
  const [editError, setEditError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [logActivityOpen, setLogActivityOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [deleteActivityId, setDeleteActivityId] = useState<string | null>(null)
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)

  const contact = getContact(deal.contactId)
  const isClosed = deal.stage === "won" || deal.stage === "lost"

  const startEdit = () => { setEditDraft({ ...deal }); setIsEditing(true); setEditError(null); setSaveSuccess(false) }
  const cancelEdit = () => { setIsEditing(false); setEditDraft(deal); setEditError(null) }

  const saveEdit = () => {
    if (!editDraft.title.trim()) { setEditError("Az ügylet címe kötelező"); return }
    setIsSaving(true)
    setTimeout(() => {
      if (editDraft.stage !== deal.stage) {
        const newEntry: StageHistoryEntry = {
          id: `sh${Date.now()}`, dealId: deal.id, actorDisplay: "Kovács Péter",
          fromStage: deal.stage, toStage: editDraft.stage, timestamp: new Date().toISOString(), source: "human",
        }
        setStageHistory((prev) => [newEntry, ...prev])
      }
      setDeal(editDraft); setIsEditing(false); setIsSaving(false)
      setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 4000)
    }, 800)
  }

  const handleActivitySuccess = (activity: Activity) => {
    setActivities((prev) => {
      if (prev.find((a) => a.id === activity.id)) return prev.map((a) => a.id === activity.id ? activity : a)
      return [activity, ...prev]
    })
    setLogActivityOpen(false); setEditingActivity(null)
  }

  const confirmDeleteActivity = (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id))
    setDeleteActivityId(null)
  }

  const handleCloseDeal = (outcome: "won" | "lost", reason: string) => {
    const newEntry: StageHistoryEntry = {
      id: `sh${Date.now()}`, dealId: deal.id, actorDisplay: "Kovács Péter",
      fromStage: deal.stage, toStage: outcome, timestamp: new Date().toISOString(), source: "human",
    }
    setStageHistory((prev) => [newEntry, ...prev])
    setDeal((prev) => ({ ...prev, stage: outcome, closeReason: reason }))
    setCloseDialogOpen(false); setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 4000)
  }

  return (
    <div className="flex flex-col gap-4 p-8 max-w-6xl">
      <Breadcrumbs items={[{ label: "Ügyletek", href: "/deals" }, { label: deal.title }]} />

      {saveSuccess && (
        <Alert>
          <CheckCircleIcon />
          <AlertTitle>Mentve</AlertTitle>
          <AlertDescription>Az ügylet sikeresen frissítve.</AlertDescription>
        </Alert>
      )}

      {editError && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Validációs hiba</AlertTitle>
          <AlertDescription>{editError}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? (
              <Input
                value={editDraft.title}
                onChange={(e) => setEditDraft((p) => ({ ...p, title: e.target.value }))}
                className="text-lg font-semibold h-auto py-0.5"
                aria-invalid={!editDraft.title.trim()}
              />
            ) : deal.title}
          </h1>
          {contact && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {contact.name} · {contact.company}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isEditing ? (
            <>
              <Button variant="outline" onClick={startEdit}><EditIcon />Szerkesztés</Button>
              {!isClosed && (
                <Button variant="secondary" onClick={() => setCloseDialogOpen(true)}>Ügylet lezárása</Button>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" onClick={cancelEdit} disabled={isSaving}><XIcon />Mégse</Button>
              <Button onClick={saveEdit} disabled={isSaving}><SaveIcon />{isSaving ? "Mentés..." : "Mentés"}</Button>
            </>
          )}
        </div>
      </div>

      {/* Stage badge */}
      <div className="flex items-center gap-2">
        {isEditing ? (
          <Select value={editDraft.stage} onValueChange={(v) => { if (v !== null) setEditDraft((p) => ({ ...p, stage: v as DealStage })) }}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STAGES.map((s) => (<SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>))}
            </SelectContent>
          </Select>
        ) : (
          <Badge className={STAGE_BADGE_CLASSES[deal.stage]}>{STAGE_LABELS[deal.stage]}</Badge>
        )}
        <span className="text-xs text-muted-foreground">{STAGE_DESCRIPTIONS[deal.stage]}</span>
      </div>

      {isClosed && deal.closeReason && (
        <Alert>
          <AlertTitle>Lezárás oka</AlertTitle>
          <AlertDescription>{deal.closeReason}</AlertDescription>
        </Alert>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-[1fr_320px] gap-4">
        <div className="flex flex-col gap-4">
          {/* Deal details card */}
          <Card className="">
            <CardHeader><CardTitle>Ügylet részletei</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Érték</Label>
                  {isEditing ? (
                    <Input type="number" value={editDraft.value} onChange={(e) => setEditDraft((p) => ({ ...p, value: parseFloat(e.target.value) || 0 }))} />
                  ) : (
                    <p className="text-sm font-medium">{formatCurrency(deal.value, deal.currency)}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Pénznem</Label>
                  {isEditing ? (
                    <Select value={editDraft.currency} onValueChange={(v) => { if (v !== null) setEditDraft((p) => ({ ...p, currency: v as Currency })) }}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HUF">HUF</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : <p className="text-sm">{deal.currency}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Felelős</Label>
                  {isEditing ? (
                    <Select value={editDraft.ownerId} onValueChange={(v) => { if (v !== null) setEditDraft((p) => ({ ...p, ownerId: v })) }}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Válassz felelőst" /></SelectTrigger>
                      <SelectContent>{MOCK_USERS.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : <p className="text-sm">{deal.ownerId ? getUserName(deal.ownerId) : "—"}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Várható zárás</Label>
                  {isEditing ? (
                    <Input type="date" value={editDraft.expectedClose} onChange={(e) => setEditDraft((p) => ({ ...p, expectedClose: e.target.value }))} />
                  ) : <p className="text-sm">{deal.expectedClose || "—"}</p>}
                </div>
              </div>

              <Separator />

              <div className="space-y-1">
                <Label>Leírás</Label>
                {isEditing ? (
                  <Textarea value={editDraft.description} onChange={(e) => setEditDraft((p) => ({ ...p, description: e.target.value }))} />
                ) : <p className="text-sm text-muted-foreground">{deal.description || "—"}</p>}
              </div>
              <div className="space-y-1">
                <Label>Megjegyzés</Label>
                {isEditing ? (
                  <Textarea value={editDraft.notes} onChange={(e) => setEditDraft((p) => ({ ...p, notes: e.target.value }))} />
                ) : <p className="text-sm text-muted-foreground">{deal.notes || "—"}</p>}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Következő lépés felelőse</Label>
                  {isEditing ? (
                    <Select value={editDraft.nextStepOwnerId} onValueChange={(v) => { if (v !== null) setEditDraft((p) => ({ ...p, nextStepOwnerId: v })) }}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Kijelölés..." /></SelectTrigger>
                      <SelectContent>{MOCK_USERS.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : <p className="text-sm">{deal.nextStepOwnerId ? getUserName(deal.nextStepOwnerId) : "—"}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Következő lépés határidő</Label>
                  {isEditing ? (
                    <Input type="date" value={editDraft.nextStepDue} onChange={(e) => setEditDraft((p) => ({ ...p, nextStepDue: e.target.value }))} />
                  ) : <p className="text-sm">{deal.nextStepDue || "—"}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Projekt indulás (tervezett)</Label>
                  {isEditing ? (
                    <Input type="date" value={editDraft.projectStartExpected} onChange={(e) => setEditDraft((p) => ({ ...p, projectStartExpected: e.target.value }))} />
                  ) : <p className="text-sm">{deal.projectStartExpected || "—"}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Projekt indulás (tényleges)</Label>
                  {isEditing ? (
                    <Input type="date" value={editDraft.projectStartActual} onChange={(e) => setEditDraft((p) => ({ ...p, projectStartActual: e.target.value }))} />
                  ) : <p className="text-sm">{deal.projectStartActual || "—"}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Projekt befejezés</Label>
                  {isEditing ? (
                    <Input type="date" value={editDraft.projectEnd} onChange={(e) => setEditDraft((p) => ({ ...p, projectEnd: e.target.value }))} />
                  ) : <p className="text-sm">{deal.projectEnd || "—"}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity timeline */}
          <Card className="">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tevékenység idővonal</CardTitle>
                <Dialog open={logActivityOpen} onOpenChange={setLogActivityOpen}>
                  <DialogTrigger render={<Button size="sm" variant="outline"><PlusIcon />Tevékenység rögzítése</Button>} />
                  <DialogContent className="sm:max-w-sm">
                    <DialogHeader><DialogTitle>Tevékenység rögzítése</DialogTitle></DialogHeader>
                    <LogActivityForm dealId={deal.id} defaultContactId={deal.contactId} onSuccess={handleActivitySuccess} onCancel={() => setLogActivityOpen(false)} />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Még nincs rögzített tevékenység.</div>
              ) : (
                <div className="space-y-3">
                  {activities.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((activity) => (
                    <div key={activity.id} className="flex gap-3 group">
                      <div className="mt-0.5 shrink-0 text-muted-foreground">{ACTIVITY_ICONS[activity.type]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">{ACTIVITY_LABELS[activity.type]}</span>
                            <span className="text-xs text-muted-foreground ml-1">· {activity.authorDisplay}</span>
                            {activity.contactId && <span className="text-xs text-muted-foreground ml-1">· {getContact(activity.contactId)?.name ?? "—"}</span>}
                            <span className="text-xs text-muted-foreground ml-1">· {formatTimestamp(activity.createdAt)}</span>
                            {activity.editedAt && <span className="text-xs text-muted-foreground ml-1">(szerkesztve {formatTimestamp(activity.editedAt)})</span>}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <Dialog open={editingActivity?.id === activity.id} onOpenChange={(open) => !open && setEditingActivity(null)}>
                              <DialogTrigger render={<Button variant="ghost" size="icon-xs" title="Szerkesztés"><EditIcon /></Button>} onClick={() => setEditingActivity(activity)} />
                              <DialogContent className="sm:max-w-sm">
                                <DialogHeader><DialogTitle>Tevékenység szerkesztése</DialogTitle></DialogHeader>
                                {editingActivity && <LogActivityForm dealId={deal.id} existingActivity={editingActivity} onSuccess={handleActivitySuccess} onCancel={() => setEditingActivity(null)} />}
                              </DialogContent>
                            </Dialog>
                            <Dialog open={deleteActivityId === activity.id} onOpenChange={(open) => !open && setDeleteActivityId(null)}>
                              <DialogTrigger render={<Button variant="ghost" size="icon-xs" title="Törlés"><TrashIcon /></Button>} onClick={() => setDeleteActivityId(activity.id)} />
                              <DialogContent className="sm:max-w-sm">
                                <DialogHeader><DialogTitle>Tevékenység törlése</DialogTitle></DialogHeader>
                                <p className="text-sm text-muted-foreground">Biztosan törlöd ezt a tevékenységet? Ez a művelet nem visszavonható.</p>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setDeleteActivityId(null)}>Mégse</Button>
                                  <Button variant="destructive" onClick={() => confirmDeleteActivity(activity.id)}>Törlés</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                        <p className="text-sm mt-0.5">{activity.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column — stage history + next step */}
        <div className="flex flex-col gap-4">
          <Card className="">
            <CardHeader><CardTitle>Fázis történet</CardTitle></CardHeader>
            <CardContent>
              {stageHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">Még nincs fázisváltás.</p>
              ) : (
                <div className="space-y-3">
                  {stageHistory.slice().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((entry) => (
                    <div key={entry.id} className="text-sm">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="font-medium">{entry.actorDisplay}</span>
                        {entry.source === "agent" && <Badge variant="outline" className="text-xs">AI</Badge>}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground text-xs mt-0.5">
                        {entry.fromStage ? (
                          <><span>{STAGE_LABELS[entry.fromStage]}</span><span>→</span></>
                        ) : <span>Létrehozva mint</span>}
                        <span className="font-medium text-foreground">{STAGE_LABELS[entry.toStage]}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatTimestamp(entry.timestamp)}</p>
                      <Separator className="mt-3" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {(deal.nextStepOwnerId || deal.nextStepDue) && (
            <Card className="">
              <CardHeader><CardTitle>Következő lépés</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {deal.nextStepOwnerId && (
                  <p className="text-sm"><span className="text-muted-foreground">Felelős: </span>{getUserName(deal.nextStepOwnerId)}</p>
                )}
                {deal.nextStepDue && (
                  <p className="text-sm flex items-center gap-1"><CalendarIcon className="size-3 text-muted-foreground" />Határidő: {deal.nextStepDue}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <CloseDealDialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen} onClose={handleCloseDeal} />
    </div>
  )
}
