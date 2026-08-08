import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import SkipLink from './SkipLink';

export default function AppLayout() {
  const { isAuthenticated, isLoading, user, logout } = useAuthStore();
  const openCommandPalette = useUiStore((s) => s.openCommandPalette);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  function isActive(path: string) {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <SkipLink targetId="main-content" />

      {/* top nav */}
      <header
        className="h-14 border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-40 flex items-center justify-between px-6"
        role="banner"
      >
        <div className="flex items-center gap-6">
          <Link to="/issues" className="text-lg font-bold bg-gradient-to-r from-brand-400 to-brand-500 bg-clip-text text-transparent">
            Taskloom
          </Link>
          <nav aria-label="Main navigation" className="flex items-center gap-1">
            <Link
              to="/issues"
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                isActive('/issues') && !isActive('/issues/')
                  ? 'text-white bg-gray-800'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
              aria-current={location.pathname === '/issues' ? 'page' : undefined}
            >
              Issues
            </Link>
            <Link
              to="/board"
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                isActive('/board')
                  ? 'text-white bg-gray-800'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
              aria-current={isActive('/board') ? 'page' : undefined}
            >
              Board
            </Link>
            <Link
              to="/settings"
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                isActive('/settings')
                  ? 'text-white bg-gray-800'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
              aria-current={isActive('/settings') ? 'page' : undefined}
            >
              Settings
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCommandPalette}
            className="text-xs text-gray-500 bg-gray-800/60 border border-gray-700 rounded-md px-2.5 py-1 hover:border-gray-600 transition-colors"
            aria-label="Open command palette (Ctrl+K)"
          >
            ⌘K
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white"
              style={{ backgroundColor: user?.avatarColor || '#6366F1' }}
              role="img"
              aria-label={`Avatar for ${user?.name}`}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={logout}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
