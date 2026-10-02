import { lessons, scopeQuestions } from '../src/data/curriculum';
import { answerQuestion } from './mentor';
import { grade } from './grading';
import {
  cookie,
  digest,
  equal,
  passwordHash,
  randomToken,
  validEmail,
  validPassword,
} from './security';
interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  AI?: { run: (model: string, input: Record<string, unknown>) => Promise<{ response?: string }> };
}
interface Account {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  salt: string;
  recovery_hash: string;
  race?: string;
}
class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
const now = () => Math.floor(Date.now() / 1000);
const publicUser = (u: Account) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  race: u.race ?? 'human',
});
async function body(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw new HttpError(415, 'Ожидается JSON.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'Пустой запрос.');
  const parts: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 16384) {
      await reader.cancel();
      throw new HttpError(413, 'Слишком большой запрос.');
    }
    parts.push(value);
  }
  const buffer = new Uint8Array(length);
  let offset = 0;
  for (const p of parts) {
    buffer.set(p, offset);
    offset += p.length;
  }
  try {
    const b = JSON.parse(new TextDecoder().decode(buffer));
    if (!b || typeof b !== 'object' || Array.isArray(b)) throw 0;
    return b;
  } catch {
    throw new HttpError(400, 'Некорректный JSON.');
  }
}
async function session(request: Request, env: Env): Promise<Account | null> {
  const token = request.headers
    .get('Cookie')
    ?.match(/(?:^|;\s*)il_session=([a-f0-9]{64})(?:;|$)/)?.[1];
  if (!token) return null;
  return env.DB.prepare(
    'SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?',
  )
    .bind(await digest(token), now())
    .first<Account>();
}
async function limit(env: Env, key: string, max: number, seconds: number) {
  const t = now();
  const row = await env.DB.prepare(
    'INSERT INTO rate_limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires_at<=? THEN 1 ELSE count+1 END, expires_at=CASE WHEN expires_at<=? THEN ? ELSE expires_at END RETURNING count',
  )
    .bind(key, t + seconds, t, t, t + seconds)
    .first<{ count: number }>();
  if (!row || row.count > max)
    throw new HttpError(429, 'Слишком много попыток. Попробуй через несколько минут.');
}
async function signIn(env: Env, u: Account, request: Request, extra: Record<string, unknown> = {}) {
  const token = randomToken();
  const writes = await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE expires_at<=?').bind(now()),
    env.DB.prepare('DELETE FROM rate_limits WHERE expires_at<=?').bind(now()),
    env.DB.prepare(
      'INSERT INTO sessions(token_hash,user_id,expires_at) SELECT ?,id,? FROM users WHERE id=? AND password_hash=?',
    ).bind(await digest(token), now() + 30 * 86400, u.id, u.password_hash),
  ]);
  if (!writes[2].meta.changes) throw new HttpError(401, 'Данные входа изменились. Войди ещё раз.');
  return json({ user: publicUser(u), ...extra }, 200, { 'Set-Cookie': cookie(token, request) });
}
async function route(request: Request, env: Env) {
  const url = new URL(request.url),
    path = url.pathname,
    method = request.method;
  if (!path.startsWith('/api/')) return env.ASSETS.fetch(request);
  if (method !== 'GET' && method !== 'POST') throw new HttpError(405, 'Метод не поддерживается.');
  if (method === 'POST' && request.headers.get('Origin') !== url.origin)
    throw new HttpError(403, 'Недопустимый источник запроса.');
  if (path === '/api/health' && method === 'GET') return json({ ok: true });
  if (!env.DB) throw new HttpError(503, 'Хранилище временно недоступно.');
  if (path === '/api/me' && method === 'GET') {
    const u = await session(request, env);
    return json({ user: u ? publicUser(u) : null });
  }

  if (path === '/api/profile/restore' && method === 'POST') {
    const b = await body(request);
    await limit(
      env,
      'restore-ip:' + (await digest(request.headers.get('CF-Connecting-IP') ?? 'local')),
      15,
      900,
    );
    const code = typeof b.code === 'string' ? b.code.trim() : '';
    if (!/^(?:[a-f0-9]{48}|[a-f0-9]{64})$/.test(code))
      throw new HttpError(400, 'Проверь секретный код.');
    const found = await env.DB.prepare('SELECT * FROM users WHERE recovery_hash=?')
      .bind(await digest(code))
      .first<Account>();
    if (!found) throw new HttpError(401, 'Код не найден или уже заменён.');
    return signIn(env, found, request);
  }
  if (path === '/api/profile' && method === 'POST') {
    const b = await body(request);
    const name = typeof b.name === 'string' ? b.name.trim() : '';
    const race = typeof b.race === 'string' ? b.race : '';
    if (name.length < 2 || name.length > 60 || !['human', 'elf', 'orc', 'dwarf'].includes(race))
      throw new HttpError(400, 'Укажи имя от 2 до 60 символов и выбери расу.');
    const current = await session(request, env);
    if (current) {
      await env.DB.prepare('UPDATE users SET name=?,race=? WHERE id=?')
        .bind(name, race, current.id)
        .run();
      return json({ user: publicUser({ ...current, name, race }) });
    }
    await limit(
      env,
      'profile-ip:' + (await digest(request.headers.get('CF-Connecting-IP') ?? 'local')),
      10,
      3600,
    );
    const code = randomToken(),
      id = crypto.randomUUID();
    const profile: Account = {
      id,
      name,
      race,
      email: id + '@profile.invalid',
      password_hash: randomToken(),
      salt: randomToken(16),
      recovery_hash: await digest(code),
    };
    await env.DB.prepare(
      'INSERT INTO users(id,email,name,password_hash,salt,recovery_hash,created_at,race) VALUES(?,?,?,?,?,?,?,?)',
    )
      .bind(
        id,
        profile.email,
        name,
        profile.password_hash,
        profile.salt,
        profile.recovery_hash,
        now(),
        race,
      )
      .run();
    return signIn(env, profile, request, { transferCode: code });
  }
  if (['/api/register', '/api/login', '/api/recover'].includes(path) && method === 'POST') {
    const b = await body(request);
    const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
    if (!validEmail(email)) throw new HttpError(400, 'Введи корректный email.');
    const ip = request.headers.get('CF-Connecting-IP') ?? 'local';
    await limit(env, 'auth-ip:' + (await digest(ip)), 30, 900);
    await limit(env, 'auth-email:' + (await digest(email)), 10, 900);
    if (!validPassword(b.password))
      throw new HttpError(400, 'Пароль должен содержать от 12 до 128 символов.');
    const existing = await env.DB.prepare('SELECT * FROM users WHERE email=?')
      .bind(email)
      .first<Account>();
    if (path === '/api/register') {
      const name = typeof b.name === 'string' ? b.name.trim() : '';
      if (name.length < 2 || name.length > 60)
        throw new HttpError(400, 'Имя должно содержать от 2 до 60 символов.');
      if (existing)
        throw new HttpError(
          409,
          'Не удалось создать аккаунт. Попробуй войти или восстановить доступ.',
        );
      const salt = randomToken(16),
        recoveryCode = randomToken(24),
        u: Account = {
          id: crypto.randomUUID(),
          name,
          email,
          salt,
          password_hash: await passwordHash(b.password, salt),
          recovery_hash: await digest(recoveryCode),
        };
      try {
        await env.DB.prepare(
          'INSERT INTO users(id,email,name,password_hash,salt,recovery_hash,created_at) VALUES(?,?,?,?,?,?,?)',
        )
          .bind(u.id, email, name, u.password_hash, salt, u.recovery_hash, now())
          .run();
      } catch (e) {
        if (String(e).includes('UNIQUE'))
          throw new HttpError(409, 'Не удалось создать аккаунт. Попробуй войти.');
        throw e;
      }
      return signIn(env, u, request, { recoveryCode });
    }
    if (path === '/api/recover') {
      if (
        typeof b.recoveryCode !== 'string' ||
        b.recoveryCode.length !== 48 ||
        !existing ||
        !equal(await digest(b.recoveryCode.trim()), existing.recovery_hash)
      )
        throw new HttpError(401, 'Email или код восстановления неверен.');
      const salt = randomToken(16),
        recoveryCode = randomToken(24),
        nextHash = await passwordHash(b.password, salt),
        nextRecovery = await digest(recoveryCode);
      const recoveryWrites = await env.DB.batch([
        env.DB.prepare(
          'UPDATE users SET password_hash=?,salt=?,recovery_hash=? WHERE id=? AND recovery_hash=?',
        ).bind(nextHash, salt, nextRecovery, existing.id, existing.recovery_hash),
        env.DB.prepare(
          'DELETE FROM sessions WHERE user_id=? AND EXISTS(SELECT 1 FROM users WHERE id=? AND recovery_hash=?)',
        ).bind(existing.id, existing.id, nextRecovery),
      ]);
      if (!recoveryWrites[0].meta.changes) throw new HttpError(401, 'Код уже использован.');
      return signIn(
        env,
        { ...existing, password_hash: nextHash, salt, recovery_hash: nextRecovery },
        request,
        { recoveryCode },
      );
    }
    const candidate = await passwordHash(
      b.password,
      existing?.salt ?? '00000000000000000000000000000000',
    );
    if (!existing || !equal(candidate, existing.password_hash))
      throw new HttpError(401, 'Email или пароль неверен.');
    return signIn(env, existing, request);
  }
  const u = await session(request, env);

  if (path === '/api/profile/key' && method === 'POST') {
    if (!u) throw new HttpError(401, 'Сначала выбери героя.');
    await limit(env, 'profile-key:' + u.id, 5, 3600);
    const code = randomToken();
    await env.DB.prepare('UPDATE users SET recovery_hash=? WHERE id=?')
      .bind(await digest(code), u.id)
      .run();
    return json({ transferCode: code });
  }
  if (path === '/api/mentor' && method === 'POST') {
    if (!u) throw new HttpError(401, 'Сначала выбери имя и расу.');
    const b = await body(request);
    const question = typeof b.question === 'string' ? b.question.trim() : '';
    if (question.length < 3 || question.length > 800)
      throw new HttpError(400, 'Вопрос должен содержать от 3 до 800 символов.');
    await limit(env, 'mentor:' + u.id, 20, 3600);
    let allowAI = !!env.AI;
    try {
      await limit(env, 'mentor-day:' + Math.floor(now() / 86400), 60, 86400);
    } catch {
      allowAI = false;
    }
    return json(
      await answerQuestion(
        question,
        typeof b.lessonId === 'string' ? b.lessonId : '',
        allowAI ? env.AI : undefined,
      ),
    );
  }
  if (path === '/api/logout' && method === 'POST') {
    const token = request.headers
      .get('Cookie')
      ?.match(/(?:^|;\s*)il_session=([a-f0-9]{64})(?:;|$)/)?.[1];
    if (token)
      await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?')
        .bind(await digest(token))
        .run();
    return json({ ok: true }, 200, { 'Set-Cookie': cookie('', request, true) });
  }
  if (path === '/api/quiz' && method === 'GET') {
    const scope = url.searchParams.get('scope') ?? '';
    const qs = scopeQuestions(scope);
    if (!qs.length) throw new HttpError(404, 'Тест не найден.');
    return json({ questions: qs.map((q) => ({ id: q.id, prompt: q.prompt, options: q.options })) });
  }
  if (path === '/api/attempts' && method === 'POST') {
    const b = await body(request);
    if (typeof b.scope !== 'string') throw new HttpError(400, 'Не указан тест.');
    const result = grade(b.scope, b.answers);
    if (!result) throw new HttpError(400, 'Ответь на все вопросы корректными вариантами.');
    if (u) {
      await limit(env, 'attempt:' + u.id, 120, 3600);
      const queries = [
        env.DB.prepare(
          'INSERT INTO attempts(id,user_id,scope,score,total,created_at) VALUES(?,?,?,?,?,?)',
        ).bind(crypto.randomUUID(), u.id, b.scope, result.score, result.total, now()),
      ];
      queries.push(
        env.DB.prepare(
          'INSERT INTO progress(user_id,lesson_id,best_score,attempts,updated_at) VALUES(?,?,?,1,?) ON CONFLICT(user_id,lesson_id) DO UPDATE SET best_score=MAX(best_score,excluded.best_score),attempts=attempts+1,updated_at=excluded.updated_at',
        ).bind(u.id, b.scope, result.score, now()),
      );
      await env.DB.batch(queries);
    }
    return json({ ...result, saved: !!u });
  }
  if (!u) throw new HttpError(401, 'Войди в аккаунт, чтобы сохранить прогресс.');
  if (path === '/api/progress' && method === 'GET') {
    const [progress, attempts] = await env.DB.batch([
      env.DB.prepare(
        'SELECT lesson_id,read_at,best_score,attempts FROM progress WHERE user_id=?',
      ).bind(u.id),
      env.DB.prepare(
        'SELECT id,scope,score,total,created_at FROM attempts WHERE user_id=? ORDER BY created_at DESC LIMIT 100',
      ).bind(u.id),
    ]);
    return json({ progress: progress.results, attempts: attempts.results });
  }
  if (path === '/api/read' && method === 'POST') {
    const b = await body(request);
    if (typeof b.lessonId !== 'string' || !lessons.some((l) => l.id === b.lessonId))
      throw new HttpError(400, 'Урок не найден.');
    await env.DB.prepare(
      'INSERT INTO progress(user_id,lesson_id,read_at,updated_at) VALUES(?,?,?,?) ON CONFLICT(user_id,lesson_id) DO UPDATE SET read_at=COALESCE(read_at,excluded.read_at),updated_at=excluded.updated_at',
    )
      .bind(u.id, b.lessonId, now(), now())
      .run();
    return json({ ok: true });
  }
  throw new HttpError(404, 'Маршрут не найден.');
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    let response: Response;
    try {
      response = await route(request, env);
    } catch (e) {
      response =
        e instanceof HttpError
          ? json({ error: e.message }, e.status, e.status === 429 ? { 'Retry-After': '900' } : {})
          : json({ error: 'Сервис временно недоступен. Попробуй ещё раз.' }, 503);
    }
    const headers = new Headers(response.headers);
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
    );
    return new Response(response.body, { status: response.status, headers });
  },
};
