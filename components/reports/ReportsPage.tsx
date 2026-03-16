import { PageHeader } from "@/components/shared/page-header"
import { BarChart3Icon } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6 p-8 max-w-6xl">
      <PageHeader title="Riportok" />
      <div className="flex flex-col items-center justify-center min-h-64 gap-3 text-muted-foreground">
        <BarChart3Icon className="size-12" />
        <p className="text-lg font-medium">Hamarosan elérhető</p>
        <p className="text-sm">
          Bevételi riportok, negyedéves bontás és többdevizás aggregáció.
        </p>
      </div>
    </div>
  )
}
