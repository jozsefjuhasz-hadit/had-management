import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    </div>
  )
}
