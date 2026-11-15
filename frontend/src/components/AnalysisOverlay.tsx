import { Check, CloudSun, Satellite, Sprout } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatCoords } from '../i18n/format';
import { fr } from '../i18n/fr';
import { cn } from '../lib/cn';
import { nearestCity } from '../lib/visuals';
import type { PlotOut } from '../types/api';
import { Button } from './Button';
import { PlotThumb } from './Thumbs';

const STEP_ICONS = [Satellite, CloudSun, Sprout];
const STEP_MS = 900;

interface AnalysisOverlayProps {
  plot: PlotOut;
  /** Masque l'overlay sans annuler l'analyse. */
  onHide: () => void;
}

/**
 * Overlay affiché pendant l'analyse (dans le cadre du téléphone, ancêtre `relative` de AppShell).
 * Les étapes avancent sur une minuterie, mais la dernière reste « en cours » tant que l'appel
 * n'est pas terminé : c'est le parent qui démonte l'overlay à la fin de l'analyse.
 */
export function AnalysisOverlay({ plot, onHide }: AnalysisOverlayProps) {
  const lastStep = fr.analyze.steps.length - 1;
  const [step, setStep] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step >= lastStep) return;
    const timer = window.setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => window.clearTimeout(timer);
  }, [step, lastStep]);

  useEffect(() => {
    sheetRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onHide();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onHide]);

  const place = nearestCity(plot.latitude, plot.longitude) ?? formatCoords(plot.latitude, plot.longitude);

  return (
    <div
      className="absolute inset-0 z-50 flex animate-fade-in items-end bg-overlay backdrop-blur-sm lg:inset-3 lg:overflow-hidden lg:rounded-[2.4rem]"
      role="dialog"
      aria-modal="true"
      aria-label={fr.analyze.running}
    >
      <div
        ref={sheetRef}
        tabIndex={-1}
        className="no-scrollbar max-h-full w-full animate-sheet-up overflow-y-auto rounded-t-[2rem] bg-card p-6 pb-8 outline-none"
      >
        <div className="relative mx-auto h-36 overflow-hidden rounded-3xl">
          <PlotThumb plot={plot} alt="" className="absolute inset-0 size-full" />
          <div className="absolute inset-x-0 h-full animate-scan bg-gradient-to-b from-transparent via-leaf/40 to-transparent" />
          <div className="absolute inset-0 rounded-3xl border-2 border-leaf/80" />
        </div>
        <h2 className="mt-5 text-center font-display text-2xl font-bold">{fr.analyze.running}</h2>
        <p className="text-center text-sm text-muted-foreground">
          {plot.name} · {place}
        </p>
        <ul className="mt-5 space-y-2.5" aria-live="polite">
          {fr.analyze.steps.map((label, i) => {
            const done = step > i;
            const current = step === i;
            const Icon = STEP_ICONS[i] ?? Sprout;
            return (
              <li
                key={label}
                aria-current={current ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-2xl p-3 transition-colors',
                  done ? 'bg-leaf-soft' : current ? 'bg-muted' : 'opacity-50',
                )}
              >
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-xl',
                    done ? 'bg-leaf text-leaf-foreground' : 'bg-card text-primary',
                  )}
                >
                  {done ? <Check className="size-5" /> : <Icon className={cn('size-5', current && 'animate-pulse')} />}
                </span>
                <span className="text-[15px] font-semibold">{label}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-center text-sm text-muted-foreground">{fr.analyze.running_hint}</p>
        <Button variant="soft" className="mt-3 w-full" onClick={onHide}>
          {fr.analyze.hide}
        </Button>
      </div>
    </div>
  );
}
