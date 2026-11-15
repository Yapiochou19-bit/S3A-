import { AlertTriangle, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { fr } from '../i18n/fr';
import { cn } from '../lib/cn';
import type { ApiError } from '../services/errors';
import { Button } from './Button';

/** Squelette de chargement : `lines` barres animées dans une carte. */
export function LoadingState({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn('space-y-3 rounded-3xl bg-card p-4 shadow-soft', className)}>
      <span className="sr-only">{fr.common.loading}</span>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="h-4 animate-pulse rounded-full bg-muted" style={{ width: `${90 - ((i * 17) % 45)}%` }} />
      ))}
    </div>
  );
}

/** Erreur en français (message issu de ErrorEnvelope) avec « Réessayer » facultatif. */
export function ErrorState({ error, onRetry, className }: { error: ApiError; onRetry?: () => void; className?: string }) {
  return (
    <div role="alert" className={cn('rounded-3xl border border-destructive/25 bg-danger-soft p-4', className)}>
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-destructive text-destructive-foreground">
          <AlertTriangle className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-bold text-foreground">{fr.common.error_title}</p>
          <p className="mt-0.5 text-sm break-words text-muted-foreground">{error.message}</p>
        </div>
      </div>
      {onRetry && (
        <Button variant="outline" className="mt-3 w-full" onClick={onRetry}>
          <RefreshCw /> {fr.common.retry}
        </Button>
      )}
    </div>
  );
}

/** État vide : titre, texte et actions facultatives. */
export function EmptyState({
  title,
  text,
  children,
  className,
}: {
  title: string;
  text?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-3xl border-2 border-dashed border-border bg-card/60 p-6 text-center', className)}>
      <p className="font-display text-lg font-bold text-foreground">{title}</p>
      {text && <p className="mt-1 text-sm text-muted-foreground">{text}</p>}
      {children && <div className="mt-4 flex flex-col items-stretch gap-2">{children}</div>}
    </div>
  );
}
