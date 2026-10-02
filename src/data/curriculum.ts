import { foundations } from './foundations';
import { applications } from './applications';
import { dataInfra } from './data-infra';
import { operations } from './operations';
import { design } from './design';
import { scenario } from './scenarios';
export const chapters = [
  ...foundations,
  ...applications,
  ...dataInfra,
  ...operations,
  ...design,
].map((c) => ({
  ...c,
  lessons: c.lessons.map((l) => ({ ...l, questions: [...l.questions, scenario(l.id)] })),
}));
export const lessons = chapters.flatMap((c) => c.lessons);
export function scopeQuestions(scope: string) {
  if (scope === 'final') return lessons.map((l) => l.questions[l.questions.length - 1]);
  if (scope.startsWith('chapter:'))
    return chapters.find((c) => c.id === scope.slice(8))?.lessons.flatMap((l) => l.questions) ?? [];
  return lessons.find((l) => l.id === scope)?.questions ?? [];
}
