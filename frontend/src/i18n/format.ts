import { fr } from './fr';

const LOCALE = 'fr-FR';

/** null ou undefined → « Non disponible » (jamais de valeur inventée). */
export const formatNumber = (value: number | null | undefined, digits = 0): string =>
  value === null || value === undefined || Number.isNaN(value)
    ? fr.common.not_available
    : new Intl.NumberFormat(LOCALE, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);

export const formatWithUnit = (value: number | null | undefined, unit: string, digits = 0): string =>
  value === null || value === undefined ? fr.common.not_available : `${formatNumber(value, digits)} ${unit}`;

const parseIsoDate = (iso: string): Date | null => {
  const d = new Date(iso.length === 7 ? `${iso}-01T00:00:00Z` : iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

const format = (iso: string | null | undefined, options: Intl.DateTimeFormatOptions): string => {
  const d = iso ? parseIsoDate(iso) : null;
  return d ? new Intl.DateTimeFormat(LOCALE, { timeZone: 'UTC', ...options }).format(d) : fr.common.not_available;
};

/** "2027-03-01" → "1 mars 2027" */
export const formatDate = (iso: string | null | undefined) =>
  format(iso, { day: 'numeric', month: 'long', year: 'numeric' });

/** "2026-11-15" → "dimanche 15 novembre" */
export const formatLongDay = (iso: string | null | undefined) =>
  format(iso, { weekday: 'long', day: 'numeric', month: 'long' });

/** "2026-11-15" → "15 nov" */
export const formatShortDay = (iso: string | null | undefined) =>
  format(iso, { day: 'numeric', month: 'short' }).replace('.', '');

/** "2026-11-15" → "dim" */
export const formatWeekday = (iso: string | null | undefined) => format(iso, { weekday: 'short' }).replace('.', '');

/** (5.49, -4.05) → "5,49° N · 4,05° O" */
export const formatCoords = (latitude: number, longitude: number): string =>
  `${formatNumber(Math.abs(latitude), 2)}° ${latitude >= 0 ? 'N' : 'S'} · ${formatNumber(Math.abs(longitude), 2)}° ${longitude >= 0 ? 'E' : 'O'}`;

/** "awa koné" → "AK" (initiales pour l'avatar ; aucune photo de personne dans l'application). */
export const initials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

/** "2027-03" → "mars" */
export const formatMonth = (period: string) => format(period, { month: 'short' }).replace('.', '');

/** "2027-03" → "mars 2027" */
export const formatMonthYear = (period: string) => format(period, { month: 'long', year: 'numeric' });
