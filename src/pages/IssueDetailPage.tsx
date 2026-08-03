import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { useIssue } from '../hooks/useIssue';
import { useUpdateIssue, useDeleteIssue } from '../hooks/useIssueMutations';
import { useComments, useCreateComment, useDeleteComment } from '../hooks/useComments';
import { useLabels, useUsers } from '../hooks/useLabelsAndUsers';
import { useAuthStore } from '../stores/authStore';
import { IssueStatus, IssuePriority, Subtask } from '../types';
import { api } from '../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

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

export default function IssueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: issue, isLoading, isError, error } = useIssue(id!);
  const updateIssue = useUpdateIssue();
  const deleteIssue = useDeleteIssue();
  const { data: allLabels } = useLabels();
  const { data: allUsers } = useUsers();

  // comments
  const { data: commentsData, hasNextPage, fetchNextPage, isFetchingNextPage } = useComments(id!);
  const createComment = useCreateComment(id!);
  const deleteComment = useDeleteComment(id!);
  const [commentText, setCommentText] = useState('');

  const comments = useMemo(() => {
    if (!commentsData?.pages) return [];
    return commentsData.pages.flatMap((p) => p.comments);
  }, [commentsData]);

  // inline edit state
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState('');

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [editingTitle]);

  // subtask mutations
  const addSubtask = useMutation({
    mutationFn: (title: string) =>
      api(`/issues/${id}/subtasks`, { method: 'POST', body: { title } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['issue', id] }),
  });

  const toggleSubtask = useMutation({
    mutationFn: ({ subtaskId, done }: { subtaskId: string; done: boolean }) =>
      api(`/issues/${id}/subtasks/${subtaskId}`, { method: 'PATCH', body: { done } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['issue', id] }),
  });

  const removeSubtask = useMutation({
    mutationFn: (subtaskId: string) =>
      api(`/issues/${id}/subtasks/${subtaskId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['issue', id] }),
  });

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (isError || !issue) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p>{error?.message || 'Issue not found'}</p>
        <button onClick={() => navigate('/issues')} className="mt-3 text-sm text-brand-400 hover:text-brand-300">
          Back to issues
        </button>
      </div>
    );
  }

  function saveTitle() {
    if (titleDraft.trim() && titleDraft !== issue!.title) {
      updateIssue.mutate({ id: id!, data: { title: titleDraft.trim() } });
    }
    setEditingTitle(false);
  }

  function saveDescription() {
    if (descDraft !== issue!.description) {
      updateIssue.mutate({ id: id!, data: { description: descDraft } });
    }
    setEditingDesc(false);
  }

  function handleDelete() {
    if (window.confirm('Are you sure you want to delete this issue?')) {
      deleteIssue.mutate(id!, {
        onSuccess: () => navigate('/issues'),
      });
    }
  }

  function handleAddComment() {
    if (!commentText.trim()) return;
    createComment.mutate(commentText.trim(), {
      onSuccess: () => setCommentText(''),
    });
  }

  function handleAddSubtask() {
    if (!newSubtaskTitle.trim()) return;
    addSubtask.mutate(newSubtaskTitle.trim(), {
      onSuccess: () => setNewSubtaskTitle(''),
    });
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* main content */}
      <div className="flex-1 overflow-auto p-6 max-w-3xl">
        {/* title */}
        {editingTitle ? (
          <input
            ref={titleInputRef}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
            className="text-2xl font-semibold bg-transparent border-b border-brand-500 text-white w-full focus:outline-none pb-1"
          />
        ) : (
          <h1
            className="text-2xl font-semibold text-white cursor-pointer hover:text-gray-200 transition-colors"
            onClick={() => { setTitleDraft(issue.title); setEditingTitle(true); }}
          >
            {issue.title}
          </h1>
        )}

        {/* description */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
          {editingDesc ? (
            <div>
              <textarea
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                rows={8}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500 resize-y"
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button onClick={saveDescription} className="text-xs bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded-md">Save</button>
                <button onClick={() => setEditingDesc(false)} className="text-xs text-gray-400 hover:text-white px-3 py-1.5">Cancel</button>
              </div>
            </div>
          ) : (
            <div
              className="prose prose-invert prose-sm max-w-none cursor-pointer min-h-[60px] p-3 rounded-lg hover:bg-gray-900/50 transition-colors"
              onClick={() => { setDescDraft(issue.description || ''); setEditingDesc(true); }}
            >
              {issue.description ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                  {issue.description}
                </ReactMarkdown>
              ) : (
                <p className="text-gray-600 italic">Click to add a description...</p>
              )}
            </div>
          )}
        </div>

        {/* subtasks */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-400 mb-3">
            Subtasks {issue.subtasks.length > 0 && `(${issue.subtasks.filter(s => s.done).length}/${issue.subtasks.length})`}
          </h3>
          <div className="space-y-1">
            {issue.subtasks.map((subtask: Subtask) => (
              <div key={subtask._id} className="flex items-center gap-2 group py-1">
                <input
                  type="checkbox"
                  checked={subtask.done}
                  onChange={(e) => toggleSubtask.mutate({ subtaskId: subtask._id, done: e.target.checked })}
                  className="rounded border-gray-600 bg-gray-800 text-brand-500 focus:ring-brand-500"
                  aria-label={`Mark "${subtask.title}" as ${subtask.done ? 'incomplete' : 'complete'}`}
                />
                <span className={`text-sm flex-1 ${subtask.done ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                  {subtask.title}
                </span>
                <button
                  onClick={() => removeSubtask.mutate(subtask._id)}
                  className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs"
                  aria-label={`Delete subtask "${subtask.title}"`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
              placeholder="Add a subtask..."
              className="flex-1 bg-gray-900 border border-gray-800 rounded-md px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button
              onClick={handleAddSubtask}
              disabled={!newSubtaskTitle.trim()}
              className="text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 px-3 py-1.5 rounded-md transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* comments */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Comments ({issue.commentsCount})</h3>

          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-gray-900/50 rounded-lg p-3 group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium text-white"
                      style={{ backgroundColor: comment.author.avatarColor }}
                    >
                      {comment.author.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium text-gray-300">{comment.author.name}</span>
                    <span className="text-xs text-gray-600">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  {comment.author.id === user?.id && (
                    <button
                      onClick={() => deleteComment.mutate(comment.id)}
                      className="text-xs text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      aria-label="Delete comment"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-300">{comment.text}</p>
              </div>
            ))}
          </div>

          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="text-xs text-brand-400 hover:text-brand-300 mt-2"
            >
              {isFetchingNextPage ? 'Loading...' : 'Load more comments'}
            </button>
          )}

          {/* new comment */}
          <div className="mt-4">
            <label htmlFor="new-comment" className="sr-only">Add a comment</label>
            <textarea
              id="new-comment"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              placeholder="Write a comment..."
              className="w-full bg-gray-900 border border-gray-800 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
            />
            <button
              onClick={handleAddComment}
              disabled={!commentText.trim() || createComment.isPending}
              className="mt-2 text-sm bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white px-4 py-1.5 rounded-md transition-colors"
            >
              {createComment.isPending ? 'Posting...' : 'Comment'}
            </button>
          </div>
        </div>

        {/* activity log */}
        <div className="mt-8 mb-12">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Activity</h3>
          <div className="space-y-2">
            {[...issue.activityLog].reverse().map((entry) => (
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
        </div>
      </div>

      {/* sidebar */}
      <div className="w-72 border-l border-gray-800 p-4 overflow-auto flex-shrink-0">
        <div className="space-y-5">
          {/* status */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Status</label>
            <select
              value={issue.status}
              onChange={(e) => updateIssue.mutate({ id: id!, data: { status: e.target.value } })}
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
              onChange={(e) => updateIssue.mutate({ id: id!, data: { priority: e.target.value } })}
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
              onChange={(e) => updateIssue.mutate({ id: id!, data: { assignee: e.target.value || null } })}
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              aria-label="Issue assignee"
            >
              <option value="">Unassigned</option>
              {allUsers?.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* labels */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Labels</label>
            <div className="space-y-1">
              {allLabels?.map((label) => {
                const isActive = issue.labels.some((l) => l.id === label.id);
                return (
                  <button
                    key={label.id}
                    onClick={() => {
                      const newLabels = isActive
                        ? issue.labels.filter(l => l.id !== label.id).map(l => l.id)
                        : [...issue.labels.map(l => l.id), label.id];
                      updateIssue.mutate({ id: id!, data: { labels: newLabels } });
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
              onClick={handleDelete}
              className="text-xs text-red-500 hover:text-red-400 transition-colors"
            >
              Delete issue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
