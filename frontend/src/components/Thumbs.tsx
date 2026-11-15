import { Sprout } from 'lucide-react';
import { cn } from '../lib/cn';
import { cropImage, plotImage, SOIL_SWATCH } from '../lib/visuals';
import type { PlotOut } from '../types/api';

/** Vignette de repli : nuancier + sillons + pousse (quand aucune photo n'existe). */
function Fallback({ swatch, className }: { swatch: string; className?: string }) {
  return (
    <div className={cn('relative flex items-center justify-center overflow-hidden', swatch, className)} aria-hidden="true">
      <div className="absolute inset-0 opacity-30 [background:repeating-linear-gradient(90deg,var(--forest-deep)_0_2px,transparent_2px_18px)]" />
      <Sprout className="relative size-10 text-primary-foreground drop-shadow" />
    </div>
  );
}

/** Image d'une parcelle (illustration selon la dernière culture), sinon repli à la couleur du sol. */
export function PlotThumb({ plot, alt, className }: { plot: PlotOut; alt: string; className?: string }) {
  const src = plotImage(plot);
  if (!src) return <Fallback swatch={SOIL_SWATCH[plot.soil_texture]} className={className} />;
  return <img src={src} alt={alt} loading="lazy" width={1024} height={768} className={cn('object-cover', className)} />;
}

/** Photo d'une culture par code, sinon repli vert. */
export function CropThumb({ cropCode, alt, className }: { cropCode: string; alt: string; className?: string }) {
  const src = cropImage(cropCode);
  if (!src) return <Fallback swatch="bg-gradient-leaf" className={className} />;
  return <img src={src} alt={alt} loading="lazy" width={816} height={816} className={cn('object-cover', className)} />;
}
