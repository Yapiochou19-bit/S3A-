import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  Loader2,
  LocateFixed,
  Minus,
  Pencil,
  Plus,
  UserRound,
} from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { toast } from 'sonner';
import { usePlot } from '../context/PlotContext';
import { formatCoords, formatNumber } from '../i18n/format';
import { fr } from '../i18n/fr';
import { cn } from '../lib/cn';
import { CITIES, nearestCity, SOIL_ORDER, SOIL_SWATCH } from '../lib/visuals';
import { api } from '../services/api';
import { toApiError, type ApiError } from '../services/errors';
import type { PlotOut, SoilTexture } from '../types/api';
import { Button } from './Button';
import { FarmMap } from './FarmMap';
import { PhoneSheet } from './PhoneSheet';
import { ErrorState } from './StateViews';

interface AddPlotSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated: (plot: PlotOut) => void;
}

const t = fr.farm.add;

const AREA_MIN = 0.5;
const AREA_MAX = 50;
const AREA_STEP = 0.5;
const AREA_SHORTCUTS = [0.5, 1, 2, 5];
const LAST_STEP = t.steps.length - 1;
const GEO_TIMEOUT_MS = 10_000;
const PREVIEW_ID = 'new';

const fmtArea = (ha: number) => formatNumber(ha, Number.isInteger(ha) ? 0 : 1);

/** Nombre → texte de champ, avec la virgule française. */
const toText = (n: number) => String(n).replace('.', ',');

/** Texte de champ → nombre dans [min, max] ; null si vide ou invalide (virgule acceptée). */
const parseCoord = (text: string, min: number, max: number): number | null => {
  const s = text.trim().replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return n >= min && n <= max ? n : null;
};

const FIELD =
  'mt-1.5 h-14 w-full rounded-2xl border-2 border-border bg-card px-4 text-base font-semibold outline-none transition focus:border-leaf';

/** Feuille d'ajout d'une parcelle. L'assistant est démonté à la fermeture : il repart de zéro à chaque ouverture. */
export function AddPlotSheet({ open, onClose, onCreated }: AddPlotSheetProps) {
  return open ? <AddPlotWizard onClose={onClose} onCreated={onCreated} /> : null;
}

