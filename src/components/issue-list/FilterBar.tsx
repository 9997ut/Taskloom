import { useState } from 'react';
import { IssueFilters } from '../../types';
import { useLabels, useUsers } from '../../hooks/useLabelsAndUsers';

interface FilterBarProps {
  filters: IssueFilters;
  onFiltersChange: (filters: IssueFilters) => void;
}

const STATUS_OPTIONS = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'Todo' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PRIORITY_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const { data: labels } = useLabels();
  const { data: users } = useUsers();

  function toggleFilter(key: 'status' | 'priority', value: string) {
    const current = filters[key] || [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [key]: next.length ? next : undefined });
  }

  function toggleLabel(labelId: string) {
    const current = filters.labels || [];
    const next = current.includes(labelId)
      ? current.filter((v) => v !== labelId)
      : [...current, labelId];
    onFiltersChange({ ...filters, labels: next.length ? next : undefined });
  }

  function setAssignee(userId: string | undefined) {
    onFiltersChange({ ...filters, assignee: userId });
  }

  function handleSearch() {
    onFiltersChange({ ...filters, search: searchInput || undefined });
  }

  function clearFilters() {
    setSearchInput('');
    onFiltersChange({});
  }

  const hasActiveFilters = filters.status?.length || filters.priority?.length ||
    filters.labels?.length || filters.assignee || filters.search;

  return (
    <div className="border-b border-gray-800 px-6 py-3">
      <div className="flex items-center gap-3 flex-wrap">
        {/* search */}
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search issues..."
            className="bg-gray-900 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-500 w-52"
          />
          <button
            onClick={handleSearch}
            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1.5 rounded-md transition-colors"
          >
            Search
          </button>
        </div>

        {/* status dropdown */}
        <div className="relative group">
          <button className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1.5 rounded-md transition-colors">
            Status {filters.status?.length ? `(${filters.status.length})` : ''}
          </button>
          <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 z-50 hidden group-hover:block min-w-[140px]">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggleFilter('status', opt.value)}
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-800 transition-colors ${
                  filters.status?.includes(opt.value) ? 'text-brand-400' : 'text-gray-300'
                }`}
              >
                {filters.status?.includes(opt.value) ? '✓ ' : '  '}{opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* priority dropdown */}
        <div className="relative group">
          <button className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1.5 rounded-md transition-colors">
            Priority {filters.priority?.length ? `(${filters.priority.length})` : ''}
          </button>
          <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 z-50 hidden group-hover:block min-w-[140px]">
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggleFilter('priority', opt.value)}
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-800 transition-colors ${
                  filters.priority?.includes(opt.value) ? 'text-brand-400' : 'text-gray-300'
                }`}
              >
                {filters.priority?.includes(opt.value) ? '✓ ' : '  '}{opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* labels dropdown */}
        {labels && labels.length > 0 && (
          <div className="relative group">
            <button className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1.5 rounded-md transition-colors">
              Labels {filters.labels?.length ? `(${filters.labels.length})` : ''}
            </button>
            <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 z-50 hidden group-hover:block min-w-[160px]">
              {labels.map((label) => (
                <button
                  key={label.id}
                  onClick={() => toggleLabel(label.id)}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-800 transition-colors flex items-center gap-2 ${
                    filters.labels?.includes(label.id) ? 'text-brand-400' : 'text-gray-300'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: label.color }}
                  />
                  {label.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* assignee dropdown */}
        {users && users.length > 0 && (
          <div className="relative group">
            <button className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1.5 rounded-md transition-colors">
              Assignee {filters.assignee ? '(1)' : ''}
            </button>
            <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 z-50 hidden group-hover:block min-w-[160px]">
              <button
                onClick={() => setAssignee(undefined)}
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-800 transition-colors ${
                  !filters.assignee ? 'text-brand-400' : 'text-gray-300'
                }`}
              >
                All
              </button>
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setAssignee(user.id)}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-800 transition-colors ${
                    filters.assignee === user.id ? 'text-brand-400' : 'text-gray-300'
                  }`}
                >
                  {user.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* sort */}
        <select
          value={`${filters.sortBy || 'updatedAt'}-${filters.sortOrder || 'desc'}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split('-');
            onFiltersChange({ ...filters, sortBy, sortOrder: sortOrder as 'asc' | 'desc' });
          }}
          className="text-xs bg-gray-800 border border-gray-700 text-gray-300 px-2 py-1.5 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="updatedAt-desc">Recently Updated</option>
          <option value="updatedAt-asc">Least Recently Updated</option>
          <option value="createdAt-desc">Newest</option>
          <option value="createdAt-asc">Oldest</option>
          <option value="priority-desc">Priority (High → Low)</option>
          <option value="priority-asc">Priority (Low → High)</option>
          <option value="title-asc">Title (A → Z)</option>
          <option value="title-desc">Title (Z → A)</option>
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors ml-1"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
