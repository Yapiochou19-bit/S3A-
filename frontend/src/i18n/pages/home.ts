/** Chaînes de l'écran « Accueil » (route /). */
export const home = {
  greeting: 'Bonjour',
  greeting_name: (firstName: string) => `Bonjour, ${firstName}`,

  // Carte météo : ce sont des relevés, pas des prévisions.
  weather_title: 'Relevés météo',
  degrees: (value: string) => `${value}°`,
  temp_caption: (day: string) => `Température maximale · relevé du ${day}`,
  rain_7d: 'Pluie sur 7 jours',
  soil_moisture: 'Humidité du sol',
  soil_trend: 'Sol sur 7 jours',
  trend_up: 'En hausse',
  trend_down: 'En baisse',
  trend_stable: 'Stable',
  last_days: 'Les 7 derniers jours',
  day_rain: 'pluie',
  day_dry: 'pas de pluie',
  day_label: (day: string, weather: string, temp: string) => `${day} : ${weather}, ${temp}`,

  // Parcelle active
  active_plot: 'Ma parcelle active',
  change_plot: 'Changer',
  plot_photo: (name: string) => `Vue de la parcelle ${name}`,
  no_crop: 'Aucune culture',
  crop_area: (crop: string, area: string) => `${crop} · ${area}`,
  soil_line: (soil: string, coords: string) => `Sol : ${soil} · ${coords}`,
  todo: 'À faire :',
  todo_analyze: 'lancez une analyse pour choisir une culture.',
  todo_nothing: 'rien de particulier pour le moment.',

  // Décision verrouillée
  locked_title: 'Décision verrouillée',
  locked_text: (season: string) => `Le choix de la saison ${season} est fixé. Il ne sera plus recalculé.`,
  locked_link: 'Voir ma décision',

  // Alerte
  alert_sub: (month: string) => `${month} · voir quoi faire`,

  // Cultures conseillées
  crops_title: 'Cultures conseillées',
  crops_empty: 'Lancez l’analyse pour voir les cultures conseillées pour votre parcelle.',
  crops_none: 'Aucune culture conseillée pour cette parcelle.',
} as const;
