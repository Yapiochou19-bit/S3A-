import { Loader2, RefreshCw, Satellite } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Button } from '../components/Button';
import { ScreenHeader } from '../components/ScreenHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { usePlot } from '../context/PlotContext';
import { useAsync } from '../hooks/useAsync';
import { formatDate, formatMonth, formatNumber, formatShortDay, formatWithUnit } from '../i18n/format';
import { fr } from '../i18n/fr';
import { cn } from '../lib/cn';
import { api } from '../services/api';
import { toApiError, type ApiError } from '../services/errors';
import type { CurrentSeasonOut, ModelVersion, Quality } from '../types/api';

const t = fr.technical;

const CARD = 'rounded-3xl bg-card p-4 shadow-soft';

const CHIP_TONES = {
  good: 'bg-leaf-soft text-leaf-foreground',
  warn: 'bg-warning-soft text-sun-foreground',
  bad: 'bg-danger-soft text-destructive',
  info: 'bg-sky-soft text-sky-foreground',
} as const;

type ChipTone = keyof typeof CHIP_TONES;

const QUALITY_TONE: Record<Quality, ChipTone> = {
  observed: 'good',
  estimated: 'info',
  needs_local_validation: 'warn',
  missing: 'bad',
};

function Chip({ tone, children }: { tone: ChipTone; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold', CHIP_TONES[tone])}>
      {children}
    </span>
  );
}

/** Ligne libellé / valeur ; à placer dans un conteneur « divide-y divide-border ». */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right text-sm font-semibold break-words text-foreground">{children}</span>
    </div>
  );
}

function SectionShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mx-5 mt-6">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

/** Enveloppe commune : chargement, erreur avec « Réessayer », puis contenu. */
function AsyncSection<T>({
  title,
  state,
  children,
}: {
  title: string;
  state: { data: T | null; error: ApiError | null; loading: boolean; reload: () => void };
  children: (data: T) => ReactNode;
}) {
  return (
    <SectionShell title={title}>
      {state.loading ? (
        <LoadingState />
      ) : state.error ? (
        <ErrorState error={state.error} onRetry={state.reload} />
      ) : state.data !== null ? (
        children(state.data)
      ) : null}
    </SectionShell>
  );
}

function SystemSection() {
  const state = useAsync(async () => ({ health: await api.getHealth(), clock: await api.getClock() }), []);
  return (
    <AsyncSection title={t.system} state={state}>
      {({ health, clock }) => (
        <div className={cn(CARD, 'divide-y divide-border')}>
          <Row label={t.status}>
            <Chip tone={health.status === 'ok' ? 'good' : 'warn'}>{health.status === 'ok' ? t.ok : t.degraded}</Chip>
          </Row>
          <Row label={t.database}>
            <Chip tone={health.database === 'ok' ? 'good' : 'bad'}>{health.database === 'ok' ? t.ok : t.down}</Chip>
          </Row>
          <Row label={t.ml_mode}>
            <Chip tone={health.ml_mode === 'real' ? 'good' : 'warn'}>{health.ml_mode === 'real' ? t.real : t.mock}</Chip>
          </Row>
          <Row label={t.model_version}>{health.model_version ?? fr.common.not_available}</Row>
          <Row label={t.llm}>
            <Chip tone={health.llm_enabled ? 'good' : 'info'}>{health.llm_enabled ? t.enabled : t.disabled}</Chip>
          </Row>
          <Row label={t.today}>
            {formatDate(clock.today)}
            {clock.is_overridden && (
              <span className="ml-1.5 inline-flex align-middle">
                <Chip tone="warn">{t.clock_overridden}</Chip>
              </span>
            )}
          </Row>
        </div>
      )}
    </AsyncSection>
  );
}

function ModelCard({ model }: { model: ModelVersion }) {
  return (
    <li className={CARD}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-lg font-bold">{t.model(model.version)}</p>
        {model.is_active && <Chip tone="good">{t.active_model}</Chip>}
      </div>
      <p className="mt-0.5 text-[13px] text-muted-foreground">
        {[model.parent_version ? t.parent(model.parent_version) : null, t.trained_until(formatDate(model.trained_until))]
          .filter(Boolean)
          .join(' · ')}
      </p>
      <div className="mt-3 divide-y divide-border">
        <Row label={t.skill}>{formatWithUnit(model.skill_pct, fr.units.pct, 1)}</Row>
        <Row label={t.coverage}>
          {formatWithUnit(model.interval_coverage === null ? null : model.interval_coverage * 100, fr.units.pct)}
        </Row>
      </div>
    </li>
  );
}

