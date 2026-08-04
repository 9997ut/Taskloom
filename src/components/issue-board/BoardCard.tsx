import { useDraggable } from '@dnd-kit/core';
import { Link } from 'react-router-dom';
import { IssueSummary } from '../../types';

interface BoardCardProps {
  issue: IssueSummary;
  isDragging?: boolean;
}

const PRIORITY_ICONS: Record<string, string> = {
  none: '—',
  low: '↓',
  medium: '→',
  high: '↑',
  urgent: '⚡'
};

export default function BoardCard({ issue, isDragging }: BoardCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: issue.id,
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-gray-900 border border-gray-800 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-shadow ${
        isDragging ? 'shadow-lg shadow-brand-500/20 opacity-90 ring-1 ring-brand-500/30' : 'hover:border-gray-700'
      }`}
      role="button"
      aria-label={`Drag ${issue.title} to change status`}
    >
      <Link to={`/issues/${issue.id}`} className="block" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm text-gray-200 line-clamp-2">{issue.title}</p>
      </Link>

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">{PRIORITY_ICONS[issue.priority]} {issue.priority}</span>
        </div>

        <div className="flex items-center gap-1">
          {issue.labels.slice(0, 2).map((label) => (
            <span
              key={label.id}
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: label.color }}
              title={label.name}
            />
          ))}
          {issue.assignee && (
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium text-white ml-1"
              style={{ backgroundColor: issue.assignee.avatarColor }}
              title={issue.assignee.name}
            >
              {issue.assignee.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
