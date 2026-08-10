# Taskloom

A production-grade issue tracking application built with the MERN stack.

## Features

- **Issue Management** — Create, update, and delete issues with status, priority, labels, assignees, subtasks, and markdown descriptions
- **Kanban Board** — Drag-and-drop board view with @dnd-kit for visual status management
- **Cursor Pagination** — Efficient infinite scroll with cursor-based API pagination
- **Full-Text Search** — Search issues by title and description via MongoDB text indexes
- **Advanced Filtering** — Filter by status, priority, labels, assignee with sort controls
- **Saved Views** — Save and recall filter combinations for quick access
- **Label Management** — Create, edit, and delete labels with hex color pickers
- **Command Palette** — Cmd/Ctrl+K for quick issue search, creation, and status changes
- **Authentication** — JWT access/refresh token rotation with httpOnly cookies
- **Activity Log** — Automatic tracking of all issue field changes
- **Optimistic Updates** — Instant UI feedback with cache rollback on failure
- **Accessibility** — Skip links, ARIA landmarks, keyboard navigation, focus management

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS 3 |
| State | TanStack Query (server), Zustand (client) |
| Routing | React Router 7 |
| DnD | @dnd-kit/core |
| Backend | Express 4, TypeScript |
| Database | MongoDB (Mongoose 9) |
| Auth | JWT (access + refresh rotation), bcrypt |
| Validation | Zod (shared schemas) |
| Testing | Vitest, Supertest, mongodb-memory-server |

## Getting Started

### Prerequisites

- Node.js ≥ 20
- MongoDB (local or Atlas)

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets

# Seed the database (2000+ issues, 2 users, 8 labels)
npm run seed

# Start development server
npm run dev
```

The app runs on `http://localhost:5173` with the API proxied to port 5000.

### Demo Credentials

After seeding, you can log in with:
- **Email**: `demo@example.com`
- **Password**: `Password123!`

### Running Tests

```bash
npm test
```

Tests use `mongodb-memory-server` — no external database needed.

## Project Structure

```
code/
├── server/              # Express backend
│   ├── config/          # Database connection
│   ├── controllers/     # Route handlers
│   ├── middleware/       # Auth, validation, error handling
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routers
│   └── utils/           # JWT helpers, activity log
├── shared/              # Shared between client & server
│   └── schemas/         # Zod validation schemas
├── src/                 # React frontend
│   ├── components/      # UI components
│   ├── hooks/           # TanStack Query hooks
│   ├── lib/             # API client, query config
│   ├── pages/           # Route pages
│   ├── stores/          # Zustand stores
│   └── types/           # TypeScript types
├── scripts/             # Seed script
└── tests/               # Integration tests
```

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/refresh` | Rotate refresh token |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Get current user |

### Issues
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/issues` | List (cursor paginated, filterable) |
| POST | `/api/issues` | Create |
| GET | `/api/issues/:id` | Get detail |
| PATCH | `/api/issues/:id` | Update |
| DELETE | `/api/issues/:id` | Soft delete |

### Subtasks
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/issues/:id/subtasks` | Add subtask |
| PATCH | `/api/issues/:id/subtasks/:sid` | Toggle/rename |
| DELETE | `/api/issues/:id/subtasks/:sid` | Remove |

### Comments, Labels, Users, Views
Full CRUD with cursor pagination where applicable.

## License

MIT
