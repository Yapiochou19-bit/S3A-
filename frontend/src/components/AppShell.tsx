import { Mic, Satellite, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { Toaster } from 'sonner';
import { fr } from '../i18n/fr';
import { USE_MOCK } from '../services/api';
import { BottomNav } from './BottomNav';
import { Logo } from './Logo';

const SCREENS = [
  { to: '/', label: fr.nav.home, desc: fr.nav.home_desc },
  { to: '/parcelle', label: fr.nav.farm, desc: fr.nav.farm_desc },
  { to: '/prediction', label: fr.nav.climate, desc: fr.nav.climate_desc },
  { to: '/recommandation', label: fr.nav.crops, desc: fr.nav.crops_desc },
  { to: '/assistant', label: fr.nav.talk_long, desc: fr.nav.talk_desc },
  { to: '/technique', label: fr.nav.technical, desc: fr.nav.technical_desc },
] as const;

const CHIP_ICONS = [Satellite, Users, Mic];

function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

/**
 * Coque de l'application.
 * - Téléphone : plein écran, le contenu défile dans la zone centrale, onglets collés en bas.
 * - Écran large : cadre de téléphone centré + panneau de présentation à gauche.
 * Les panneaux (PhoneSheet) se positionnent dans le cadre, qui est l'ancêtre `relative`.
 */
export function AppShell() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const online = useOnline();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="min-h-dvh lg:flex lg:items-center lg:justify-center lg:gap-16 lg:p-8">
      <aside className="hidden max-w-sm lg:block">
        <Logo />
        <p className="mt-8 text-xs font-bold tracking-[0.18em] text-primary uppercase">{fr.app.concept_eyebrow}</p>
        <p className="mt-3 font-display text-4xl leading-[1.05] font-bold tracking-tight text-foreground">
          {fr.app.concept_title}
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{fr.app.concept_text}</p>
        <ul className="mt-8 space-y-2">
          {SCREENS.map((s, i) => (
            <li key={s.to}>
              <NavLink
                to={s.to}
                end={s.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-4 rounded-2xl border p-3 transition-colors ${
                    isActive ? 'border-border bg-card shadow-soft' : 'border-transparent hover:bg-card/70'
                  }`
                }
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-secondary font-display text-sm font-bold text-secondary-foreground">
                  {i + 1}
                </span>
                <span>
                  <span className="block font-semibold text-foreground">{s.label}</span>
                  <span className="block text-sm text-muted-foreground">{s.desc}</span>
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
          {fr.app.concept_chips.map((chip, i) => {
            const Icon = CHIP_ICONS[i] ?? Satellite;
            return (
              <span key={chip} className="inline-flex items-center gap-1.5 rounded-full bg-card/70 px-3 py-1.5">
                <Icon className="size-3.5" /> {chip}
              </span>
            );
          })}
        </div>
      </aside>

      <div className="relative mx-auto w-full overflow-hidden lg:mx-0 lg:w-[392px] lg:shrink-0 lg:rounded-[3rem] lg:bg-forest-deep lg:p-3 lg:shadow-lift">
        <div
          ref={scrollRef}
          id="contenu"
          className="no-scrollbar flex h-dvh flex-col overflow-x-hidden overflow-y-auto bg-background lg:h-[820px] lg:rounded-[2.4rem]"
        >
          {!online && (
            <p role="status" className="bg-destructive px-4 py-1.5 text-center text-xs font-semibold text-destructive-foreground">
              {fr.app.offline_banner}
            </p>
          )}
          {USE_MOCK && (
            <p className="bg-sun-soft px-4 py-1 text-center text-[11px] font-semibold text-sun-foreground">
              {fr.app.mock_banner}
            </p>
          )}
          <Outlet />
          <BottomNav />
        </div>
      </div>

      <Toaster
        position="top-center"
        offset={20}
        toastOptions={{
          classNames: {
            toast:
              '!rounded-2xl !border-border !bg-card !text-foreground !shadow-card !font-sans !text-[15px] !gap-3 !p-4',
            title: '!font-semibold',
            description: '!text-muted-foreground',
            icon: '!text-primary',
          },
        }}
      />
    </div>
  );
}
