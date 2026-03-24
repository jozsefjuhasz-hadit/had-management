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
import { STAGE_LABELS, STAGE_BADGE_CLASSES } from "@/lib/constants"
import { formatCurrency, formatDate } from "@/lib/format"

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
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-6xl">
      <PageHeader
        title="Irányítópult"
        subtitle="Jó reggelt, Péter. Itt a pipeline áttekintésed."
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_KPIS.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {kpi.label}
                </CardTitle>
                <span className="text-muted-foreground">{kpi.icon}</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold leading-none text-primary">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent deals */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Legutóbbi ügyletek</CardTitle>
              <Link
                href="/deals"
                className="text-xs text-primary hover:underline flex items-center gap-0.5 py-1 px-1.5 -my-1 -mr-1.5 rounded"
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
                  className="flex items-center gap-3 py-2.5 hover:bg-muted/40 rounded-lg px-1 -mx-1 transition-[background-color] duration-150"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{deal.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {deal.contactName}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge className={STAGE_BADGE_CLASSES[deal.stage]}>
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
                className="text-xs text-primary hover:underline flex items-center gap-0.5 py-1 px-1.5 -my-1 -mr-1.5 rounded"
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
                    className="flex items-center gap-3 py-2.5 hover:bg-muted/40 rounded-lg px-1 -mx-1 transition-[background-color] duration-150"
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
                      {formatDate(step.dueDate)}
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
          {(() => {
            const stages = ["lead", "qualified", "proposal", "negotiation"] as DealStage[]
            const counts = stages.map((s) => MOCK_RECENT_DEALS.filter((d) => d.stage === s).length)
            const total = Math.max(counts.reduce((a, b) => a + b, 0), 1)
            return (
              <div className="space-y-3">
                {stages.map((stage, i) => (
                  <div key={stage} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-28 shrink-0">{STAGE_LABELS[stage]}</span>
                    <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden">
                      <div
                        className={`h-full rounded-md transition-all duration-300 ${STAGE_BADGE_CLASSES[stage]}`}
                        style={{ width: `${Math.max((counts[i] / total) * 100, counts[i] > 0 ? 8 : 0)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-6 text-right tabular-nums">{counts[i]}</span>
                  </div>
                ))}
              </div>
            )
          })()}
        </CardContent>
      </Card>
    </div>
  )
}
