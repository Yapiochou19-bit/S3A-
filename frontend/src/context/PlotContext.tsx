import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../services/api';
import { toApiError, type ApiError } from '../services/errors';
import type { AnalysisOut, PlotOut, ReportOut } from '../types/api';

const STORAGE_KEY = 's3a.active_plot_id';

const readStoredId = (): string | null => {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const storeId = (id: string | null) => {
  try {
    if (id) window.localStorage.setItem(STORAGE_KEY, id);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // stockage indisponible (navigation privée) : la sélection reste en mémoire
  }
};

interface PlotContextValue {
  plots: PlotOut[];
  plotsLoading: boolean;
  plotsError: ApiError | null;
  reloadPlots: () => void;
  activePlot: PlotOut | null;
  selectPlot: (plotId: string) => void;
  addPlot: (plot: PlotOut) => void;
  /** Dernière analyse de la parcelle active (en mémoire). */
  analysis: AnalysisOut | null;
  analysisRunning: boolean;
  analysisError: ApiError | null;
  runAnalysis: () => Promise<AnalysisOut | null>;
  applyLockedReport: (report: ReportOut) => void;
}

const PlotContext = createContext<PlotContextValue | null>(null);

export function PlotProvider({ children }: { children: ReactNode }) {
  const [plots, setPlots] = useState<PlotOut[]>([]);
  const [plotsLoading, setPlotsLoading] = useState(true);
  const [plotsError, setPlotsError] = useState<ApiError | null>(null);
  const [activePlotId, setActivePlotId] = useState<string | null>(readStoredId);
  const [analyses, setAnalyses] = useState<Record<string, AnalysisOut>>({});
  const [runningPlotId, setRunningPlotId] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<ApiError | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setPlotsLoading(true);
    setPlotsError(null);
    api
      .listPlots()
      .then((list) => {
        if (cancelled) return;
        setPlots(list);
        // Parcelle mémorisée absente de la liste → on prend la première.
        setActivePlotId((current) => (list.some((p) => p.plot_id === current) ? current : (list[0]?.plot_id ?? null)));
      })
      .catch((e: unknown) => {
        if (!cancelled) setPlotsError(toApiError(e));
      })
      .finally(() => {
        if (!cancelled) setPlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  useEffect(() => {
    if (!plotsLoading && !plotsError) storeId(activePlotId);
  }, [activePlotId, plotsLoading, plotsError]);

  const reloadPlots = useCallback(() => setAttempt((n) => n + 1), []);

  const selectPlot = useCallback((plotId: string) => {
    setActivePlotId(plotId);
    setAnalysisError(null);
  }, []);

  const addPlot = useCallback((plot: PlotOut) => {
    setPlots((list) => [...list, plot]);
    setActivePlotId(plot.plot_id);
    setAnalysisError(null);
  }, []);

  const runAnalysis = useCallback(async (): Promise<AnalysisOut | null> => {
    if (!activePlotId || runningPlotId) return null;
    const plotId = activePlotId;
    setRunningPlotId(plotId);
    setAnalysisError(null);
    try {
      const result = await api.runAnalysis(plotId);
      setAnalyses((all) => ({ ...all, [plotId]: result }));
      return result;
    } catch (e) {
      setAnalysisError(toApiError(e));
      return null;
    } finally {
      setRunningPlotId(null);
    }
  }, [activePlotId, runningPlotId]);

  const applyLockedReport = useCallback((report: ReportOut) => {
    setAnalyses((all) => {
      const current = all[report.plot_id];
      if (!current) return all;
      return {
        ...all,
        [report.plot_id]: { ...current, report, season: { ...current.season, status: report.status } },
      };
    });
  }, []);

  const value = useMemo<PlotContextValue>(() => {
    const activePlot = plots.find((p) => p.plot_id === activePlotId) ?? null;
    return {
      plots,
      plotsLoading,
      plotsError,
      reloadPlots,
      activePlot,
      selectPlot,
      addPlot,
      analysis: activePlot ? (analyses[activePlot.plot_id] ?? null) : null,
      analysisRunning: runningPlotId !== null,
      analysisError,
      runAnalysis,
      applyLockedReport,
    };
  }, [
    plots,
    plotsLoading,
    plotsError,
    reloadPlots,
    activePlotId,
    selectPlot,
    addPlot,
    analyses,
    runningPlotId,
    analysisError,
    runAnalysis,
    applyLockedReport,
  ]);

  return <PlotContext.Provider value={value}>{children}</PlotContext.Provider>;
}

export function usePlot(): PlotContextValue {
  const ctx = useContext(PlotContext);
  if (!ctx) throw new Error('usePlot doit être utilisé dans <PlotProvider>.');
  return ctx;
}
