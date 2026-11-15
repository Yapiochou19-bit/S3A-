import type { ReactNode } from 'react';

interface ScreenHeaderProps {
  /** Petite ligne au-dessus du titre (ex. « Parcelle Anyama · Anyama »). */
  eyebrow?: ReactNode;
  title: ReactNode;
  /** Bouton d'action à droite. */
  action?: ReactNode;
}

/** En-tête collant d'un écran. */
export function ScreenHeader({ eyebrow, title, action }: ScreenHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-end justify-between gap-3 bg-background/90 px-5 pt-6 pb-3 backdrop-blur-xl">
      <div className="min-w-0">
        {eyebrow && <p className="truncate text-[13px] font-semibold text-muted-foreground">{eyebrow}</p>}
        <h1 className="font-display text-[28px] leading-tight font-bold text-foreground">{title}</h1>
      </div>
      {action}
    </header>
  );
}