function AddPlotWizard({ onClose, onCreated }: Omit<AddPlotSheetProps, 'open'>) {
  const { plots, activePlot, addPlot } = usePlot();
  const ids = useId();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [owner, setOwner] = useState(activePlot?.owner_name ?? '');
  const [latText, setLatText] = useState('');
  const [lonText, setLonText] = useState('');
  const [manualOpen, setManualOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [area, setArea] = useState(1);
  const [soil, setSoil] = useState<SoilTexture | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<ApiError | null>(null);

  // Ignore une réponse de géolocalisation arrivée après la fermeture de la feuille.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const latitude = parseCoord(latText, -90, 90);
  const longitude = parseCoord(lonText, -180, 180);
  const coords = latitude !== null && longitude !== null ? { latitude, longitude } : null;
  const latInvalid = latText.trim() !== '' && latitude === null;
  const lonInvalid = lonText.trim() !== '' && longitude === null;
  const place = coords ? (nearestCity(coords.latitude, coords.longitude) ?? formatCoords(coords.latitude, coords.longitude)) : null;

  const defaultName = t.default_name(plots.length + 1);
  const plotName = name.trim() || defaultName;
  const ownerName = owner.trim();
  const fields = Math.max(1, Math.round(area * 1.4));

  const canNext = step === 0 ? coords !== null && ownerName !== '' : step === 2 ? soil !== null : true;

  const setPosition = (lat: number, lon: number) => {
    setLatText(toText(lat));
    setLonText(toText(lon));
    setGeoError(null);
  };

  const locate = () => {
    if (!('geolocation' in navigator)) {
      setGeoError(t.geo_unsupported);
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mounted.current) return;
        const lat = Number(position.coords.latitude.toFixed(4));
        const lon = Number(position.coords.longitude.toFixed(4));
        setPosition(lat, lon);
        setLocating(false);
        toast.success(t.position_found, { description: nearestCity(lat, lon) ?? formatCoords(lat, lon) });
      },
      (error) => {
        if (!mounted.current) return;
        setLocating(false);
        setGeoError(error.code === error.PERMISSION_DENIED ? t.geo_denied : t.geo_unavailable);
      },
      { timeout: GEO_TIMEOUT_MS },
    );
  };

  const save = async () => {
    if (!coords || !soil || ownerName === '' || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const plot = await api.createPlot({
        name: plotName,
        owner_name: ownerName,
        latitude: coords.latitude,
        longitude: coords.longitude,
        area_ha: area,
        soil_texture: soil,
        soil_ph: null,
        slope_pct: null,
        practiced_crops: [],
      });
      addPlot(plot);
      onCreated(plot);
      toast.success(t.saved, { description: t.saved_text(plot.name) });
      onClose();
    } catch (e) {
      setSaveError(toApiError(e));
      setSaving(false);
    }
  };

  const goTo = (target: number) => {
    setSaveError(null);
    setStep(target);
  };

  const rows = [
    { label: t.row_name, value: plotName, step: 0 },
    { label: t.row_place, value: place ?? fr.common.not_available, step: 0 },
    { label: t.row_area, value: fr.farm.area(fmtArea(area)), step: 1 },
    { label: t.row_soil, value: soil ? fr.soil[soil] : fr.common.not_available, step: 2 },
    { label: t.row_owner, value: ownerName, step: 0 },
  ];

  return (
    <PhoneSheet open onClose={onClose} title={t.title}>
      {/* Progression */}
      <div className="px-5">
        <ol className="flex gap-1.5">
          {t.steps.map((label, i) => (
            <li key={label} className="flex-1" aria-current={i === step ? 'step' : undefined}>
              <div className={cn('h-1.5 rounded-full transition-colors duration-300', i <= step ? 'bg-leaf' : 'bg-muted')} />
              <p className={cn('mt-1.5 text-[11px] font-semibold', i === step ? 'text-primary' : 'text-muted-foreground')}>
                {i + 1}. {label}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pt-5 pb-4">
        {step === 0 && (
          <div key="s0" className="animate-fade-up space-y-5">
            <div>
              <p className="text-lg font-bold">{t.place_title}</p>
              <p className="text-sm text-muted-foreground">{t.place_text}</p>
            </div>

            <Button variant="soft" size="lg" className="w-full" onClick={locate} disabled={locating}>
              {locating ? <Loader2 className="animate-spin" /> : <LocateFixed />}
              {locating ? t.locating : t.locate}
            </Button>
            {geoError && (
              <p role="alert" className="rounded-2xl bg-danger-soft p-3 text-sm font-semibold text-foreground">
                {geoError}
              </p>
            )}

            <div role="group" aria-label={t.cities_label} className="grid grid-cols-2 gap-2">
              {CITIES.map((city) => {
                const chosen = coords?.latitude === city.latitude && coords.longitude === city.longitude;
                return (
                  <button
                    key={city.name}
                    type="button"
                    aria-pressed={chosen}
                    onClick={() => setPosition(city.latitude, city.longitude)}
                    className={cn(
                      'flex h-14 min-w-0 items-center justify-between gap-1 rounded-2xl border-2 px-4 text-[15px] font-semibold transition active:scale-95',
                      chosen ? 'border-leaf bg-leaf-soft text-leaf-foreground' : 'border-border bg-card',
                    )}
                  >
                    <span className="truncate">{city.name}</span>
                    {chosen && <Check className="size-5 shrink-0 text-primary" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>

            {place && (
              <p role="status" className="rounded-2xl bg-leaf-soft px-4 py-3 text-sm font-bold text-leaf-foreground">
                {t.position_chosen(place)}
              </p>
            )}

            <div>
              <button
                type="button"
                aria-expanded={manualOpen}
                aria-controls={`${ids}-manual`}
                onClick={() => setManualOpen((o) => !o)}
                className="flex min-h-12 w-full items-center justify-between gap-2 text-left text-[15px] font-semibold text-primary underline-offset-4 hover:underline"
              >
                {t.manual_toggle}
                <ChevronDown className={cn('size-5 shrink-0 transition-transform', manualOpen && 'rotate-180')} aria-hidden="true" />
              </button>
              {manualOpen && (
                <div id={`${ids}-manual`} className="mt-1 grid animate-fade-in grid-cols-2 gap-3">
                  <label className="block min-w-0">
                    <span className="text-sm font-semibold text-muted-foreground">{t.latitude}</span>
                    <input
                      value={latText}
                      onChange={(e) => setLatText(e.target.value)}
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder={t.latitude_placeholder}
                      aria-invalid={latInvalid}
                      aria-describedby={latInvalid ? `${ids}-lat-error` : undefined}
                      className={cn(FIELD, latInvalid && 'border-destructive focus:border-destructive')}
                    />
                    {latInvalid && (
                      <span id={`${ids}-lat-error`} role="alert" className="mt-1 block text-xs font-semibold text-destructive">
                        {t.invalid_latitude}
                      </span>
                    )}
                  </label>
                  <label className="block min-w-0">
                    <span className="text-sm font-semibold text-muted-foreground">{t.longitude}</span>
                    <input
                      value={lonText}
                      onChange={(e) => setLonText(e.target.value)}
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder={t.longitude_placeholder}
                      aria-invalid={lonInvalid}
                      aria-describedby={lonInvalid ? `${ids}-lon-error` : undefined}
                      className={cn(FIELD, lonInvalid && 'border-destructive focus:border-destructive')}
                    />
                    {lonInvalid && (
                      <span id={`${ids}-lon-error`} role="alert" className="mt-1 block text-xs font-semibold text-destructive">
                        {t.invalid_longitude}
                      </span>
                    )}
                  </label>
                </div>
              )}
            </div>

            <label className="block">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                <Pencil className="size-3.5" aria-hidden="true" /> {t.name_label}
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={defaultName}
                autoComplete="off"
                maxLength={60}
                className={FIELD}
              />
            </label>

            <label className="block">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                <UserRound className="size-3.5" aria-hidden="true" /> {t.owner_label}
              </span>
              <input
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder={t.owner_placeholder}
                autoComplete="name"
                maxLength={80}
                required
                aria-describedby={`${ids}-owner-hint`}
                className={FIELD}
              />
              <span
                id={`${ids}-owner-hint`}
                className={cn('mt-1 block text-xs font-semibold', ownerName === '' ? 'text-destructive' : 'sr-only')}
              >
                {t.owner_required}
              </span>
            </label>
          </div>
        )}

        {step === 1 && (
          <div key="s1" className="animate-fade-up space-y-5">
            <div>
              <p className="text-lg font-bold">{t.area_title}</p>
              <p className="text-sm text-muted-foreground">{t.area_text}</p>
            </div>
            <div className="flex items-center justify-between rounded-3xl bg-card p-4 shadow-soft">
              <Button
                variant="soft"
                size="icon"
                className="size-16 rounded-full"
                disabled={area <= AREA_MIN}
                onClick={() => setArea((a) => Math.max(AREA_MIN, a - AREA_STEP))}
                aria-label={t.decrease}
              >
                <Minus className="!size-7" />
              </Button>
              <div className="text-center" aria-live="polite">
                <p className="font-display text-5xl font-bold tabular-nums">{fmtArea(area)}</p>
                <p className="text-sm font-semibold text-muted-foreground">{t.hectares(area)}</p>
              </div>
              <Button
                variant="soft"
                size="icon"
                className="size-16 rounded-full"
                disabled={area >= AREA_MAX}
                onClick={() => setArea((a) => Math.min(AREA_MAX, a + AREA_STEP))}
                aria-label={t.increase}
              >
                <Plus className="!size-7" />
              </Button>
            </div>
            <div role="group" aria-label={t.shortcuts_label} className="grid grid-cols-4 gap-2">
              {AREA_SHORTCUTS.map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={area === v}
                  onClick={() => setArea(v)}
                  className={cn(
                    'h-12 rounded-2xl border-2 text-sm font-bold transition active:scale-95',
                    area === v ? 'border-leaf bg-leaf-soft' : 'border-border bg-card',
                  )}
                >
                  {fr.farm.area(fmtArea(v))}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-sky-soft p-4 text-sky-foreground">
              <span className="shrink-0 font-display text-3xl font-bold">{t.football_count(fields)}</span>
              <span className="text-sm leading-snug font-semibold">{t.football_text(fields)}</span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div key="s2" className="animate-fade-up space-y-5">
            <div>
              <p className="text-lg font-bold">{t.soil_title}</p>
              <p className="text-sm text-muted-foreground">{t.soil_text}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {SOIL_ORDER.map((texture) => {
                const chosen = soil === texture;
                return (
                  <button
                    key={texture}
                    type="button"
                    aria-pressed={chosen}
                    onClick={() => setSoil(texture)}
                    className={cn(
                      'relative overflow-hidden rounded-3xl border-2 bg-card text-left transition active:scale-95',
                      chosen ? 'border-leaf shadow-glow' : 'border-border',
                    )}
                  >
                    <div className={cn('relative h-20', SOIL_SWATCH[texture])}>
                      <div className="absolute inset-0 opacity-25 [background:radial-gradient(circle_at_20%_30%,var(--background)_0_2px,transparent_3px),radial-gradient(circle_at_70%_60%,var(--forest-deep)_0_2px,transparent_3px)] [background-size:14px_14px,18px_18px]" />
                      {chosen && (
                        <span className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-leaf text-leaf-foreground">
                          <Check className="size-4" aria-hidden="true" />
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-bold">{fr.soil[texture]}</p>
                      <p className="text-xs leading-snug text-muted-foreground">{fr.soil_hints[texture]}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === LAST_STEP && (
          <div key="s3" className="animate-fade-up space-y-4">
            <p className="text-lg font-bold">{t.review_title}</p>
            <div className="overflow-hidden rounded-3xl bg-card shadow-card">
              <FarmMap plots={[{ plot_id: PREVIEW_ID, name: plotName }]} activeId={PREVIEW_ID} label={t.review_map_label} />
              <ul className="divide-y divide-border">
                {rows.map((row) => (
                  <li key={row.label}>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => goTo(row.step)}
                      aria-label={t.edit(`${row.label}, ${row.value}`)}
                      className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left transition active:bg-muted disabled:opacity-60"
                    >
                      <span className="shrink-0 text-sm text-muted-foreground">{row.label}</span>
                      <span className="flex min-w-0 items-center gap-2 font-bold">
                        <span className="min-w-0 text-right break-words">{row.value}</span>
                        <Pencil className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            {saveError && <ErrorState error={saveError} />}
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-border bg-background px-5 pt-3 pb-6">
        {step > 0 && (
          <Button
            variant="outline"
            size="lg"
            className="w-14 px-0"
            disabled={saving}
            onClick={() => goTo(step - 1)}
            aria-label={fr.common.back}
          >
            <ChevronLeft />
          </Button>
        )}
        {step < LAST_STEP ? (
          <Button variant="hero" size="lg" className="flex-1" disabled={!canNext} onClick={() => goTo(step + 1)}>
            {fr.common.continue} <ArrowRight />
          </Button>
        ) : (
          <Button variant="leaf" size="lg" className="flex-1" disabled={saving} onClick={() => void save()}>
            {saving ? <Loader2 className="animate-spin" /> : <Check />}
            {saving ? t.saving : t.save}
          </Button>
        )}
      </div>
    </PhoneSheet>
  );
}
