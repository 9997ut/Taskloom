import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { IssueDetail } from '../types';

export function useIssue(id: string) {
  return useQuery({
    queryKey: ['issue', id],
    queryFn: () => api<{ issue: IssueDetail }>(`/issues/${id}`),
    select: (data) => data.issue,
    enabled: !!id,
  });
}
