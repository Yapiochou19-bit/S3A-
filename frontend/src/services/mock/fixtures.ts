/**
 * Données mock PROVISOIRES — déterministes, calquées sur le plan S3A.
 * Parcelle de démonstration P001 (Awa Koné, Parcelle Anyama).
 * À remplacer par contracts/examples/*.json dès leur publication.
 */
import type {
  AnalysisOut,
  ClockOut,
  CropSheet,
  CurrentSeasonOut,
  HealthOut,
  LearningLoopOut,
  ModelVersion,
  PeriodFeatures,
  PeriodIndices,
  PlotOut,
  PredictedValue,
  PredictionOutput,
  PredictionPeriod,
  RecommendationOutput,
  ReportOut,
  SeasonOut,
} from '../../types/api';

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

const round = (x: number, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

/** Valeur estimée avec intervalle q10–q90 symétrique de ±spread. */
const est = (value: number, spread: number, d = 2): PredictedValue => ({
  value: round(value, d),
  q10: round(value - spread, d),
  q90: round(value + spread, d),
  quality: 'estimated',
});

const missing = (): PredictedValue => ({ value: null, q10: null, q90: null, quality: 'missing' });

// ---------------------------------------------------------------------------
// Système
// ---------------------------------------------------------------------------

export const health: HealthOut = {
  status: 'ok',
  database: 'ok',
  ml_mode: 'mock',
  model_version: 'mock-0.0.0',
  llm_enabled: false,
};

export const clock: ClockOut = { today: '2026-11-14', is_overridden: false };

// ---------------------------------------------------------------------------
// Cultures (9)
// ---------------------------------------------------------------------------

export const crops: CropSheet[] = [
  { code: 'maize', name_fr: 'Maïs', category: 'cereal', nitrogen_role: 'demanding', cycle_days: 110, water_need_mm: 500, is_cover_crop: false },
  { code: 'rice', name_fr: 'Riz pluvial', category: 'cereal', nitrogen_role: 'demanding', cycle_days: 120, water_need_mm: 700, is_cover_crop: false },
  { code: 'sorghum', name_fr: 'Sorgho', category: 'cereal', nitrogen_role: 'neutral', cycle_days: 110, water_need_mm: 400, is_cover_crop: false },
  { code: 'cassava', name_fr: 'Manioc', category: 'tuber', nitrogen_role: 'neutral', cycle_days: 300, water_need_mm: 1000, is_cover_crop: false },
  { code: 'yam', name_fr: 'Igname', category: 'tuber', nitrogen_role: 'demanding', cycle_days: 240, water_need_mm: 1000, is_cover_crop: false },
  { code: 'groundnut', name_fr: 'Arachide', category: 'legume', nitrogen_role: 'fixer', cycle_days: 100, water_need_mm: 450, is_cover_crop: false },
  { code: 'cowpea', name_fr: 'Niébé', category: 'legume', nitrogen_role: 'fixer', cycle_days: 75, water_need_mm: 350, is_cover_crop: false },
  { code: 'soybean', name_fr: 'Soja', category: 'legume', nitrogen_role: 'fixer', cycle_days: 100, water_need_mm: 450, is_cover_crop: false },
  { code: 'mucuna', name_fr: 'Mucuna', category: 'cover', nitrogen_role: 'fixer', cycle_days: 120, water_need_mm: 400, is_cover_crop: true },
];

const cropName = (code: string) => crops.find((c) => c.code === code)?.name_fr ?? code;

// ---------------------------------------------------------------------------
// Parcelle P001
// ---------------------------------------------------------------------------

export const plotP001: PlotOut = {
  plot_id: 'P001',
  name: 'Parcelle Anyama',
  owner_name: 'Awa Koné',
  latitude: 5.49,
  longitude: -4.05,
  area_ha: 1.5,
  soil_texture: 'sandy_loam',
  soil_ph: 5.8,
  slope_pct: null, // saisie manuelle optionnelle, non renseignée
  practiced_crops: ['maize', 'cassava', 'groundnut'],
  crop_history: [
    { season_label: '2025-A', crop_code: 'maize' },
    { season_label: '2025-B', crop_code: 'groundnut' },
    { season_label: '2026-A', crop_code: 'maize' },
  ],
  created_at: '2026-11-14T08:00:00Z',
};

export const plots: PlotOut[] = [plotP001];

// ---------------------------------------------------------------------------
// Saison 2027-A (mars → juillet, 5 périodes)
// ---------------------------------------------------------------------------

export const season2027A: SeasonOut = {
  season_label: '2027-A',
  season_start: '2027-03-01',
  season_end: '2027-07-31',
  lock_date: '2027-02-15',
  status: 'draft',
  prediction_version: 1,
};

/** Profil mensuel typique d'Anyama : pic de pluie en juin. */
const MONTHS: Array<{ period: string; lead: number; precip: number; tmax: number; tmin: number; sm: number; heat: number }> = [
  { period: '2027-03', lead: 4, precip: 120, tmax: 33.1, tmin: 23.6, sm: 0.52, heat: 3 },
  { period: '2027-04', lead: 5, precip: 160, tmax: 32.6, tmin: 23.8, sm: 0.6, heat: 6 },
  { period: '2027-05', lead: 6, precip: 260, tmax: 31.4, tmin: 23.5, sm: 0.7, heat: 1 },
  { period: '2027-06', lead: 7, precip: 410, tmax: 29.6, tmin: 23.0, sm: 0.82, heat: 0 },
  { period: '2027-07', lead: 8, precip: 150, tmax: 28.4, tmin: 22.6, sm: 0.74, heat: 0 },
];

const buildPeriod = (m: (typeof MONTHS)[number]): PredictionPeriod => {
  const tmean = (m.tmax + m.tmin) / 2;
  const et0 = 4.2 * 30 - m.lead * 2;
  const features: PeriodFeatures = {
    t2m_mean_c: est(tmean, 0.8, 1),
    t2m_max_c: est(m.tmax, 1.0, 1),
    t2m_min_c: est(m.tmin, 0.7, 1),
    precip_mm: est(m.precip, m.precip * 0.35, 0),
    rain_days: est(Math.round(m.precip / 18), 3, 0),
    heavy_rain_days: est(Math.round(m.precip / 110), 1, 0),
    dry_days: est(30 - Math.round(m.precip / 18), 3, 0),
    heat_stress_days: est(m.heat, 2, 0),
    rh2m_pct: est(78 + m.precip / 40, 4, 0),
    solar_mj_m2: est(19 - m.precip / 80, 1.5, 1),
    sm_surface: est(m.sm - 0.06, 0.08),
    sm_root: est(m.sm, 0.07),
    et0_mm: est(et0, 10, 0),
    ndvi: missing(), // NDVI non prêt en V1 → null + missing
  };
  const wsi = Math.min(1, Math.max(0, et0 / (m.precip + et0) * (1 - m.sm) * 2));
  const indices: PeriodIndices = {
    water_stress_index: est(wsi, 0.1),
    // érosion sans NDVI → à valider localement
    erosion_risk_index: { ...est(Math.min(1, m.precip / 500), 0.12), quality: 'needs_local_validation' },
    infiltration_capacity_index: est(0.62, 0.08),
  };
  return { period: m.period, lead_months: m.lead, features, indices };
};

const periods = MONTHS.map(buildPeriod);

export const prediction2027A: PredictionOutput = {
  plot_id: 'P001',
  season_label: '2027-A',
  season_start: '2027-03-01',
  season_end: '2027-07-31',
  forecast_origin: '2026-10-31',
  model_version: 'mock-0.0.0',
  periods,
  season_summary: {
    precip_total_mm: est(1100, 280, 0),
    heat_stress_days_total: est(10, 4, 0),
    mean_water_stress_index: est(0.34, 0.1),
  },
  critical_periods: [
    { period: '2027-04', kind: 'heat_stress', severity: 'high', message_fr: 'Avril : environ 6 jours au-dessus de 35 °C.' },
    { period: '2027-06', kind: 'heavy_rain', severity: 'moderate', message_fr: 'Juin : fortes pluies, risque de ruissellement.' },
  ],
  baseline_comparison: [
    { target: 'precip_mm', skill_pct: 7.4, method: 'model' },
    { target: 't2m_max_c', skill_pct: 12.1, method: 'model' },
    { target: 'sm_root', skill_pct: 2.1, method: 'climatology' },
  ],
  warnings: ['Les prévisions à plus de 5 mois ont une fiabilité limitée.', 'NDVI non disponible pour cette saison.'],
};

// ---------------------------------------------------------------------------
// Recommandation
// ---------------------------------------------------------------------------

export const recommendation2027A: RecommendationOutput = {
  main_crop: {
    crop_code: 'groundnut',
    name_fr: cropName('groundnut'),
    score: 82,
    reasons: ['Après deux saisons de maïs, une légumineuse restaure l’azote du sol.', 'Besoin en eau compatible avec la pluie prévue.'],
    penalties: [],
  },
  next_crop: {
    crop_code: 'maize',
    name_fr: cropName('maize'),
    score: 74,
    reasons: ['Le maïs profite de l’azote laissé par l’arachide.'],
    penalties: [],
  },
  top_3: [
    { crop_code: 'groundnut', name_fr: cropName('groundnut'), score: 82, reasons: ['Rotation favorable après le maïs.'], penalties: [] },
    { crop_code: 'cowpea', name_fr: cropName('cowpea'), score: 76, reasons: ['Cycle court, tolère la chaleur d’avril.'], penalties: [] },
    { crop_code: 'cassava', name_fr: cropName('cassava'), score: 61, reasons: ['Résiste aux périodes sèches.'], penalties: ['Cycle trop long pour la saison A.'] },
  ],
  cover_crops: ['mucuna'],
  warnings: ['Fortes pluies prévues en juin : prévoir un couvert pour limiter l’érosion.'],
  missing_info: ['Pente de la parcelle non renseignée.'],
};

// ---------------------------------------------------------------------------
// Bilan
// ---------------------------------------------------------------------------

export const report2027A: ReportOut = {
  plot_id: 'P001',
  season_label: '2027-A',
  status: 'draft',
  version: 1,
  text_fr:
    'Pour la saison 2027-A, environ 1100 mm de pluie sont attendus, avec un pic en juin. ' +
    'Avril sera chaud, avec environ 6 jours au-dessus de 35 °C. ' +
    'Culture conseillée : arachide, puis maïs la saison suivante, car la rotation restaure l’azote du sol. ' +
    'Un couvert de mucuna limitera l’érosion pendant les fortes pluies de juin. ' +
    'Information manquante : la pente de la parcelle. ' +
    'Ces prévisions restent incertaines et doivent être confirmées par l’observation du terrain.',
  created_at: '2026-11-14T08:05:00Z',
  locked_at: null,
};

export const analysis2027A: AnalysisOut = {
  season: season2027A,
  prediction: prediction2027A,
  recommendation: recommendation2027A,
  report: report2027A,
  timings_ms: { weather: 420, prediction: 1310, recommendation: 35, report: 12 },
};

// ---------------------------------------------------------------------------
// Saison en cours (2026-B)
// ---------------------------------------------------------------------------

const series30d = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 9, 15 + i)); // 15 oct → 13 nov
  const rainy = i % 4 === 0 || i % 7 === 0;
  return {
    date: d.toISOString().slice(0, 10),
    precip_mm: rainy ? round(6 + (i % 5) * 3.5, 1) : 0,
    t2m_max_c: round(30.5 + Math.sin(i / 4) * 1.4, 1),
    sm_root: round(0.66 - i * 0.004, 3),
  };
});

