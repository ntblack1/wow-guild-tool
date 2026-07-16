import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { HomePage } from "./pages/HomePage";
import { LoadingState } from "./components/LoadingState";
import { NotFoundPage } from "./pages/NotFoundPage";

const AuthPage = lazy(() => import("./pages/AuthPage").then((module) => ({ default: module.AuthPage })));
const CharactersPage = lazy(() => import("./pages/CharactersPage").then((module) => ({ default: module.CharactersPage })));
const EventDetailPage = lazy(() => import("./pages/EventDetailPage").then((module) => ({ default: module.EventDetailPage })));
const EventsPage = lazy(() => import("./pages/EventsPage").then((module) => ({ default: module.EventsPage })));
const ForumPage = lazy(() => import("./pages/ForumPage").then((module) => ({ default: module.ForumPage })));
const PostDetailPage = lazy(() => import("./pages/PostDetailPage").then((module) => ({ default: module.PostDetailPage })));
const ReportsPage = lazy(() => import("./pages/ReportsPage").then((module) => ({ default: module.ReportsPage })));

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/auth" element={<Suspense fallback={<LoadingState />}><AuthPage /></Suspense>} />
        <Route path="/characters" element={<Suspense fallback={<LoadingState />}><CharactersPage /></Suspense>} />
        <Route path="/events" element={<Suspense fallback={<LoadingState />}><EventsPage /></Suspense>} />
        <Route path="/events/:eventId" element={<Suspense fallback={<LoadingState />}><EventDetailPage /></Suspense>} />
        <Route path="/forum" element={<Suspense fallback={<LoadingState />}><ForumPage /></Suspense>} />
        <Route path="/forum/:postId" element={<Suspense fallback={<LoadingState />}><PostDetailPage /></Suspense>} />
        <Route path="/reports" element={<Suspense fallback={<LoadingState />}><ReportsPage /></Suspense>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
