import { fr } from '../i18n/fr';
import { cn } from '../lib/cn';

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'relative inline-flex size-10 items-center justify-center rounded-2xl bg-gradient-forest text-primary-foreground shadow-soft',
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" className="size-6" fill="none">
        <path d="M16 27c0-7 0-11 0-14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M16 15c-1-5-5-8-10-8 0 5 4 9 10 8Z" className="fill-leaf" />
        <path d="M16 19c1-6 5-10 11-10 0 6-5 10-11 10Z" fill="currentColor" />
        <circle cx="24.5" cy="5.5" r="2" className="fill-sun" />
      </svg>
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="leading-none">
        <span className="block font-display text-xl font-bold tracking-tight">{fr.app.name}</span>
        <span className="block text-[11px] font-medium text-muted-foreground">{fr.app.subtitle}</span>
      </span>
    </span>
  );
}
