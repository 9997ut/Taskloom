import { Types } from 'mongoose';
import { IIssue, IActivityEntry, ActivityType } from '../models/Issue.js';

interface ActivityEntryInput {
  type: ActivityType;
  description: string;
  actor: Types.ObjectId | string;
}

export function generateActivityDiff(
  current: IIssue,
  updates: Record<string, unknown>,
  actorId: string,
): ActivityEntryInput[] {
  const entries: ActivityEntryInput[] = [];

  if (updates.status !== undefined && updates.status !== current.status) {
    entries.push({
      type: 'status_changed',
      description: `Status changed from ${current.status} to ${updates.status}`,
      actor: new Types.ObjectId(actorId),
    });
  }

  if (updates.priority !== undefined && updates.priority !== current.priority) {
    entries.push({
      type: 'priority_changed',
      description: `Priority changed from ${current.priority} to ${updates.priority}`,
      actor: new Types.ObjectId(actorId),
    });
  }

  if (updates.assignee !== undefined) {
    const currentAssignee = current.assignee?.toString() || null;
    const newAssignee = updates.assignee?.toString() || null;

    if (currentAssignee !== newAssignee) {
      entries.push({
        type: 'assignee_changed',
        description: newAssignee
          ? 'Assignee changed'
          : 'Assignee removed',
        actor: new Types.ObjectId(actorId),
      });
    }
  }

  if (updates.labels !== undefined) {
    const currentLabels = new Set(current.labels.map((l) => l.toString()));
    const newLabels = new Set((updates.labels as string[]).map((l) => l.toString()));

    for (const label of newLabels) {
      if (!currentLabels.has(label)) {
        entries.push({
          type: 'label_added',
          description: 'Label added',
          actor: new Types.ObjectId(actorId),
        });
      }
    }

    for (const label of currentLabels) {
      if (!newLabels.has(label)) {
        entries.push({
          type: 'label_removed',
          description: 'Label removed',
          actor: new Types.ObjectId(actorId),
        });
      }
    }
  }

  return entries;
}
