/**
 * Dictionnaire français : TOUTES les chaînes affichées par l'interface.
 * - Ce fichier : chaînes partagées (coque, navigation, états, unités…).
 * - ./pages/*.ts : chaînes propres à chaque écran.
 * Les textes venant de l'API (messages, raisons, bilan) ne sont pas ici.
 */
import { assistant } from './pages/assistant';
import { climate } from './pages/climate';
import { crops } from './pages/crops';
import { farm } from './pages/farm';
import { home } from './pages/home';
import { technical } from './pages/technical';

export const fr = {
  app: {
    name: 'S3A',
    subtitle: 'Assistant agricole',
    mock_banner: 'Mode démonstration : données simulées',
    offline_banner: 'Hors ligne : vérifiez votre connexion',
    skip_to_content: 'Aller au contenu',
    // Panneau de présentation (écran large uniquement)
    concept_eyebrow: 'NASA Space Apps Challenge · Abidjan 2026',
    concept_title: 'L’agriculture intelligente, dans la poche de chaque producteur.',
    concept_text:
      'S3A transforme les données satellites et climatiques en conseils simples, en français, pour les petits producteurs de Côte d’Ivoire et d’Afrique.',
    concept_chips: ['Données NASA POWER', 'Pensé pour les producteurs', 'Conseils parlés en français'],
  },
  nav: {
    label: 'Navigation principale',
    home: 'Accueil',
    home_desc: 'Tableau de bord du producteur',
    farm: 'Ma ferme',
    farm_desc: 'Parcelles et ajout guidé',
    talk: 'Parler',
    talk_long: 'Demander conseil',
    talk_desc: 'Appuyez sur « Parler » et posez votre question.',
    more: 'Plus',
    more_title: 'Autres rubriques',
    more_hint: 'Choisissez ce que vous voulez consulter.',
    climate: 'Climat',
    climate_desc: 'Pluie, chaleur, humidité du sol',
    crops: 'Cultures',
    crops_desc: 'Recommandations expliquées',
    technical: 'Espace technique',
    technical_desc: 'Modèles, système, apprentissage',
  },
  common: {
    loading: 'Chargement…',
    retry: 'Réessayer',
    not_available: 'Non disponible',
    error_title: 'Un problème est survenu',
    cancel: 'Annuler',
    close: 'Fermer',
    back: 'Retour',
    continue: 'Continuer',
    see_all: 'Tout voir',
    listen: 'Écouter',
    stop: 'Arrêter',
    speech_unavailable: 'La lecture vocale n’est pas disponible sur ce téléphone.',
    season: (label: string) => `Saison ${label}`,
    from_to: (start: string, end: string) => `Du ${start} au ${end}`,
    range: (low: string, high: string) => `entre ${low} et ${high}`,
    score: (n: string) => `Note ${n} sur 100`,
    no_plot_title: 'Votre champ n’est pas encore enregistré',
    no_plot_text: 'Ajoutez votre champ pour recevoir des conseils adaptés à votre région.',
    go_to_farm: 'Aller à Ma ferme',
    no_analysis_title: 'Pas encore d’analyse',
    no_analysis_text: 'Lancez l’analyse pour voir les résultats de votre parcelle.',
    locked: 'Verrouillée',
    draft: 'Modifiable',
    closed: 'Terminée',
  },
  quality: {
    observed: 'Mesuré',
    estimated: 'Estimé',
    needs_local_validation: 'À vérifier sur place',
    missing: 'Non disponible',
  },
  units: {
    mm: 'mm',
    celsius: '°C',
    days: 'j',
    ha: 'ha',
    pct: '%',
  },
  errors: {
    network: 'Impossible de joindre le serveur. Vérifiez votre connexion.',
    timeout: 'Le serveur met trop de temps à répondre. Réessayez dans un instant.',
    unknown: 'Erreur inattendue. Réessayez.',
  },
  analyze: {
    button: 'Obtenir mes conseils',
    subtitle: 'Appuyez ici pour préparer les conseils de votre champ',
    again: 'Actualiser mes conseils',
    running: 'Analyse en cours…',
    running_hint: 'Nous préparons les conseils. Cela peut prendre une minute.',
    steps: ['Regarder la météo de votre région', 'Repérer les périodes à surveiller', 'Chercher les cultures adaptées'],
    hide: 'Continuer à naviguer',
    done: 'Analyse terminée',
    done_text: (plot: string, alerts: number, crops: number) =>
      `${plot} : ${alerts} période${alerts > 1 ? 's' : ''} à surveiller, ${crops} culture${crops > 1 ? 's' : ''} conseillée${crops > 1 ? 's' : ''}.`,
  },
  soil: {
    sandy: 'Sableux',
    loamy: 'Limoneux',
    clay: 'Argileux',
    sandy_loam: 'Sablo-limoneux',
    clay_loam: 'Argilo-limoneux',
    unknown: 'Je ne sais pas',
  },
  soil_hints: {
    sandy: 'Clair, coule entre les doigts',
    loamy: 'Doux, sombre, se tient un peu',
    clay: 'Collant, lourd quand il pleut',
    sandy_loam: 'Granuleux mais se tient',
    clay_loam: 'Ferme, se fend quand il sèche',
    unknown: 'On fera sans pour l’instant',
  },
  /** Niveau d'adaptation d'une culture, d'après sa note sur 100. */
  suitability: {
    very: 'Très adaptée',
    good: 'Adaptée',
    possible: 'Possible',
  },
  plot_status: {
    ok: 'Rien à signaler',
    watch: 'À surveiller',
    unknown: 'Pas encore de relevé',
  },
  critical: {
    kind: {
      water_stress: 'Manque d’eau',
      erosion: 'Risque d’érosion',
      heat_stress: 'Forte chaleur',
      heavy_rain: 'Fortes pluies',
    },
    severity: { moderate: 'Risque modéré', high: 'Risque élevé' },
  },
  targets: {
    precip_mm: 'Pluie',
    t2m_max_c: 'Température maximale',
    sm_root: 'Humidité du sol',
  } as Record<string, string>,
  not_found: {
    title: 'Page introuvable',
    text: 'Cette page n’existe pas ou a été déplacée.',
    back: 'Retour à l’accueil',
  },
  home,
  farm,
  climate,
  crops,
  assistant,
  technical,
} as const;
