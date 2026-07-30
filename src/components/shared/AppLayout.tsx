import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export default function AppLayout() {
  const { isAuthenticated, isLoading, user, logout } = useAuthStore();

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

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* top nav */}
      <header className="h-14 border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-40 flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <a href="/issues" className="text-lg font-bold bg-gradient-to-r from-brand-400 to-brand-500 bg-clip-text text-transparent">
            Taskloom
          </a>
          <nav className="flex items-center gap-1">
            <a
              href="/issues"
              className="px-3 py-1.5 rounded-md text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
            >
              Issues
            </a>
            <a
              href="/board"
              className="px-3 py-1.5 rounded-md text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
            >
              Board
            </a>
            <a
              href="/settings"
              className="px-3 py-1.5 rounded-md text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
            >
              Settings
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="text-xs text-gray-500 bg-gray-800/60 border border-gray-700 rounded-md px-2.5 py-1 hover:border-gray-600 transition-colors"
            title="Command palette"
          >
            ⌘K
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white"
              style={{ backgroundColor: user?.avatarColor || '#6366F1' }}
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

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
