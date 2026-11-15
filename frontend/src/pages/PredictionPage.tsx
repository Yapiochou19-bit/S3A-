import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CloudRain,
  Droplets,
  Flame,
  Info,
  Lightbulb,
  Loader2,
  Mountain,
  RefreshCw,
  Satellite,
  ShieldCheck,
  Square,
  Thermometer,
  Volume2,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AnalysisGate } from '../components/AnalysisGate';
import { BarChart, type BarPoint } from '../components/BarChart';
import { Button, ButtonLink } from '../components/Button';
import { ScreenHeader } from '../components/ScreenHeader';
import { ErrorState } from '../components/StateViews';
import { usePlot } from '../context/PlotContext';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { formatCoords, formatDate, formatMonth, formatMonthYear, formatNumber, formatWithUnit } from '../i18n/format';
import { fr } from '../i18n/fr';
import { cn } from '../lib/cn';
import { nearestCity } from '../lib/visuals';
import type { AnalysisOut, BaselineComparison, CriticalPeriod, PredictedValue, PredictionOutput } from '../types/api';

const t = fr.climate;

type MetricKey = 'rain' | 'heat' | 'soil';
type CriticalKind = CriticalPeriod['kind'];

const METRIC_KEYS: MetricKey[] = ['rain', 'heat', 'soil'];

interface MetricStyle {
  icon: LucideIcon;
  tone: 'sky' | 'sun' | 'leaf';
  chip: string;
  activeChip: string;
  /** Périodes critiques qui concernent cette mesure. */
  kinds: CriticalKind[];
  digits: number;
  baseline: number;
  /** Facteur d'affichage (l'humidité du sol est une fraction 0–1 dans l'API). */
  scale: number;
  pick: (period: PredictionOutput['periods'][number]) => PredictedValue;
}

const METRICS: Record<MetricKey, MetricStyle> = {
  rain: {
    icon: CloudRain,
    tone: 'sky',
    chip: 'bg-sky-soft text-sky-foreground',
    activeChip: 'bg-sky text-primary-foreground',
    kinds: ['heavy_rain', 'water_stress'],
    digits: 0,
    baseline: 0,
    scale: 1,
    pick: (p) => p.features.precip_mm,
  },
  heat: {
    icon: Thermometer,
    tone: 'sun',
    chip: 'bg-warning-soft text-sun-foreground',
    activeChip: 'bg-warning text-primary-foreground',
    kinds: ['heat_stress'],
    digits: 1,
    baseline: 20,
    scale: 1,
    pick: (p) => p.features.t2m_max_c,
  },
  soil: {
    icon: Droplets,
    tone: 'leaf',
    chip: 'bg-leaf-soft text-leaf-foreground',
    activeChip: 'bg-leaf text-leaf-foreground',
    kinds: ['water_stress', 'erosion'],
    digits: 0,
    baseline: 0,
    scale: 100,
    pick: (p) => p.features.sm_root,
  },
};

const KIND_STYLE: Record<CriticalKind, { icon: LucideIcon; bar: string }> = {
  heat_stress: { icon: Flame, bar: 'bg-earth text-primary-foreground' },
  heavy_rain: { icon: CloudRain, bar: 'bg-sky text-primary-foreground' },
  water_stress: { icon: AlertTriangle, bar: 'bg-warning text-primary-foreground' },
  erosion: { icon: Mountain, bar: 'bg-sun text-sun-foreground' },
};

const scaled = (value: number | null, scale: number): number | null => (value === null ? null : value * scale);

const mean = (values: Array<number | null>): number | null => {
  const known = values.filter((v): v is number => v !== null);
  return known.length === 0 ? null : known.reduce((sum, v) => sum + v, 0) / known.length;
};

interface MonthValue {
  period: string;
  value: number;
}

/** Mois où la valeur est la plus haute et la plus basse (mois sans donnée ignorés). */
const extremes = (points: MonthValue[]): { max: MonthValue; min: MonthValue } | null => {
  const first = points[0];
  if (!first) return null;
  let max = first;
  let min = first;
  for (const p of points) {
    if (p.value > max.value) max = p;
    if (p.value < min.value) min = p;
  }
  return { max, min };
};

const isReliable = (b: BaselineComparison): boolean => b.method === 'model' && b.skill_pct !== null && b.skill_pct >= 3;

