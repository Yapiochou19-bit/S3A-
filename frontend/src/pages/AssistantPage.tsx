import { Map, Mic, Send, Sprout, Square, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { ButtonLink } from '../components/Button';
import { ScreenHeader } from '../components/ScreenHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { usePlot } from '../context/PlotContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { fr } from '../i18n/fr';
import { cn } from '../lib/cn';
import { api } from '../services/api';
import { toApiError, type ApiError } from '../services/errors';
import type { PlotOut, VoiceAnswerOut } from '../types/api';

const t = fr.assistant;

interface Exchange {
  id: number;
  question: string;
  /** null tant que la réponse n'est pas arrivée (ou en cas d'erreur). */
  answer: VoiceAnswerOut | null;
}

const WAVE_DELAYS = ['0ms', '120ms', '240ms', '360ms', '480ms'];
const DOT_DELAYS = ['0ms', '160ms', '320ms'];

function AssistantAvatar() {
  return (
    <span
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-leaf text-leaf-foreground shadow-soft"
      aria-hidden="true"
    >
      <Sprout className="size-5" />
    </span>
  );
}

function Conversation({ plot }: { plot: PlotOut }) {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [draft, setDraft] = useState('');
  const mainRef = useRef<HTMLElement>(null);
  const nextId = useRef(1);
  const pendingRef = useRef(false);
  const mounted = useRef(true);
  const synthesis = useSpeechSynthesis();

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const request = async (id: number, question: string) => {
    pendingRef.current = true;
    setPending(true);
    setError(null);
    try {
      const answer = await api.askVoice({ plot_id: plot.plot_id, question });
      if (!mounted.current) return;
      setExchanges((list) => list.map((x) => (x.id === id ? { ...x, answer } : x)));
      if (synthesis.supported) synthesis.speak(answer.speak_text);
    } catch (e) {
      if (mounted.current) setError(toApiError(e));
    } finally {
      pendingRef.current = false;
      if (mounted.current) setPending(false);
    }
  };

  const ask = (raw: string) => {
    const question = raw.trim();
    if (!question || pendingRef.current) return;
    synthesis.cancel();
    const id = nextId.current++;
    // Une question restée sans réponse (erreur) est remplacée par la nouvelle.
    setExchanges((list) => [...list.filter((x) => x.answer !== null), { id, question, answer: null }]);
    setDraft('');
    void request(id, question);
  };

  const retry = () => {
    const last = exchanges[exchanges.length - 1];
    if (last && last.answer === null && !pendingRef.current) void request(last.id, last.question);
  };

  const recognition = useSpeechRecognition(ask);

  const repeat = (text: string) => {
    if (!synthesis.supported) {
      toast(fr.common.speech_unavailable);
      return;
    }
    synthesis.speak(text);
  };

  const toggleMic = () => {
    if (recognition.listening) {
      recognition.stop();
      return;
    }
    synthesis.cancel();
    recognition.start();
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(draft);
  };

  // Défile vers le dernier message (la zone défilante est le parent direct de <main> dans AppShell).
  useEffect(() => {
    const scroller = mainRef.current?.parentElement;
    if (scroller && (exchanges.length > 0 || pending || error))
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
  }, [exchanges, pending, error]);

  let lastAnswer: VoiceAnswerOut | null = null;
  for (const x of exchanges) if (x.answer) lastAnswer = x.answer;
  const suggestions: readonly string[] = lastAnswer ? lastAnswer.suggestions : t.starters;

  return (
    <main ref={mainRef} className="flex flex-1 flex-col">
      <ScreenHeader eyebrow={plot.name} title={fr.nav.talk_long} />

      <div className="flex-1 space-y-3 px-5 pb-4" role="log" aria-label={t.thread_label} aria-live="polite">
        <div className="flex animate-fade-up items-end gap-2">
          <AssistantAvatar />
          <p className="max-w-[85%] rounded-3xl rounded-bl-lg bg-card px-4 py-3 text-[15px] leading-snug break-words shadow-soft">
            {t.welcome(plot.name)}
          </p>
        </div>

        {exchanges.map((x) => (
          <div key={x.id} className="space-y-3">
            <div className="flex animate-fade-up justify-end">
              <p className="max-w-[85%] rounded-3xl rounded-br-lg bg-gradient-forest px-4 py-3 text-[15px] leading-snug break-words text-primary-foreground shadow-soft">
                <span className="sr-only">{t.you} : </span>
                {x.question}
              </p>
            </div>
            {x.answer && (
              <div className="flex animate-fade-up items-end gap-2">
                <AssistantAvatar />
                <div className="max-w-[85%] min-w-0 rounded-3xl rounded-bl-lg bg-card px-4 pt-3 pb-1 shadow-soft">
                  <span className="sr-only">{t.assistant_name} : </span>
                  {x.answer.data_missing && (
                    <span className="mb-2 inline-flex rounded-full bg-warning-soft px-2.5 py-1 text-xs font-bold text-sun-foreground">
                      {t.data_missing}
                    </span>
                  )}
                  <p className="text-[15px] leading-snug break-words whitespace-pre-line">{x.answer.answer_text}</p>
                  <button
                    type="button"
                    onClick={() => repeat(x.answer?.speak_text ?? '')}
                    className="-ml-1 flex min-h-12 items-center gap-1.5 rounded-2xl px-1 text-sm font-bold text-primary transition active:scale-95"
                  >
                    <Volume2 className="size-5" /> {t.repeat}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {pending && (
          <div className="flex animate-fade-in items-end gap-2" role="status">
            <AssistantAvatar />
            <div className="flex items-center gap-1.5 rounded-3xl rounded-bl-lg bg-card px-4 py-4 shadow-soft">
              <span className="sr-only">{t.thinking}</span>
              {DOT_DELAYS.map((delay) => (
                <span
                  key={delay}
                  className="size-2 animate-dot rounded-full bg-muted-foreground"
                  style={{ animationDelay: delay }}
                />
              ))}
            </div>
          </div>
        )}

        {error && !pending && <ErrorState error={error} onRetry={retry} />}
      </div>

      {/* Zone de saisie : collée juste au-dessus des onglets ; le creux du bas laisse passer le bouton central. */}
      <div className="sticky bottom-[calc(4rem+max(env(safe-area-inset-bottom),0.5rem))] z-30 border-t border-border/70 bg-background/95 px-5 pt-3 pb-8 backdrop-blur-xl">
        <ul className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-3" aria-label={t.suggestions_label}>
          {suggestions.map((s) => (
            <li key={s} className="shrink-0">
              <button
                type="button"
                disabled={pending}
                onClick={() => ask(s)}
                className="min-h-12 max-w-[78vw] rounded-full bg-leaf-soft px-4 py-2 text-left text-sm font-semibold text-leaf-foreground transition active:scale-95 disabled:opacity-50 lg:max-w-[280px]"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>

        {recognition.supported ? (
          <div className="mb-3 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={toggleMic}
              disabled={pending && !recognition.listening}
              aria-label={recognition.listening ? t.mic_stop : t.mic_start}
              aria-pressed={recognition.listening}
              className={cn(
                'relative flex size-20 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95 disabled:opacity-50',
                recognition.listening
                  ? 'bg-destructive text-destructive-foreground shadow-lift'
                  : 'bg-gradient-leaf text-leaf-foreground shadow-glow',
              )}
            >
              {!recognition.listening && !pending && (
                <span className="absolute inset-0 animate-pulse-ring rounded-full bg-leaf/50" aria-hidden="true" />
              )}
              {recognition.listening ? (
                <Square className="relative size-8 fill-current" />
              ) : (
                <Mic className="relative size-9" strokeWidth={2.2} />
              )}
            </button>
            <div className="min-w-0" role="status">
              {recognition.listening ? (
                <>
                  <div className="flex h-8 items-center gap-1" aria-hidden="true">
                    {WAVE_DELAYS.map((delay) => (
                      <span
                        key={delay}
                        className="h-full w-1.5 animate-wave rounded-full bg-destructive"
                        style={{ animationDelay: delay }}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-sm font-bold">{t.listening}</p>
                </>
              ) : (
                <p className="text-sm font-semibold text-muted-foreground">{t.mic_hint}</p>
              )}
            </div>
          </div>
        ) : (
          <p className="mb-3 text-sm text-muted-foreground">{t.no_mic}</p>
        )}

        <form onSubmit={submit} className="flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label={t.input_label}
            placeholder={t.input_placeholder}
            autoComplete="off"
            enterKeyHint="send"
            className="h-14 min-w-0 flex-1 rounded-2xl border-2 border-border bg-card px-4 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-leaf"
          />
          <button
            type="submit"
            disabled={pending || draft.trim() === ''}
            aria-label={t.send}
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-forest text-primary-foreground shadow-soft transition active:scale-95 disabled:opacity-50"
          >
            <Send className="size-6" />
          </button>
        </form>
      </div>
    </main>
  );
}

export function AssistantPage() {
  const { activePlot, plotsLoading, plotsError, reloadPlots } = usePlot();

  if (activePlot) return <Conversation key={activePlot.plot_id} plot={activePlot} />;

  return (
    <main className="flex flex-1 flex-col">
      <ScreenHeader title={fr.nav.talk_long} />
      {plotsLoading ? (
        <LoadingState lines={4} className="mx-5" />
      ) : plotsError ? (
        <ErrorState error={plotsError} onRetry={reloadPlots} className="mx-5" />
      ) : (
        <EmptyState title={fr.common.no_plot_title} text={fr.common.no_plot_text} className="mx-5">
          <ButtonLink to="/parcelle" variant="hero" size="lg">
            <Map /> {fr.farm.add_plot}
          </ButtonLink>
        </EmptyState>
      )}
    </main>
  );
}
