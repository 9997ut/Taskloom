import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { useAuthStore } from './stores/authStore';
import AppLayout from './components/shared/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ListViewPage from './pages/ListViewPage';
import BoardViewPage from './pages/BoardViewPage';
import IssueDetailPage from './pages/IssueDetailPage';
import SettingsPage from './pages/SettingsPage';
import CommandPalette from './components/command-palette/CommandPalette';

function AppRoutes() {
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-500 border-t-transparent mx-auto"></div>
          <p className="text-gray-500 mt-4 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/issues" replace /> : <LoginPage />
      } />
      <Route path="/register" element={
        isAuthenticated ? <Navigate to="/issues" replace /> : <RegisterPage />
      } />

      <Route element={<AppLayout />}>
        <Route path="/issues" element={<ListViewPage />} />
        <Route path="/board" element={<BoardViewPage />} />
        <Route path="/issues/:id" element={<IssueDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/issues" replace />} />
      <Route path="*" element={<Navigate to="/issues" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <CommandPalette />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
