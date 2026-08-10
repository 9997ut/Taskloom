import { ActivityEntry } from '../../types';

interface ActivityLogProps {
  entries: ActivityEntry[];
}

export default function ActivityLog({ entries }: ActivityLogProps) {
  if (entries.length === 0) {
    return (
      <p className="text-xs text-gray-600 italic">No activity yet</p>
    );
  }

  return (
    <div className="space-y-2">
      {[...entries].reverse().map((entry) => (
        <div key={entry._id} className="flex items-start gap-2 text-xs">
          <div
            className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-medium text-white flex-shrink-0 mt-0.5"
            style={{ backgroundColor: entry.actor?.avatarColor || '#6366F1' }}
          >
            {entry.actor?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <span className="text-gray-400">{entry.actor?.name || 'Unknown'}</span>
            <span className="text-gray-600 ml-1">{entry.description}</span>
            <span className="text-gray-700 ml-2">{new Date(entry.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
