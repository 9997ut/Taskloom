export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
}

export type IssueStatus = 'backlog' | 'todo' | 'in-progress' | 'done' | 'cancelled';
export type IssuePriority = 'none' | 'low' | 'medium' | 'high' | 'urgent';

export interface Label {
  id: string;
  name: string;
  color: string;
}

// aliases for component prop clarity
export type LabelSummary = Label;
export type UserSummary = User;

export interface Subtask {
  _id: string;
  title: string;
  done: boolean;
  createdAt: string;
}

export interface ActivityEntry {
  _id: string;
  type: string;
  description: string;
  actor: {
    _id: string;
    name: string;
    avatarColor: string;
  };
  createdAt: string;
}

// list view issue (lightweight)
export interface IssueSummary {
  id: string;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  labels: Label[];
  assignee: User | null;
  updatedAt: string;
  createdAt: string;
}

// detail view issue (full)
export interface IssueDetail extends IssueSummary {
  description: string;
  reporter: User;
  subtasks: Subtask[];
  activityLog: ActivityEntry[];
  commentsCount: number;
}

export interface Comment {
  id: string;
  issue: string;
  author: User;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedView {
  id: string;
  name: string;
  filters: IssueFilters;
  createdAt: string;
  updatedAt: string;
}


export interface IssueFilters {
  status?: string[];
  priority?: string[];
  labels?: string[];
  assignee?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  nextCursor: string | null;
  [key: string]: T[] | string | null;
}
