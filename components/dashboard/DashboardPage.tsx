"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { PageHeader } from "@/components/shared/page-header"
import {
  UsersIcon,
  TrendingUpIcon,
  CheckCircleIcon,
  CalendarIcon,
  ChevronRightIcon,
} from "lucide-react"
import type { DealStage, Currency } from "@/lib/types"
import { STAGE_LABELS, STAGE_BADGE_VARIANTS } from "@/lib/constants"
import { formatCurrency } from "@/lib/format"

// ─── Mock data (will be replaced by server data) ─────────────────────────────

interface KpiItem {
  label: string
  value: string
  sub: string
  icon: React.ReactNode
}

const MOCK_KPIS: KpiItem[] = [
  {
    label: "Aktív kapcsolatok",
    value: "47",
    sub: "3 új ezen a héten",
    icon: <UsersIcon className="size-5" />,
  },
  {
    label: "Aktív pipeline",
    value: "12",
    sub: "nyitott ügylet",
    icon: <TrendingUpIcon className="size-5" />,
  },
  {
    label: "Pipeline érték",
    value: "~45,2 M HUF",
    sub: "becsült — vegyes pénznem",
    icon: <TrendingUpIcon className="size-5" />,
  },
  {
    label: "Megnyert (negyedév)",
    value: "3",
    sub: "lezárt ügylet",
    icon: <CheckCircleIcon className="size-5" />,
  },
]

interface RecentDeal {
  id: string
  title: string
  stage: DealStage
  value: number
  currency: Currency
  contactName: string
}

const MOCK_RECENT_DEALS: RecentDeal[] = [
  { id: "d1", title: "TechCorp ERP integráció", stage: "negotiation", value: 4500000, currency: "HUF", contactName: "Nagy Balázs" },
  { id: "d2", title: "Industrial Co. adatplatform", stage: "proposal", value: 25000, currency: "EUR", contactName: "Varga Katalin" },
  { id: "d3", title: "Startup.io MVP tanácsadás", stage: "qualified", value: 8000, currency: "USD", contactName: "Horváth Gábor" },
]

interface UpcomingStep {
  dealId: string
  dealTitle: string
  ownerName: string
  dueDate: string
}

const MOCK_NEXT_STEPS: UpcomingStep[] = [
  { dealId: "d1", dealTitle: "TechCorp ERP integráció", ownerName: "Kovács Péter", dueDate: "2026-03-20" },
  { dealId: "d3", dealTitle: "Startup.io MVP tanácsadás", ownerName: "Szabó Ágnes", dueDate: "2026-03-18" },
]

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Irányítópult"
        subtitle="Jó reggelt, Péter. Itt a pipeline áttekintésed."
      />

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        {MOCK_KPIS.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
                <span className="text-muted-foreground">{kpi.icon}</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold leading-none">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Recent deals */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Legutóbbi ügyletek</CardTitle>
              <Link
                href="/deals"
                className="text-xs text-primary hover:underline flex items-center gap-0.5"
              >
                Összes <ChevronRightIcon className="size-3" />
              </Link>
            </div>
            <CardDescription>A legfrissebb pipeline aktivitás</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {MOCK_RECENT_DEALS.map((deal) => (
                <Link
                  key={deal.id}
                  href={`/deals/${deal.id}`}
                  className="flex items-center gap-3 py-2.5 hover:bg-muted/40 rounded-lg px-1 -mx-1 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{deal.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {deal.contactName}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant={STAGE_BADGE_VARIANTS[deal.stage]}>
                      {STAGE_LABELS[deal.stage]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(deal.value, deal.currency)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming next steps */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Következő lépések</CardTitle>
              <Link
                href="/deals"
                className="text-xs text-primary hover:underline flex items-center gap-0.5"
              >
                Összes <ChevronRightIcon className="size-3" />
              </Link>
            </div>
            <CardDescription>Hamarosan esedékes teendők</CardDescription>
          </CardHeader>
          <CardContent>
            {MOCK_NEXT_STEPS.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nincs esedékes következő lépés.
              </div>
            ) : (
              <div className="divide-y">
                {MOCK_NEXT_STEPS.map((step) => (
                  <Link
                    key={step.dealId}
                    href={`/deals/${step.dealId}`}
                    className="flex items-center gap-3 py-2.5 hover:bg-muted/40 rounded-lg px-1 -mx-1 transition-colors"
                  >
                    <CalendarIcon className="size-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {step.dealTitle}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {step.ownerName}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {step.dueDate}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pipeline by stage */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline fázis szerint</CardTitle>
          <CardDescription>
            Aktív ügyletek fázisonként (megnyert/elvesztett nélkül)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto">
            {(["lead", "qualified", "proposal", "negotiation"] as DealStage[]).map(
              (stage) => {
                const count = MOCK_RECENT_DEALS.filter(
                  (d) => d.stage === stage
                ).length
                return (
                  <div
                    key={stage}
                    className="flex flex-col items-center gap-1 min-w-20"
                  >
                    <Badge variant={STAGE_BADGE_VARIANTS[stage]}>
                      {STAGE_LABELS[stage]}
                    </Badge>
                    <span className="text-2xl font-semibold">{count}</span>
                    <span className="text-xs text-muted-foreground">
                      ügylet
                    </span>
                  </div>
                )
              }
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
