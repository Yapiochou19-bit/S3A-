import {
  ChevronRight,
  CloudSun,
  Home,
  Map,
  Mic,
  MoreHorizontal,
  SlidersHorizontal,
  Sprout,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink } from 'react-router';
import { fr } from '../i18n/fr';
import { cn } from '../lib/cn';
import { PhoneSheet } from './PhoneSheet';

const ITEMS: Array<{ to: string; label: string; icon: LucideIcon; center?: true; more?: true }> = [
  { to: '/', label: fr.nav.home, icon: Home },
  { to: '/parcelle', label: fr.nav.farm, icon: Map },
  { to: '/assistant', label: fr.nav.talk, icon: Mic, center: true },
  { to: '', label: fr.nav.more, icon: MoreHorizontal, more: true },
];

const MORE_ITEMS: Array<{ to: string; label: string; description: string; icon: LucideIcon }> = [
  { to: '/prediction', label: fr.nav.climate, description: fr.nav.climate_desc, icon: CloudSun },
  { to: '/recommandation', label: fr.nav.crops, description: fr.nav.crops_desc, icon: Sprout },
  { to: '/technique', label: fr.nav.technical, description: fr.nav.technical_desc, icon: SlidersHorizontal },
];

/** Navigation principale volontairement courte ; les écrans secondaires restent dans « Plus ». */
export function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav
        aria-label={fr.nav.label}
        className="sticky bottom-0 z-40 mt-auto border-t border-border/70 bg-card/95 px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom),0.5rem)] shadow-nav backdrop-blur-xl"
      >
        <ul className="grid grid-cols-4 items-end">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            if (item.more) {
              return (
                <li key="more" className="min-w-0">
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded={moreOpen}
                    onClick={() => setMoreOpen(true)}
                    className="flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-2xl"
                  >
                    <span className="flex h-8 w-14 items-center justify-center rounded-full text-muted-foreground">
                      <Icon className="size-[22px]" />
                    </span>
                    <span className="max-w-full truncate text-[11px] font-semibold text-muted-foreground">
                      {item.label}
                    </span>
                  </button>
                </li>
              );
            }
            if (item.center) {
              return (
                <li key={item.to} className="flex justify-center">
                  <NavLink to={item.to} className="group -mt-7 flex flex-col items-center gap-1" aria-label={fr.nav.talk_long}>
                    {({ isActive }) => (
                      <>
                        <span
                          className={cn(
                            'relative flex size-16 items-center justify-center rounded-full bg-gradient-leaf text-leaf-foreground shadow-glow ring-4 ring-card transition-transform group-active:scale-95',
                            isActive && 'bg-gradient-forest text-primary-foreground',
                          )}
                        >
                          {!isActive && <span className="absolute inset-0 animate-pulse-ring rounded-full bg-leaf/50" />}
                          <Icon className="relative size-7" strokeWidth={2.2} />
                        </span>
                        <span className={cn('text-[11px] font-semibold', isActive ? 'text-primary' : 'text-muted-foreground')}>
                          {item.label}
                        </span>
                      </>
                    )}
                  </NavLink>
                </li>
              );
            }
            return (
              <li key={item.to} className="min-w-0">
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl"
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          'flex h-8 w-14 items-center justify-center rounded-full transition-colors',
                          isActive ? 'bg-leaf-soft text-primary' : 'text-muted-foreground',
                        )}
                      >
                        <Icon className="size-[22px]" strokeWidth={isActive ? 2.4 : 2} />
                      </span>
                      <span
                        className={cn(
                          'max-w-full truncate text-[11px] font-semibold',
                          isActive ? 'text-primary' : 'text-muted-foreground',
                        )}
                      >
                        {item.label}
                      </span>
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <PhoneSheet open={moreOpen} onClose={() => setMoreOpen(false)} title={fr.nav.more_title}>
        <p className="px-5 pb-3 text-sm text-muted-foreground">{fr.nav.more_hint}</p>
        <ul className="space-y-2 overflow-y-auto px-5 pb-6">
          {MORE_ITEMS.map(({ to, label, description, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={() => setMoreOpen(false)}
                className="flex min-h-16 items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-soft transition active:scale-[0.98]"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-leaf-soft text-primary">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{label}</span>
                  <span className="block text-sm text-muted-foreground">{description}</span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
              </NavLink>
            </li>
          ))}
        </ul>
      </PhoneSheet>
    </>
  );
}
