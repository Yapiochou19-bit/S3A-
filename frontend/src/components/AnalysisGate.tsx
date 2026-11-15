import { Loader2, Map, ScanLine } from 'lucide-react';
import type { ReactNode } from 'react';
import { usePlot } from '../context/PlotContext';
import { fr } from '../i18n/fr';
import type { AnalysisOut, PlotOut } from '../types/api';
import { Button, ButtonLink } from './Button';
import { EmptyState, ErrorState, LoadingState } from './StateViews';

/**
 * Garde commune aux écrans qui dépendent d'une analyse (Climat, Cultures) :
 * chargement → erreur → pas de parcelle → pas d'analyse → contenu.
 * À placer sous le ScreenHeader ; gère ses propres marges (mx-5).
 */
export function AnalysisGate({ children }: { children: (analysis: AnalysisOut, plot: PlotOut) => ReactNode }) {
  const { activePlot, plotsLoading, plotsError, reloadPlots, analysis, analysisRunning, analysisError, runAnalysis } =
    usePlot();

  if (plotsLoading) return <LoadingState lines={5} className="mx-5" />;
  if (plotsError) return <ErrorState error={plotsError} onRetry={reloadPlots} className="mx-5" />;
  if (!activePlot)
    return (
      <EmptyState title={fr.common.no_plot_title} text={fr.common.no_plot_text} className="mx-5">
        <ButtonLink to="/parcelle" variant="hero" size="lg">
          <Map /> {fr.farm.add_plot}
        </ButtonLink>
      </EmptyState>
    );
  if (!analysis)
    return (
      <div className="mx-5 space-y-3">
        <EmptyState title={fr.common.no_analysis_title} text={fr.common.no_analysis_text}>
          <Button variant="hero" size="lg" disabled={analysisRunning} onClick={() => void runAnalysis()}>
            {analysisRunning ? <Loader2 className="animate-spin" /> : <ScanLine />}
            {analysisRunning ? fr.analyze.running : fr.analyze.button}
          </Button>
          {analysisRunning && (
            <p role="status" className="text-sm text-muted-foreground">
              {fr.analyze.running_hint}
            </p>
          )}
        </EmptyState>
        {analysisError && !analysisRunning && <ErrorState error={analysisError} />}
      </div>
    );
  return <>{children(analysis, activePlot)}</>;
}
