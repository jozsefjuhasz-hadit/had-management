"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/components/shared/page-header"
import {
  UserIcon,
  BuildingIcon,
  MailIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react"
import type { Contact, ContactSource } from "@/lib/types"
import { SOURCE_LABELS, SOURCE_BADGE_CLASSES } from "@/lib/constants"
import { formatRelativeDate } from "@/lib/format"
import { MOCK_CONTACTS, MOCK_USERS, getUserName } from "@/lib/mock-data"

// ─── Create Contact Form ──────────────────────────────────────────────────────

interface CreateContactFormErrors {
  name?: string
  email?: string
}

function CreateContactForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: (contact: Contact) => void
  onCancel: () => void
}) {
  const [name, setName] = useState("")
  const [title, setTitle] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [company, setCompany] = useState("")
  const [source, setSource] = useState<ContactSource | "">("")
  const [kamUserId, setKamUserId] = useState("")
  const [referredByUserId, setReferredByUserId] = useState("")
  const [notes, setNotes] = useState("")
  const [errors, setErrors] = useState<CreateContactFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = (): CreateContactFormErrors => {
    const errs: CreateContactFormErrors = {}
    if (!name.trim()) errs.name = "A név megadása kötelező"
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Adj meg érvényes email címet"
    }
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
      const newContact: Contact = {
        id: `c${Date.now()}`,
        name: name.trim(),
        title,
        email,
        phone,
        company,
        source: (source as ContactSource) || "other",
        kamUserId,
        referredByUserId,
        notes,
        lastInteractionDate: new Date().toISOString().split("T")[0],
        isArchived: false,
      }
      setIsSubmitting(false)
      onSuccess(newContact)
    }, 800)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="contact-name">
          Név <span className="text-destructive">*</span>
        </Label>
        <Input
          id="contact-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (errors.name) setErrors((p) => ({ ...p, name: undefined }))
          }}
          placeholder="Teljes név"
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="contact-title">Beosztás</Label>
          <Input
            id="contact-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Beosztás"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="contact-company">Cég</Label>
          <Input
            id="contact-company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Cégnév"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="contact-email">Email</Label>
        <Input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (errors.email) setErrors((p) => ({ ...p, email: undefined }))
          }}
          placeholder="email@pelda.hu"
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="contact-phone">Telefon</Label>
        <Input
          id="contact-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+36 20 000 0000"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="contact-source">Forrás</Label>
        <Select
          value={source}
          onValueChange={(v) => { if (v !== null) setSource(v as ContactSource) }}
        >
          <SelectTrigger id="contact-source" className="w-full">
            <SelectValue placeholder="Válassz forrást" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="referral">Ajánlás</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="other">Egyéb</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="contact-kam">Felelős (KAM)</Label>
        <Select value={kamUserId} onValueChange={(v) => { if (v !== null) setKamUserId(v) }}>
          <SelectTrigger id="contact-kam" className="w-full">
            <SelectValue placeholder="Válassz felelőst" />
          </SelectTrigger>
          <SelectContent>
            {MOCK_USERS.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="contact-referredby">Ajánlotta</Label>
        <Select value={referredByUserId} onValueChange={(v) => { if (v !== null) setReferredByUserId(v) }}>
          <SelectTrigger id="contact-referredby" className="w-full">
            <SelectValue placeholder="Válassz felhasználót (opcionális)" />
          </SelectTrigger>
          <SelectContent>
            {MOCK_USERS.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="contact-notes">Megjegyzés</Label>
        <Textarea
          id="contact-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Bármilyen kiegészítő információ..."
        />
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Mégse
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Mentés..." : "Kapcsolat létrehozása"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>(MOCK_CONTACTS)
  const [search, setSearch] = useState("")
  const [filterSource, setFilterSource] = useState<ContactSource | "all">("all")
  const [showArchived, setShowArchived] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const filtered = contacts.filter((c) => {
    if (c.isArchived && !showArchived) return false
    if (!c.isArchived && showArchived) return false
    if (filterSource !== "all" && c.source !== filterSource) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q)
      )
    }
    return true
  })

  const handleCreateSuccess = (contact: Contact) => {
    setContacts((prev) => [contact, ...prev])
    setCreateOpen(false)
    setSuccessMessage(`„${contact.name}" kapcsolat sikeresen létrehozva.`)
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  const isEmpty = contacts.filter((c) => !c.isArchived).length === 0

  if (isEmpty) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 min-h-64 p-8">
        <UserIcon className="size-10 text-muted-foreground" />
        <p className="text-muted-foreground">Még nincsenek kapcsolatok.</p>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button><PlusIcon />Új kapcsolat</Button>} />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Új kapcsolat</DialogTitle>
            </DialogHeader>
            <CreateContactForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-8 max-w-6xl">
      {successMessage && (
        <Alert>
          <AlertTitle>Sikeres</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <PageHeader
        title="Kapcsolatok"
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button><PlusIcon />Új kapcsolat</Button>} />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Új kapcsolat</DialogTitle>
              </DialogHeader>
              <CreateContactForm
                onSuccess={handleCreateSuccess}
                onCancel={() => setCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <SearchIcon className="absolute left-2.5 top-2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Keresés..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select
          value={filterSource}
          onValueChange={(v) => { if (v !== null) setFilterSource(v as ContactSource | "all") }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Forrás" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Minden forrás</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="referral">Ajánlás</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="other">Egyéb</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={showArchived ? "secondary" : "outline"}
          onClick={() => setShowArchived((p) => !p)}
        >
          {showArchived ? "Aktívak mutatása" : "Archiváltak mutatása"}
        </Button>
      </div>

      {/* Contacts list */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
              <SearchIcon className="size-6" />
              <p className="text-sm">Nincs találat a szűrésre.</p>
            </div>
          ) : (
            <div className="divide-y">
              <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-4 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <span>Név / Cég</span>
                <span>Email</span>
                <span>Forrás</span>
                <span>Felelős</span>
                <span>Utolsó interakció</span>
              </div>
              {filtered.map((contact) => (
                <Link
                  key={contact.id}
                  href={`/contacts/${contact.id}`}
                  className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-4 px-4 py-3 hover:bg-muted/40 cursor-pointer transition-[background-color] duration-150 items-center"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {contact.name}
                      </span>
                      {contact.isArchived && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          Archivált
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                      {contact.title && <span>{contact.title}</span>}
                      {contact.title && contact.company && <span>·</span>}
                      {contact.company && (
                        <span className="flex items-center gap-1">
                          <BuildingIcon className="size-3" />
                          {contact.company}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0 truncate text-sm">
                    {contact.email ? (
                      <span className="flex items-center gap-1">
                        <MailIcon className="size-3 text-muted-foreground shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                  <div>
                    {contact.source ? (
                      <Badge className={SOURCE_BADGE_CLASSES[contact.source]}>
                        {SOURCE_LABELS[contact.source]}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </div>
                  <div className="text-sm truncate">
                    {contact.kamUserId ? (
                      getUserName(contact.kamUserId)
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatRelativeDate(contact.lastInteractionDate)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        {filtered.length} kapcsolat
      </p>
    </div>
  )
}
