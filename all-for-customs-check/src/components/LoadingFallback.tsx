import { ArrowClockwise } from '@phosphor-icons/react'

export function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-background">
      <div className="flex flex-col items-center gap-4">
        <ArrowClockwise className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Učitavanje...</p>
      </div>
    </div>
  )
}

export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <ArrowClockwise className="w-12 h-12 animate-spin text-primary" />
        <p className="text-lg font-medium">Carinski Alat</p>
        <p className="text-sm text-muted-foreground">Učitavanje aplikacije...</p>
      </div>
    </div>
  )
}
