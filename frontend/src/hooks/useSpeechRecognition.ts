import { useCallback, useEffect, useRef, useState } from 'react';

/** Sous-ensemble de l'API Web Speech utilisé ici (absente des types DOM standards). */
interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  abort(): void;
}
type RecognitionConstructor = new () => Recognition;

const getConstructor = (): RecognitionConstructor | null => {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

/** Dictée vocale en français. `supported` vaut false sur Firefox : afficher la saisie texte. */
export function useSpeechRecognition(onTranscript: (text: string) => void) {
  const supported = getConstructor() !== null;
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<Recognition | null>(null);
  const callbackRef = useRef(onTranscript);
  callbackRef.current = onTranscript;

  const stop = useCallback(() => {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getConstructor();
    if (!Ctor) return;
    recognitionRef.current?.abort();
    const recognition = new Ctor();
    recognition.lang = 'fr-FR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      if (transcript) callbackRef.current(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    try {
      recognition.start();
    } catch {
      setListening(false);
    }
  }, []);

  useEffect(() => stop, [stop]);

  return { supported, listening, start, stop };
}
