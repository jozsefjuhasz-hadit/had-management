"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import {
  MailIcon,
  PhoneIcon,
  BuildingIcon,
  BriefcaseIcon,
  UserIcon,
} from "lucide-react"
import {
  STAGE_LABELS,
  STAGE_BADGE_VARIANTS,
  SOURCE_LABELS,
} from "@/lib/constants"
import { formatCurrency, formatRelativeDate } from "@/lib/format"
import {
  MOCK_CONTACTS,
  getUserName,
  getDealsForContact,
  getActivitiesForContact,
} from "@/lib/mock-data"
import { ACTIVITY_LABELS } from "@/lib/constants"

interface ContactDetailPageProps {
  contactId: string
}

export default function ContactDetailPage({ contactId }: ContactDetailPageProps) {
  const contact = MOCK_CONTACTS.find((c) => c.id === contactId)

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 p-6 gap-2">
        <UserIcon className="size-10 text-muted-foreground" />
        <p className="text-muted-foreground">A kapcsolat nem található.</p>
        <Link href="/contacts" className="text-sm text-primary hover:underline">
          Vissza a kapcsolatokhoz
        </Link>
      </div>
    )
  }

  const deals = getDealsForContact(contactId)
  const activities = getActivitiesForContact(contactId)
  const activeDeals = deals.filter((d) => !["won", "lost"].includes(d.stage))
  const wonDeals = deals.filter((d) => d.stage === "won")
  const openPipelineValue = activeDeals.reduce((sum, d) => sum + d.value, 0)
  const wonValue = wonDeals.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="flex flex-col gap-4 p-6">
      <Breadcrumbs
        items={[
          { label: "Kapcsolatok", href: "/contacts" },
          { label: contact.name },
        ]}
      />

      {/* Contact header */}
      <div className="flex items-center gap-4">
        <div className="size-12 rounded-full bg-primary flex items-center justify-center text-lg font-semibold text-primary-foreground">
          {contact.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{contact.name}</h1>
          <p className="text-sm text-muted-foreground">
            {contact.title && <span>{contact.title}</span>}
            {contact.title && contact.company && <span> · </span>}
            {contact.company && <span>{contact.company}</span>}
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aktív ügyletek
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{activeDeals.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nyitott pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatCurrency(openPipelineValue, "HUF")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Megnyert érték
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatCurrency(wonValue, "HUF")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-4">
        {/* Left column */}
        <div className="flex flex-col gap-4">
          {/* Contact info */}
          <Card>
            <CardHeader>
              <CardTitle>Kapcsolat adatai</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contact.email && (
                <div className="flex items-center gap-2 text-sm">
                  <MailIcon className="size-4 text-muted-foreground shrink-0" />
                  <span>{contact.email}</span>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <PhoneIcon className="size-4 text-muted-foreground shrink-0" />
                  <span>{contact.phone}</span>
                </div>
              )}
              {contact.company && (
                <div className="flex items-center gap-2 text-sm">
                  <BuildingIcon className="size-4 text-muted-foreground shrink-0" />
                  <span>{contact.company}</span>
                </div>
              )}
              {contact.title && (
                <div className="flex items-center gap-2 text-sm">
                  <BriefcaseIcon className="size-4 text-muted-foreground shrink-0" />
                  <span>{contact.title}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Forrás:</span>
                <span>{SOURCE_LABELS[contact.source]}</span>
              </div>
              {contact.kamUserId && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Felelős (KAM):</span>
                  <span>{getUserName(contact.kamUserId)}</span>
                </div>
              )}
              {contact.referredByUserId && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Ajánlotta:</span>
                  <span>{getUserName(contact.referredByUserId)}</span>
                </div>
              )}
              {contact.notes && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Megjegyzés</p>
                  <p className="text-sm">{contact.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deals for this contact */}
          <Card>
            <CardHeader>
              <CardTitle>Kapcsolódó ügyletek</CardTitle>
            </CardHeader>
            <CardContent>
              {deals.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nincs kapcsolódó ügylet.
                </p>
              ) : (
                <div className="divide-y">
                  {deals.map((deal) => (
                    <Link
                      key={deal.id}
                      href={`/deals/${deal.id}`}
                      className="flex items-center justify-between py-2.5 hover:bg-muted/40 rounded-lg px-1 -mx-1 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {deal.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(deal.value, deal.currency)}
                        </p>
                      </div>
                      <Badge variant={STAGE_BADGE_VARIANTS[deal.stage]}>
                        {STAGE_LABELS[deal.stage]}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column — activity timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Tevékenység idővonal</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Még nincs rögzített tevékenység.
              </p>
            ) : (
              <div className="space-y-3">
                {activities
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  )
                  .map((activity) => (
                    <div key={activity.id} className="text-sm">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-xs text-muted-foreground">
                          {ACTIVITY_LABELS[activity.type]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          · {activity.authorName}
                        </span>
                      </div>
                      <p className="mt-0.5">{activity.content}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatRelativeDate(activity.createdAt)}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
