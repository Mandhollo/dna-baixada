export default function PremiumLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background-secondary">
      <div className="flex flex-col items-center gap-6">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-primary/20 border-t-accent" />
        <p className="text-sm font-medium text-foreground-muted">Carregando DNA Premium…</p>
      </div>
    </div>
  );
}
