/**
 * Point d'entrée unique des composants vers les données.
 * VITE_USE_MOCK=true → données simulées ; sinon → API Django REST.
 */
import * as mockApi from './mock/mockApi';
import * as realApi from './realApi';

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export type ApiClient = typeof realApi;

export const api: ApiClient = USE_MOCK ? mockApi : realApi;
