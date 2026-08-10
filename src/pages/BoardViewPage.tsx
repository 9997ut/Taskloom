import { useState, useMemo, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useIssues } from '../hooks/useIssues';
import { useOptimisticStatusUpdate } from '../hooks/useOptimisticUpdate';
import { IssueSummary, IssueStatus } from '../types';
import BoardColumn from '../components/issue-board/BoardColumn';
import BoardCard from '../components/issue-board/BoardCard';

const COLUMNS: { status: IssueStatus; label: string }[] = [
  { status: 'backlog', label: 'Backlog' },
  { status: 'todo', label: 'Todo' },
  { status: 'in-progress', label: 'In Progress' },
  { status: 'done', label: 'Done' },
  { status: 'cancelled', label: 'Cancelled' },
];

export default function BoardViewPage() {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useIssues({ sortBy: 'updatedAt', sortOrder: 'desc' });
  const updateIssue = useOptimisticStatusUpdate();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  // load all pages for the board
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allIssues = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((p) => p.issues);
  }, [data]);

  const grouped = useMemo(() => {
    const map: Record<IssueStatus, IssueSummary[]> = {
      'backlog': [],
      'todo': [],
      'in-progress': [],
      'done': [],
      'cancelled': [],
    };
    for (const issue of allIssues) {
      if (map[issue.status]) {
        map[issue.status].push(issue);
      }
    }
    return map;
  }, [allIssues]);

  const activeIssue = useMemo(() => {
    if (!activeId) return null;
    return allIssues.find((i) => i.id === activeId) || null;
  }, [activeId, allIssues]);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const issueId = active.id as string;
    const newStatus = over.id as IssueStatus;

    const issue = allIssues.find((i) => i.id === issueId);
    if (!issue || issue.status === newStatus) return;

    updateIssue.mutate({ id: issueId, data: { status: newStatus } });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-x-auto p-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 h-full min-w-max">
          {COLUMNS.map((col) => (
            <BoardColumn
              key={col.status}
              status={col.status}
              label={col.label}
              issues={grouped[col.status]}
              count={grouped[col.status].length}
            />
          ))}
        </div>

        <DragOverlay>
          {activeIssue ? <BoardCard issue={activeIssue} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
