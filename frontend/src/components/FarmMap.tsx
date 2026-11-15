import { cn } from '../lib/cn';
import type { PlotOut } from '../types/api';

/** Emplacements schématiques des parcelles sur le croquis (positions illustratives, pas géographiques). */
const MAP_SLOTS = [
  '34,38 100,30 108,92 44,100',
  '138,34 214,28 216,96 144,104',
  '236,62 296,56 300,116 242,124',
  '60,128 124,120 130,172 66,178',
  '168,126 232,132 226,180 162,174',
];

interface FarmMapProps {
  plots: Array<Pick<PlotOut, 'plot_id' | 'name'>>;
  activeId?: string;
  onSelect?: (plotId: string) => void;
  /** Texte alternatif du croquis. */
  label: string;
  className?: string;
}

/** Croquis de la ferme : chaque parcelle est un polygone sélectionnable. */
export function FarmMap({ plots, activeId, onSelect, label, className }: FarmMapProps) {
  return (
    <svg viewBox="0 0 310 190" className={cn('block w-full', className)} role="img" aria-label={label}>
      <rect width="310" height="190" className="fill-leaf-soft" />
      <path d="M0 0h310v60C240 50 200 80 140 70S40 40 0 60Z" className="fill-secondary" />
      <path d="M0 190V150c60-20 110 10 170 0s100-30 140-20v60Z" className="fill-sun-soft" />
      <path
        d="M-10 120C40 110 70 140 110 108S190 92 210 112 280 140 320 116"
        className="fill-none stroke-sky"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M0 22C80 26 150 6 230 18S300 30 320 26"
        className="fill-none stroke-earth/60"
        strokeWidth="4"
        strokeDasharray="1 7"
        strokeLinecap="round"
      />
      {plots.map((plot, index) => {
        const points = MAP_SLOTS[index % MAP_SLOTS.length] ?? '';
        const active = plot.plot_id === activeId;
        const [x = 0, y = 0] = (points.split(' ')[0] ?? '0,0').split(',').map(Number);
        return (
          <g key={plot.plot_id} onClick={() => onSelect?.(plot.plot_id)} className={cn(onSelect && 'cursor-pointer')}>
            <polygon
              points={points}
              className={cn(
                'transition-all duration-300',
                active ? 'fill-leaf/70 stroke-forest' : 'fill-forest/25 stroke-forest/60',
              )}
              strokeWidth={active ? 3 : 1.5}
              strokeLinejoin="round"
            />
            <text x={x + 8} y={y + 22} className="fill-forest-deep font-sans text-[10px] font-bold">
              {plot.name.length > 12 ? `${plot.name.slice(0, 11)}…` : plot.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
