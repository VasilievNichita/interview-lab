import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Code2,
  Compass,
  Flame,
  GraduationCap,
  Layers3,
  LogOut,
  Menu,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  X,
  Zap,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { chapters, lessons } from './data/curriculum';
import type { Attempt, Chapter, Lesson, Progress, Question, User } from './data/types';
import './style.css';

async function api<T>(path: string, data?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch('/api/' + path, {
      method: data === undefined ? 'GET' : 'POST',
      headers: data === undefined ? {} : { 'Content-Type': 'application/json' },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  } catch {
    throw new Error('Нет связи с сервером. Проверь интернет и попробуй ещё раз.');
  }
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error('Не удалось связаться с сервером. Проверь подключение.');
  }
  if (!response.ok)
    throw new Error((result as { error?: string }).error ?? 'Не удалось выполнить запрос.');
  return result as T;
}
const number = (n: number) => String(n).padStart(2, '0');
const plural = (n: number, forms: [string, string, string]) =>
  `${n} ${forms[n % 100 >= 11 && n % 100 <= 14 ? 2 : n % 10 === 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 ? 1 : 2]}`;
const complete = (p?: Progress) => !!p?.read_at && (p?.best_score ?? 0) >= 80;
const scopeTitle = (scope: string) =>
  scope === 'final'
    ? 'Итоговый экзамен'
    : scope.startsWith('chapter:')
      ? 'Экзамен: ' + (chapters.find((c) => c.id === scope.slice(8))?.title ?? scope)
      : (lessons.find((l) => l.id === scope)?.title ?? scope);
type Grade = {
  score: number;
  correct: number;
  total: number;
  passed: boolean;
  saved: boolean;
  results: { id: string; correct: boolean; answer: number; explanation: string }[];
};

