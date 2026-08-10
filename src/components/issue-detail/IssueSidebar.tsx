import { IssueDetail, IssueStatus, IssuePriority, LabelSummary, UserSummary } from '../../types';

interface IssueSidebarProps {
  issue: IssueDetail;
  allLabels: LabelSummary[];
  allUsers: UserSummary[];
  onUpdate: (data: Record<string, unknown>) => void;
  onDelete: () => void;
}

const STATUS_OPTIONS: { value: IssueStatus; label: string; icon: string }[] = [
  { value: 'backlog', label: 'Backlog', icon: '○' },
  { value: 'todo', label: 'Todo', icon: '◎' },
  { value: 'in-progress', label: 'In Progress', icon: '◑' },
  { value: 'done', label: 'Done', icon: '●' },
  { value: 'cancelled', label: 'Cancelled', icon: '⊘' },
];

const PRIORITY_OPTIONS: { value: IssuePriority; label: string; icon: string }[] = [
  { value: 'none', label: 'No priority', icon: '—' },
  { value: 'low', label: 'Low', icon: '↓' },
  { value: 'medium', label: 'Medium', icon: '→' },
  { value: 'high', label: 'High', icon: '↑' },
  { value: 'urgent', label: 'Urgent', icon: '⚡' },
];

export default function IssueSidebar({ issue, allLabels, allUsers, onUpdate, onDelete }: IssueSidebarProps) {
  return (
    <div className="w-72 border-l border-gray-800 p-4 overflow-auto flex-shrink-0">
      <div className="space-y-5">
        {/* status */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Status</label>
          <select
            value={issue.status}
            onChange={(e) => onUpdate({ status: e.target.value })}
            className="w-full bg-gray-900 border border-gray-700 rounded-md px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            aria-label="Issue status"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.icon} {o.label}</option>
            ))}
          </select>
        </div>

        {/* priority */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Priority</label>
          <select
            value={issue.priority}
            onChange={(e) => onUpdate({ priority: e.target.value })}
            className="w-full bg-gray-900 border border-gray-700 rounded-md px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            aria-label="Issue priority"
          >
            {PRIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.icon} {o.label}</option>
            ))}
          </select>
        </div>

        {/* assignee */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Assignee</label>
          <select
            value={issue.assignee?.id || ''}
            onChange={(e) => onUpdate({ assignee: e.target.value || null })}
            className="w-full bg-gray-900 border border-gray-700 rounded-md px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            aria-label="Issue assignee"
          >
            <option value="">Unassigned</option>
            {allUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        {/* labels */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Labels</label>
          <div className="space-y-1">
            {allLabels.map((label) => {
              const isActive = issue.labels.some((l) => l.id === label.id);
              return (
                <button
                  key={label.id}
                  onClick={() => {
                    const newLabels = isActive
                      ? issue.labels.filter(l => l.id !== label.id).map(l => l.id)
                      : [...issue.labels.map(l => l.id), label.id];
                    onUpdate({ labels: newLabels });
                  }}
                  className={`w-full text-left px-2 py-1 rounded text-xs flex items-center gap-2 transition-colors ${
                    isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: label.color }} />
                  {label.name}
                  {isActive && <span className="ml-auto text-brand-400">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* reporter */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Reporter</label>
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium text-white"
              style={{ backgroundColor: issue.reporter?.avatarColor || '#6366F1' }}
            >
              {issue.reporter?.name?.charAt(0)?.toUpperCase()}
            </div>
            <span className="text-sm text-gray-300">{issue.reporter?.name}</span>
          </div>
        </div>

        {/* delete */}
        <div className="pt-4 border-t border-gray-800">
          <button
            onClick={onDelete}
            className="text-xs text-red-500 hover:text-red-400 transition-colors"
          >
            Delete issue
          </button>
        </div>
      </div>
    </div>
  );
}
