import React, { useEffect, useRef, useState } from 'react';
import { X, Send, Settings2, Copy, Check } from 'lucide-react';
import { api } from './api';
import type { User } from './data/types';
export const races = [
  {
    id: 'human',
    name: 'Люди',
    title: 'Страж Гондора',
    call: 'Гондор зовёт на помощь',
    reply: 'И Гондор явится',
  },
  {
    id: 'elf',
    name: 'Эльфы',
    title: 'Хранительница леса',
    call: 'Лес прислушивается к тебе',
    reply: 'Мудрость эльфов отвечает',
  },
  {
    id: 'orc',
    name: 'Орки',
    title: 'Орк-наставник',
    call: 'Спрашивай, воин!',
    reply: 'Орк объяснит по делу',
  },
  {
    id: 'dwarf',
    name: 'Гномы',
    title: 'Гимли, хранитель знаний',
    call: 'Есть вопрос к гномам?',
    reply: 'Топор остёр, а ответ — точен',
  },
] as const;
type Transfer = { id: string; code: string };
export function readTransfer(): Transfer | null {
  try {
    const v = JSON.parse(localStorage.getItem('duskwarden-transfer') ?? 'null');
    return v && typeof v.id === 'string' && typeof v.code === 'string' ? v : null;
  } catch {
    return null;
  }
}
function saveTransfer(value: Transfer) {
  try {
    localStorage.setItem('duskwarden-transfer', JSON.stringify(value));
  } catch {
    /* The manually saved code still works when browser storage is disabled. */
  }
}
export function ProfileDialog({
  user,
  onClose,
  onAuth,
}: {
  user: User | null;
  onClose: () => void;
  onAuth: (u: User) => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(user?.name ?? '');
  const [race, setRace] = useState(user?.race ?? 'human');
  const [importing, setImporting] = useState(false),
    [inputCode, setInputCode] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [copied, setCopied] = useState(false);
  const saved = readTransfer();
  const [code, setCode] = useState(saved?.id === user?.id ? (saved?.code ?? '') : '');
  const [created, setCreated] = useState(false);
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (importing) {
        const d = await api<{ user: User }>('profile/restore', { code: inputCode.trim() });
        saveTransfer({ id: d.user.id, code: inputCode.trim() });
        await onAuth(d.user);
        onClose();
      } else {
        const d = await api<{ user: User; transferCode?: string }>('profile', { name, race });
        if (d.transferCode) {
          saveTransfer({ id: d.user.id, code: d.transferCode });
          setCode(d.transferCode);
          setCreated(true);
        }
        await onAuth(d.user);
        if (!d.transferCode) onClose();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function newKey() {
    setBusy(true);
    setError('');
    try {
      const d = await api<{ transferCode: string }>('profile/key', {});
      if (user) {
        saveTransfer({ id: user.id, code: d.transferCode });
        setCode(d.transferCode);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="auth-dialog hero-dialog"
      aria-labelledby="profile-title"
      onCancel={onClose}
    >
      <div className="auth-inner">
        <button className="modal-close icon-button" aria-label="Закрыть профиль" onClick={onClose}>
          <X size={20} />
        </button>
        <div className="eyebrow">ЛЕТОПИСЬ ПУТЕШЕСТВЕННИКА</div>
        <h2 id="profile-title">
          {created
            ? 'Твой путь сохранён'
            : importing
              ? 'Вернуть свой путь'
              : user
                ? 'Твой герой'
                : 'Назови своего героя'}
        </h2>
        {created ? (
          <>
            <p>
              Сохрани секретный код. Он открывает твой прогресс на другом устройстве. Не передавай
              его другим людям.
            </p>
            <code className="recovery-code">{code}</code>
            <button
              className="button secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(code);
                  setCopied(true);
                } catch {
                  setError('Выдели код и скопируй вручную.');
                }
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}{' '}
              {copied ? 'Скопировано' : 'Скопировать код'}
            </button>
            <button className="button primary full" onClick={onClose}>
              Код сохранён — в путь
            </button>
          </>
        ) : (
          <>
            <p>
              {importing
                ? 'Введи код переноса. Подойдёт и старый код восстановления: прежний прогресс сохранится.'
                : 'Только имя и раса. Прогресс сохраняется автоматически, без email и пароля.'}
            </p>
            <form onSubmit={submit}>
              {importing ? (
                <label>
                  Секретный код
                  <input
                    autoComplete="off"
                    name="transferCode"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    required
                    minLength={48}
                    maxLength={64}
                  />
                </label>
              ) : (
                <>
                  <label>
                    Твоё имя
                    <input
                      name="name"
                      autoComplete="given-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      minLength={2}
                      maxLength={60}
                      placeholder="Никита"
                    />
                  </label>
                  <fieldset className="race-picker">
                    <legend>Выбери расу и спутника</legend>
                    {races.map((r) => (
                      <label
                        className={'race-choice ' + (race === r.id ? 'chosen' : '')}
                        key={r.id}
                      >
                        <input
                          type="radio"
                          name="race"
                          value={r.id}
                          checked={race === r.id}
                          onChange={() => setRace(r.id)}
                        />
                        <img src={'/images/companions/' + r.id + '.png'} alt="" />
                        <span>{r.name}</span>
                      </label>
                    ))}
                  </fieldset>
                </>
              )}
              <button className="button primary full" disabled={busy}>
                {busy
                  ? 'Сохраняем…'
                  : importing
                    ? 'Восстановить путь'
                    : user
                      ? 'Сохранить героя'
                      : 'Начать путь'}
              </button>
            </form>
            <button
              className="text-button"
              onClick={() => {
                setImporting(!importing);
                setError('');
              }}
            >
              {importing ? 'Вернуться к герою' : 'У меня есть код переноса'}
            </button>
            {user && !importing && (
              <details className="transfer-settings">
                <summary>Перенос на другое устройство</summary>
                <p>Код даёт доступ к этому прогрессу. Храни его как пароль.</p>
                {code ? (
                  <code className="recovery-code">{code}</code>
                ) : (
                  <p>
                    На этом устройстве код не сохранён. Можно выдать новый; прежний перестанет
                    работать.
                  </p>
                )}
                <button disabled={busy} className="button secondary" onClick={newKey}>
                  {code ? 'Заменить секретный код' : 'Получить код переноса'}
                </button>
              </details>
            )}
          </>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </dialog>
  );
}
type Answer = {
  answer: string;
  mode: 'ai' | 'course';
  sources: { title: string; url: string }[];
  notice?: string;
};
function InlineAnswer({ text }: { text: string }) {
  return text
    .split(/(\*\*[^*\n]+\*\*|`[^`\n]+`)/g)
    .map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : part.startsWith('`') && part.endsWith('`') ? (
        <code key={i}>{part.slice(1, -1)}</code>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      ),
    );
}
export function Companion({
  user,
  lessonId,
  onSetup,
}: {
  user: User | null;
  lessonId?: string;
  onSetup: () => void;
}) {
  const [open, setOpen] = useState(false),
    [question, setQuestion] = useState(''),
    [answer, setAnswer] = useState<Answer | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const field = useRef<HTMLTextAreaElement>(null),
    trigger = useRef<HTMLButtonElement>(null);
  const race = races.find((r) => r.id === user?.race) ?? races[0];
  useEffect(() => {
    if (open) field.current?.focus();
  }, [open]);
  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setAnswer(null);
    try {
      setAnswer(await api<Answer>('mentor', { question, lessonId }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <aside className="companion" aria-label="Учебный спутник">
      {open && user && (
        <section
          className="npc-dialog"
          role="dialog"
          aria-modal="false"
          aria-labelledby="npc-title"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              close();
            }
          }}
        >
          <header>
            <div>
              <span className="eyebrow">{race.title}</span>
              <h2 id="npc-title">{race.call}</h2>
            </div>
            <button className="icon-button" aria-label="Закрыть помощника" onClick={close}>
              <X size={18} />
            </button>
          </header>
          <p className="npc-intro">
            {user.name}, задай вопрос о разработке. Например: «Что такое UML-диаграмма?»
          </p>
          <form onSubmit={ask}>
            <label htmlFor="mentor-question">Твой вопрос</label>
            <textarea
              ref={field}
              id="mentor-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
              minLength={3}
              maxLength={800}
              rows={3}
              placeholder="Что хочешь понять?"
            />
            <button className="button primary" disabled={busy || question.trim().length < 3}>
              <Send size={16} />
              {busy ? 'Спутник размышляет…' : 'Позвать на помощь'}
            </button>
          </form>
          <div aria-live="polite" aria-busy={busy}>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            {answer && (
              <>
                <h3 className="npc-reply-title">{race.reply}</h3>
                <p className="npc-notice">{answer.notice}</p>
                <div className="npc-answer">
                  {answer.answer.split(/```[^\n]*\n([\s\S]*?)```/g).map((part, i) =>
                    i % 2 ? (
                      <pre key={i}>
                        <code>{part.trim()}</code>
                      </pre>
                    ) : (
                      <InlineAnswer key={i} text={part} />
                    ),
                  )}
                </div>
                {answer.sources.length > 0 && (
                  <nav className="npc-sources" aria-label="Материалы к ответу">
                    {answer.sources.map((s) => (
                      <a
                        key={s.url}
                        href={s.url}
                        target={s.url.startsWith('#') ? undefined : '_blank'}
                        rel="noreferrer"
                        onClick={() => {
                          if (s.url.startsWith('#')) setOpen(false);
                        }}
                      >
                        {s.title} ↗
                      </a>
                    ))}
                  </nav>
                )}
              </>
            )}
          </div>
          <footer>
            <small>Вопрос отправляется Cloudflare AI. Не вводи секретные данные.</small>
            <button
              className="icon-button"
              aria-label="Изменить героя"
              onClick={() => {
                setOpen(false);
                onSetup();
              }}
            >
              <Settings2 size={16} />
            </button>
          </footer>
        </section>
      )}
      <button
        ref={trigger}
        className="npc-trigger"
        aria-label={
          user
            ? open
              ? 'Скрыть спутника'
              : 'Спросить спутника: ' + race.title
            : 'Выбрать своего спутника'
        }
        aria-expanded={open}
        onClick={() => {
          if (!user) onSetup();
          else if (open) close();
          else setOpen(true);
        }}
      >
        <img
          src={user ? '/images/companions/' + race.id + '.png' : '/images/warden-sigil.svg'}
          alt=""
        />
        <span>{user ? 'Спросить спутника' : 'Выбрать героя'}</span>
      </button>
    </aside>
  );
}
