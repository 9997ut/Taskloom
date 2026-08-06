import { useState, useEffect, useRef, useCallback, useMemo, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIssues } from '../../hooks/useIssues';
import { useCreateIssue } from '../../hooks/useIssueMutations';
import { useOptimisticStatusUpdate } from '../../hooks/useOptimisticUpdate';
import { useUiStore } from '../../stores/uiStore';
import { IssueSummary, IssueStatus } from '../../types';

const STATUS_OPTIONS: { value: IssueStatus; label: string; icon: string }[] = [
  { value: 'backlog', label: 'Backlog', icon: '○' },
  { value: 'todo', label: 'Todo', icon: '◎' },
  { value: 'in-progress', label: 'In Progress', icon: '◑' },
  { value: 'done', label: 'Done', icon: '●' },
  { value: 'cancelled', label: 'Cancelled', icon: '⊘' },
];

type PaletteMode = 'search' | 'create' | 'status';

export default function CommandPalette() {
  const { commandPaletteOpen, closeCommandPalette } = useUiStore();
  const navigate = useNavigate();
  const createIssue = useCreateIssue();
  const statusUpdate = useOptimisticStatusUpdate();

  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<PaletteMode>('search');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [statusTarget, setStatusTarget] = useState<string | null>(null);
  const [createTitle, setCreateTitle] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data } = useIssues({ search: query || undefined });

  const results = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((p) => p.issues).slice(0, 10);
  }, [data]);

  // build action list
  const actions = useMemo(() => {
    const items: { id: string; label: string; type: 'action' | 'issue'; data?: unknown }[] = [];

    if (mode === 'search') {
      items.push({ id: 'create', label: 'Create new issue', type: 'action' });

      for (const issue of results) {
        items.push({ id: issue.id, label: issue.title, type: 'issue', data: issue });
      }
    } else if (mode === 'status') {
      for (const s of STATUS_OPTIONS) {
        items.push({ id: s.value, label: `${s.icon} ${s.label}`, type: 'action' });
      }
    }

    return items;
  }, [mode, results]);

  // focus trap and escape handling
  useEffect(() => {
    if (commandPaletteOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [commandPaletteOpen]);

  function handleClose() {
    closeCommandPalette();
    setQuery('');
    setMode('search');
    setSelectedIndex(0);
    setStatusTarget(null);
    setCreateTitle('');
    // return focus to trigger element
    setTimeout(() => triggerRef.current?.focus(), 0);
  }

  // global keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: globalThis.KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (commandPaletteOpen) {
          handleClose();
        } else {
          useUiStore.getState().openCommandPalette();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, actions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (mode === 'create') {
        if (createTitle.trim()) {
          createIssue.mutate({ title: createTitle.trim() }, {
            onSuccess: (data) => {
              handleClose();
              navigate(`/issues/${data.issue._id || data.issue.id}`);
            },
          });
        }
        return;
      }

      const selected = actions[selectedIndex];
      if (!selected) return;

      if (selected.id === 'create') {
        setMode('create');
        setCreateTitle('');
        return;
      }

      if (mode === 'status' && statusTarget) {
        statusUpdate.mutate({ id: statusTarget, data: { status: selected.id } });
        handleClose();
        return;
      }

      if (selected.type === 'issue') {
        handleClose();
        navigate(`/issues/${selected.id}`);
      }
    }
  }, [actions, selectedIndex, mode, createTitle, statusTarget]);

  function handleIssueStatusChange(issueId: string) {
    setStatusTarget(issueId);
    setMode('status');
    setSelectedIndex(0);
  }

  if (!commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* palette */}
      <div
        ref={containerRef}
        className="relative w-full max-w-lg bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="px-4 py-3 border-b border-gray-800">
          {mode === 'create' ? (
            <input
              ref={inputRef}
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter issue title and press Enter..."
              className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-gray-500"
              autoFocus
            />
          ) : (
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
              onKeyDown={handleKeyDown}
              placeholder={mode === 'status' ? 'Select new status...' : 'Search issues or type a command...'}
              className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-gray-500"
            />
          )}
        </div>

        <div className="max-h-72 overflow-auto py-1">
          {mode === 'create' ? (
            <div className="px-4 py-3 text-sm text-gray-400">
              Type a title and press <kbd className="text-xs bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700">Enter</kbd> to create
            </div>
          ) : (
            actions.map((action, i) => (
              <button
                key={action.id}
                onClick={() => {
                  setSelectedIndex(i);
                  if (action.id === 'create') {
                    setMode('create');
                  } else if (mode === 'status' && statusTarget) {
                    statusUpdate.mutate({ id: statusTarget, data: { status: action.id } });
                    handleClose();
                  } else if (action.type === 'issue') {
                    handleClose();
                    navigate(`/issues/${action.id}`);
                  }
                }}
                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors ${
                  i === selectedIndex ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800/50'
                }`}
              >
                <span className="truncate">{action.label}</span>
                {action.type === 'issue' && mode === 'search' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleIssueStatusChange(action.id);
                    }}
                    className="text-xs text-gray-500 hover:text-brand-400 ml-2 flex-shrink-0"
                    aria-label={`Change status of ${action.label}`}
                  >
                    Status ›
                  </button>
                )}
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-gray-800 flex items-center gap-3 text-[11px] text-gray-600">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}
