import { Home } from 'lucide-react';
import { ButtonLink } from '../components/Button';
import { EmptyState } from '../components/StateViews';
import { fr } from '../i18n/fr';

export function NotFoundPage() {
  return (
    <main className="flex-1 px-5 pt-10 pb-6">
      <EmptyState title={fr.not_found.title} text={fr.not_found.text}>
        <ButtonLink to="/" variant="hero" size="lg">
          <Home /> {fr.not_found.back}
        </ButtonLink>
      </EmptyState>
    </main>
  );
}
