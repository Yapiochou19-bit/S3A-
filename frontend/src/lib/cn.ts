import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Assemble des classes Tailwind ; la dernière gagne en cas de conflit (ex. `h-16` puis `h-20`). */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
