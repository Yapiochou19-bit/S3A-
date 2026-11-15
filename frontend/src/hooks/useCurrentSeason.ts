import { usePlot } from '../context/PlotContext';
import { api } from '../services/api';
import type { CurrentSeasonOut } from '../types/api';
import { useAsync } from './useAsync';

/**
 * Relevés de la saison en cours pour la parcelle active (pluie, chaleur, humidité du sol, alertes).
 * `data` vaut null tant qu'aucune parcelle n'est active.
 */
export function useCurrentSeason() {
  const { activePlot } = usePlot();
  const plotId = activePlot?.plot_id ?? null;
  return useAsync<CurrentSeasonOut | null>(() => (plotId ? api.getCurrentSeason(plotId) : Promise.resolve(null)), [plotId]);
}
