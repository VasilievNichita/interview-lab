import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cookie,
  digest,
  equal,
  passwordHash,
  randomToken,
  validEmail,
  validPassword,
} from '../server/security.ts';
test('password KDF is salted, reproducible and different from a plain digest', async () => {
  const a = await passwordHash('a-long-test-password', 'salt-a');
  assert.equal(a, await passwordHash('a-long-test-password', 'salt-a'));
  assert.notEqual(a, await passwordHash('a-long-test-password', 'salt-b'));
  assert.notEqual(a, await digest('a-long-test-password'));
  assert.match(a, /^pbkdf2-sha256:100000:[a-f0-9]{64}$/);
});
test('sessions use unpredictable tokens and restrictive cookies', () => {
  assert.notEqual(randomToken(), randomToken());
  assert.match(randomToken(), /^[a-f0-9]{64}$/);
  const header = cookie('token', new Request('https://example.com'));
  for (const flag of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/'])
    assert.ok(header.includes(flag));
  assert.ok(cookie('', new Request('https://example.com'), true).includes('Max-Age=0'));
});
test('input bounds and constant-length equality', () => {
  assert.ok(validPassword('long-passphrase-example'));
  assert.ok(!validPassword('short'));
  assert.ok(!validPassword('x'.repeat(129)));
  assert.ok(validEmail('learner@example.com'));
  assert.ok(!validEmail('not-an-email'));
  assert.ok(!validEmail('a b@example.com'));
  assert.ok(equal('abc', 'abc'));
  assert.ok(!equal('abc', 'abd'));
  assert.ok(!equal('a', 'ab'));
});
