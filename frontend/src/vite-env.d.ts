/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "true" active les données simulées. */
  readonly VITE_USE_MOCK?: string;
  /** Racine de l'API Django REST, ex. https://api.exemple.org/api/v1 */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