function ReliabilityCard({ prediction }: { prediction: PredictionOutput }) {
  const [open, setOpen] = useState(false);
  const measures = prediction.baseline_comparison;
  const total = measures.length;
  const reliable = measures.filter(isReliable).length;
  const level =
    reliable === total
      ? t.reliability_levels.high
      : reliable >= total / 2
        ? t.reliability_levels.medium
        : t.reliability_levels.limited;

  return (
    <section className="texture-veins mx-5 animate-fade-up rounded-3xl bg-gradient-forest p-4 text-primary-foreground shadow-card">
      <div className="flex items-center gap-3">
        <div className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground/15">
          <ShieldCheck className="size-7 text-leaf" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-medium opacity-80">{t.reliability}</h2>
          <p className="font-display text-2xl leading-tight font-bold">
            {total === 0 ? fr.common.not_available : t.reliability_value(level, reliable, total)}
          </p>
        </div>
      </div>
      {total > 0 && (
        <div className="mt-3 flex gap-1" aria-hidden>
          {measures.map((b) => (
            <span
              key={b.target}
              className={cn('h-2 flex-1 rounded-full', isReliable(b) ? 'bg-leaf' : 'bg-primary-foreground/20')}
            />
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-2 flex min-h-12 w-full items-center justify-between gap-2 text-left text-sm font-semibold"
        aria-expanded={open}
        aria-controls="climate-sources"
      >
        <span className="flex items-center gap-1.5">
          <Satellite className="size-4 shrink-0" /> {t.sources_toggle}
        </span>
        <ChevronDown className={cn('size-4 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div id="climate-sources" className="animate-fade-up">
          <p className="text-sm leading-relaxed opacity-90">
            {t.sources_text(prediction.model_version, formatDate(prediction.forecast_origin))}
          </p>
          {total > 0 && (
            <>
              <p className="mt-3 text-xs font-bold tracking-wide uppercase opacity-70">{t.sources_list}</p>
              <ul className="mt-1.5 space-y-1.5">
                {measures.map((b) => (
                  <li key={b.target} className="flex items-start gap-2 text-sm leading-snug">
                    <span
                      className={cn(
                        'mt-1.5 size-2 shrink-0 rounded-full',
                        isReliable(b) ? 'bg-leaf' : 'bg-primary-foreground/40',
                      )}
                      aria-hidden
                    />
                    <span>
                      <span className="font-bold">{fr.targets[b.target] ?? b.target}</span>
                      <span className="opacity-90">
                        {' · '}
                        {b.method === 'model' && b.skill_pct !== null
                          ? t.source_gain(formatNumber(b.skill_pct, 1), b.skill_pct > 0)
                          : t.source_climatology}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function MetricsSection({ prediction }: { prediction: PredictionOutput }) {
  const [metric, setMetric] = useState<MetricKey>('rain');
  const { supported, speaking, speak, cancel } = useSpeechSynthesis();
  const { periods, season_summary: summary, critical_periods: critical } = prediction;

  const headline: Record<MetricKey, string> = {
    rain: formatNumber(summary.precip_total_mm.value),
    heat: formatNumber(mean(periods.map((p) => p.features.t2m_max_c.value)), 1),
    soil: formatNumber(scaled(mean(periods.map((p) => p.features.sm_root.value)), 100)),
  };

  const style = METRICS[metric];
  const text = t.metrics[metric];
  const unit = text.unit;

  const data: BarPoint[] = periods.map((p) => {
    const v = style.pick(p);
    return {
      label: formatMonth(p.period),
      value: scaled(v.value, style.scale),
      low: scaled(v.q10, style.scale),
      high: scaled(v.q90, style.scale),
      highlight: critical.some((c) => c.period === p.period && style.kinds.includes(c.kind)),
    };
  });

  const known: MonthValue[] = periods.flatMap((p) => {
    const value = scaled(style.pick(p).value, style.scale);
    return value === null ? [] : [{ period: p.period, value }];
  });
  const ext = extremes(known);
  const show = (m: MonthValue) => formatWithUnit(m.value, unit, style.digits);

  let insight: string = t.no_data;
  if (ext) {
    const single = ext.max.period === ext.min.period;
    const maxMonth = formatMonthYear(ext.max.period);
    const minMonth = formatMonthYear(ext.min.period);
    if (metric === 'rain') {
      insight = single
        ? t.rain_single(maxMonth, show(ext.max))
        : t.rain_both(maxMonth, show(ext.max), minMonth, show(ext.min));
    } else if (metric === 'heat') {
      const days = summary.heat_stress_days_total.value;
      const rounded = days === null ? null : Math.round(days);
      insight = `${t.heat_hottest(maxMonth, show(ext.max))} ${
        rounded === null ? t.heat_days_missing : t.heat_days(rounded, formatNumber(rounded))
      }`;
    } else {
      insight = single
        ? t.soil_single(maxMonth, show(ext.max))
        : t.soil_both(minMonth, show(ext.min), maxMonth, show(ext.max));
    }
  }

  const firstPeriod = periods[0];

  const select = (key: MetricKey) => {
    cancel();
    setMetric(key);
  };

  const listen = () => {
    if (!supported) {
      toast(fr.common.speech_unavailable);
      return;
    }
    if (speaking) cancel();
    else speak(`${text.label}. ${insight}`);
  };

  return (
    <section className="mx-5 mt-5">
      <div className="grid grid-cols-3 gap-2" role="tablist" aria-label={t.metrics_label}>
        {METRIC_KEYS.map((key) => {
          const it = METRICS[key];
          const active = key === metric;
          const Icon = it.icon;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              id={`climate-tab-${key}`}
              aria-selected={active}
              aria-controls="climate-panel"
              onClick={() => select(key)}
              className={cn(
                'flex min-h-12 min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-3 transition active:scale-95',
                active ? cn(it.activeChip, 'shadow-soft') : 'bg-card text-foreground shadow-soft',
              )}
            >
              <Icon className="size-6" />
              <span className="font-display text-lg leading-none font-bold">
                {headline[key]}
                {headline[key] !== fr.common.not_available && (
                  <span className="text-xs font-semibold"> {t.metrics[key].unit}</span>
                )}
              </span>
              <span className="text-[11px] font-semibold opacity-80">{t.metrics[key].tab}</span>
            </button>
          );
        })}
      </div>

      <article
        key={metric}
        id="climate-panel"
        role="tabpanel"
        aria-labelledby={`climate-tab-${metric}`}
        className="mt-3 animate-fade-up rounded-3xl bg-card p-4 shadow-card"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-muted-foreground">{t.chart_title(text.label, periods.length)}</h2>
            {firstPeriod && (
              <span className={cn('mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-bold', style.chip)}>
                {fr.quality[style.pick(firstPeriod).quality]}
              </span>
            )}
          </div>
          <Button
            size="icon"
            variant="soft"
            className="shrink-0"
            onClick={listen}
            aria-label={speaking ? t.stop : t.listen}
          >
            {speaking ? <Square /> : <Volume2 />}
          </Button>
        </div>
        <div className="mt-3">
          <BarChart
            data={data}
            tone={style.tone}
            label={t.chart_alt(text.label)}
            caption={t.chart_caption(unit)}
            digits={style.digits}
            baseline={style.baseline}
          />
        </div>
        <div className="mt-2 flex gap-3 rounded-2xl bg-sun-soft p-3">
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-sun-foreground" />
          <p className="text-[15px] leading-snug">
            <span className="font-bold">{t.in_short}</span>
            {insight}
          </p>
        </div>
      </article>
    </section>
  );
}

function PeriodsSection({ prediction }: { prediction: PredictionOutput }) {
  return (
    <section className="mx-5 mt-6">
      <h2 className="mb-3 text-lg font-bold">{t.periods}</h2>
      <div className="rounded-3xl bg-card p-4 shadow-soft">
        {prediction.periods.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.no_periods}</p>
        ) : (
          <ul className="space-y-2.5">
            {prediction.periods.map((p) => {
              const alerts = prediction.critical_periods.filter((c) => c.period === p.period);
              return (
                <li key={p.period} className="flex items-center gap-3">
                  <span className="w-10 shrink-0 text-sm font-bold text-muted-foreground capitalize">
                    {formatMonth(p.period)}
                  </span>
                  <div className="flex h-7 min-w-0 flex-1 gap-1 overflow-hidden rounded-full bg-muted">
                    {alerts.length === 0 ? (
                      <span className="sr-only">{t.calm_month}</span>
                    ) : (
                      alerts.map((c) => (
                        <span
                          key={c.kind}
                          className={cn(
                            'flex min-w-0 flex-1 items-center justify-center rounded-full px-2 text-[10px] font-bold',
                            KIND_STYLE[c.kind].bar,
                          )}
                        >
                          <span className="truncate">{fr.critical.kind[c.kind]}</span>
                        </span>
                      ))
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-leaf-soft p-3">
          <CalendarDays className="size-5 shrink-0 text-primary" />
          <p className="text-sm font-semibold">
            <span className="font-bold">{fr.common.season(prediction.season_label)}</span>
            {' · '}
            {fr.common.from_to(formatDate(prediction.season_start), formatDate(prediction.season_end))}
          </p>
        </div>
      </div>
    </section>
  );
}

function AlertsSection({ alerts }: { alerts: CriticalPeriod[] }) {
  const [openAlert, setOpenAlert] = useState<number | null>(0);

  return (
    <section className="mx-5 mt-6">
      <h2 className="mb-3 text-lg font-bold">{t.alerts}</h2>
      {alerts.length === 0 ? (
        <div className="flex items-center gap-3 rounded-3xl border border-leaf/30 bg-leaf-soft p-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-leaf text-leaf-foreground">
            <CheckCircle2 className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="font-bold">{t.no_alerts_title}</p>
            <p className="text-sm text-muted-foreground">{t.no_alerts_text}</p>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {alerts.map((a, i) => {
            const open = openAlert === i;
            const high = a.severity === 'high';
            const Icon = KIND_STYLE[a.kind].icon;
            return (
              <li key={`${a.period}-${a.kind}`}>
                <button
                  type="button"
                  onClick={() => setOpenAlert(open ? null : i)}
                  aria-expanded={open}
                  className={cn(
                    'min-h-12 w-full rounded-3xl border p-4 text-left transition',
                    high ? 'border-warning/30 bg-warning-soft' : 'border-earth/20 bg-earth-soft',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'flex size-11 shrink-0 items-center justify-center rounded-2xl text-primary-foreground',
                        high ? 'bg-warning' : 'bg-earth',
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{fr.critical.kind[a.kind]}</span>
                      <span className="block text-sm text-muted-foreground">
                        <span className="capitalize">{formatMonthYear(a.period)}</span> · {fr.critical.severity[a.severity]}
                      </span>
                    </span>
                    <ChevronDown
                      className={cn('size-5 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
                    />
                  </div>
                  {open && (
                    <p className="mt-3 animate-fade-up rounded-2xl bg-card/80 p-3 text-[15px] leading-snug">{a.message_fr}</p>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ClimateContent({ analysis }: { analysis: AnalysisOut }) {
  const { analysisRunning, analysisError, runAnalysis } = usePlot();
  const { prediction, season } = analysis;

  return (
    <>
      <ReliabilityCard prediction={prediction} />
      <MetricsSection prediction={prediction} />
      <PeriodsSection prediction={prediction} />
      <AlertsSection alerts={prediction.critical_periods} />

      {prediction.warnings.length > 0 && (
        <section className="mx-5 mt-6">
          <h2 className="mb-3 text-lg font-bold">{t.notes}</h2>
          <ul className="space-y-2.5 rounded-3xl bg-card p-4 shadow-soft">
            {prediction.warnings.map((w) => (
              <li key={w} className="flex items-start gap-2.5 text-[15px] leading-snug">
                <Info className="mt-0.5 size-5 shrink-0 text-sky" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mx-5 mt-6 space-y-3">
        <ButtonLink to="/recommandation" variant="hero" size="xl" className="w-full">
          {t.next} <ArrowRight />
        </ButtonLink>
        {season.status === 'draft' && (
          <>
            <Button variant="outline" className="w-full" disabled={analysisRunning} onClick={() => void runAnalysis()}>
              {analysisRunning ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              {analysisRunning ? fr.analyze.running : fr.analyze.again}
            </Button>
            {analysisError && !analysisRunning && <ErrorState error={analysisError} onRetry={() => void runAnalysis()} />}
          </>
        )}
      </div>
    </>
  );
}

export function PredictionPage() {
  const { activePlot } = usePlot();
  const eyebrow = activePlot
    ? `${activePlot.name} · ${
        nearestCity(activePlot.latitude, activePlot.longitude) ?? formatCoords(activePlot.latitude, activePlot.longitude)
      }`
    : undefined;

  return (
    <main className="flex-1 pb-6">
      <ScreenHeader eyebrow={eyebrow} title={fr.nav.climate} />
      <AnalysisGate>{(analysis) => <ClimateContent analysis={analysis} />}</AnalysisGate>
    </main>
  );
}