function ModelsSection() {
  const state = useAsync(() => api.listModels(), []);
  const [retraining, setRetraining] = useState(false);
  const [retrainError, setRetrainError] = useState<ApiError | null>(null);
  const [newVersion, setNewVersion] = useState<string | null>(null);

  const retrain = async () => {
    setRetraining(true);
    setRetrainError(null);
    setNewVersion(null);
    try {
      const model = await api.retrainModel();
      setNewVersion(model.version);
      state.reload();
    } catch (e) {
      setRetrainError(toApiError(e));
    } finally {
      setRetraining(false);
    }
  };

  return (
    <AsyncSection title={t.models} state={state}>
      {(models) => (
        <div className="space-y-3">
          {models.length === 0 ? (
            <EmptyState title={t.models} text={t.no_models} />
          ) : (
            <ul className="space-y-3">
              {models.map((model) => (
                <ModelCard key={model.version} model={model} />
              ))}
            </ul>
          )}
          <Button variant="outline" className="w-full" disabled={retraining} onClick={() => void retrain()}>
            {retraining ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            {retraining ? t.retraining : t.retrain}
          </Button>
          {newVersion && (
            <p role="status" className="rounded-2xl bg-leaf-soft p-3 text-sm font-semibold text-leaf-foreground">
              {t.retrained(newVersion)}
            </p>
          )}
          {retrainError && <ErrorState error={retrainError} />}
        </div>
      )}
    </AsyncSection>
  );
}

function LearningLoopSection({ plotId }: { plotId: string }) {
  const state = useAsync(() => api.getLearningLoop(plotId), [plotId]);
  return (
    <AsyncSection title={t.loop} state={state}>
      {(loop) => (
        <div className={CARD}>
          <p className="text-sm leading-relaxed text-muted-foreground">{t.loop_intro}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Chip tone="info">{t.loop_season(loop.evaluated_season)}</Chip>
            {loop.previous_model && loop.current_model && (
              <Chip tone="good">{t.loop_models(loop.previous_model.version, loop.current_model.version)}</Chip>
            )}
            <Chip tone={loop.data_refresh === 'live' ? 'good' : 'warn'}>{t.data_refresh[loop.data_refresh]}</Chip>
          </div>
          {!loop.evaluation || loop.evaluation.errors.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">{t.no_evaluation}</p>
          ) : (
            <div className="no-scrollbar mt-3 overflow-x-auto">
              <table className="w-full min-w-[340px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th scope="col" className="py-2 pr-3 font-semibold">{t.col_period}</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">{t.col_target}</th>
                    <th scope="col" className="py-2 pr-3 text-right font-semibold">{t.col_predicted}</th>
                    <th scope="col" className="py-2 pr-3 text-right font-semibold">{t.col_observed}</th>
                    <th scope="col" className="py-2 text-right font-semibold">{t.col_error}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loop.evaluation.errors.map((e) => (
                    <tr key={`${e.period}-${e.target}`}>
                      <td className="py-2.5 pr-3 capitalize">{formatMonth(e.period)}</td>
                      <td className="py-2.5 pr-3">{fr.targets[e.target] ?? e.target}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{formatNumber(e.predicted, 1)}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{formatNumber(e.observed, 1)}</td>
                      <td className="py-2.5 text-right font-semibold tabular-nums">
                        {formatWithUnit(e.pct_error, fr.units.pct, 1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </AsyncSection>
  );
}

const CHART_W = 300;
const CHART_H = 80;
const CHART_PAD = 6;

/** Courbe de l'humidité du sol (indice 0–1 affiché en %) ; les jours sans relevé coupent la ligne. */
function SoilLine({ series }: { series: CurrentSeasonOut['series_30d'] }) {
  const known = series.map((d) => d.sm_root).filter((v): v is number => v !== null);
  const first = series[0];
  const last = series[series.length - 1];
  if (known.length === 0 || !first || !last) {
    return <p className="text-sm text-muted-foreground">{t.soil_chart_missing}</p>;
  }

  const min = Math.min(...known);
  const max = Math.max(...known);
  const span = max - min || 1;
  const step = series.length > 1 ? CHART_W / (series.length - 1) : 0;
  const point = (value: number, i: number) =>
    `${(i * step).toFixed(1)},${(CHART_PAD + (1 - (value - min) / span) * (CHART_H - 2 * CHART_PAD)).toFixed(1)}`;

  // Segments continus : une valeur null interrompt la courbe (rien n'est interpolé).
  const segments: string[][] = [];
  let run: string[] = [];
  series.forEach((d, i) => {
    if (d.sm_root === null) {
      if (run.length > 0) segments.push(run);
      run = [];
    } else {
      run.push(point(d.sm_root, i));
    }
  });
  if (run.length > 0) segments.push(run);

  return (
    <figure>
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
        <span className="font-semibold">{t.soil_chart}</span>
        <span className="text-xs text-muted-foreground">
          {t.soil_chart_range(formatWithUnit(min * 100, fr.units.pct), formatWithUnit(max * 100, fr.units.pct))}
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="mt-2 block w-full" role="img" aria-label={t.soil_chart}>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={CHART_W} y1={CHART_H * f} y2={CHART_H * f} className="stroke-border" strokeDasharray="2 4" />
        ))}
        {segments.map((points, i) =>
          points.length === 1 ? (
            <circle
              key={i}
              cx={points[0]?.split(',')[0]}
              cy={points[0]?.split(',')[1]}
              r="2"
              className="fill-leaf"
            />
          ) : (
            <polyline
              key={i}
              points={points.join(' ')}
              fill="none"
              className="stroke-leaf"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ),
        )}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] font-semibold text-muted-foreground">
        <span>{formatShortDay(first.date)}</span>
        <span>{formatShortDay(last.date)}</span>
      </div>
    </figure>
  );
}

function CurrentSeasonSection({ plotId }: { plotId: string }) {
  const state = useAsync(() => api.getCurrentSeason(plotId), [plotId]);
  return (
    <AsyncSection title={t.current} state={state}>
      {(current) => {
        const change = current.trend.sm_root_7d_change;
        const trend =
          change === null ? fr.common.not_available : change > 0.005 ? t.trend_up : change < -0.005 ? t.trend_down : t.trend_flat;
        return (
          <div className={CARD}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-lg font-bold">{fr.common.season(current.season_label)}</p>
                <p className="text-[13px] text-muted-foreground">{t.as_of(formatDate(current.as_of))}</p>
              </div>
              <Chip tone={QUALITY_TONE[current.quality]}>{fr.quality[current.quality]}</Chip>
            </div>
            <div className="mt-3 divide-y divide-border">
              <Row label={t.rain_7d}>{formatWithUnit(current.precip_7d_mm, fr.units.mm, 1)}</Row>
              <Row label={t.rain_30d}>{formatWithUnit(current.precip_30d_mm, fr.units.mm, 1)}</Row>
              <Row label={t.soil_trend}>{trend}</Row>
            </div>
            <div className="mt-4 rounded-2xl bg-muted/50 p-3">
              <SoilLine series={current.series_30d} />
            </div>
            <h3 className="mt-4 text-sm font-bold">{t.alerts}</h3>
            {current.alerts.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">{t.no_alerts}</p>
            ) : (
              <ul className="mt-1 divide-y divide-border">
                {current.alerts.map((alert) => (
                  <li key={alert.kind} className="flex items-center justify-between gap-3 py-2.5 text-sm last:pb-0">
                    <span className="min-w-0">{alert.message_fr}</span>
                    <span className="shrink-0">
                      <Chip tone={alert.active ? 'bad' : 'good'}>{alert.active ? t.alert_on : t.alert_off}</Chip>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      }}
    </AsyncSection>
  );
}

/** Les deux sections liées à la parcelle active, avec leurs états communs (liste des parcelles). */
function PlotSections() {
  const { activePlot, plotsLoading, plotsError, reloadPlots } = usePlot();

  if (activePlot) {
    return (
      <>
        <LearningLoopSection plotId={activePlot.plot_id} />
        <CurrentSeasonSection plotId={activePlot.plot_id} />
      </>
    );
  }
  return (
    <>
      {[t.loop, t.current].map((title) => (
        <SectionShell key={title} title={title}>
          {plotsLoading ? (
            <LoadingState />
          ) : plotsError ? (
            <ErrorState error={plotsError} onRetry={reloadPlots} />
          ) : (
            <EmptyState title={fr.common.no_plot_title} text={fr.common.no_plot_text} />
          )}
        </SectionShell>
      ))}
    </>
  );
}

export function TechnicalPage() {
  const { analysis } = usePlot();
  const timings = analysis ? Object.entries(analysis.timings_ms) : [];

  return (
    <main className="flex-1 pb-6">
      <ScreenHeader eyebrow={t.subtitle} title={t.title} />

      <div className="-mt-3">
        <SystemSection />
      </div>
      <ModelsSection />
      <PlotSections />

      <SectionShell title={t.timings}>
        {timings.length === 0 ? (
          <p className={cn(CARD, 'text-sm text-muted-foreground')}>{t.no_timings}</p>
        ) : (
          <div className={cn(CARD, 'divide-y divide-border')}>
            {timings.map(([step, ms]) => (
              <Row key={step} label={t.timings_labels[step] ?? step}>
                <span className="tabular-nums">{t.ms(formatNumber(ms))}</span>
              </Row>
            ))}
          </div>
        )}
      </SectionShell>

      <SectionShell title={t.sources}>
        <div className={cn(CARD, 'flex items-start gap-3')}>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sky-soft text-sky-foreground">
            <Satellite className="size-5" />
          </span>
          <p className="text-sm leading-relaxed">{t.sources_text}</p>
        </div>
      </SectionShell>
    </main>
  );
}
