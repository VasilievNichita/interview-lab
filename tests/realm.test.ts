import test from 'node:test';
import assert from 'node:assert/strict';
import { lessons } from '../src/data/curriculum.ts';
import { expanded } from '../src/data/expanded.ts';
import { answerQuestion, findMaterials } from '../server/mentor.ts';

test('every lesson has substantive topic-specific expansion and a worked exercise', () => {
  assert.equal(Object.keys(expanded).length, lessons.length);
  for (const l of lessons) {
    assert.ok(expanded[l.id], l.id);
    assert.equal(l.sections.length, 5);
    assert.ok(expanded[l.id].join(' ').length > 1500, l.id);
    assert.match(l.sections[4].text, /Практика|Задача/);
    assert.ok(l.minutes >= 10);
  }
});
test('mentor fallback answers UML truthfully without pretending to use AI', async () => {
  const d = await answerQuestion('Что такое UML таблица?', '');
  assert.equal(d.mode, 'course');
  assert.match(d.answer, /диаграмма/i);
  assert.ok(d.sources[0].url.startsWith('https://www.uml.org/'));
  const unknown = await answerQuestion('zzzzzzzz qqqqqqq', '');
  assert.match(unknown.answer, /не нашлось/);
});
test('mentor handles unavailable AI and grounds successful answers in selected materials', async () => {
  assert.ok(findMaterials('HTTP HTTPS', '')[0].id === 'http');
  const fallback = await answerQuestion('Что такое HTTP?', 'http', {
    run: async () => {
      throw new Error('quota');
    },
  });
  assert.equal(fallback.mode, 'course');
  let input: any;
  const result = await answerQuestion('Объясни кэш', 'cache', {
    run: async (_model, payload) => {
      input = payload;
      return { response: 'Кэш — копия данных.' };
    },
  });
  assert.equal(result.mode, 'ai');
  assert.equal(input.max_tokens, 1000);
  assert.ok(input.messages[1].content.includes('Кэш'));
});
const base = process.env.TEST_BASE_URL;
if (base && !/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base))
  throw new Error('Local test origin required');
test(
  'name/race profiles isolate progress and restore across devices with revocable keys',
  { skip: !base },
  async () => {
    async function req(path: string, data?: unknown, cookie = '') {
      const r = await fetch(base + '/api/' + path, {
        method: data === undefined ? 'GET' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: base!,
          ...(cookie ? { Cookie: cookie } : {}),
        },
        body: data === undefined ? undefined : JSON.stringify(data),
      });
      return {
        status: r.status,
        body: (await r.json()) as any,
        cookie: r.headers.get('set-cookie')?.split(';')[0] ?? '',
      };
    }
    const a = await req('profile', { name: 'Same Name', race: 'elf' });
    assert.equal(a.status, 200);
    assert.equal(a.body.user.race, 'elf');
    assert.match(a.body.transferCode, /^[a-f0-9]{64}$/);
    assert.equal(a.body.user.recovery_hash, undefined);
    const b = await req('profile', { name: 'Same Name', race: 'orc' });
    assert.equal(b.status, 200);
    assert.notEqual(a.body.user.id, b.body.user.id);
    assert.equal((await req('profile', { name: 'Bad', race: 'dragon' })).status, 400);
    assert.equal((await req('read', { lessonId: 'internet' }, a.cookie)).status, 200);
    assert.equal((await req('progress', undefined, b.cookie)).body.progress.length, 0);
    const restored = await req('profile/restore', { code: a.body.transferCode });
    assert.equal(restored.status, 200);
    assert.equal(restored.body.user.id, a.body.user.id);
    assert.equal(
      (await req('progress', undefined, restored.cookie)).body.progress[0].lesson_id,
      'internet',
    );
    const edited = await req('profile', { name: 'New Name', race: 'dwarf' }, restored.cookie);
    assert.equal(edited.body.user.id, a.body.user.id);
    assert.equal(edited.body.user.race, 'dwarf');
    const rotated = await req('profile/key', {}, restored.cookie);
    assert.equal(rotated.status, 200);
    assert.notEqual(rotated.body.transferCode, a.body.transferCode);
    assert.equal((await req('profile/restore', { code: a.body.transferCode })).status, 401);
    assert.equal((await req('profile/restore', { code: rotated.body.transferCode })).status, 200);
    assert.equal((await req('mentor', { question: 'Что такое UML?' })).status, 401);
    assert.equal((await req('mentor', { question: 'x' }, restored.cookie)).status, 400);
  },
);
