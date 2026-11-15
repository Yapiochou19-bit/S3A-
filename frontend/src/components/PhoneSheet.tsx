import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { fr } from '../i18n/fr';
import { cn } from '../lib/cn';

interface PhoneSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

/** Panneau qui monte du bas et reste dans le cadre du téléphone (ancêtre `relative` de AppShell). */
export function PhoneSheet({ open, onClose, title, children, className }: PhoneSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="absolute inset-0 z-50 flex items-end lg:inset-3 lg:overflow-hidden lg:rounded-[2.4rem]">
      <button
        type="button"
        aria-label={fr.common.close}
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-overlay backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative flex max-h-[92%] w-full animate-sheet-up flex-col rounded-t-[2rem] bg-background shadow-lift',
          className,
        )}
      >
        <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-border" />
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <h2 className="font-display text-xl font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-12 items-center justify-center rounded-full bg-muted transition active:scale-95"
            aria-label={fr.common.close}
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
