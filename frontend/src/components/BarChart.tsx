import { formatNumber } from '../i18n/format';
import { cn } from '../lib/cn';

export interface BarPoint {
  label: string;
  /** null → barre absente et tiret (donnée non disponible). */
  value: number | null;
  /** Fourchette q10–q90, facultative : dessinée en trait fin. */
  low?: number | null;
  high?: number | null;
  /** Barre mise en avant en rouge (période critique). */
  highlight?: boolean;
}

const TONES = {
  sky: { bar: 'fill-sky', soft: 'fill-sky-soft' },
  sun: { bar: 'fill-warning', soft: 'fill-warning-soft' },
  leaf: { bar: 'fill-leaf', soft: 'fill-leaf-soft' },
} as const;

interface BarChartProps {
  data: BarPoint[];
  tone: keyof typeof TONES;
  /** Texte alternatif du graphique. */
  label: string;
  /** Légende en bas à droite (ex. « en mm · trait = fourchette »). */
  caption?: string;
  digits?: number;
  /** Plancher de l'axe (utile pour les températures). */
  baseline?: number;
}

const W = 300;
const H = 150;

/** Histogramme de la maquette : barres arrondies sur fond clair, valeur au-dessus, fourchette en trait fin. */
export function BarChart({ data, tone, label, caption, digits = 0, baseline = 0 }: BarChartProps) {
  const values = data.flatMap((d) => [d.value, d.high ?? null]).filter((v): v is number => v !== null);
  const max = Math.max(baseline + 1, ...values) * 1.15;
  const bw = Math.min(34, (W / Math.max(1, data.length)) * 0.6);
  const gap = (W - bw * data.length) / (data.length + 1);
  const y = (v: number) => H - ((Math.max(baseline, v) - baseline) / (max - baseline)) * H;

  return (
    <svg viewBox={`0 0 ${W} ${H + (caption ? 40 : 24)}`} className="block w-full" role="img" aria-label={label}>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} className="stroke-border" strokeDasharray="2 4" />
      ))}
      {data.map((d, i) => {
        const x = gap + i * (bw + gap);
        const cx = x + bw / 2;
        const top = d.value === null ? H : y(d.value);
        const labelY = (d.high != null ? Math.min(y(d.high), top) : top) - 6;
        return (
          <g key={d.label} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
            <rect x={x} y={0} width={bw} height={H} rx="10" className={TONES[tone].soft} opacity={0.5} />
            {d.value !== null && (
              <rect
                x={x}
                y={top}
                width={bw}
                height={H - top}
                rx="10"
                className={cn(TONES[tone].bar, d.highlight && 'fill-destructive')}
              />
            )}
            {d.low != null && d.high != null && (
              <line x1={cx} x2={cx} y1={y(d.high)} y2={y(d.low)} className="stroke-forest-deep" strokeWidth="1.5" strokeLinecap="round" />
            )}
            <text x={cx} y={Math.max(11, labelY)} textAnchor="middle" className="fill-foreground font-sans text-[11px] font-bold">
              {d.value === null ? '–' : formatNumber(d.value, digits)}
            </text>
            <text
              x={cx}
              y={H + 18}
              textAnchor="middle"
              className={cn('font-sans text-[11px] font-semibold', d.highlight ? 'fill-destructive' : 'fill-muted-foreground')}
            >
              {d.label}
            </text>
          </g>
        );
      })}
      {caption && (
        <text x={W} y={H + 36} textAnchor="end" className="fill-muted-foreground font-sans text-[10px]">
          {caption}
        </text>
      )}
    </svg>
  );
}
