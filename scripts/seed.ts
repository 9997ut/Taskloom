import dotenv from 'dotenv';
dotenv.config();

import mongoose, { Types } from 'mongoose';
import bcrypt from 'bcrypt';
import connectDB from '../server/config/db.js';
import User from '../server/models/User.js';
import Label from '../server/models/Label.js';
import Issue from '../server/models/Issue.js';
import Comment from '../server/models/Comment.js';
import SavedView from '../server/models/SavedView.js';
import { STATUS_VALUES, PRIORITY_VALUES, ACTIVITY_TYPES } from '../server/models/Issue.js';

// Deterministic ObjectIds for repeatability
function oid(hex: string): Types.ObjectId {
  return new Types.ObjectId(hex.padEnd(24, '0'));
}

const USER_IDS = {
  demo: oid('aaaaaaaaaaaa'),
  member: oid('bbbbbbbbbbbb'),
};

const LABEL_IDS = [
  oid('cccccccccc01'),
  oid('cccccccccc02'),
  oid('cccccccccc03'),
  oid('cccccccccc04'),
  oid('cccccccccc05'),
  oid('cccccccccc06'),
  oid('cccccccccc07'),
  oid('cccccccccc08'),
];

const LABELS_DATA = [
  { _id: LABEL_IDS[0], name: 'bug', color: '#EF4444' },
  { _id: LABEL_IDS[1], name: 'feature', color: '#3B82F6' },
  { _id: LABEL_IDS[2], name: 'improvement', color: '#8B5CF6' },
  { _id: LABEL_IDS[3], name: 'documentation', color: '#06B6D4' },
  { _id: LABEL_IDS[4], name: 'performance', color: '#F59E0B' },
  { _id: LABEL_IDS[5], name: 'security', color: '#EF4444' },
  { _id: LABEL_IDS[6], name: 'ui/ux', color: '#EC4899' },
  { _id: LABEL_IDS[7], name: 'backend', color: '#22C55E' },
];

const ISSUE_TITLES = [
  'Fix login redirect loop on expired sessions',
  'Add dark mode toggle to settings page',
  'Implement cursor-based pagination for issue list',
  'Database connection pool exhaustion under load',
  'Add keyboard shortcuts documentation',
  'Optimize bundle size by lazy loading routes',
  'Rate limiter miscounting behind reverse proxy',
  'Design system color tokens need consolidation',
  'Add CSV export for issue list',
  'Memory leak in real-time notification listener',
  'Implement drag-and-drop file attachments',
  'Search indexing fails on special characters',
  'Add bulk status change to issue list',
  'Mobile responsive breakpoints for board view',
  'API response time degradation on filtered queries',
  'Add user avatar upload functionality',
  'Webhook integration for Slack notifications',
  'Implement undo/redo for description editor',
  'Fix timezone display in activity log',
  'Add issue templates for common workflows',
];