function App() {
  const [route, setRoute] = useState(location.hash.slice(1) || 'home');
  const [user, setUser] = useState<User | null>(null),
    [progress, setProgress] = useState<Progress[]>([]),
    [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [auth, setAuth] = useState(false),
    [mobile, setMobile] = useState(false),
    [busy, setBusy] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (mobile) menuRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    else if (menuRef.current?.contains(document.activeElement)) menuButtonRef.current?.focus();
  }, [mobile]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobile(false);
    };
    window.addEventListener('keydown', escape);
    return () => {
      window.removeEventListener('keydown', escape);
    };
  }, []);
  useEffect(() => {
    const listener = () => {
      setRoute(location.hash.slice(1) || 'home');
      setMobile(false);
      window.scrollTo(0, 0);
      mainRef.current?.focus({ preventScroll: true });
    };
    window.addEventListener('hashchange', listener);
    return () => window.removeEventListener('hashchange', listener);
  }, []);
  const refresh = async () => {
    const data = await api<{ progress: Progress[]; attempts: Attempt[] }>('progress');
    setProgress(data.progress);
    setAttempts(data.attempts);
  };
  useEffect(() => {
    api<{ user: User | null }>('me')
      .then(async (d) => {
        setUser(d.user);
        if (d.user) await refresh();
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  const onAuth = async (u: User) => {
    setUser(u);
    setProgress([]);
    setAttempts([]);
    try {
      await refresh();
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const done = lessons.filter((l) => complete(progress.find((p) => p.lesson_id === l.id))).length;
  const readCount = progress.filter((p) => p.read_at).length;
  const next =
    lessons.find((l) => !complete(progress.find((p) => p.lesson_id === l.id))) ?? lessons[0];
  const passedExams = progress.filter(
    (p) => (p.lesson_id.startsWith('chapter:') || p.lesson_id === 'final') && p.best_score >= 80,
  ).length;
  const navigate = (value: string) => {
    location.hash = value;
  };
  const markRead = async (id: string) => {
    if (!user) {
      setAuth(true);
      return;
    }
    setBusy(true);
    try {
      await api('read', { lessonId: id });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const logout = async () => {
    setBusy(true);
    try {
      await api('logout', {});
      setUser(null);
      setProgress([]);
      setAttempts([]);
      navigate('home');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const currentLesson = route.startsWith('lesson/')
    ? lessons.find((l) => l.id === route.slice(7))
    : undefined;
  const currentChapter = route.startsWith('chapter/')
    ? chapters.find((c) => c.id === route.slice(8))
    : chapters.find((c) => c.lessons.some((l) => l.id === currentLesson?.id));
  const quizScope = route.startsWith('quiz/') ? route.slice(5) : null;
  return (
    <div className={'app-shell ' + (route === 'home' ? 'home-page' : 'inner-page')}>
      <a
        className="skip"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          mainRef.current?.focus();
        }}
      >
        Перейти к содержимому
      </a>
      {mobile && (
        <button className="overlay" aria-label="Закрыть меню" onClick={() => setMobile(false)} />
      )}
      <aside
        id="course-menu"
        ref={menuRef}
        className={'sidebar ' + (mobile ? 'is-open' : '')}
        inert={!mobile}
        onClick={(event) => {
          if ((event.target as Element).closest('a')) setMobile(false);
        }}
      >
        <button
          className="drawer-close icon-button"
          aria-label="Закрыть навигацию"
          onClick={() => setMobile(false)}
        >
          <X size={18} />
        </button>
        <a href="#home" className="brand">
          <span className="brand-icon">
            <img src="/images/warden-sigil.svg" alt="" width="32" height="32" />
          </span>
          <span>
            duskwarden<small>ЗНАНИЯ В ДЕЙСТВИИ</small>
          </span>
        </a>
        <div className="track-label">
          <span className="tiny-dot" /> FULLSTACK PATH <span>01</span>
        </div>
        <nav aria-label="Главная навигация" className="primary-nav">
          <a className={route === 'home' ? 'selected' : ''} href="#home">
            <Compass size={19} />
            Мой маршрут
          </a>
          <a className={route === 'progress' ? 'selected' : ''} href="#progress">
            <Target size={19} />
            Мой прогресс<span className="nav-count">{done}</span>
          </a>
          <a className={route === 'practice' ? 'selected' : ''} href="#practice">
            <Zap size={19} />
            Практика
          </a>
        </nav>
        <div className="nav-caption">
          ПРОГРАММА ОБУЧЕНИЯ <span>9</span>
        </div>
        <nav aria-label="Разделы программы" className="chapter-nav">
          {chapters.map((c, i) => (
            <a
              key={c.id}
              href={'#chapter/' + c.id}
              className={currentChapter?.id === c.id ? 'active' : ''}
            >
              <span className="nav-number">{number(i + 1)}</span>
              <span>{c.title}</span>
              {c.lessons.every((l) => complete(progress.find((p) => p.lesson_id === l.id))) && (
                <Check size={15} />
              )}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="mini-progress">
            <span>Твой путь</span>
            <strong>{Math.round((done / lessons.length) * 100)}%</strong>
          </div>
          <div className="bar">
            <i style={{ width: (done / lessons.length) * 100 + '%' }} />
          </div>
          <small>
            {done} из {lessons.length} тем освоено
          </small>
          <button className="profile" onClick={() => (user ? navigate('progress') : setAuth(true))}>
            <span className="avatar">
              {user ? user.name.slice(0, 1).toUpperCase() : <GraduationCap size={20} />}
            </span>
            <span>
              {user?.name ?? 'Гостевой режим'}
              <small>{user ? 'Прогресс в облаке' : 'Войди, чтобы сохранять'}</small>
            </span>
            <ChevronRight size={16} />
          </button>
        </div>
      </aside>
      <div className="workspace" inert={mobile}>
        <header className="topbar">
          <a className="wordmark" href="#home">
            duskwarden
          </a>
          <nav className="header-links" aria-label="Основные страницы">
            <a href="#home" aria-current={route === 'home' ? 'page' : undefined}>
              Обучение
            </a>
            <a href="#practice" aria-current={route === 'practice' ? 'page' : undefined}>
              Практика
            </a>
            <a href="#progress" aria-current={route === 'progress' ? 'page' : undefined}>
              Мой прогресс
            </a>
          </nav>
          <div className="top-actions">
            <button
              className="icon-button menu-toggle"
              ref={menuButtonRef}
              aria-label="Открыть меню"
              aria-expanded={mobile}
              aria-controls="course-menu"
              onClick={() => setMobile(true)}
            >
              <Menu size={20} />
            </button>
            <span className="level">
              <span /> Junior → Middle
            </span>
            {user ? (
              <button
                className="icon-button"
                disabled={busy}
                onClick={logout}
                title="Выйти"
                aria-label="Выйти"
              >
                <LogOut size={18} />
              </button>
            ) : (
              <button className="button small secondary" onClick={() => setAuth(true)}>
                Войти <ArrowUpRight size={15} />
              </button>
            )}
          </div>
        </header>
        {route !== 'home' && (
          <div className="landscape-ribbon" aria-hidden="true">
            <span className="ribbon-kicker">DUSKWARDEN / ХРОНИКИ ЗНАНИЙ</span>
            <span className="ribbon-caption">
              {currentLesson
                ? 'Одна новая идея. Ещё один шаг.'
                : quizScope
                  ? 'Остановись. Подумай. Проверь себя.'
                  : route === 'progress'
                    ? 'Посмотри, какой путь уже пройден.'
                    : 'Большой путь начинается с любопытства.'}
            </span>
          </div>
        )}
        <main id="main-content" tabIndex={-1} ref={mainRef}>
          {error && (
            <div className="error-banner" role="alert">
              <AlertCircle size={19} />
              <span>{error}</span>
              <button aria-label="Закрыть сообщение" onClick={() => setError('')}>
                <X size={16} />
              </button>
            </div>
          )}
          {loading ? (
            <div className="loading">
              <span className="spinner" /> Загружаем мастерскую…
            </div>
          ) : (
            <>
              {route === 'home' && (
                <>
                  <section className="landscape-hero" aria-labelledby="hero-title">
                    <img
                      className="hero-photo"
                      src="/images/mist-lake.jpg"
                      alt=""
                      fetchPriority="high"
                    />
                    <div className="hero-copy">
                      <img className="realm-sigil" src="/images/warden-sigil.svg" alt="" />
                      <div className="hero-eyebrow">ХРОНИКИ ТВОЕГО ПУТИ</div>
                      <h1 id="hero-title">
                        Большие цели.
                        <br />
                        Понятные шаги.
                      </h1>
                      <p>
                        От первого «как это работает» до уверенного ответа
                        <br className="desktop-break" /> на собеседовании. Изучай fullstack в своём
                        ритме.
                      </p>
                      <button
                        className="button hero-button"
                        onClick={() => navigate('lesson/' + next.id)}
                      >
                        {readCount ? 'Продолжить обучение' : 'Начать свой путь'}{' '}
                        <ArrowUpRight size={18} />
                      </button>
                    </div>
                    <span className="hero-caption">FULLSTACK · JUNIOR → MIDDLE</span>
                    <button
                      className="scroll-cue"
                      aria-label="Посмотреть программу"
                      onClick={() =>
                        document.getElementById('learning-path')?.scrollIntoView({
                          behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
                            ? 'instant'
                            : 'smooth',
                        })
                      }
                    >
                      <ChevronDown size={32} />
                    </button>
                    <span className="photo-credit">Пейзаж создан для duskwarden</span>
                  </section>
                  <div className="home-content" id="learning-path">
                    <div className="journey-intro">
                      <div>
                        <div className="eyebrow">ОДИН УРОК БЛИЖЕ К ЦЕЛИ</div>
                        <h2>{user ? user.name + ', продолжим?' : 'Знания, которые остаются.'}</h2>
                      </div>
                      <p>
                        Пойми идею. Разбери пример. Проверь себя.
                        <br />
                        Небольшие шаги складываются в уверенное понимание.
                      </p>
                    </div>
                    <a className="journey-next" href={'#lesson/' + next.id}>
                      <span className="next-number">{number(lessons.indexOf(next) + 1)}</span>
                      <div>
                        <span className="eyebrow">
                          {readCount ? 'ПРОДОЛЖИТЬ ОБУЧЕНИЕ' : 'ТВОЯ ОТПРАВНАЯ ТОЧКА'}
                        </span>
                        <h3>{next.title}</h3>
                        <p>{next.summary}</p>
                      </div>
                      <span className="next-time">
                        <Clock3 size={16} /> {next.minutes} мин
                      </span>
                      <ArrowUpRight size={26} />
                    </a>
                    <div className="stats">
                      <Stat
                        icon={<BookOpen />}
                        value={`${readCount}/${lessons.length}`}
                        label="уроков прочитано"
                      />
                      <Stat
                        icon={<CheckCircle2 />}
                        value={`${done}/${lessons.length}`}
                        label="тем закреплено"
                      />
                      <Stat icon={<Trophy />} value={`${passedExams}/10`} label="экзаменов сдано" />
                      <Stat icon={<Layers3 />} value="9" label="разделов fullstack" />
                    </div>
                    <div className="section-heading">
                      <div>
                        <h2>Твой маршрут</h2>
                        <p>От базовых понятий к проектированию систем.</p>
                      </div>
                      <span className="muted">39 тем · в своём темпе</span>
                    </div>
                    <div className="chapter-grid">
                      {chapters.map((c, i) => (
                        <ChapterCard key={c.id} chapter={c} index={i} progress={progress} />
                      ))}
                    </div>
                    {!user && (
                      <div className="guest-note">
                        <ShieldCheck size={22} />
                        <div>
                          <b>Твой прогресс — на любом устройстве</b>
                          <p>
                            Создай аккаунт, чтобы сохранять прочитанное, результаты и историю
                            попыток.
                          </p>
                        </div>
                        <button className="button secondary" onClick={() => setAuth(true)}>
                          Создать аккаунт
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
              {route.startsWith('chapter/') && currentChapter && (
                <>
                  <button className="back" onClick={() => navigate('home')}>
                    <ChevronLeft size={16} />
                    Все разделы
                  </button>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">
                        РАЗДЕЛ {number(chapters.indexOf(currentChapter) + 1)}
                      </div>
                      <h1>{currentChapter.title}</h1>
                      <p>{currentChapter.subtitle}</p>
                    </div>
                    <span className="chapter-glyph" style={{ color: currentChapter.color }}>
                      <Layers3 size={46} />
                    </span>
                  </div>
                  <div className="lesson-list">
                    {currentChapter.lessons.map((l, i) => {
                      const p = progress.find((p) => p.lesson_id === l.id);
                      return (
                        <a key={l.id} className="lesson-row" href={'#lesson/' + l.id}>
                          <span className={'lesson-number ' + (complete(p) ? 'done' : '')}>
                            {complete(p) ? <Check size={20} /> : number(i + 1)}
                          </span>
                          <div>
                            <h3>{l.title}</h3>
                            <p>{l.summary}</p>
                          </div>
                          <span className="lesson-meta">
                            {p?.read_at ? 'Прочитано' : `${l.minutes} мин`}
                            <small>
                              {p?.attempts ? `Лучший тест: ${p.best_score}%` : 'Теория + практика'}
                            </small>
                          </span>
                          <ChevronRight size={19} />
                        </a>
                      );
                    })}
                  </div>
                  <div className="exam-card">
                    <div className="exam-icon">
                      <Trophy size={28} />
                    </div>
                    <div>
                      <h2>Проверь весь раздел</h2>
                      <p>
                        {plural(
                          currentChapter.lessons.reduce((n, l) => n + l.questions.length, 0),
                          ['вопрос', 'вопроса', 'вопросов'],
                        )}{' '}
                        · проходной результат 80% · можно повторять
                      </p>
                    </div>
                    <button
                      className="button primary"
                      onClick={() => navigate('quiz/chapter:' + currentChapter.id)}
                    >
                      Начать экзамен
                    </button>
                  </div>
                </>
              )}
              {currentLesson && (
                <LessonView
                  lesson={currentLesson}
                  chapter={currentChapter!}
                  progress={progress.find((p) => p.lesson_id === currentLesson.id)}
                  onRead={() => markRead(currentLesson.id)}
                  busy={busy}
                  onQuiz={() => navigate('quiz/' + currentLesson.id)}
                  user={user}
                />
              )}
              {quizScope && (
                <Quiz
                  key={quizScope}
                  scope={quizScope}
                  user={user}
                  onSaved={refresh}
                  onAuth={() => setAuth(true)}
                />
              )}
              {route === 'practice' && (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">ПРОВЕРЬ ПОНИМАНИЕ</div>
                      <h1>Знания любят практику.</h1>
                      <p>Сначала объясни своими словами. Потом проверь себя.</p>
                    </div>
                    <Zap size={42} className="accent" />
                  </div>
                  <InterviewCards />
                  <div className="section-heading">
                    <div>
                      <h2>Экзамены по разделам</h2>
                      <p>Порог 80%. После отправки — разбор каждого ответа.</p>
                    </div>
                  </div>
                  <div className="exam-grid">
                    {chapters.map((c, i) => (
                      <a href={'#quiz/chapter:' + c.id} className="exam-tile" key={c.id}>
                        <span className="nav-number">{number(i + 1)}</span>
                        <div>
                          <h3>{c.title}</h3>
                          <p>
                            {plural(
                              c.lessons.reduce((n, l) => n + l.questions.length, 0),
                              ['вопрос', 'вопроса', 'вопросов'],
                            )}
                          </p>
                        </div>
                        <ChevronRight size={18} />
                      </a>
                    ))}
                  </div>
                  <div className="exam-card final-exam">
                    <Trophy size={38} />
                    <div>
                      <span className="eyebrow">ФИНИШНАЯ ПРЯМАЯ</span>
                      <h2>Большой fullstack-экзамен</h2>
                      <p>39 вопросов из всех разделов. Найди темы, к которым стоит вернуться.</p>
                    </div>
                    <button className="button primary" onClick={() => navigate('quiz/final')}>
                      Проверить себя
                    </button>
                  </div>
                </>
              )}
              {route === 'progress' && (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">КАЖДЫЙ ШАГ СЧИТАЕТСЯ</div>
                      <h1>Твой прогресс</h1>
                      <p>Тема освоена, когда урок прочитан и тест сдан минимум на 80%.</p>
                    </div>
                    <Target size={44} className="accent" />
                  </div>
                  {!user ? (
                    <div className="empty-state">
                      <GraduationCap size={48} />
                      <h2>Сохрани свою точку старта</h2>
                      <p>Войди в аккаунт — и результаты будут доступны с телефона и компьютера.</p>
                      <button className="button primary" onClick={() => setAuth(true)}>
                        Войти или зарегистрироваться
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="stats">
                        <Stat icon={<BookOpen />} value={`${readCount}`} label="прочитано" />
                        <Stat icon={<CheckCircle2 />} value={`${done}`} label="закреплено" />
                        <Stat icon={<Trophy />} value={`${passedExams}`} label="экзаменов сдано" />
                        <Stat
                          icon={<Target />}
                          value={`${Math.round((done / 39) * 100)}%`}
                          label="маршрута освоено"
                        />
                      </div>
                      <div className="progress-chapters">
                        {chapters.map((c) => {
                          const n = c.lessons.filter((l) =>
                            complete(progress.find((p) => p.lesson_id === l.id)),
                          ).length;
                          return (
                            <a href={'#chapter/' + c.id} key={c.id}>
                              <div>
                                <b>{c.title}</b>
                                <span>
                                  {n}/{c.lessons.length}
                                </span>
                              </div>
                              <div className="bar">
                                <i
                                  style={{
                                    width: (n / c.lessons.length) * 100 + '%',
                                    background: c.color,
                                  }}
                                />
                              </div>
                            </a>
                          );
                        })}
                      </div>
                      <div className="section-heading">
                        <div>
                          <h2>История попыток</h2>
                          <p>
                            Последние 100 проверок. Лучшие результаты уроков сохраняются отдельно.
                          </p>
                        </div>
                      </div>
                      {attempts.length ? (
                        <div className="history">
                          {attempts.map((a) => (
                            <a href={'#quiz/' + a.scope} key={a.id}>
                              <span className={'result-icon ' + (a.score >= 80 ? 'success' : '')}>
                                {a.score >= 80 ? <Check size={18} /> : <RotateCcw size={18} />}
                              </span>
                              <div>
                                <b>{scopeTitle(a.scope)}</b>
                                <small>
                                  {new Date(a.created_at * 1000).toLocaleString('ru-RU')} ·{' '}
                                  {a.total} вопросов
                                </small>
                              </div>
                              <strong className={a.score >= 80 ? 'accent' : ''}>{a.score}%</strong>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="empty-state compact">
                          <Trophy size={32} />
                          <h3>Первая проверка ещё впереди</h3>
                          <p>Пройди тест после урока — результат появится здесь.</p>
                          <a className="button secondary" href={'#lesson/' + next.id}>
                            Открыть урок
                          </a>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
              {!['home', 'progress', 'practice'].includes(route) &&
                !currentLesson &&
                !quizScope &&
                !(route.startsWith('chapter/') && currentChapter) && (
                  <div className="empty-state">
                    <h1>Страница не найдена</h1>
                    <a href="#home" className="button primary">
                      К маршруту
                    </a>
                  </div>
                )}
            </>
          )}
          <footer className="app-footer">
            <span>
              <Code2 size={15} /> duskwarden
            </span>
            <span>Понимание важнее заучивания.</span>
            <a
              href="https://github.com/VasilievNichita/interview-lab"
              target="_blank"
              rel="noreferrer"
            >
              Исходный код <ExternalLink size={13} />
            </a>
          </footer>
        </main>
      </div>
      {auth && <AuthModal onClose={() => setAuth(false)} onAuth={onAuth} />}
    </div>
  );
}
function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="stat">
      <span className="stat-icon">{icon}</span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
function ChapterCard({
  chapter: c,
  index,
  progress,
}: {
  chapter: Chapter;
  index: number;
  progress: Progress[];
}) {
  const n = c.lessons.filter((l) => complete(progress.find((p) => p.lesson_id === l.id))).length;
  return (
    <a
      href={'#chapter/' + c.id}
      className="chapter-card"
      style={{ '--chapter-color': c.color } as React.CSSProperties}
    >
      <div className="chapter-top">
        <span className="chapter-number">{number(index + 1)}</span>
        <span className="chapter-status">
          {n === c.lessons.length ? (
            <>
              <Check size={13} />
              Освоено
            </>
          ) : n ? (
            `Освоено: ${n}`
          ) : (
            plural(c.lessons.length, ['тема', 'темы', 'тем'])
          )}
        </span>
        <ArrowUpRight size={19} />
      </div>
      <h3>{c.title}</h3>
      <p>{c.subtitle}</p>
      <div className="chapter-bottom">
        <span>
          {c.lessons.length * 8} мин <i /> Теория + тест
        </span>
        <div className="segmented">
          {c.lessons.map((l) => (
            <i
              className={complete(progress.find((p) => p.lesson_id === l.id)) ? 'filled' : ''}
              key={l.id}
            />
          ))}
        </div>
      </div>
    </a>
  );
}

function LessonView({
  lesson: l,
  chapter,
  progress: p,
  onRead,
  busy,
  onQuiz,
  user,
}: {
  lesson: Lesson;
  chapter: Chapter;
  progress?: Progress;
  onRead: () => void;
  busy: boolean;
  onQuiz: () => void;
  user: User | null;
}) {
  const idx = lessons.indexOf(l),
    next = lessons[idx + 1];
  return (
    <>
      <a className="back" href={'#chapter/' + chapter.id}>
        <ChevronLeft size={16} />
        {chapter.title}
      </a>
      <div className="lesson-heading">
        <div className="eyebrow">
          УРОК {number(idx + 1)} <span>•</span> <Clock3 size={13} /> {l.minutes} МИН
        </div>
        <h1>{l.title}</h1>
        <p>{l.summary}</p>
      </div>
      <div className="reading-layout">
        <article className="lesson-article">
          <div className="takeaway">
            <Sparkles size={22} />
            <div>
              <span>ЗАПОМНИ ГЛАВНОЕ</span>
              <p>{l.takeaway}</p>
            </div>
          </div>
          {l.sections.map((s) => (
            <section key={s.title}>
              <h2>{s.title}</h2>
              <p>{s.text}</p>
            </section>
          ))}
          <section>
            <h2>Разложим по шагам</h2>
            <div className="concept-diagram">
              {l.diagram.map((d, i) => (
                <React.Fragment key={d}>
                  <div>
                    <small>{number(i + 1)}</small>
                    <span>{d}</span>
                  </div>
                  {i < l.diagram.length - 1 && <ChevronRight size={17} />}
                </React.Fragment>
              ))}
            </div>
          </section>
          <section>
            <h2>На практике</h2>
            <div className="example">
              <div>
                <Code2 size={17} /> РАЗБОР ПРИМЕРА
              </div>
              <p>{l.example}</p>
            </div>
          </section>
          <details className="deeper" open>
            <summary>
              <Layers3 size={19} />
              <span>Глубже: понимание уровня middle</span>
              <ChevronRight size={17} />
            </summary>
            <p>{l.deeper}</p>
          </details>
          <section className="interview-prompt">
            <div className="eyebrow">
              <Flame size={16} /> НА СОБЕСЕДОВАНИИ
            </div>
            <h2>Сформулируй ответ вслух</h2>
            <p>{l.interview}</p>
            <small>Попробуй объяснить за 60–90 секунд: определение, пример, компромисс.</small>
          </section>
          <section>
            <h2>Почитать первоисточник</h2>
            {l.sources.map((s) => (
              <a className="source-link" href={s.url} target="_blank" rel="noreferrer" key={s.url}>
                {s.title}
                <ExternalLink size={15} />
              </a>
            ))}
          </section>
          <div className="lesson-actions">
            <button
              className={'button ' + (p?.read_at ? 'secondary' : 'primary')}
              onClick={onRead}
              disabled={busy || !!p?.read_at}
            >
              {p?.read_at ? <Check size={17} /> : <BookOpen size={17} />}{' '}
              {p?.read_at
                ? 'Прочитано и сохранено'
                : busy
                  ? 'Сохраняем…'
                  : 'Я разобрался с теорией'}
            </button>
            <button className="button secondary" onClick={onQuiz}>
              Закрепить знания <Zap size={16} />
            </button>
          </div>
          {!user && (
            <p className="save-note">
              Читать и решать можно без аккаунта. Для сохранения прогресса понадобится вход.
            </p>
          )}
          {next && (
            <a className="next-lesson" href={'#lesson/' + next.id}>
              <span>
                Следующая тема<b>{next.title}</b>
              </span>
              <ChevronRight size={22} />
            </a>
          )}
        </article>
        <aside className="lesson-aside">
          <div className="aside-card">
            <span className="eyebrow">ТВОЙ ЧЕКПОИНТ</span>
            <div className={'checkpoint ' + (p?.read_at ? 'checked' : '')}>
              <CheckCircle2 size={18} />
              <span>Разобраться с теорией</span>
            </div>
            <div className={'checkpoint ' + ((p?.best_score ?? 0) >= 80 ? 'checked' : '')}>
              <Target size={18} />
              <span>Закрепить на 80%+</span>
            </div>
            <div className="divider" />
            <span className="muted">Лучший результат</span>
            <strong className="best-score">{p?.attempts ? `${p.best_score}%` : '—'}</strong>
            <button className="button secondary full" onClick={onQuiz}>
              К вопросам <Zap size={15} />
            </button>
          </div>
          <p className="aside-note">
            Не нужно знать всё наизусть. Важно объяснить, зачем это нужно и где может сломаться.
          </p>
        </aside>
      </div>
    </>
  );
}

function Quiz({
  scope,
  user,
  onSaved,
  onAuth,
}: {
  scope: string;
  user: User | null;
  onSaved: () => Promise<void>;
  onAuth: () => void;
}) {
  const [questions, setQuestions] = useState<Omit<Question, 'answer' | 'explanation'>[]>([]),
    [answers, setAnswers] = useState<number[]>([]),
    [result, setResult] = useState<Grade | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    api<{ questions: typeof questions }>('quiz?scope=' + encodeURIComponent(scope))
      .then((d) => {
        if (active) {
          setQuestions(d.questions);
          setAnswers(Array(d.questions.length).fill(-1));
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [scope]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await api<Grade>('attempts', { scope, answers });
      setResult(r);
      if (r.saved) await onSaved();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const answered = answers.filter((a) => a >= 0).length;
  return (
    <div className="quiz-page">
      <a className="back" href="#practice">
        <ChevronLeft size={16} />
        Все проверки
      </a>
      <div className="page-heading">
        <div>
          <div className="eyebrow">ПРОВЕРКА ЗНАНИЙ</div>
          <h1>{scopeTitle(scope)}</h1>
          <p>
            {plural(questions.length, ['вопрос', 'вопроса', 'вопросов'])} · один верный вариант ·
            проходной результат 80%
          </p>
        </div>
        <Target size={42} className="accent" />
      </div>
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      {loading ? (
        <div className="loading">Загружаем вопросы…</div>
      ) : (
        <>
          {result && (
            <div className={'quiz-result ' + (result.passed ? 'passed' : '')} role="status">
              <div
                className="score-ring"
                style={{ '--score': result.score + '%' } as React.CSSProperties}
              >
                <strong>{result.score}%</strong>
              </div>
              <div>
                <span className="eyebrow">
                  {result.passed ? 'ЕЩЁ ОДИН ШАГ ВПЕРЁД' : 'ОШИБКИ ПОКАЗЫВАЮТ, ЧТО ПОВТОРИТЬ'}
                </span>
                <h2>{result.passed ? 'Отлично, ты разобрался.' : 'Закрепим сложные моменты.'}</h2>
                <p>
                  Верно {result.correct} из {result.total}.{' '}
                  {result.saved
                    ? 'Результат сохранён в аккаунте.'
                    : 'Это гостевая попытка, результат не сохранён.'}
                </p>
                <button
                  className="button secondary"
                  onClick={() => {
                    setResult(null);
                    setAnswers(Array(questions.length).fill(-1));
                    window.scrollTo(0, 0);
                  }}
                >
                  <RotateCcw size={15} />
                  Пройти ещё раз
                </button>
                {!result.saved && (
                  <button className="text-button" onClick={onAuth}>
                    Войти для следующих попыток
                  </button>
                )}
              </div>
            </div>
          )}
          {!user && !result && (
            <p className="guest-quiz">
              <ShieldCheck size={17} />
              Гостевая попытка. <button onClick={onAuth}>Войди</button>, чтобы сохранить результат.
            </p>
          )}
          <form onSubmit={submit}>
            {questions.map((q, i) => {
              const r = result?.results[i];
              return (
                <fieldset className="question" key={q.id}>
                  <legend>
                    <span>{number(i + 1)}</span>
                    {q.prompt}
                  </legend>
                  <div className="options">
                    {q.options.map((option, j) => (
                      <label
                        className={
                          'option ' +
                          (answers[i] === j ? 'chosen ' : '') +
                          (r && r.answer === j
                            ? 'correct '
                            : r && answers[i] === j
                              ? 'incorrect'
                              : '')
                        }
                        key={option}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={j}
                          checked={answers[i] === j}
                          disabled={!!result || busy}
                          onChange={() =>
                            setAnswers((prev) => prev.map((a, k) => (k === i ? j : a)))
                          }
                        />
                        <span className="option-letter">{String.fromCharCode(65 + j)}</span>
                        <span>{option}</span>
                        {r && r.answer === j && <CheckCircle2 size={18} />}
                      </label>
                    ))}
                  </div>
                  {r && (
                    <div className={'explanation ' + (r.correct ? 'success' : '')}>
                      <b>{r.correct ? 'Верно' : 'Разберём ответ'}</b>
                      <p>{r.explanation}</p>
                    </div>
                  )}
                </fieldset>
              );
            })}
            {questions.length > 0 && !result && (
              <div className="submit-row">
                <span>
                  Ответов:{' '}
                  <b>
                    {answered}/{questions.length}
                  </b>
                </span>
                <button className="button primary" disabled={busy || answered !== questions.length}>
                  {busy ? 'Проверяем…' : 'Проверить ответы'} <CheckCircle2 size={17} />
                </button>
              </div>
            )}
          </form>
          {result && (
            <div className="result-links">
              <a
                href={
                  scope.startsWith('chapter:')
                    ? '#chapter/' + scope.slice(8)
                    : scope === 'final'
                      ? '#home'
                      : '#lesson/' + scope
                }
                className="button secondary"
              >
                Вернуться к материалу
              </a>
              <a href="#progress" className="button secondary">
                Посмотреть прогресс
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function InterviewCards() {
  const [index, setIndex] = useState(0),
    [revealed, setRevealed] = useState(false);
  const l = lessons[index];
  return (
    <section className="interview-cards">
      <div className="flash-top">
        <span className="pill">
          <Flame size={14} /> УСТНАЯ ПРАКТИКА
        </span>
        <span>
          {number(index + 1)} / {lessons.length}
        </span>
      </div>
      <h2>{l.title}</h2>
      <p>Объясни понятие, приведи пример и назови один компромисс.</p>
      {revealed ? (
        <div className="flash-answer">
          <p>{l.interview}</p>
          <a href={'#lesson/' + l.id}>
            Открыть урок <ArrowUpRight size={15} />
          </a>
        </div>
      ) : (
        <button className="button secondary" onClick={() => setRevealed(true)}>
          Показать ориентир ответа
        </button>
      )}
      <div className="flash-bottom">
        <span>Самопроверка · не влияет на баллы</span>
        <button
          className="icon-button"
          aria-label="Предыдущая карточка"
          onClick={() => {
            setIndex((index + 38) % 39);
            setRevealed(false);
          }}
        >
          <ChevronLeft />
        </button>
        <button
          className="icon-button"
          aria-label="Следующая карточка"
          onClick={() => {
            setIndex((index + 1) % 39);
            setRevealed(false);
          }}
        >
          <ChevronRight />
        </button>
      </div>
    </section>
  );
}

function AuthModal({
  onClose,
  onAuth,
}: {
  onClose: () => void;
  onAuth: (u: User) => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<'login' | 'register' | 'recover'>('register'),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [recovery, setRecovery] = useState('');
  useEffect(() => {
    const d = dialog.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const f = new FormData(e.currentTarget);
    try {
      const data = await api<{ user: User; recoveryCode?: string }>(mode, Object.fromEntries(f));
      await onAuth(data.user);
      if (data.recoveryCode) setRecovery(data.recoveryCode);
      else onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <dialog
      ref={dialog}
      className="auth-dialog"
      onCancel={(e) => {
        if (recovery) {
          e.preventDefault();
          return;
        }
        onClose();
      }}
    >
      <div className="auth-inner">
        <button className="modal-close icon-button" aria-label="Закрыть" onClick={onClose}>
          <X size={21} />
        </button>
        <span className="brand-icon">
          <Code2 size={26} />
        </span>
        {recovery ? (
          <>
            <h2>Сохрани код восстановления</h2>
            <p>
              Он понадобится, если забудешь пароль. Отправки писем нет; код показывается только
              сейчас. Сохрани его в менеджере паролей.
            </p>
            <code className="recovery-code">{recovery}</code>
            <p className="save-note">
              При восстановлении старый код заменяется новым, все прежние сеансы завершаются.
            </p>
            <button className="button primary full" onClick={onClose}>
              Я сохранил код
            </button>
          </>
        ) : (
          <>
            <h2>
              {mode === 'register'
                ? 'Твой путь начинается здесь.'
                : mode === 'login'
                  ? 'С возвращением.'
                  : 'Вернём доступ.'}
            </h2>
            <p>
              {mode === 'register'
                ? 'Один аккаунт. Все уроки и результаты — с тобой на любом устройстве.'
                : mode === 'login'
                  ? 'Войди, чтобы продолжить с того места, где остановился.'
                  : 'Введи email, сохранённый код восстановления и новый пароль.'}
            </p>
            <div className="auth-tabs">
              <button
                className={mode === 'register' ? 'active' : ''}
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
              >
                Регистрация
              </button>
              <button
                className={mode === 'login' ? 'active' : ''}
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
              >
                Вход
              </button>
            </div>
            <form onSubmit={submit}>
              {mode === 'register' && (
                <label>
                  Как тебя зовут
                  <input
                    name="name"
                    autoComplete="given-name"
                    required
                    minLength={2}
                    maxLength={60}
                    placeholder="Никита"
                  />
                </label>
              )}
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  placeholder="you@example.com"
                />
              </label>
              {mode === 'recover' && (
                <label>
                  Код восстановления
                  <input
                    name="recoveryCode"
                    autoComplete="off"
                    required
                    minLength={48}
                    maxLength={48}
                  />
                </label>
              )}
              <label>
                {mode === 'recover' ? 'Новый пароль' : 'Пароль'}
                <input
                  name="password"
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  minLength={12}
                  maxLength={128}
                  placeholder="Не меньше 12 символов"
                />
              </label>
              {error && (
                <div className="form-error" role="alert">
                  {error}
                </div>
              )}
              <button className="button primary full" disabled={busy}>
                {busy
                  ? 'Подождём ответ сервера…'
                  : mode === 'register'
                    ? 'Создать аккаунт'
                    : mode === 'login'
                      ? 'Войти'
                      : 'Восстановить доступ'}
              </button>
            </form>
            <button
              className="text-button"
              onClick={() => {
                setMode('recover');
                setError('');
              }}
            >
              Забыл пароль?
            </button>
            <p className="privacy-note">
              <ShieldCheck size={14} />
              Email используется для входа, без рассылок. Подтверждение почты не выполняется.
              Сохраняются имя, защищённые данные входа и результаты обучения.
            </p>
          </>
        )}
      </div>
    </dialog>
  );
}
createRoot(document.getElementById('root')!).render(<App />);
