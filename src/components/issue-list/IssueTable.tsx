import { useEffect, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
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

const ROW_HEIGHT = 41; // px — matches IssueRow py-2.5 + content + border

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
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: issues.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  // fetch next page when user scrolls near the bottom
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight - scrollTop - clientHeight < 200) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

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
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* header row */}
      <div className="flex items-center gap-3 px-6 py-2 border-b border-gray-800 text-xs text-gray-500 font-medium bg-gray-950 z-10 flex-shrink-0">
        <span className="w-5"></span>
        <span className="w-16">Status</span>
        <span className="flex-1">Title</span>
        <span className="w-32">Labels</span>
        <span className="w-24 text-right">Assignee</span>
        <span className="w-20 text-right">Updated</span>
      </div>

      {/* virtualized list */}
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <div
          style={{ height: virtualizer.getTotalSize(), position: 'relative' }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <IssueRow issue={issues[virtualRow.index]} />
            </div>
          ))}
        </div>

        {/* loading indicator at bottom */}
        {isFetchingNextPage && (
          <div className="h-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-500 border-t-transparent" />
          </div>
        )}
      </div>
    </div>
  );
}
