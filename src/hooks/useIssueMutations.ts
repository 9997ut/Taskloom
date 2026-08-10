import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { IssueDetail } from '../types';

interface UpdateIssueVars {
  id: string;
  data: Record<string, unknown>;
}

export function useUpdateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: UpdateIssueVars) => {
      return api<{ issue: IssueDetail }>(`/issues/${id}`, {
        method: 'PATCH',
        body: data,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['issue', variables.id] });
    },
  });
}

export function useCreateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { title: string; description?: string; status?: string; priority?: string }) => {
      return api<{ issue: IssueDetail }>('/issues', {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });
}

export function useDeleteIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return api(`/issues/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    }
  });
}
