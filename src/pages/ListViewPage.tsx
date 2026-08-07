import { useState, useMemo } from 'react';
import { IssueFilters } from '../types';
import { useIssues } from '../hooks/useIssues';
import FilterBar from '../components/issue-list/FilterBar';
import IssueTable from '../components/issue-list/IssueTable';
import SavedViewsSidebar from '../components/shared/SavedViewsSidebar';

export default function ListViewPage() {
  const [filters, setFilters] = useState<IssueFilters>({});

  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useIssues(filters);

  const issues = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.issues);
  }, [data]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <SavedViewsSidebar onApplyFilters={setFilters} currentFilters={filters} />

      <div className="flex-1 flex flex-col">
        <FilterBar filters={filters} onFiltersChange={setFilters} />
        <IssueTable
          issues={issues}
          hasNextPage={!!hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
        />
      </div>
    </div>
  );
}
