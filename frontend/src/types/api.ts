/**
 * Types PROVISOIRES du contrat API S3A (Django REST).
 *
 * À remplacer par schema.d.ts généré avec openapi-typescript dès que Dev3
 * publie contracts/openapi.json. En cas de divergence, le contrat gagne.
 *
 * Règles du plan :
 * - clés JSON en anglais snake_case ;
 * - une donnée absente vaut null avec quality = "missing" (jamais inventée).
 */

// ---------------------------------------------------------------------------
// Communs
// ---------------------------------------------------------------------------

export type IsoDate = string; // "2027-03-01"
export type IsoDateTime = string; // "2026-11-14T10:00:00Z"

export type Quality = 'observed' | 'estimated' | 'needs_local_validation' | 'missing';

export interface ErrorEnvelope {
  error: {
    code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'CONFLICT' | 'SEASON_LOCKED' | 'UPSTREAM_ERROR' | 'INTERNAL_ERROR';
    message: string; // en français, affiché tel quel
    details?: Record<string, unknown> | null;
  };
}

// ---------------------------------------------------------------------------
// Système
// ---------------------------------------------------------------------------

export interface HealthOut {
  status: 'ok' | 'degraded';
  database: 'ok' | 'down';
  ml_mode: 'real' | 'mock';
  model_version: string | null;
  llm_enabled: boolean;
}

export interface ClockOut {
  today: IsoDate;
  is_overridden: boolean;
}

export interface ClockSet {
  today: IsoDate | null; // null = remettre l'horloge réelle
}

// ---------------------------------------------------------------------------
// Cultures
// ---------------------------------------------------------------------------

export type CropCategory = 'cereal' | 'tuber' | 'legume' | 'cover';
export type NitrogenRole = 'fixer' | 'demanding' | 'neutral';

export interface CropSheet {
  code: string; // "maize"
  name_fr: string; // "Maïs"
  category: CropCategory;
  nitrogen_role: NitrogenRole;
  cycle_days: number;
  water_need_mm: number;
  is_cover_crop: boolean;
}

export interface RotationRule {
  previous_crop: string;
  next_crop: string;
  effect: 'favorable' | 'neutral' | 'unfavorable';
  reason_fr: string;
}

// ---------------------------------------------------------------------------
// Parcelles
// ---------------------------------------------------------------------------

export type SoilTexture = 'sandy' | 'loamy' | 'clay' | 'sandy_loam' | 'clay_loam' | 'unknown';

export interface PlotCreate {
  name: string;
  owner_name: string;
  latitude: number;
  longitude: number;
  area_ha: number | null;
  soil_texture: SoilTexture;
  soil_ph: number | null;
  slope_pct: number | null;
  practiced_crops: string[]; // codes CropSheet
}

export interface CropHistoryEntry {
  season_label: string; // "2026-A"
  crop_code: string;
}

export interface PlotOut extends PlotCreate {
  plot_id: string; // "P001"
  crop_history: CropHistoryEntry[];
  created_at: IsoDateTime;
}

// ---------------------------------------------------------------------------
// Prédiction (prediction_output)
// ---------------------------------------------------------------------------

export interface PredictedValue {
  value: number | null;
  q10: number | null;
  q90: number | null;
  quality: Quality;
}

/** Les 14 clés par période (liste provisoire, à confirmer avec Dev1). */
export interface PeriodFeatures {
  t2m_mean_c: PredictedValue;
  t2m_max_c: PredictedValue;
  t2m_min_c: PredictedValue;
  precip_mm: PredictedValue;
  rain_days: PredictedValue;
  heavy_rain_days: PredictedValue;
  dry_days: PredictedValue;
  heat_stress_days: PredictedValue;
  rh2m_pct: PredictedValue;
  solar_mj_m2: PredictedValue;
  sm_surface: PredictedValue;
  sm_root: PredictedValue;
  et0_mm: PredictedValue;
  ndvi: PredictedValue;
}

export interface PeriodIndices {
  water_stress_index: PredictedValue;
  erosion_risk_index: PredictedValue;
  infiltration_capacity_index: PredictedValue;
}

export interface PredictionPeriod {
  period: string; // "2027-03"
  lead_months: number; // 1..9
  features: PeriodFeatures;
  indices: PeriodIndices;
}

