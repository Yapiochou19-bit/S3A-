/**
 * Client de l'API Django REST.
 *
 * ATTENTION : les chemins ci-dessous sont PROVISOIRES. Ils doivent être alignés
 * sur contracts/openapi.json dès que Dev3 le publie (seul ce fichier change).
 */
import type {
  AnalysisOut,
  AnalysisRequest,
  ClockOut,
  ClockSet,
  CropSheet,
  CurrentSeasonOut,
  EvaluationOut,
  HealthOut,
  LearningLoopOut,
  ModelVersion,
  PlotCreate,
  PlotOut,
  ReportOut,
  VoiceAnswerOut,
  VoiceQuestion,
} from '../types/api';
import { request } from './http';

const ANALYSIS_TIMEOUT_MS = 90_000;
const seg = encodeURIComponent;

// Système
export const getHealth = () => request<HealthOut>('GET', '/health');
export const getClock = () => request<ClockOut>('GET', '/system/clock');
export const setClock = (body: ClockSet) => request<ClockOut>('PUT', '/system/clock', { body });

// Cultures et parcelles
export const getCrops = () => request<CropSheet[]>('GET', '/crops');
export const listPlots = () => request<PlotOut[]>('GET', '/plots');
export const getPlot = (plotId: string) => request<PlotOut>('GET', `/plots/${seg(plotId)}`);
export const createPlot = (body: PlotCreate) => request<PlotOut>('POST', '/plots', { body });

// Saisons, analyse, bilan
export const getCurrentSeason = (plotId: string) =>
  request<CurrentSeasonOut>('GET', `/plots/${seg(plotId)}/seasons/current`);

export const runAnalysis = (plotId: string, body: AnalysisRequest = {}) =>
  request<AnalysisOut>('POST', `/plots/${seg(plotId)}/analysis`, { body, timeoutMs: ANALYSIS_TIMEOUT_MS });

export const getSeasonReport = (plotId: string, seasonLabel: string) =>
  request<ReportOut>('GET', `/plots/${seg(plotId)}/seasons/${seg(seasonLabel)}/report`);

export const lockSeason = (plotId: string, seasonLabel: string) =>
  request<ReportOut>('POST', `/plots/${seg(plotId)}/seasons/${seg(seasonLabel)}/lock`);

// Apprentissage et modèles
export const evaluateSeason = (plotId: string, seasonLabel: string) =>
  request<EvaluationOut>('POST', `/plots/${seg(plotId)}/seasons/${seg(seasonLabel)}/evaluate`);

export const getLearningLoop = (plotId: string) =>
  request<LearningLoopOut>('GET', `/plots/${seg(plotId)}/learning-loop`);

export const listModels = () => request<ModelVersion[]>('GET', '/models');

export const retrainModel = () => request<ModelVersion>('POST', '/models/retrain', { timeoutMs: ANALYSIS_TIMEOUT_MS });

// Voix
export const askVoice = (body: VoiceQuestion) => request<VoiceAnswerOut>('POST', '/voice/ask', { body });
