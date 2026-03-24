"use client"

import { useState } from "react"
import Link from "next/link"
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
import { PageHeader } from "@/components/shared/page-header"
import { PlusIcon, SearchIcon, TrendingUpIcon, LoaderIcon } from "lucide-react"
import type { Deal, DealStage, Currency } from "@/lib/types"
import {
  STAGES,
  STAGE_LABELS,
  STAGE_DESCRIPTIONS,
  STAGE_BADGE_CLASSES,
} from "@/lib/constants"
import { formatCurrency, formatDate } from "@/lib/format"
import { MOCK_DEALS, MOCK_CONTACTS, MOCK_USERS, getUserName, getContact } from "@/lib/mock-data"

// ─── Create Deal Form ─────────────────────────────────────────────────────────

function CreateDealForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: (deal: Deal) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState("")
  const [contactId, setContactId] = useState("")
  const [stage, setStage] = useState<DealStage>("lead")
  const [value, setValue] = useState("")
  const [currency, setCurrency] = useState<Currency>("HUF")
  const [ownerId, setOwnerId] = useState("")
  const [expectedClose, setExpectedClose] = useState("")
  const [description, setDescription] = useState("")
  const [notes, setNotes] = useState("")
  const [nextStepOwnerId, setNextStepOwnerId] = useState("")
  const [nextStepDue, setNextStepDue] = useState("")
  const [projectStartExpected, setProjectStartExpected] = useState("")
  const [projectStartActual, setProjectStartActual] = useState("")
  const [projectEnd, setProjectEnd] = useState("")
  const [errors, setErrors] = useState<{ title?: string; contactId?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = () => {
    const errs: { title?: string; contactId?: string } = {}
    if (!title.trim()) errs.title = "Az ügylet címe kötelező"
    if (!contactId) errs.contactId = "Kapcsolat kiválasztása kötelező"
    return errs
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setIsSubmitting(true)
    setTimeout(() => {
      const newDeal: Deal = {
        id: `d${Date.now()}`,
        title: title.trim(),
        contactId,
        stage,
        value: parseFloat(value) || 0,
        currency,
        ownerId,
        expectedClose,
        description,
        notes,
        nextStepOwnerId,
        nextStepDue,
        projectStartExpected,
        projectStartActual,
        projectEnd,
        createdAt: new Date().toISOString().split("T")[0],
      }
      setIsSubmitting(false)
      onSuccess(newDeal)
    }, 800)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="space-y-1">
        <Label htmlFor="deal-title">
          Cím <span className="text-destructive">*</span>
        </Label>
        <Input
          id="deal-title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            if (errors.title) setErrors((p) => ({ ...p, title: undefined }))
          }}
          placeholder="Ügylet címe"
          aria-invalid={!!errors.title}
        />
        {errors.title && (
          <p className="text-xs text-destructive" role="alert">{errors.title}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="deal-contact">
          Kapcsolat <span className="text-destructive">*</span>
        </Label>
        <Select
          value={contactId}
          onValueChange={(v) => {
            if (v === null) return
            setContactId(v)
            if (errors.contactId) setErrors((p) => ({ ...p, contactId: undefined }))
          }}
        >
          <SelectTrigger id="deal-contact" className="w-full" aria-invalid={!!errors.contactId}>
            <SelectValue placeholder="Válassz kapcsolatot" />
          </SelectTrigger>
          <SelectContent>
            {MOCK_CONTACTS.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} — {c.company}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.contactId && (
          <p className="text-xs text-destructive" role="alert">{errors.contactId}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="deal-stage">Fázis</Label>
        <Select value={stage} onValueChange={(v) => { if (v !== null) setStage(v as DealStage) }}>
          <SelectTrigger id="deal-stage" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STAGES.map((s) => (
              <SelectItem key={s} value={s}>
                {STAGE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{STAGE_DESCRIPTIONS[stage]}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="deal-value">Érték</Label>
          <Input
            id="deal-value"
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0"
            min={0}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="deal-currency">Pénznem</Label>
          <Select value={currency} onValueChange={(v) => { if (v !== null) setCurrency(v as Currency) }}>
            <SelectTrigger id="deal-currency" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HUF">HUF</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="deal-owner">Felelős</Label>
        <Select value={ownerId} onValueChange={(v) => { if (v !== null) setOwnerId(v) }}>
          <SelectTrigger id="deal-owner" className="w-full">
            <SelectValue placeholder="Válassz felelőst" />
          </SelectTrigger>
          <SelectContent>
            {MOCK_USERS.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="deal-close">Várható zárás</Label>
        <Input
          id="deal-close"
          type="date"
          value={expectedClose}
          onChange={(e) => setExpectedClose(e.target.value)}
        />
      </div>

      <Separator />

      <div className="space-y-1">
        <Label htmlFor="deal-desc">Leírás</Label>
        <Textarea
          id="deal-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Lehetőség leírása..."
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="deal-notes">Megjegyzés</Label>
        <Textarea
          id="deal-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Belső megjegyzések..."
        />
      </div>

      <Separator />

      <div className="space-y-1">
        <Label htmlFor="deal-next-owner">Következő lépés felelőse</Label>
        <Select value={nextStepOwnerId} onValueChange={(v) => { if (v !== null) setNextStepOwnerId(v) }}>
          <SelectTrigger id="deal-next-owner" className="w-full">
            <SelectValue placeholder="Válassz felelőst" />
          </SelectTrigger>
          <SelectContent>
            {MOCK_USERS.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="deal-next-due">Következő lépés határidő</Label>
        <Input
          id="deal-next-due"
          type="date"
          value={nextStepDue}
          onChange={(e) => setNextStepDue(e.target.value)}
        />
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="deal-ps-expected">Projekt indulás (tervezett)</Label>
          <Input
            id="deal-ps-expected"
            type="date"
            value={projectStartExpected}
            onChange={(e) => setProjectStartExpected(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="deal-ps-actual">Projekt indulás (tényleges)</Label>
          <Input
            id="deal-ps-actual"
            type="date"
            value={projectStartActual}
            onChange={(e) => setProjectStartActual(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="deal-pe">Projekt befejezés</Label>
        <Input
          id="deal-pe"
          type="date"
          value={projectEnd}
          onChange={(e) => setProjectEnd(e.target.value)}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Mégse
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <><LoaderIcon className="size-4 animate-spin" />Mentés...</> : "Ügylet létrehozása"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>(MOCK_DEALS)
  const [search, setSearch] = useState("")
  const [filterStage, setFilterStage] = useState<DealStage | "all">("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const filtered = deals.filter((d) => {
    if (filterStage !== "all" && d.stage !== filterStage) return false
    if (search) {
      const q = search.toLowerCase()
      const contact = getContact(d.contactId)
      return (
        d.title.toLowerCase().includes(q) ||
        contact?.name.toLowerCase().includes(q) ||
        contact?.company.toLowerCase().includes(q)
      )
    }
    return true
  })

  const activeDeals = deals.filter((d) => !["won", "lost"].includes(d.stage))
  const wonDeals = deals.filter((d) => d.stage === "won")

  const handleCreateSuccess = (deal: Deal) => {
    setDeals((prev) => [deal, ...prev])
    setCreateOpen(false)
    setSuccessMessage(`„${deal.title}" ügylet sikeresen létrehozva.`)
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  if (deals.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 min-h-64 p-4 md:p-8">
        <TrendingUpIcon className="size-10 text-muted-foreground" />
        <p className="text-muted-foreground">Még nincsenek ügyletek.</p>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button><PlusIcon />Új ügylet</Button>} />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Új ügylet</DialogTitle>
            </DialogHeader>
            <CreateDealForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-8 max-w-6xl">
      {successMessage && (
        <Alert role="status" aria-live="polite">
          <AlertTitle>Sikeres</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <PageHeader
        title="Ügyletek"
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button><PlusIcon />Új ügylet</Button>} />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Új ügylet</DialogTitle>
              </DialogHeader>
              <CreateDealForm
                onSuccess={handleCreateSuccess}
                onCancel={() => setCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        }
      />

      {/* KPI summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Aktív pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-primary">{activeDeals.length}</p>
            <p className="text-xs text-muted-foreground">nyitott ügylet</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Megnyert (év)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-primary">{wonDeals.length}</p>
            <p className="text-xs text-muted-foreground">lezárt ügylet</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Esedékes lépések</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-primary">
              {deals.filter((d) => d.nextStepDue && d.nextStepDue <= "2026-03-20").length}
            </p>
            <p className="text-xs text-muted-foreground">7 napon belül</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <SearchIcon className="absolute left-2.5 top-2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Keresés..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
            aria-label="Ügyletek keresése"
          />
        </div>
        <Select
          value={filterStage}
          onValueChange={(v) => { if (v !== null) setFilterStage(v as DealStage | "all") }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Fázis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Minden fázis</SelectItem>
            {STAGES.map((s) => (
              <SelectItem key={s} value={s}>
                {STAGE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Deals list */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
              <SearchIcon className="size-6" />
              <p className="text-sm">Nincs találat a szűrésre.</p>
            </div>
          ) : (
            <div className="divide-y" role="table" aria-label="Ügyletek listája">
              <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-4 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground" role="row">
                <span role="columnheader">Cím / Kapcsolat</span>
                <span role="columnheader">Érték</span>
                <span role="columnheader">Fázis</span>
                <span role="columnheader">Felelős</span>
                <span role="columnheader">Zárási dátum</span>
              </div>
              {filtered.map((deal) => {
                const contact = getContact(deal.contactId)
                return (
                  <Link
                    key={deal.id}
                    href={`/deals/${deal.id}`}
                    role="row"
                    className="flex flex-col gap-1 px-4 py-3 hover:bg-muted/40 cursor-pointer transition-[background-color] duration-150 md:grid md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr] md:gap-4 md:items-center"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{deal.title}</p>
                      {contact && (
                        <p className="text-xs text-muted-foreground truncate">
                          {contact.name} · {contact.company}
                        </p>
                      )}
                    </div>
                    <div className="text-sm font-medium">
                      {formatCurrency(deal.value, deal.currency)}
                    </div>
                    <div>
                      <Badge className={STAGE_BADGE_CLASSES[deal.stage]}>
                        {STAGE_LABELS[deal.stage]}
                      </Badge>
                    </div>
                    <div className="text-sm truncate">
                      {deal.ownerId ? getUserName(deal.ownerId) : <span className="text-muted-foreground">—</span>}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(deal.expectedClose)}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        {filtered.length} ügylet
      </p>
    </div>
  )
}
