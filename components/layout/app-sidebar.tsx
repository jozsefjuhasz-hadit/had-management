"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboardIcon,
  ContactIcon,
  HandshakeIcon,
  BarChart3Icon,
} from "lucide-react"
import { ThemeToggle } from "./theme-toggle"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Irányítópult", icon: LayoutDashboardIcon },
  { href: "/contacts", label: "Kapcsolatok", icon: ContactIcon },
  { href: "/deals", label: "Ügyletek", icon: HandshakeIcon },
  { href: "/reports", label: "Riportok", icon: BarChart3Icon },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col">
      {/* Branding */}
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
        <span className="font-semibold text-sm text-sidebar-foreground">
          HAD Management
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-full bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground">
            KP
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate text-sidebar-foreground">
              Kovács Péter
            </p>
            <p className="text-xs text-muted-foreground">Account Manager</p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}
