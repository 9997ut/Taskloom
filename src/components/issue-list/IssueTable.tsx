import { useEffect, useRef, useMemo } from 'react';
import { IssueSummary } from '../../types';
import IssueRow from './IssueRow';

interface IssueTableProps {
  issues: IssueSummary[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRetry: () => void;
}

export default function IssueTable({
  issues,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  isLoading,
  isError,
  error,
  onRetry,
}: IssueTableProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // infinite scroll trigger
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    const el = loadMoreRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p className="mb-3">{error?.message || 'Failed to load issues'}</p>
        <button
          onClick={onRetry}
          className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-md transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <p className="text-lg">No issues match these filters</p>
        <p className="text-sm mt-1">Try adjusting your filters or create a new issue</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* header row */}
      <div className="flex items-center gap-3 px-6 py-2 border-b border-gray-800 text-xs text-gray-500 font-medium sticky top-0 bg-gray-950 z-10">
        <span className="w-5"></span>
        <span className="w-16">Status</span>
        <span className="flex-1">Title</span>
        <span className="w-32">Labels</span>
        <span className="w-24 text-right">Assignee</span>
        <span className="w-20 text-right">Updated</span>
      </div>

      {issues.map((issue) => (
        <IssueRow key={issue.id} issue={issue} />
      ))}

      {/* load more sentinel */}
      <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
        {isFetchingNextPage && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-500 border-t-transparent" />
        )}
      </div>
    </div>
  );
}
