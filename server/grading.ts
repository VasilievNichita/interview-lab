import { scopeQuestions } from '../src/data/curriculum';
export function grade(scope: string, answers: unknown) {
  const questions = scopeQuestions(scope);
  if (
    !questions.length ||
    !Array.isArray(answers) ||
    answers.length !== questions.length ||
    answers.some((a, i) => !Number.isInteger(a) || a < 0 || a >= questions[i].options.length)
  )
    return null;
  const results = questions.map((q, i) => ({
    id: q.id,
    correct: answers[i] === q.answer,
    answer: q.answer,
    explanation: q.explanation,
  }));
  const correct = results.filter((r) => r.correct).length;
  return {
    score: Math.round((correct / questions.length) * 100),
    correct,
    total: questions.length,
    passed: correct / questions.length >= 0.8,
    results,
  };
}
