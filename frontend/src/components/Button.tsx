import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router';
import { cn } from '../lib/cn';

const BASE =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold select-none transition-all duration-200 ' +
  'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0';

const VARIANTS = {
  default: 'bg-primary text-primary-foreground shadow-soft hover:bg-forest-deep',
  hero: 'bg-gradient-forest text-primary-foreground shadow-lift hover:brightness-110',
  leaf: 'bg-gradient-leaf text-leaf-foreground shadow-glow hover:brightness-105',
  soft: 'bg-secondary text-secondary-foreground hover:bg-accent',
  outline: 'border-2 border-border bg-card text-foreground hover:border-leaf hover:bg-leaf-soft/40',
  ghost: 'text-foreground hover:bg-muted',
  glass: 'bg-primary-foreground/15 text-primary-foreground backdrop-blur-md hover:bg-primary-foreground/25',
  destructive: 'bg-destructive text-destructive-foreground hover:brightness-110',
} as const;

/** Toutes les tailles font au moins 48 px de haut (cible tactile). */
const SIZES = {
  default: 'h-12 rounded-2xl px-5 text-[15px] [&_svg]:size-5',
  lg: 'h-14 rounded-2xl px-6 text-base [&_svg]:size-5',
  xl: 'h-16 rounded-3xl px-6 text-lg [&_svg]:size-6',
  icon: 'size-12 rounded-2xl [&_svg]:size-5',
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

interface StyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const buttonClasses = ({ variant = 'default', size = 'default' }: StyleProps = {}, className?: string) =>
  cn(BASE, VARIANTS[variant], SIZES[size], className);

export function Button({
  variant,
  size,
  className,
  type = 'button',
  ...rest
}: StyleProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={buttonClasses({ variant, size }, className)} {...rest} />;
}

/** Même apparence qu'un bouton, mais navigue vers une route. */
export function ButtonLink({ variant, size, className, ...rest }: StyleProps & LinkProps) {
  return <Link className={buttonClasses({ variant, size }, className)} {...rest} />;
}
