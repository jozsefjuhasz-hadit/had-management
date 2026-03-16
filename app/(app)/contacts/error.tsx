"use client"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircleIcon } from "lucide-react"

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col gap-4 p-6">
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>A kapcsolatok nem tölthetők be</AlertTitle>
        <AlertDescription>Nem sikerült lekérni a kapcsolatlistát. Kérlek próbáld újra.</AlertDescription>
      </Alert>
      <Button variant="outline" onClick={reset}>Újrapróbálás</Button>
    </div>
  )
}
