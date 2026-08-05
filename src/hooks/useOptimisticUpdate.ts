import { useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { api } from '../lib/api';
import { IssueDetail, IssueSummary } from '../types';

interface UpdateIssueVars {
  id: string;
  data: Record<string, unknown>;
}

interface IssueListPage {
  issues: IssueSummary[];
  nextCursor: string | null;
}

export function useOptimisticStatusUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: UpdateIssueVars) => {
      return api<{ issue: IssueDetail }>(`/issues/${id}`, {
        method: 'PATCH',
        body: data,
      });
    },

    onMutate: async ({ id, data }) => {
      // cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: ['issues'] });
      await queryClient.cancelQueries({ queryKey: ['issue', id] });

      // snapshot current cache
      const previousIssues = queryClient.getQueriesData<InfiniteData<IssueListPage>>({ queryKey: ['issues'] });
      const previousDetail = queryClient.getQueryData<{ issue: IssueDetail }>(['issue', id]);

      // optimistically update list caches
      queryClient.setQueriesData<InfiniteData<IssueListPage>>(
        { queryKey: ['issues'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              issues: page.issues.map((issue) =>
                issue.id === id ? { ...issue, ...data } as IssueSummary : issue
              ),
            })),
          };
        }
      );

      // optimistically update detail cache
      if (previousDetail) {
        queryClient.setQueryData(['issue', id], {
          issue: { ...previousDetail.issue, ...data },
        });
      }

      return { previousIssues, previousDetail };
    },

    onError: (_err, { id }, context) => {
      // roll back to snapshots
      if (context?.previousIssues) {
        for (const [queryKey, data] of context.previousIssues) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(['issue', id], context.previousDetail);
      }
    },

    onSettled: (_data, _err, { id }) => {
      // refetch to reconcile with server
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['issue', id] });
    },
  });
}
