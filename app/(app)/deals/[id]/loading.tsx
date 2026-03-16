import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-8 w-72" />
      <div className="grid grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}
