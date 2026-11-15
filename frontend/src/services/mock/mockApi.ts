/**
 * API mock PROVISOIRE : mêmes fonctions que le futur client Django REST.
 * Utilisée quand VITE_USE_MOCK=true. État en mémoire, réinitialisé au rechargement.
 * Les erreurs sont levées au format ErrorEnvelope.
 */
import type {
  AnalysisOut,
  AnalysisRequest,
  ClockOut,
  ClockSet,
  CropSheet,
  CurrentSeasonOut,
  ErrorEnvelope,
  EvaluationOut,
  HealthOut,
  LearningLoopOut,
  ModelVersion,
  PlotCreate,
  PlotOut,
  ReportOut,
  VoiceAnswerOut,
  VoiceQuestion,
} from '../../types/api';
import { ApiError } from '../errors';
import * as fx from './fixtures';

/** Même erreur que le client réel : code et message issus d'un ErrorEnvelope. */
const fail = (status: number, code: ErrorEnvelope['error']['code'], message: string): never => {
  throw new ApiError(status, code, message);
};

const clone = <T>(x: T): T => structuredClone(x);
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const reply = async <T>(x: T, ms = 250): Promise<T> => {
  await delay(ms);
  return clone(x);
};

// ---------------------------------------------------------------------------
// État en mémoire
// ---------------------------------------------------------------------------

const state = {
  clock: clone(fx.clock),
  plots: clone(fx.plots),
  /** Une analyse par parcelle, créée à la première demande à partir du jeu de démo. */
  analyses: {} as Record<string, AnalysisOut>,
  models: clone(fx.models),
  nextPlotNumber: 2,
};

const findPlot = (plotId: string): PlotOut =>
  state.plots.find((p) => p.plot_id === plotId) ?? fail(404, 'NOT_FOUND', 'Parcelle introuvable.');

/** Toute parcelle existante reçoit les données de démonstration, à son identifiant. */
const analysisFor = (plotId: string): AnalysisOut => {
  findPlot(plotId);
  const existing = state.analyses[plotId];
  if (existing) return existing;
  const created = clone(fx.analysis2027A);
  created.prediction.plot_id = plotId;
  created.report.plot_id = plotId;
  created.season.prediction_version = 0;
  state.analyses[plotId] = created;
  return created;
};

// ---------------------------------------------------------------------------
// Système
// ---------------------------------------------------------------------------

export const getHealth = (): Promise<HealthOut> => reply(fx.health, 100);

export const getClock = (): Promise<ClockOut> => reply(state.clock, 100);

export const setClock = async (body: ClockSet): Promise<ClockOut> => {
  state.clock = body.today
    ? { today: body.today, is_overridden: true }
    : { today: new Date().toISOString().slice(0, 10), is_overridden: false };
  return reply(state.clock, 100);
};

// ---------------------------------------------------------------------------
// Cultures et parcelles
// ---------------------------------------------------------------------------

export const getCrops = (): Promise<CropSheet[]> => reply(fx.crops);

export const listPlots = (): Promise<PlotOut[]> => reply(state.plots);

export const getPlot = async (plotId: string): Promise<PlotOut> => reply(findPlot(plotId));

export const createPlot = async (body: PlotCreate): Promise<PlotOut> => {
  if (!body.name.trim()) fail(422, 'VALIDATION_ERROR', 'Le nom de la parcelle est obligatoire.');
  if (body.latitude < -90 || body.latitude > 90 || body.longitude < -180 || body.longitude > 180)
    fail(422, 'VALIDATION_ERROR', 'Coordonnées invalides.');
  if (body.soil_ph !== null && (body.soil_ph < 0 || body.soil_ph > 10))
    fail(422, 'VALIDATION_ERROR', 'Le pH du sol doit être compris entre 0 et 10.');
  const plot: PlotOut = {
    ...body,
    plot_id: `P${String(state.nextPlotNumber++).padStart(3, '0')}`,
    crop_history: [],
    created_at: new Date().toISOString(),
  };
  state.plots.push(plot);
  return reply(plot, 400);
};

// ---------------------------------------------------------------------------
// Saisons, analyse, bilan
// ---------------------------------------------------------------------------

export const getCurrentSeason = async (plotId: string): Promise<CurrentSeasonOut> => {
  findPlot(plotId);
  return reply({ ...fx.currentSeason, plot_id: plotId });
};

/** Simule le calcul long (le vrai client applique un timeout de 90 s). */
export const runAnalysis = async (plotId: string, _body: AnalysisRequest = {}): Promise<AnalysisOut> => {
  const analysis = analysisFor(plotId);
  if (analysis.season.status !== 'draft')
    fail(409, 'SEASON_LOCKED', 'La saison est verrouillée : aucun nouveau calcul possible.');
  await delay(2500);
  const version = (analysis.season.prediction_version ?? 0) + 1;
  analysis.season.prediction_version = version;
  analysis.report.version = version;
  analysis.report.created_at = new Date().toISOString();
  return clone(analysis);
};

export const getSeasonReport = async (plotId: string, seasonLabel: string): Promise<ReportOut> => {
  const analysis = analysisFor(plotId);
  if (seasonLabel !== analysis.season.season_label) fail(404, 'NOT_FOUND', 'Aucun bilan pour cette saison.');
  return reply(analysis.report);
};

