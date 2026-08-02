import { IssueSummary, IssueStatus } from '../../types';
import { useUpdateIssue } from '../../hooks/useIssueMutations';
import { Link } from 'react-router-dom';

interface IssueRowProps {
  issue: IssueSummary;
}

const STATUS_CONFIG: Record<IssueStatus, { label: string; icon: string; color: string }> = {
  'backlog': { label: 'Backlog', icon: '○', color: 'text-gray-400' },
  'todo': { label: 'Todo', icon: '◎', color: 'text-blue-400' },
  'in-progress': { label: 'In Progress', icon: '◑', color: 'text-yellow-400' },
  'done': { label: 'Done', icon: '●', color: 'text-green-400' },
  'cancelled': { label: 'Cancelled', icon: '⊘', color: 'text-red-400' },
};

const PRIORITY_CONFIG = {
  'none': { label: 'No priority', icon: '—', color: 'text-gray-500' },
  'low': { label: 'Low', icon: '↓', color: 'text-blue-400' },
  'medium': { label: 'Medium', icon: '→', color: 'text-yellow-400' },
  'high': { label: 'High', icon: '↑', color: 'text-orange-400' },
  'urgent': { label: 'Urgent', icon: '⚡', color: 'text-red-400' },
};

const STATUS_ORDER: IssueStatus[] = ['backlog', 'todo', 'in-progress', 'done', 'cancelled'];

export default function IssueRow({ issue }: IssueRowProps) {
  const updateIssue = useUpdateIssue();
  const statusCfg = STATUS_CONFIG[issue.status];
  const priorityCfg = PRIORITY_CONFIG[issue.priority];

  function handleStatusChange(newStatus: string) {
    updateIssue.mutate({ id: issue.id, data: { status: newStatus } });
  }

  const timeAgo = getTimeAgo(new Date(issue.updatedAt));

  return (
    <div className="flex items-center gap-3 px-6 py-2.5 hover:bg-gray-900/50 border-b border-gray-800/50 transition-colors group">
      {/* priority */}
      <span className={`text-sm flex-shrink-0 w-5 ${priorityCfg.color}`} title={priorityCfg.label}>
        {priorityCfg.icon}
      </span>

      {/* status quick change */}
      <div className="relative flex-shrink-0">
        <select
          value={issue.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className={`appearance-none bg-transparent text-sm cursor-pointer focus:outline-none ${statusCfg.color}`}
          title={`Status: ${statusCfg.label}`}
          aria-label={`Change status of ${issue.title}`}
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label}</option>
          ))}
        </select>
      </div>

      {/* title */}
      <Link
        to={`/issues/${issue.id}`}
        className="flex-1 text-sm text-gray-200 hover:text-white truncate transition-colors"
      >
        {issue.title}
      </Link>

      {/* labels */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {issue.labels.slice(0, 3).map((label) => (
          <span
            key={label.id}
            className="text-xs px-1.5 py-0.5 rounded-full border"
            style={{
              borderColor: label.color + '40',
              color: label.color,
              backgroundColor: label.color + '15',
            }}
          >
            {label.name}
          </span>
        ))}
        {issue.labels.length > 3 && (
          <span className="text-xs text-gray-500">+{issue.labels.length - 3}</span>
        )}
      </div>

      {/* assignee */}
      <div className="flex-shrink-0 w-24 text-right">
        {issue.assignee ? (
          <div className="flex items-center gap-1.5 justify-end">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium text-white flex-shrink-0"
              style={{ backgroundColor: issue.assignee.avatarColor }}
            >
              {issue.assignee.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-gray-400 truncate">{issue.assignee.name.split(' ')[0]}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-600">—</span>
        )}
      </div>

      {/* updated */}
      <span className="text-xs text-gray-500 flex-shrink-0 w-20 text-right">
        {timeAgo}
      </span>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
