import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { setupTestDB, teardownTestDB, clearCollections, app } from './setup';

let accessToken: string;
let issueId: string;

async function registerAndLogin(): Promise<string> {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Issue Tester', email: 'issue@test.com', password: 'Password123' });
  return res.body.accessToken;
}

describe('Issue API', () => {
  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearCollections();
    accessToken = await registerAndLogin();
  });

  describe('POST /api/issues', () => {
    it('should create an issue with default values', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Test issue' })
        .expect(201);

      expect(res.body.issue.title).toBe('Test issue');
      expect(res.body.issue.status).toBe('backlog');
      expect(res.body.issue.priority).toBe('none');
      expect(res.body.issue.activityLog).toHaveLength(1);
      expect(res.body.issue.activityLog[0].type).toBe('created');
      issueId = res.body.issue._id;
    });

    it('should reject without title', async () => {
      await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ description: 'No title' })
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/issues')
        .send({ title: 'Unauthed' })
        .expect(401);
    });
  });

  describe('GET /api/issues', () => {
    beforeEach(async () => {
      // create some issues
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/issues')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ title: `Issue ${i}`, status: i < 3 ? 'todo' : 'done' });
      }
    });

    it('should list issues with pagination', async () => {
      const res = await request(app)
        .get('/api/issues?limit=3')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.issues).toHaveLength(3);
      expect(res.body.nextCursor).toBeDefined();
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/issues?status=done')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.issues.length).toBe(2);
      for (const issue of res.body.issues) {
        expect(issue.status).toBe('done');
      }
    });

    it('should follow cursor for next page', async () => {
      const page1 = await request(app)
        .get('/api/issues?limit=3')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const page2 = await request(app)
        .get(`/api/issues?limit=3&cursor=${page1.body.nextCursor}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(page2.body.issues).toHaveLength(2);
      expect(page2.body.nextCursor).toBeNull();

      // no overlap
      const page1Ids = page1.body.issues.map((i: any) => i.id);
      const page2Ids = page2.body.issues.map((i: any) => i.id);
      for (const id of page2Ids) {
        expect(page1Ids).not.toContain(id);
      }
    });
  });

  describe('PATCH /api/issues/:id', () => {
    let testIssueId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Patchable', status: 'backlog', priority: 'none' });
      testIssueId = res.body.issue._id;
    });

    it('should update status and record activity', async () => {
      const res = await request(app)
        .patch(`/api/issues/${testIssueId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'in-progress' })
        .expect(200);

      expect(res.body.issue.status).toBe('in-progress');
      const statusEntries = res.body.issue.activityLog.filter(
        (e: any) => e.type === 'status_changed',
      );
      expect(statusEntries.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 404 for non-existent issue', async () => {
      await request(app)
        .patch('/api/issues/000000000000000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'done' })
        .expect(404);
    });
  });

  describe('DELETE /api/issues/:id', () => {
    it('should soft delete an issue', async () => {
      const createRes = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'To be deleted' });

      const id = createRes.body.issue._id;

      await request(app)
        .delete(`/api/issues/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      // should no longer appear in list
      const listRes = await request(app)
        .get('/api/issues')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const found = listRes.body.issues.find((i: any) => i.id === id);
      expect(found).toBeUndefined();
    });
  });

  describe('Subtasks', () => {
    let parentId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Parent issue' });
      parentId = res.body.issue._id;
    });

    it('should create and toggle a subtask', async () => {
      const createRes = await request(app)
        .post(`/api/issues/${parentId}/subtasks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Sub 1' })
        .expect(201);

      expect(createRes.body.subtask.done).toBe(false);

      const subtaskId = createRes.body.subtask._id;

      const toggleRes = await request(app)
        .patch(`/api/issues/${parentId}/subtasks/${subtaskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ done: true })
        .expect(200);

      expect(toggleRes.body.subtask.done).toBe(true);
    });

    it('should delete a subtask', async () => {
      const createRes = await request(app)
        .post(`/api/issues/${parentId}/subtasks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'To delete' });

      const subtaskId = createRes.body.subtask._id;

      await request(app)
        .delete(`/api/issues/${parentId}/subtasks/${subtaskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });
  });
});
