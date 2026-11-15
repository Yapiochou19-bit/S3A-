import { createBrowserRouter, RouterProvider } from 'react-router';
import { AppShell } from './components/AppShell';
import { PlotProvider } from './context/PlotContext';
import { AssistantPage } from './pages/AssistantPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlotPage } from './pages/PlotPage';
import { PredictionPage } from './pages/PredictionPage';
import { RecommendationPage } from './pages/RecommendationPage';
import { TechnicalPage } from './pages/TechnicalPage';

/**
 * Routes du plan Dev4 (/, /parcelle, /prediction, /recommandation, /technique)
 * + /assistant pour le bouton « Parler » de la maquette.
 */
const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/parcelle', element: <PlotPage /> },
      { path: '/prediction', element: <PredictionPage /> },
      { path: '/recommandation', element: <RecommendationPage /> },
      { path: '/assistant', element: <AssistantPage /> },
      { path: '/technique', element: <TechnicalPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export function App() {
  return (
    <PlotProvider>
      <RouterProvider router={router} />
    </PlotProvider>
  );
}