export const currentSeason: CurrentSeasonOut = {
  plot_id: 'P001',
  season_label: '2026-B',
  as_of: '2026-11-13',
  quality: 'observed',
  precip_7d_mm: round(series30d.slice(-7).reduce((s, x) => s + (x.precip_mm ?? 0), 0), 1),
  precip_30d_mm: round(series30d.reduce((s, x) => s + (x.precip_mm ?? 0), 0), 1),
  et0_7d_mm: 29.4,
  et0_30d_mm: 121.8,
  trend: { sm_root_7d_change: -0.028 },
  series_30d: series30d,
  alerts: [
    { kind: 'dry_spell', active: false, message_fr: 'Pas de période sèche prolongée.' },
    { kind: 'heavy_rain', active: false, message_fr: 'Pas de forte pluie récente.' },
    { kind: 'heat_stress', active: false, message_fr: 'Pas de chaleur excessive.' },
    { kind: 'low_soil_moisture', active: true, message_fr: 'L’humidité du sol baisse depuis 7 jours.' },
    { kind: 'data_stale', active: false, message_fr: 'Données à jour.' },
  ],
};

// ---------------------------------------------------------------------------
// Modèles et boucle d'apprentissage (2026-A, v1.0.0 → v1.1.0)
// ---------------------------------------------------------------------------

