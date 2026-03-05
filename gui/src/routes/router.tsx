import { createRouter, createRoute, createRootRoute, redirect } from '@tanstack/react-router';
import { lazy } from 'react';
import AppLayout from '../components/layout/AppLayout';
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Lazy load all page components
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const CardsListPage = lazy(() => import('../pages/CardsListPage'));
const CardCreatePage = lazy(() => import('../pages/CardCreatePage'));
const CardDetailPage = lazy(() => import('../pages/CardDetailPage'));
const CardEditPage = lazy(() => import('../pages/CardEditPage'));
const DecksListPage = lazy(() => import('../pages/DecksListPage'));
const DeckCreatePage = lazy(() => import('../pages/DeckCreatePage'));
const DeckDetailPage = lazy(() => import('../pages/DeckDetailPage'));
const BooksListPage = lazy(() => import('../pages/BooksListPage'));
const BookDetailPage = lazy(() => import('../pages/BookDetailPage'));
const GenerationPage = lazy(() => import('../pages/GenerationPage'));
const StorageSettingsPage = lazy(() => import('../pages/StorageSettingsPage'));

// Root route
const rootRoute = createRootRoute();

// Public routes
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage,
});

// Authenticated layout route
const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth',
  component: () => (
    <ProtectedRoute />
  ),
});

const appLayoutRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  id: 'app',
  component: AppLayout,
});

// Index redirect
const indexRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' });
  },
});

// Dashboard
const dashboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/dashboard',
  component: DashboardPage,
});

// Cards
const cardsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/cards',
  component: CardsListPage,
});

const cardCreateRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/cards/new',
  component: CardCreatePage,
});

const cardDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/cards/$cardId',
  component: CardDetailPage,
});

const cardEditRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/cards/$cardId/edit',
  component: CardEditPage,
});

// Decks
const decksRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/decks',
  component: DecksListPage,
});

const deckCreateRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/decks/new',
  component: DeckCreatePage,
});

const deckDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/decks/$deckId',
  component: DeckDetailPage,
});

// Books
const booksRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/books',
  component: BooksListPage,
});

const bookDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/books/$bookId',
  component: BookDetailPage,
});

// Generation
const generationRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/generation',
  component: GenerationPage,
});

// Settings
const storageSettingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings/storage',
  component: StorageSettingsPage,
});

// Build route tree
const routeTree = rootRoute.addChildren([
  loginRoute,
  registerRoute,
  authLayoutRoute.addChildren([
    appLayoutRoute.addChildren([
      indexRoute,
      dashboardRoute,
      cardsRoute,
      cardCreateRoute,
      cardDetailRoute,
      cardEditRoute,
      decksRoute,
      deckCreateRoute,
      deckDetailRoute,
      booksRoute,
      bookDetailRoute,
      generationRoute,
      storageSettingsRoute,
    ]),
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
