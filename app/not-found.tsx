import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Az oldal nem található.</p>
      <Link
        href="/dashboard"
        className="text-primary hover:underline text-sm"
      >
        Vissza az irányítópulthoz
      </Link>
    </div>
  )
}
