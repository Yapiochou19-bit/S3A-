import { formatNumber } from '../i18n/format';
import { fr } from '../i18n/fr';
import { cn } from '../lib/cn';
import type { Tone } from '../lib/visuals';

const TONE_STROKE: Record<Tone, string> = {
  leaf: 'stroke-leaf',
  sky: 'stroke-sky',
  sun: 'stroke-warning',
  earth: 'stroke-earth',
};

interface ScoreRingProps {
  /** Note de 0 à 100. */
  value: number;
  tone?: Tone;
  size?: number;
  className?: string;
}

/** Anneau de note avec la valeur au centre. */
export function ScoreRing({ value, tone = 'leaf', size = 64, className }: ScoreRingProps) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={fr.common.score(formatNumber(value))}
    >
      <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90">
        <circle cx="32" cy="32" r={r} strokeWidth="6" className="fill-none stroke-muted" />
        <circle
          cx="32"
          cy="32"
          r={r}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          className={cn('fill-none transition-[stroke-dashoffset] duration-1000', TONE_STROKE[tone])}
        />
      </svg>
      <span className={cn('relative font-display font-bold text-foreground', size < 48 ? 'text-[11px]' : 'text-lg')}>
        {formatNumber(value)}
      </span>
    </div>
  );
}