const DESCRIPTION_TEMPLATES = [
  '## Summary\n\nThis needs to be addressed to improve the overall user experience.\n\n## Steps to Reproduce\n\n1. Navigate to the relevant section\n2. Perform the described action\n3. Observe the unexpected behavior\n\n## Expected Behavior\n\nThe system should handle this case gracefully.',
  '## Context\n\nThis feature has been requested by multiple users and aligns with our product roadmap.\n\n## Requirements\n\n- Must work across all supported browsers\n- Should be accessible via keyboard\n- Must not break existing functionality',
  '## Problem\n\nCurrent implementation has performance implications that need to be addressed.\n\n## Proposed Solution\n\nRefactor the existing approach to use a more efficient algorithm.\n\n## Impact\n\nThis will improve response times by an estimated 40%.',
  '',
];

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSubset<T>(arr: readonly T[], min: number, max: number): T[] {
  const count = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seed(): Promise<void> {
  await connectDB();

  console.log('Cleaning existing seed data...');
  await User.deleteMany({ email: { $in: ['demo@example.com', 'member@example.com'] } });
  await Label.deleteMany({ _id: { $in: LABEL_IDS } });
  await Issue.deleteMany({ reporter: { $in: Object.values(USER_IDS) } });
  await Comment.deleteMany({});
  await SavedView.deleteMany({ owner: { $in: Object.values(USER_IDS) } });

  console.log('Creating users...');
  const passwordHash = await bcrypt.hash('Password123!', 12);
  await User.create([
    {
      _id: USER_IDS.demo,
      name: 'Demo User',
      email: 'demo@example.com',
      passwordHash,
      avatarColor: '#6366F1',
    },
    {
      _id: USER_IDS.member,
      name: 'Team Member',
      email: 'member@example.com',
      passwordHash,
      avatarColor: '#EC4899',
    },
  ]);

  console.log('Creating labels...');
  await Label.create(LABELS_DATA);

  console.log('Creating 2000+ issues...');
  const users = [USER_IDS.demo, USER_IDS.member];
  const startDate = new Date('2026-01-01');
  const endDate = new Date('2026-07-15');
  const issues = [];

  for (let i = 0; i < 2100; i++) {
    const createdAt = randomDate(startDate, endDate);
    const updatedAt = randomDate(createdAt, endDate);
    const reporter = randomFrom(users);
    const assignee = Math.random() > 0.3 ? randomFrom(users) : null;
    const status = randomFrom(STATUS_VALUES);
    const priority = randomFrom(PRIORITY_VALUES);
    const issueLabels = randomSubset(LABEL_IDS, 0, 3);

    const titleBase = i < ISSUE_TITLES.length
      ? ISSUE_TITLES[i]
      : `Issue #${i + 1}: ${randomFrom(['Fix', 'Add', 'Update', 'Refactor', 'Implement', 'Remove'])} ${randomFrom(['user', 'auth', 'dashboard', 'API', 'database', 'cache', 'notification', 'search', 'filter', 'export'])} ${randomFrom(['handling', 'flow', 'logic', 'component', 'endpoint', 'service', 'module', 'feature'])}`;

    const activityLog = [];
    activityLog.push({
      type: 'created' as const,
      description: 'Issue created',
      actor: reporter,
      createdAt,
    });

    if (status !== 'backlog') {
      activityLog.push({
        type: 'status_changed' as const,
        description: `Status changed from backlog to ${status}`,
        actor: randomFrom(users),
        createdAt: randomDate(createdAt, updatedAt),
      });
    }

    if (priority !== 'none') {
      activityLog.push({
        type: 'priority_changed' as const,
        description: `Priority changed from none to ${priority}`,
        actor: randomFrom(users),
        createdAt: randomDate(createdAt, updatedAt),
      });
    }

    if (assignee) {
      activityLog.push({
        type: 'assignee_changed' as const,
        description: 'Assignee changed',
        actor: randomFrom(users),
        createdAt: randomDate(createdAt, updatedAt),
      });
    }

    if (issueLabels.length > 0) {
      for (const label of issueLabels) {
        activityLog.push({
          type: 'label_added' as const,
          description: `Label added`,
          actor: randomFrom(users),
          createdAt: randomDate(createdAt, updatedAt),
        });
      }
    }

    const subtasks = [];
    const subtaskCount = Math.floor(Math.random() * 4);
    for (let s = 0; s < subtaskCount; s++) {
      const done = Math.random() > 0.5;
      subtasks.push({
        title: `Subtask ${s + 1} for issue ${i + 1}`,
        done,
        createdAt: randomDate(createdAt, updatedAt),
      });
      activityLog.push({
        type: 'subtask_added' as const,
        description: `Subtask added: Subtask ${s + 1}`,
        actor: randomFrom(users),
        createdAt: randomDate(createdAt, updatedAt),
      });
      if (done) {
        activityLog.push({
          type: 'subtask_completed' as const,
          description: `Subtask completed: Subtask ${s + 1}`,
          actor: randomFrom(users),
          createdAt: randomDate(createdAt, updatedAt),
        });
      }
    }

    issues.push({
      title: titleBase,
      description: randomFrom(DESCRIPTION_TEMPLATES),
      status,
      priority,
      labels: issueLabels,
      assignee,
      reporter,
      subtasks,
      activityLog,
      isDeleted: false,
      createdAt,
      updatedAt,
    });
  }

  await Issue.insertMany(issues);
  const insertedIssues = await Issue.find({}).select('_id').lean();
  const issueIds = insertedIssues.map((i) => i._id);

  console.log('Creating 200+ comments...');
  const comments = [];
  for (let c = 0; c < 250; c++) {
    const issueId = randomFrom(issueIds);
    const author = randomFrom(users);
    comments.push({
      issue: issueId,
      author,
      text: randomFrom([
        'I can reproduce this. Working on a fix now.',
        'This looks like a duplicate of another issue. Should we merge?',
        'Needs more investigation. The root cause might be in the middleware layer.',
        'Fixed in the latest commit. Please verify.',
        'Agreed, this should be prioritized for the next sprint.',
        'The proposed solution works but introduces a regression. See linked PR.',
        'Added a unit test to cover this edge case.',
        'Moving this to backlog until we have bandwidth.',
        'This is blocking the release. Can someone take a look?',
        'Closing as wont-fix per team discussion.',
      ]),
      createdAt: randomDate(startDate, endDate),
    });
  }
  await Comment.insertMany(comments);

  console.log('Creating saved views...');
  await SavedView.create([
    {
      owner: USER_IDS.demo,
      name: 'My Open Bugs',
      filters: {
        status: ['todo', 'in-progress'],
        labels: [LABEL_IDS[0].toString()],
        sortBy: 'priority',
        sortOrder: 'desc',
      },
    },
    {
      owner: USER_IDS.demo,
      name: 'High Priority',
      filters: {
        priority: ['high', 'urgent'],
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      },
    },
    {
      owner: USER_IDS.demo,
      name: 'Assigned to Me',
      filters: {
        assignee: USER_IDS.demo.toString(),
        status: ['todo', 'in-progress'],
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      },
    },
  ]);

  const issueCount = await Issue.countDocuments();
  const activityCount = await Issue.aggregate([
    { $project: { count: { $size: '$activityLog' } } },
    { $group: { _id: null, total: { $sum: '$count' } } },
  ]);
  const commentCount = await Comment.countDocuments();

  console.log(`\nSeed complete:`);
  console.log(`  Users: 2`);
  console.log(`  Labels: 8`);
  console.log(`  Issues: ${issueCount}`);
  console.log(`  Activity log entries: ${activityCount[0]?.total || 0}`);
  console.log(`  Comments: ${commentCount}`);
  console.log(`  Saved views: 3`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