export const modelV100: ModelVersion = {
  version: '1.0.0',
  parent_version: null,
  is_active: false,
  trained_until: '2025-12-31',
  skill_pct: 6.8,
  interval_coverage: 0.78,
  created_at: '2026-11-14T06:00:00Z',
};

export const modelV110: ModelVersion = {
  version: '1.1.0',
  parent_version: '1.0.0',
  is_active: true,
  trained_until: '2026-07-31',
  skill_pct: 8.2,
  interval_coverage: 0.8,
  created_at: '2026-11-14T07:30:00Z',
};

export const models: ModelVersion[] = [modelV110, modelV100];

export const learningLoop: LearningLoopOut = {
  plot_id: 'P001',
  evaluated_season: '2026-A',
  evaluation: {
    plot_id: 'P001',
    season_label: '2026-A',
    model_version: '1.0.0',
    errors: [
      { period: '2026-03', target: 'precip_mm', predicted: 118, observed: 97, abs_error: 21, pct_error: 21.6 },
      { period: '2026-04', target: 'precip_mm', predicted: 155, observed: 171, abs_error: 16, pct_error: 9.4 },
      { period: '2026-05', target: 'precip_mm', predicted: 248, observed: 302, abs_error: 54, pct_error: 17.9 },
      { period: '2026-06', target: 'precip_mm', predicted: 395, observed: 361, abs_error: 34, pct_error: 9.4 },
      { period: '2026-07', target: 'precip_mm', predicted: 140, observed: 0, abs_error: 140, pct_error: null },
      { period: '2026-04', target: 't2m_max_c', predicted: 32.4, observed: 33.0, abs_error: 0.6, pct_error: 1.8 },
    ],
    skipped_periods: [],
  },
  previous_model: modelV100,
  current_model: modelV110,
  data_refresh: 'live',
};
