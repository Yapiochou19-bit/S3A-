/** Chaînes de l'écran « Climat » (route /prediction). */
export const climate = {
  // Carte « Fiabilité des prévisions »
  reliability: 'Fiabilité des prévisions',
  reliability_levels: { high: 'Élevée', medium: 'Moyenne', limited: 'Limitée' },
  reliability_value: (level: string, reliable: number, total: number) =>
    `${level} · ${reliable} mesure${reliable > 1 ? 's' : ''} sur ${total}`,
  sources_toggle: 'D’où viennent ces données ?',
  sources_text: (modelVersion: string, origin: string) =>
    `Les données viennent de NASA POWER (réanalyse MERRA-2). L’humidité du sol est un indice estimé, pas une mesure directe. ` +
    `Chaque prévision est comparée à la moyenne des années passées. Modèle ${modelVersion}, calculé avec les données jusqu’au ${origin}.`,
  sources_list: 'Détail par mesure',
  source_gain: (value: string, positive: boolean) => `${positive ? '+' : ''}${value} % par rapport à la moyenne`,
  source_climatology: 'basé sur la moyenne des années passées',

  // Sélecteur de mesures
  metrics_label: 'Choisir une mesure',
  metrics: {
    rain: { tab: 'Pluie', label: 'Pluie', unit: 'mm' },
    heat: { tab: 'Chaleur', label: 'Chaleur', unit: '°C' },
    soil: { tab: 'Sol', label: 'Humidité du sol', unit: '%' },
  },
  chart_title: (label: string, months: number) => `${label} · ${months} mois`,
  chart_alt: (label: string) => `${label} prévue mois par mois`,
  chart_caption: (unit: string) => `en ${unit} · trait fin = fourchette possible`,
  listen: 'Écouter l’explication',
  stop: 'Arrêter la lecture',

  // Encart « En clair »
  in_short: 'En clair : ',
  no_data: 'Les données de cette mesure ne sont pas disponibles.',
  rain_both: (wetMonth: string, wetValue: string, dryMonth: string, dryValue: string) =>
    `Le mois le plus pluvieux sera ${wetMonth} (${wetValue}). Le mois le plus sec sera ${dryMonth} (${dryValue}).`,
  rain_single: (month: string, value: string) => `Il est prévu ${value} de pluie en ${month}.`,
  heat_hottest: (month: string, value: string) => `Le mois le plus chaud sera ${month} (${value} l’après-midi).`,
  heat_days: (count: number, text: string) =>
    count === 0
      ? 'Aucun jour au-dessus de 35 °C n’est prévu sur la saison.'
      : `Environ ${text} jour${count > 1 ? 's' : ''} au-dessus de 35 °C sur la saison.`,
  heat_days_missing: 'Le nombre de jours au-dessus de 35 °C n’est pas disponible.',
  soil_both: (dryMonth: string, dryValue: string, wetMonth: string, wetValue: string) =>
    `Le sol sera le plus sec en ${dryMonth} (${dryValue}) et le plus humide en ${wetMonth} (${wetValue}).`,
  soil_single: (month: string, value: string) => `L’humidité du sol sera de ${value} en ${month}.`,

  // Périodes importantes
  periods: 'Périodes importantes',
  no_periods: 'Aucun mois prévu pour cette saison.',
  calm_month: 'Rien à signaler',

  // Alertes
  alerts: 'Alertes',
  no_alerts_title: 'Aucune période difficile prévue',
  no_alerts_text: 'Les prévisions ne montrent pas de mois à risque pour cette saison.',

  // À savoir
  notes: 'À savoir',

  next: 'Voir les cultures adaptées',
} as const;
