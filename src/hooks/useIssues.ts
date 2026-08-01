import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { IssueSummary, IssueFilters } from '../types';

interface IssueListResponse {
  issues: IssueSummary[];
  nextCursor: string | null;
}

export function useIssues(filters: IssueFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['issues', filters],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();

      if (filters.status?.length) params.set('status', filters.status.join(','));
      if (filters.priority?.length) params.set('priority', filters.priority.join(','));
      if (filters.labels?.length) params.set('labels', filters.labels.join(','));
      if (filters.assignee) params.set('assignee', filters.assignee);
      if (filters.search) params.set('search', filters.search);
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
      if (pageParam) params.set('cursor', pageParam);

      const queryString = params.toString();
      const url = `/issues${queryString ? `?${queryString}` : ''}`;

      return api<IssueListResponse>(url);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
