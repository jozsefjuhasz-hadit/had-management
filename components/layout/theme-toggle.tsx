"use client"

import { useEffect, useCallback, useSyncExternalStore } from "react"
import { Button } from "@/components/ui/button"
import { SunIcon, MoonIcon } from "lucide-react"

const STORAGE_KEY = "had_theme"

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback)
  return () => window.removeEventListener("storage", callback)
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY) === "dark"
}

function getServerSnapshot() {
  return false
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  const toggle = useCallback(() => {
    const next = !dark
    localStorage.setItem(STORAGE_KEY, next ? "dark" : "light")
    document.documentElement.classList.toggle("dark", next)
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }))
  }, [dark])

  return (
    <Button variant="ghost" size="sm" onClick={toggle} aria-label="Téma váltás">
      {dark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
    </Button>
  )
}