export interface CriticalPeriod {
  period: string;
  kind: 'water_stress' | 'erosion' | 'heat_stress' | 'heavy_rain';
  severity: 'moderate' | 'high';
  message_fr: string;
}

export interface BaselineComparison {
  target: keyof PeriodFeatures;
  skill_pct: number | null;
  method: 'model' | 'climatology';
}

export interface PredictionOutput {
  plot_id: string;
  season_label: string;
  season_start: IsoDate;
  season_end: IsoDate;
  forecast_origin: IsoDate;
  model_version: string;
  periods: PredictionPeriod[];
  season_summary: {
    precip_total_mm: PredictedValue;
    heat_stress_days_total: PredictedValue;
    mean_water_stress_index: PredictedValue;
  };
  critical_periods: CriticalPeriod[];
  baseline_comparison: BaselineComparison[];
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Recommandation (recommendation_output)
// ---------------------------------------------------------------------------

export interface CropScore {
  crop_code: string;
  name_fr: string;
  score: number; // 0..100
  reasons: string[];
  penalties: string[];
}

export interface RecommendationOutput {
  main_crop: CropScore;
  next_crop: CropScore | null;
  top_3: CropScore[];
  cover_crops: string[];
  warnings: string[];
  missing_info: string[];
}

// ---------------------------------------------------------------------------
// Saisons, analyse, bilan
// ---------------------------------------------------------------------------

export type SeasonStatus = 'draft' | 'locked' | 'closed';

export interface SeasonOut {
  season_label: string; // "2027-A"
  season_start: IsoDate;
  season_end: IsoDate;
  lock_date: IsoDate;
  status: SeasonStatus;
  prediction_version: number | null;
}

export interface AnalysisRequest {
  season_label?: string; // défaut : saison suivante
  force?: boolean;
}

export interface AnalysisOut {
  season: SeasonOut;
  prediction: PredictionOutput;
  recommendation: RecommendationOutput;
  report: ReportOut;
  timings_ms: Record<string, number>;
}

export interface ReportOut {
  plot_id: string;
  season_label: string;
  status: SeasonStatus;
  version: number;
  text_fr: string; // ≤ 150 mots
  created_at: IsoDateTime;
  locked_at: IsoDateTime | null;
}

export type AlertKind = 'dry_spell' | 'heavy_rain' | 'heat_stress' | 'low_soil_moisture' | 'data_stale';

export interface CurrentSeasonOut {
  plot_id: string;
  season_label: string;
  as_of: IsoDate;
  quality: Quality;
  precip_7d_mm: number | null;
  precip_30d_mm: number | null;
  et0_7d_mm: number | null;
  et0_30d_mm: number | null;
  trend: { sm_root_7d_change: number | null };
  series_30d: Array<{
    date: IsoDate;
    precip_mm: number | null;
    t2m_max_c: number | null;
    sm_root: number | null;
  }>;
  alerts: Array<{ kind: AlertKind; active: boolean; message_fr: string }>;
}

// ---------------------------------------------------------------------------
// Boucle d'apprentissage
// ---------------------------------------------------------------------------

export interface PeriodError {
  period: string;
  target: keyof PeriodFeatures;
  predicted: number | null;
  observed: number | null;
  abs_error: number | null;
  pct_error: number | null; // null si observed = 0
}

export interface EvaluationOut {
  plot_id: string;
  season_label: string;
  model_version: string;
  errors: PeriodError[];
  skipped_periods: string[];
}

export interface ModelVersion {
  version: string; // "1.0.0"
  parent_version: string | null;
  is_active: boolean;
  trained_until: IsoDate;
  skill_pct: number | null;
  interval_coverage: number | null;
  created_at: IsoDateTime;
}

export interface LearningLoopOut {
  plot_id: string;
  evaluated_season: string; // "2026-A"
  evaluation: EvaluationOut | null;
  previous_model: ModelVersion | null;
  current_model: ModelVersion | null;
  data_refresh: 'live' | 'cached_only';
}

// ---------------------------------------------------------------------------
// Voix
// ---------------------------------------------------------------------------

export interface VoiceQuestion {
  plot_id: string;
  question: string;
}

export interface VoiceAnswerOut {
  intent: string;
  answer_text: string; // affiché
  speak_text: string; // prononcé (unités en toutes lettres)
  data_missing: boolean;
  llm_used: boolean;
  suggestions: [string, string, string];
}
