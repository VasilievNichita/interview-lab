import test from 'node:test';
import assert from 'node:assert/strict';
import { lessons, scopeQuestions } from '../src/data/curriculum.ts';
const base = process.env.TEST_BASE_URL;
// Integration tests only create disposable records in a local development database.
if (base && !/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base))
  throw new Error('Integration tests require a localhost origin.');
test(
  'account lifecycle, persistence, ownership, grading and recovery',
  { skip: !base },
  async (t) => {
    const origin = base!;
    const suffix = crypto.randomUUID();
    let cookieA = '',
      cookieB = '',
      recovery = '';
    const email = `qa-${suffix}@example.test`,
      password = 'local-test-passphrase-123';
    async function req(
      path: string,
      data?: unknown,
      session = '',
      extra: Record<string, string> = {},
    ) {
      const r = await fetch(origin + '/api/' + path, {
        method: data === undefined ? 'GET' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: origin,
          ...(session ? { Cookie: session } : {}),
          ...extra,
        },
        body: data === undefined ? undefined : JSON.stringify(data),
      });
      return { status: r.status, headers: r.headers, body: (await r.json()) as any };
    }
    await t.test('reject unauthenticated writes and cross-origin requests', async () => {
      assert.equal((await req('read', { lessonId: 'internet' })).status, 401);
      assert.equal(
        (
          await req('register', { email, password, name: 'QA' }, '', {
            Origin: 'https://evil.example',
          })
        ).status,
        403,
      );
    });
    await t.test('register two isolated accounts', async () => {
      const a = await req('register', { email, password, name: 'QA learner' });
      assert.equal(a.status, 200);
      assert.equal(a.body.user.email, email);
      assert.equal(a.body.user.password_hash, undefined);
      cookieA = a.headers.get('set-cookie')!.split(';')[0];
      recovery = a.body.recoveryCode;
      assert.equal(recovery.length, 48);
      const b = await req('register', {
        email: `b-${suffix}@example.test`,
        password,
        name: 'Other learner',
      });
      assert.equal(b.status, 200);
      cookieB = b.headers.get('set-cookie')!.split(';')[0];
    });
    await t.test('refuse duplicate registration', async () => {
      assert.equal((await req('register', { email, password, name: 'Duplicate' })).status, 409);
    });
    await t.test('score on server, persist read status and retain best result', async () => {
      assert.equal((await req('read', { lessonId: 'internet' }, cookieA)).status, 200);
      const answers = lessons[0].questions.map((q) => q.answer);
      const first = await req('attempts', { scope: 'internet', answers, score: 0 }, cookieA);
      assert.equal(first.body.score, 100);
      assert.equal(first.body.saved, true);
      const second = await req(
        'attempts',
        {
          scope: 'internet',
          answers: lessons[0].questions.map((q) => (q.answer + 1) % q.options.length),
          score: 100,
        },
        cookieA,
      );
      assert.equal(second.body.score, 0);
      const p = await req('progress', undefined, cookieA);
      assert.equal(p.body.progress[0].best_score, 100);
      assert.equal(p.body.progress[0].attempts, 2);
      assert.ok(p.body.progress[0].read_at);
      assert.equal(p.body.attempts.length, 2);
    });
    await t.test('other users cannot see or overwrite progress via supplied user_id', async () => {
      const b = await req('progress', undefined, cookieB);
      assert.deepEqual(b.body.progress, []);
      await req('read', { lessonId: 'http', user_id: 'forged' }, cookieB);
      const a = await req('progress', undefined, cookieA);
      assert.equal(a.body.progress.length, 1);
    });
    await t.test('reject malformed quiz answers', async () => {
      assert.equal(
        (await req('attempts', { scope: 'internet', answers: [999, 1] }, cookieA)).status,
        400,
      );
    });
    await t.test('guest quizzes do not persist', async () => {
      const r = await req('attempts', {
        scope: 'internet',
        answers: lessons[0].questions.map((q) => q.answer),
      });
      assert.equal(r.body.saved, false);
    });
    await t.test('new login observes progress from another device', async () => {
      const r = await req('login', { email, password });
      assert.equal(r.status, 200);
      const another = r.headers.get('set-cookie')!.split(';')[0];
      assert.equal((await req('progress', undefined, another)).body.progress[0].best_score, 100);
    });
    await t.test('recovery changes password, rotates code and revokes old sessions', async () => {
      const r = await req('recover', {
        email,
        password: 'new-local-password-123',
        recoveryCode: recovery,
      });
      assert.equal(r.status, 200);
      assert.notEqual(r.body.recoveryCode, recovery);
      assert.equal((await req('me', undefined, cookieA)).body.user, null);
      assert.equal((await req('login', { email, password })).status, 401);
      assert.equal((await req('recover', { email, password, recoveryCode: recovery })).status, 401);
      cookieA = r.headers.get('set-cookie')!.split(';')[0];
      assert.equal((await req('progress', undefined, cookieA)).body.progress.length, 1);
    });
    await t.test('logout revokes server session', async () => {
      assert.equal((await req('logout', {}, cookieA)).status, 200);
      assert.equal((await req('me', undefined, cookieA)).body.user, null);
    });
    await t.test(
      'chapter mastery is stored separately from the recent history window',
      async () => {
        const scope = 'chapter:foundation';
        const answers = scopeQuestions(scope).map((q) => q.answer);
        assert.equal((await req('attempts', { scope, answers }, cookieB)).body.score, 100);
        const p = await req('progress', undefined, cookieB);
        const exam = p.body.progress.find((p: any) => p.lesson_id === scope);
        assert.equal(exam.best_score, 100);
        assert.equal(exam.read_at, null);
      },
    );
    await t.test('reject oversized JSON bodies', async () => {
      assert.equal(
        (await req('read', { lessonId: 'internet', padding: 'x'.repeat(17000) }, cookieB)).status,
        413,
      );
    });
  },
);
