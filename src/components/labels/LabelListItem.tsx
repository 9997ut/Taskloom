import { useState } from 'react';
import { Label } from '../../types';

interface LabelListItemProps {
  label: Label;
  onEdit: (id: string, data: { name: string; color: string }) => void;
  onDelete: (id: string) => void;
}

export default function LabelListItem({ label, onEdit, onDelete }: LabelListItemProps) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(label.name);
  const [editColor, setEditColor] = useState(label.color);

  function saveEdit() {
    if (!editName.trim()) return;
    onEdit(label.id, { name: editName.trim(), color: editColor });
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-900/30 rounded-lg border border-gray-800 group">
      {editing ? (
        <>
          <input
            type="color"
            value={editColor}
            onChange={(e) => setEditColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
            aria-label="Edit label color"
          />
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            autoFocus
          />
          <button onClick={saveEdit} className="text-xs text-brand-400 hover:text-brand-300">Save</button>
          <button onClick={() => setEditing(false)} className="text-xs text-gray-500 hover:text-gray-300">Cancel</button>
        </>
      ) : (
        <>
          <span
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: label.color }}
          />
          <span className="text-sm text-gray-200 flex-1">{label.name}</span>
          <button
            onClick={() => { setEditName(label.name); setEditColor(label.color); setEditing(true); }}
            className="text-xs text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
          >
            Edit
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete label "${label.name}"? It will be removed from all issues.`))
                onDelete(label.id);
            }}
            className="text-xs text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
          >
            Delete
          </button>
        </>
      )}
    </div>
  );
}
