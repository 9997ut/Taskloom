import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiResponseError } from '../lib/api';
import { Label } from '../types';
import LabelListItem from '../components/labels/LabelListItem';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: labels, isLoading } = useQuery({
    queryKey: ['labels'],
    queryFn: () => api<{ labels: Label[] }>('/labels'),
    select: (d) => d.labels,
  });

  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366F1');
  const [error, setError] = useState('');

  const createLabel = useMutation({
    mutationFn: (data: { name: string; color: string }) =>
      api('/labels', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      setNewName('');
      setNewColor('#6366F1');
      setError('');
    },
    onError: (err: ApiResponseError) => setError(err.message),
  });

  const updateLabel = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; color?: string } }) =>
      api(`/labels/${id}`, { method: 'PATCH', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      setError('');
    },
    onError: (err: ApiResponseError) => setError(err.message),
  });

  const deleteLabel = useMutation({
    mutationFn: (id: string) => api(`/labels/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] });
    },
  });

  function handleCreate() {
    if (!newName.trim()) return;
    createLabel.mutate({ name: newName.trim(), color: newColor });
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold text-white mb-6">Settings</h1>

      <div className="mb-8">
        <h2 className="text-lg font-medium text-white mb-4">Labels</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-sm text-red-400 mb-4">
            {error}
          </div>
        )}

        {/* create form */}
        <div className="flex items-center gap-3 mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
            aria-label="Label color"
          />
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="New label name"
            className="flex-1 bg-gray-900 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim() || createLabel.isPending}
            className="text-sm bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white px-4 py-1.5 rounded-md transition-colors"
          >
            Create
          </button>
        </div>

        {/* label list */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-2">
            {labels?.map((label) => (
              <LabelListItem
                key={label.id}
                label={label}
                onEdit={(id, data) => updateLabel.mutate({ id, data })}
                onDelete={(id) => deleteLabel.mutate(id)}
              />
            ))}

            {labels?.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No labels yet. Create one above.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
