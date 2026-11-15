import {
  AlertTriangle,
  CalendarClock,
  ChevronRight,
  CloudRain,
  CloudSun,
  Droplets,
  Loader2,
  Lock,
  Map,
  MapPin,
  ScanLine,
  Sun,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { AnalysisOverlay } from '../components/AnalysisOverlay';
import { Button, ButtonLink } from '../components/Button';
import { ScoreRing } from '../components/ScoreRing';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { CropThumb, PlotThumb } from '../components/Thumbs';
import { usePlot } from '../context/PlotContext';
import { useAsync } from '../hooks/useAsync';
import { useCurrentSeason } from '../hooks/useCurrentSeason';
import {
  formatCoords,
  formatLongDay,
  formatMonthYear,
  formatNumber,
  formatShortDay,
  formatWeekday,
  formatWithUnit,
  initials,
} from '../i18n/format';
import { fr } from '../i18n/fr';
import { cn } from '../lib/cn';
import { lastCropCode, nearestCity, plotStatus, STATUS_CHIP, suitability } from '../lib/visuals';
import { api } from '../services/api';
import type { CurrentSeasonOut, PlotOut } from '../types/api';

const t = fr.home;

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** En dessous de cet écart (fraction d'humidité du sol), la tendance est dite « stable ». */
const TREND_EPSILON = 0.005;

const trendLabel = (change: number | null): string =>
  change === null
    ? fr.common.not_available
    : change > TREND_EPSILON
      ? t.trend_up
      : change < -TREND_EPSILON
        ? t.trend_down
        : t.trend_stable;

const degrees = (value: number | null | undefined): string =>
  value === null || value === undefined ? fr.common.not_available : t.degrees(formatNumber(value));

/** Carte des relevés météo de la saison en cours (pas des prévisions). */
function WeatherCard({ plot, current }: { plot: PlotOut; current: CurrentSeasonOut }) {
  const last = current.series_30d[current.series_30d.length - 1];
  const week = current.series_30d.slice(-7);
  const BigIcon = current.precip_7d_mm !== null && current.precip_7d_mm > 20 ? CloudRain : CloudSun;
  const soilPct = last?.sm_root === null || last?.sm_root === undefined ? null : last.sm_root * 100;
  const tiles = [
    { icon: CloudRain, value: formatWithUnit(current.precip_7d_mm, fr.units.mm), label: t.rain_7d },
    { icon: Droplets, value: formatWithUnit(soilPct, fr.units.pct), label: t.soil_moisture },
    { icon: TrendingUp, value: trendLabel(current.trend.sm_root_7d_change), label: t.soil_trend },
  ];

  return (
    <section
      aria-label={t.weather_title}
      className="mx-5 mt-5 animate-fade-up overflow-hidden rounded-3xl bg-gradient-sky p-5 text-primary-foreground shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold opacity-90">
            <MapPin className="size-4 shrink-0" />
            <span className="truncate">
              {nearestCity(plot.latitude, plot.longitude) ?? formatCoords(plot.latitude, plot.longitude)}
            </span>
          </p>
          <p
            className={cn(
              'mt-1 font-display leading-none font-bold',
              last?.t2m_max_c === null || last?.t2m_max_c === undefined ? 'text-3xl' : 'text-6xl',
            )}
          >
            {degrees(last?.t2m_max_c)}
          </p>
          <p className="mt-1 text-[15px] font-medium">{t.temp_caption(formatShortDay(current.as_of))}</p>
        </div>
        <BigIcon
          className="size-20 shrink-0 animate-float-soft text-sun drop-shadow-lg"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {tiles.map(({ icon: Icon, value, label }) => (
          <div key={label} className="rounded-2xl bg-primary-foreground/15 px-2 py-2.5 backdrop-blur">
            <Icon className="mx-auto size-5" aria-hidden="true" />
            <p className="mt-1 text-sm leading-tight font-bold">{value}</p>
            <p className="text-[11px] opacity-85">{label}</p>
          </div>
        ))}
      </div>

      {week.length > 0 && (
        <ul aria-label={t.last_days} className="no-scrollbar -mx-1 mt-4 flex gap-1 overflow-x-auto">
          {week.map((day) => {
            const rain = day.precip_mm !== null && day.precip_mm >= 1;
            const DayIcon = rain ? CloudRain : Sun;
            const noTemp = day.t2m_max_c === null;
            return (
              <li
                key={day.date}
                aria-label={t.day_label(
                  formatWeekday(day.date),
                  day.precip_mm === null ? fr.common.not_available : rain ? t.day_rain : t.day_dry,
                  degrees(day.t2m_max_c),
                )}
                className={cn(
                  'flex min-w-[42px] flex-1 flex-col items-center gap-1 rounded-2xl py-2',
                  rain && 'bg-primary-foreground/20',
                )}
              >
                <span className="text-[11px] font-semibold opacity-90">{formatWeekday(day.date)}</span>
                {day.precip_mm === null ? (
                  <span className="size-5" />
                ) : (
                  <DayIcon className={cn('size-5', rain ? 'text-primary-foreground' : 'text-sun')} aria-hidden="true" />
                )}
                <span className={cn('text-center font-bold', noTemp ? 'text-[9px] leading-tight' : 'text-xs')}>
                  {degrees(day.t2m_max_c)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const { activePlot, plotsLoading, plotsError, reloadPlots, analysis, analysisRunning, analysisError, runAnalysis } =
    usePlot();
  const season = useCurrentSeason();
  const clock = useAsync(() => api.getClock(), []);
  const cropSheets = useAsync(() => api.getCrops(), []);
  const [overlayHidden, setOverlayHidden] = useState(false);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const current = activePlot && season.data?.plot_id === activePlot.plot_id ? season.data : null;
  const firstName = activePlot?.owner_name.trim().split(/\s+/)[0] ?? '';
  const criticalPeriods = analysis?.prediction.critical_periods ?? [];
  const firstCritical = criticalPeriods[0];
  const locked = analysis !== null && analysis.season.status !== 'draft';

  const handleAnalyze = async () => {
    if (!activePlot) return;
    const plotName = activePlot.name;
    setOverlayHidden(false);
    const result = await runAnalysis();
    if (!result) return;
    toast.success(fr.analyze.done, {
      description: fr.analyze.done_text(
        plotName,
        result.prediction.critical_periods.length,
        result.recommendation.top_3.length,
      ),
    });
    if (mounted.current) navigate('/prediction');
  };

  // Encart « À faire » : alerte active de la saison en cours, sinon première période critique, sinon invitation.
  const activeAlert = current?.alerts.find((a) => a.active);
  const todo = activeAlert?.message_fr ?? firstCritical?.message_fr ?? (analysis ? t.todo_nothing : t.todo_analyze);

  // Ligne « culture · surface »
  const cropCode = activePlot ? lastCropCode(activePlot) : null;
  const cropName = cropCode ? cropSheets.data?.find((c) => c.code === cropCode)?.name_fr : t.no_crop;
  const area =
    activePlot && activePlot.area_ha !== null
      ? formatWithUnit(activePlot.area_ha, fr.units.ha, Number.isInteger(activePlot.area_ha) ? 0 : 1)
      : null;
  const cropLine = cropName && area ? t.crop_area(cropName, area) : (cropName ?? area);

  const status = plotStatus(current);

  return (
    <main className="flex-1 pb-6">
      {/* En-tête */}
      <header className="flex items-center justify-between gap-3 px-5 pt-6">
        <div className="flex min-w-0 items-center gap-3">
          {activePlot && (
            <span
              aria-hidden="true"
              className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-forest font-display font-bold text-primary-foreground"
            >
              {initials(activePlot.owner_name)}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-muted-foreground">
              {clock.data
                ? capitalize(formatLongDay(clock.data.today))
                : clock.loading
                  ? fr.common.loading
                  : fr.common.not_available}
            </p>
            <h1 className="truncate font-display text-2xl leading-tight font-bold">
              {firstName ? t.greeting_name(firstName) : t.greeting}
            </h1>
          </div>
        </div>
      </header>

      {plotsLoading ? (
        <LoadingState lines={5} className="mx-5 mt-5" />
      ) : plotsError ? (
        <ErrorState error={plotsError} onRetry={reloadPlots} className="mx-5 mt-5" />
      ) : !activePlot ? (
        <section className="mx-5 mt-5 animate-fade-up">
          <h2 className="mb-3 text-lg font-bold">{t.active_plot}</h2>
          <EmptyState title={fr.common.no_plot_title} text={fr.common.no_plot_text}>
            <ButtonLink to="/parcelle" variant="hero" size="lg">
              <Map /> {fr.farm.add_plot}
            </ButtonLink>
          </EmptyState>
        </section>
      ) : (
        <>
          {/* Relevés météo */}
          {season.error ? (
            <ErrorState error={season.error} onRetry={season.reload} className="mx-5 mt-5" />
          ) : current ? (
            <WeatherCard plot={activePlot} current={current} />
          ) : (
            <LoadingState lines={5} className="mx-5 mt-5" />
          )}

          {/* Parcelle active */}
          <section className="mx-5 mt-5 animate-fade-up [animation-delay:80ms]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">{t.active_plot}</h2>
              <Link to="/parcelle" className="flex min-h-12 items-center text-sm font-semibold text-primary">
                {t.change_plot} <ChevronRight className="size-4" />
              </Link>
            </div>
            <article className="overflow-hidden rounded-3xl bg-card shadow-card">
              <div className="relative h-36">
                <PlotThumb plot={activePlot} alt={t.plot_photo(activePlot.name)} className="absolute inset-0 size-full" />
                <div className="absolute inset-0 bg-gradient-fade" />
                {!season.loading && !season.error && (
                  <span
                    className={cn(
                      'absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold',
                      STATUS_CHIP[status].chip,
                    )}
                  >
                    <span className={cn('size-2 rounded-full', STATUS_CHIP[status].dot)} />
                    {fr.plot_status[status]}
                  </span>
                )}
                <div className="absolute right-4 bottom-3 left-4 text-primary-foreground">
                  <h3 className="truncate font-display text-2xl font-bold">{activePlot.name}</h3>
                  {cropLine && <p className="truncate text-sm font-medium opacity-90">{cropLine}</p>}
                </div>
              </div>
              <div className="space-y-3 p-4">
                <p className="flex items-start gap-1.5 text-sm font-medium text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>
                    {t.soil_line(
                      fr.soil[activePlot.soil_texture],
                      formatCoords(activePlot.latitude, activePlot.longitude),
                    )}
                  </span>
                </p>
                <div className="flex items-center gap-3 rounded-2xl bg-sun-soft p-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sun text-sun-foreground">
                    <CalendarClock className="size-5" />
                  </span>
                  <p className="text-sm leading-snug font-medium text-foreground">
                    <span className="font-bold">{t.todo}</span> {todo}
                  </p>
                </div>
              </div>
            </article>
          </section>

          {/* Action principale */}
          <section className="mx-5 mt-5 space-y-3">
            {locked && analysis ? (
              <div className="rounded-3xl bg-card p-4 shadow-card">
                <div className="flex items-start gap-3">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-leaf-soft text-leaf-foreground">
                    <Lock className="size-6" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-bold">{t.locked_title}</h2>
                    <p className="text-sm text-muted-foreground">{t.locked_text(analysis.season.season_label)}</p>
                  </div>
                </div>
                <ButtonLink to="/recommandation" variant="hero" size="lg" className="mt-3 w-full">
                  {t.locked_link} <ChevronRight />
                </ButtonLink>
              </div>
            ) : (
              <>
                <Button
                  variant="hero"
                  size="xl"
                  className="relative h-20 w-full justify-between overflow-hidden pr-3 pl-5 texture-veins"
                  disabled={analysisRunning}
                  aria-busy={analysisRunning}
                  onClick={() => void handleAnalyze()}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground/15">
                      {analysisRunning ? <Loader2 className="!size-7 animate-spin" /> : <ScanLine className="!size-7" />}
                    </span>
                    <span className="min-w-0 text-left whitespace-normal">
                      <span className="block text-lg leading-tight font-bold">
                        {analysisRunning ? fr.analyze.running : analysis ? fr.analyze.again : fr.analyze.button}
                      </span>
                      <span className="block text-[13px] font-medium opacity-80">
                        {analysisRunning ? fr.analyze.running_hint : fr.analyze.subtitle}
                      </span>
                    </span>
                  </span>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-leaf text-leaf-foreground">
                    <ChevronRight className="!size-6" />
                  </span>
                </Button>
                {analysisError && !analysisRunning && <ErrorState error={analysisError} />}
              </>
            )}
          </section>

          {/* Alerte : première période critique de l'analyse */}
          {firstCritical && (
            <Link
              to="/prediction"
              className="mx-5 mt-4 flex items-center gap-3 rounded-3xl border border-warning/30 bg-warning-soft p-4 transition active:scale-[0.98]"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-warning text-primary-foreground">
                <AlertTriangle className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold text-foreground">{fr.critical.kind[firstCritical.kind]}</span>
                <span className="block text-sm text-muted-foreground">
                  {t.alert_sub(formatMonthYear(firstCritical.period))}
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
            </Link>
          )}

          {/* Cultures conseillées */}
          <section className="mt-6">
            <div className="mb-3 flex items-center justify-between px-5">
              <h2 className="text-lg font-bold">{t.crops_title}</h2>
              {analysis && (
                <Link to="/recommandation" className="flex min-h-12 items-center text-sm font-semibold text-primary">
                  {fr.common.see_all} <ChevronRight className="size-4" />
                </Link>
              )}
            </div>
            {!analysis ? (
              <p className="mx-5 rounded-3xl bg-card p-4 text-sm font-medium text-muted-foreground shadow-soft">
                {t.crops_empty}
              </p>
            ) : analysis.recommendation.top_3.length === 0 ? (
              <p className="mx-5 rounded-3xl bg-card p-4 text-sm font-medium text-muted-foreground shadow-soft">
                {t.crops_none}
              </p>
            ) : (
              <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto px-5 pb-2">
                {analysis.recommendation.top_3.map((crop) => {
                  const level = suitability(crop.score);
                  return (
                    <Link
                      key={crop.crop_code}
                      to="/recommandation"
                      className="w-40 shrink-0 snap-start overflow-hidden rounded-3xl bg-card shadow-soft transition active:scale-[0.97]"
                    >
                      <div className="relative h-24">
                        <CropThumb cropCode={crop.crop_code} alt="" className="size-full" />
                        <div className="absolute top-2 right-2 flex rounded-full bg-card p-0.5 shadow-soft">
                          <ScoreRing value={crop.score} tone={level.tone} size={40} />
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="truncate font-display text-base font-bold">{crop.name_fr}</p>
                        <p className="text-xs font-semibold text-muted-foreground">{level.label}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {analysisRunning && !overlayHidden && (
            <AnalysisOverlay plot={activePlot} onHide={() => setOverlayHidden(true)} />
          )}
        </>
      )}
    </main>
  );
}
