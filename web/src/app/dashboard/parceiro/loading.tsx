export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background-secondary">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-accent" />
        <p className="text-sm font-medium text-foreground-muted">Carregando…</p>
      </div>
    </div>
  );
}
