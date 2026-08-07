import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { SavedView, IssueFilters } from '../../types';

interface SavedViewsSidebarProps {
  onApplyFilters: (filters: IssueFilters) => void;
  currentFilters: IssueFilters;
}

export default function SavedViewsSidebar({ onApplyFilters, currentFilters }: SavedViewsSidebarProps) {
  const queryClient = useQueryClient();

  const { data: views, isLoading } = useQuery({
    queryKey: ['savedViews'],
    queryFn: () => api<{ views: SavedView[] }>('/views'),
    select: (d) => d.views,
  });

  const createView = useMutation({
    mutationFn: (data: { name: string; filters: IssueFilters }) =>
      api('/views', { method: 'POST', body: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savedViews'] }),
  });

  const deleteView = useMutation({
    mutationFn: (id: string) => api(`/views/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savedViews'] }),
  });

  function handleSaveCurrentFilters() {
    const name = prompt('Name for this saved view:');
    if (!name?.trim()) return;
    createView.mutate({ name: name.trim(), filters: currentFilters });
  }

  return (
    <div className="w-56 border-r border-gray-800 flex-shrink-0 p-3 overflow-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Saved Views</h3>
        <button
          onClick={handleSaveCurrentFilters}
          className="text-xs text-brand-400 hover:text-brand-300"
          title="Save current filters"
        >
          + Save
        </button>
      </div>

      {isLoading && (
        <div className="text-xs text-gray-600 py-2">Loading...</div>
      )}

      {views && views.length === 0 && (
        <p className="text-xs text-gray-600 py-2">No saved views yet</p>
      )}

      <div className="space-y-0.5">
        {views?.map((view) => (
          <div
            key={view.id}
            className="flex items-center justify-between group rounded-md hover:bg-gray-800/50 px-2 py-1.5 transition-colors"
          >
            <button
              onClick={() => onApplyFilters(view.filters)}
              className="text-sm text-gray-300 hover:text-white truncate flex-1 text-left"
            >
              {view.name}
            </button>
            <button
              onClick={() => deleteView.mutate(view.id)}
              className="text-xs text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all ml-1"
              aria-label={`Delete saved view "${view.name}"`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
