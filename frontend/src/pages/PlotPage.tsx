import { Layers, MapPin, Plus, Ruler, Sprout, Star, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AddPlotSheet } from '../components/AddPlotSheet';
import { Button, ButtonLink } from '../components/Button';
import { FarmMap } from '../components/FarmMap';
import { ScreenHeader } from '../components/ScreenHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { PlotThumb } from '../components/Thumbs';
import { usePlot } from '../context/PlotContext';
import { useAsync } from '../hooks/useAsync';
import { formatCoords, formatNumber } from '../i18n/format';
import { fr } from '../i18n/fr';
import { cn } from '../lib/cn';
import { lastCropCode, nearestCity, SOIL_SWATCH } from '../lib/visuals';
import { api } from '../services/api';
import type { PlotOut } from '../types/api';

const t = fr.farm;

const fmtArea = (ha: number) => formatNumber(ha, Number.isInteger(ha) ? 0 : 1);

export function PlotPage() {
  const { plots, plotsLoading, plotsError, reloadPlots, activePlot, selectPlot } = usePlot();
  const crops = useAsync(() => api.getCrops(), []);
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const activeId = activePlot?.plot_id ?? null;
  const sel: PlotOut | null = plots.find((p) => p.plot_id === selected) ?? activePlot ?? plots[0] ?? null;

  const areas = plots.flatMap((p) => (p.area_ha === null ? [] : [p.area_ha]));
  const total = areas.length > 0 ? formatNumber(areas.reduce((a, b) => a + b, 0), 1) : null;

  /** Nom de la dernière culture ; null = aucune culture connue. */
  const cropName = (plot: PlotOut): string | null => {
    const code = lastCropCode(plot);
    if (!code) return null;
    if (crops.loading) return fr.common.loading;
    return crops.data?.find((c) => c.code === code)?.name_fr ?? fr.common.not_available;
  };

  const openSheet = () => setAdding(true);

  return (
    <main className="flex-1 pb-6">
      <ScreenHeader
        eyebrow={plotsLoading || plotsError ? undefined : t.eyebrow(plots.length, total)}
        title={fr.nav.farm}
        action={
          <Button size="icon" variant="leaf" className="shrink-0" onClick={openSheet} aria-label={t.add_plot}>
            <Plus />
          </Button>
        }
      />

      {plotsLoading ? (
        <div className="mx-5 space-y-3">
          <LoadingState lines={5} />
          <LoadingState />
        </div>
      ) : plotsError ? (
        <ErrorState error={plotsError} onRetry={reloadPlots} className="mx-5" />
      ) : !sel ? (
        <EmptyState title={t.empty_title} text={t.empty_text} className="mx-5">
          <Button variant="hero" size="xl" onClick={openSheet}>
            <Plus /> {t.add_plot}
          </Button>
        </EmptyState>
      ) : (
        <>
          {/* Aperçu de la parcelle sélectionnée */}
          <section className="mx-5 animate-fade-up overflow-hidden rounded-3xl bg-card shadow-card">
            <div className="relative">
              <FarmMap plots={plots} activeId={sel.plot_id} onSelect={setSelected} label={t.map_label} />
              <span className="absolute top-3 left-3 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-1.5 rounded-full bg-card/90 px-3 py-1.5 text-xs font-bold shadow-soft backdrop-blur">
                <MapPin className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                <span className="truncate">
                  {nearestCity(sel.latitude, sel.longitude) ?? formatCoords(sel.latitude, sel.longitude)}
                </span>
              </span>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-bold break-words">{sel.name}</h2>
                  <p className="text-sm text-muted-foreground">{cropName(sel) ?? t.no_crop}</p>
                </div>
                {sel.plot_id === activeId ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-leaf-soft px-3 py-1.5 text-xs font-bold text-leaf-foreground">
                    <Star className="size-3.5 fill-current" aria-hidden="true" /> {t.active}
                  </span>
                ) : (
                  <Button
                    variant="soft"
                    className="shrink-0 px-4"
                    onClick={() => {
                      selectPlot(sel.plot_id);
                      toast.success(t.now_active(sel.name), { description: t.now_active_text });
                    }}
                  >
                    {t.make_active}
                  </Button>
                )}
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2">
                <Info
                  icon={Ruler}
                  label={t.info_area}
                  value={sel.area_ha === null ? fr.common.not_available : t.area(fmtArea(sel.area_ha))}
                />
                <Info
                  icon={Layers}
                  label={t.info_soil}
                  value={fr.soil[sel.soil_texture]}
                  swatch={SOIL_SWATCH[sel.soil_texture]}
                />
                <Info icon={MapPin} label={t.info_position} value={formatCoords(sel.latitude, sel.longitude)} />
              </dl>
            </div>
          </section>

          {/* Liste des parcelles */}
          <section className="mx-5 mt-6">
            <h2 className="mb-3 text-lg font-bold">{t.list_title}</h2>
            <ul className="space-y-3">
              {plots.map((p, i) => (
                <li key={p.plot_id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <button
                    type="button"
                    aria-pressed={p.plot_id === sel.plot_id}
                    onClick={() => setSelected(p.plot_id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-3xl border-2 bg-card p-2.5 pr-4 text-left shadow-soft transition active:scale-[0.98]',
                      p.plot_id === sel.plot_id ? 'border-leaf' : 'border-transparent',
                    )}
                  >
                    <PlotThumb plot={p} alt="" className="size-20 shrink-0 rounded-2xl" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-lg font-bold">{p.name}</span>
                      <span className="block truncate text-sm text-muted-foreground">
                        {cropName(p) ?? t.no_crop_short} ·{' '}
                        {p.area_ha === null ? t.area_unknown : t.area(fmtArea(p.area_ha))}
                      </span>
                      <span className="mt-1 block truncate text-xs font-semibold text-muted-foreground">
                        {t.owner(p.owner_name)}
                      </span>
                    </span>
                    {p.plot_id === activeId && (
                      <>
                        <Star className="size-5 shrink-0 fill-sun text-sun" aria-hidden="true" />
                        <span className="sr-only">{t.active_plot}</span>
                      </>
                    )}
                  </button>
                </li>
              ))}
            </ul>

            <Button variant="hero" size="xl" className="mt-5 w-full" onClick={openSheet}>
              <Plus /> {t.add_plot}
            </Button>

            {activePlot && (
              <ButtonLink to="/" variant="leaf" size="lg" className="mt-3 w-full">
                <Sprout /> {fr.analyze.button}
              </ButtonLink>
            )}
          </section>
        </>
      )}

      <AddPlotSheet open={adding} onClose={() => setAdding(false)} onCreated={(plot) => setSelected(plot.plot_id)} />
    </main>
  );
}

function Info({ icon: Icon, label, value, swatch }: { icon: LucideIcon; label: string; value: string; swatch?: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-muted p-3">
      <dt className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
        <Icon className="size-3.5 shrink-0" aria-hidden="true" /> {label}
      </dt>
      <dd className="mt-1 flex items-start gap-1.5 text-sm leading-snug font-bold">
        {swatch && <span className={cn('mt-1 size-3 shrink-0 rounded-full', swatch)} aria-hidden="true" />}
        <span className="min-w-0 break-words">{value}</span>
      </dd>
    </div>
  );
}
