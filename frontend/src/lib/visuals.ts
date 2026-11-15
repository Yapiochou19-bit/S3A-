/**
 * Correspondances purement visuelles (images, nuanciers, niveaux) à partir des données de l'API.
 * Aucune donnée métier n'est inventée ici.
 */
import cropCassava from '../assets/crop-cassava.jpg';
import cropCocoa from '../assets/crop-cocoa.jpg';
import cropRice from '../assets/crop-rice.jpg';
import cropYam from '../assets/crop-yam.jpg';
import plotCocoa from '../assets/plot-cocoa.jpg';
import plotMaize from '../assets/plot-maize.jpg';
import { fr } from '../i18n/fr';
import type { CurrentSeasonOut, PlotOut, SoilTexture } from '../types/api';

/** Photo d'une culture par code ; undefined → afficher la vignette de repli. */
const CROP_IMAGES: Record<string, string> = {
  maize: plotMaize,
  cassava: cropCassava,
  yam: cropYam,
  rice: cropRice,
  cocoa: cropCocoa,
};

export const cropImage = (cropCode: string | null | undefined): string | undefined =>
  cropCode ? CROP_IMAGES[cropCode] : undefined;

const PLOT_IMAGES: Record<string, string> = { maize: plotMaize, cocoa: plotCocoa };

/** Dernière culture connue de la parcelle (historique, sinon cultures pratiquées). */
export const lastCropCode = (plot: PlotOut): string | null =>
  plot.crop_history[plot.crop_history.length - 1]?.crop_code ?? plot.practiced_crops[0] ?? null;

/** Vue aérienne illustrative selon la dernière culture ; undefined → vignette de repli. */
export const plotImage = (plot: PlotOut): string | undefined => {
  const code = lastCropCode(plot);
  return code ? PLOT_IMAGES[code] : undefined;
};

/** Classe de fond (nuancier) par texture de sol. */
export const SOIL_SWATCH: Record<SoilTexture, string> = {
  sandy: 'bg-sand',
  sandy_loam: 'bg-earth',
  loamy: 'bg-silt',
  clay_loam: 'bg-laterite',
  clay: 'bg-clay',
  unknown: 'bg-muted-foreground',
};

/** Ordre d'affichage des textures dans le choix du sol. */
export const SOIL_ORDER: SoilTexture[] = ['sandy', 'sandy_loam', 'loamy', 'clay_loam', 'clay', 'unknown'];

export type Tone = 'leaf' | 'sky' | 'sun' | 'earth';

/** Niveau d'adaptation d'une culture selon sa note (0–100). */
export const suitability = (score: number): { label: string; tone: Tone } =>
  score >= 85
    ? { label: fr.suitability.very, tone: 'leaf' }
    : score >= 75
      ? { label: fr.suitability.good, tone: 'sky' }
      : { label: fr.suitability.possible, tone: 'sun' };

export type PlotStatus = 'ok' | 'watch' | 'unknown';

/** État de la parcelle déduit des alertes de la saison en cours (aucune alerte active → ok). */
export const plotStatus = (current: CurrentSeasonOut | null | undefined): PlotStatus =>
  !current || current.quality === 'missing' ? 'unknown' : current.alerts.some((a) => a.active) ? 'watch' : 'ok';

/** Classes de pastille par état. */
export const STATUS_CHIP: Record<PlotStatus, { chip: string; dot: string }> = {
  ok: { chip: 'bg-leaf-soft text-leaf-foreground', dot: 'bg-leaf' },
  watch: { chip: 'bg-warning-soft text-sun-foreground', dot: 'bg-warning' },
  unknown: { chip: 'bg-sky-soft text-sky-foreground', dot: 'bg-sky' },
};

/** Villes proposées à la création d'une parcelle (coordonnées du centre-ville). */
export const CITIES: Array<{ name: string; latitude: number; longitude: number }> = [
  { name: 'Abidjan', latitude: 5.36, longitude: -4.01 },
  { name: 'Anyama', latitude: 5.49, longitude: -4.05 },
  { name: 'Bouaké', latitude: 7.69, longitude: -5.03 },
  { name: 'Yamoussoukro', latitude: 6.82, longitude: -5.28 },
  { name: 'Korhogo', latitude: 9.46, longitude: -5.63 },
  { name: 'Daloa', latitude: 6.88, longitude: -6.45 },
  { name: 'San-Pédro', latitude: 4.75, longitude: -6.64 },
  { name: 'Man', latitude: 7.41, longitude: -7.55 },
];

/** Ville proposée la plus proche d'un point (pour un libellé de lieu lisible), à moins de ~60 km. */
export const nearestCity = (latitude: number, longitude: number): string | null => {
  let best: { name: string; d: number } | null = null;
  for (const c of CITIES) {
    const d = Math.hypot(c.latitude - latitude, c.longitude - longitude);
    if (!best || d < best.d) best = { name: c.name, d };
  }
  return best && best.d < 0.55 ? best.name : null;
};
