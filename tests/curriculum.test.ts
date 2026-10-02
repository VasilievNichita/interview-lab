import test from 'node:test';
import assert from 'node:assert/strict';
import { chapters, lessons, scopeQuestions } from '../src/data/curriculum.ts';
import { grade } from '../server/grading.ts';
test('all original roadmap topics have complete lessons and answer explanations', () => {
  assert.equal(chapters.length, 9);
  assert.equal(lessons.length, 39);
  assert.equal(new Set(lessons.map((l) => l.id)).size, 39);
  const qs = lessons.flatMap((l) => l.questions);
  assert.equal(new Set(qs.map((q) => q.id)).size, 117);
  for (const l of lessons) {
    assert.ok(l.sections.length >= 2);
    assert.ok(l.deeper.length > 100);
    assert.ok(l.example.length > 100);
    assert.ok(l.interview.length > 80);
    assert.equal(l.questions.length, 3);
    assert.ok(l.sources[0].url.startsWith('https://'));
    for (const q of l.questions) {
      assert.ok(q.answer >= 0 && q.answer < q.options.length);
      assert.ok(q.explanation.length > 30);
    }
  }
});
test('grading rejects forged, missing, extra and out-of-range answers', () => {
  for (const input of [null, [], [0], [0, 1, 2, 3], [-1, 1], [3, 1], ['0', 1], [0.5, 1]])
    assert.equal(grade('internet', input), null);
  assert.equal(grade('unknown', [0, 1]), null);
});
test('grading computes scores independently of the client', () => {
  for (const c of chapters) {
    const qs = scopeQuestions('chapter:' + c.id);
    const good = grade(
      'chapter:' + c.id,
      qs.map((q) => q.answer),
    );
    assert.equal(good?.score, 100);
    assert.equal(good?.passed, true);
    const bad = grade(
      'chapter:' + c.id,
      qs.map((q) => (q.answer + 1) % q.options.length),
    );
    assert.equal(bad?.score, 0);
    assert.equal(bad?.passed, false);
  }
  assert.equal(scopeQuestions('final').length, 39);
});
