import { useDroppable } from '@dnd-kit/core';
import { IssueSummary, IssueStatus } from '../../types';
import BoardCard from './BoardCard';

interface BoardColumnProps {
  status: IssueStatus;
  label: string;
  issues: IssueSummary[];
  count: number;
}

const STATUS_COLORS: Record<IssueStatus, string> = {
  backlog: 'bg-gray-500',
  todo: 'bg-blue-500',
  'in-progress': 'bg-yellow-500',
  done: 'bg-green-500',
  cancelled: 'bg-red-500',
};

export default function BoardColumn({ status, label, issues, count }: BoardColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`w-72 flex flex-col rounded-lg transition-colors ${
        isOver ? 'bg-gray-800/50' : 'bg-gray-900/30'
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0">
        <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[status]}`} />
        <span className="text-sm font-medium text-gray-300">{label}</span>
        <span className="text-xs text-gray-600 ml-auto">{count}</span>
      </div>

      <div className="flex-1 overflow-auto px-2 pb-2 space-y-2">
        {issues.map((issue) => (
          <BoardCard key={issue.id} issue={issue} />
        ))}
      </div>
    </div>
  );
}
