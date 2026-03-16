import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-full" />
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    </div>
  )
}
