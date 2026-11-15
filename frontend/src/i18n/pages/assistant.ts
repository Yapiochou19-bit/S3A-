/** Chaînes de l'écran « Parler » (route /assistant). */
export const assistant = {
  thread_label: 'Conversation avec l’assistant',
  assistant_name: 'Assistant S3A',
  you: 'Vous',
  welcome: (plot: string) =>
    `Bonjour ! Posez-moi une question sur votre parcelle « ${plot} ». Vous pouvez parler ou écrire.`,
  starters: ['Que dois-je planter ?', 'Va-t-il pleuvoir cette saison ?', 'Quels sont les risques pour ma parcelle ?'],
  suggestions_label: 'Questions proposées',
  data_missing: 'Donnée manquante',
  repeat: 'Répéter',
  thinking: 'L’assistant prépare sa réponse…',
  input_label: 'Votre question',
  input_placeholder: 'Écrivez votre question…',
  send: 'Envoyer la question',
  mic_start: 'Parler à l’assistant',
  mic_stop: 'Arrêter l’écoute',
  mic_hint: 'Appuyez pour parler',
  listening: 'Je vous écoute…',
  no_mic: 'Le micro n’est pas disponible sur ce navigateur. Écrivez votre question ci-dessous.',
} as const;