export const lockSeason = async (plotId: string, seasonLabel: string): Promise<ReportOut> => {
  const analysis = analysisFor(plotId);
  if (seasonLabel !== analysis.season.season_label) fail(404, 'NOT_FOUND', 'Saison introuvable.');
  if (analysis.season.status !== 'draft') fail(409, 'CONFLICT', 'La saison est déjà verrouillée.');
  analysis.season.status = 'locked';
  analysis.report.status = 'locked';
  analysis.report.locked_at = new Date().toISOString();
  return reply(analysis.report, 400);
};

// ---------------------------------------------------------------------------
// Apprentissage et modèles
// ---------------------------------------------------------------------------

export const evaluateSeason = async (plotId: string, seasonLabel: string): Promise<EvaluationOut> => {
  findPlot(plotId);
  const evaluation = fx.learningLoop.evaluation;
  if (seasonLabel !== '2026-A' || !evaluation)
    return fail(409, 'CONFLICT', 'La saison n’est pas terminée : évaluation impossible.');
  return reply({ ...evaluation, plot_id: plotId }, 600);
};

export const getLearningLoop = async (plotId: string): Promise<LearningLoopOut> => {
  findPlot(plotId);
  return reply({ ...fx.learningLoop, plot_id: plotId });
};

export const listModels = (): Promise<ModelVersion[]> => reply(state.models);

export const retrainModel = async (): Promise<ModelVersion> => {
  await delay(3000);
  const active = state.models.find((m) => m.is_active) ?? state.models[0];
  if (!active) return fail(404, 'NOT_FOUND', 'Aucun modèle à réentraîner.');
  const [major = 1, minor = 0] = active.version.split('.').map(Number);
  const next: ModelVersion = {
    ...active,
    version: `${major}.${minor + 1}.0`,
    parent_version: active.version,
    is_active: true,
    trained_until: state.clock.today,
    created_at: new Date().toISOString(),
  };
  state.models = [next, ...state.models.map((m) => ({ ...m, is_active: false }))];
  return clone(next);
};

// ---------------------------------------------------------------------------
// Voix
// ---------------------------------------------------------------------------

const SUGGESTIONS: VoiceAnswerOut['suggestions'] = [
  'Quelle culture planter ?',
  'Va-t-il beaucoup pleuvoir ?',
  'Quand faut-il faire attention ?',
];

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const INTENTS: Array<{ intent: string; keywords: string[]; answer: () => Omit<VoiceAnswerOut, 'intent' | 'suggestions' | 'llm_used'> }> = [
  {
    intent: 'recommend_crop',
    keywords: ['planter', 'culture', 'semer', 'cultiver'],
    answer: () => {
      const r = fx.recommendation2027A;
      const next = r.next_crop ? `, puis ${r.next_crop.name_fr.toLowerCase()} la saison suivante` : '';
      const text = `Culture conseillée : ${r.main_crop.name_fr.toLowerCase()}${next}.`;
      return { answer_text: text, speak_text: text, data_missing: false };
    },
  },
  {
    intent: 'rain_forecast',
    keywords: ['pluie', 'pleuvoir', 'pleut'],
    answer: () => ({
      answer_text: 'Environ 1100 mm de pluie attendus sur la saison 2027-A, surtout en juin.',
      speak_text: 'Environ mille cent millimètres de pluie attendus sur la saison, surtout en juin.',
      data_missing: false,
    }),
  },
  {
    intent: 'critical_periods',
    keywords: ['attention', 'danger', 'risque', 'critique'],
    answer: () => ({
      answer_text: 'Attention en avril (chaleur) et en juin (fortes pluies).',
      speak_text: 'Attention en avril à cause de la chaleur, et en juin à cause des fortes pluies.',
      data_missing: false,
    }),
  },
  {
    intent: 'vegetation',
    keywords: ['vegetation', 'ndvi', 'vert'],
    answer: () => ({
      answer_text: 'L’indice de végétation n’est pas disponible pour le moment.',
      speak_text: 'L’indice de végétation n’est pas disponible pour le moment.',
      data_missing: true,
    }),
  },
];

export const askVoice = async (body: VoiceQuestion): Promise<VoiceAnswerOut> => {
  findPlot(body.plot_id);
  const q = normalize(body.question);
  const match = INTENTS.find((i) => i.keywords.some((k) => q.includes(k)));
  const base = match
    ? { intent: match.intent, ...match.answer() }
    : {
        intent: 'unknown',
        answer_text: 'Je n’ai pas compris. Vous pouvez essayer une des questions proposées.',
        speak_text: 'Je n’ai pas compris. Vous pouvez essayer une des questions proposées.',
        data_missing: false,
      };
  return reply({ ...base, llm_used: false, suggestions: SUGGESTIONS }, 500);
};

/** Réinitialise l'état mock (tests, bouton de démo). */
export const resetMock = () => {
  state.clock = clone(fx.clock);
  state.plots = clone(fx.plots);
  state.analyses = {};
  state.models = clone(fx.models);
  state.nextPlotNumber = 2;
};
