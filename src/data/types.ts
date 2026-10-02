export interface Question {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}
export interface Lesson {
  id: string;
  title: string;
  summary: string;
  minutes: number;
  sections: { title: string; text: string }[];
  example: string;
  deeper: string;
  interview: string;
  takeaway: string;
  diagram: string[];
  sources: { title: string; url: string }[];
  questions: Question[];
}
export interface Chapter {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  lessons: Lesson[];
}
export interface Progress {
  lesson_id: string;
  read_at: number | null;
  best_score: number;
  attempts: number;
}
export interface Attempt {
  id: string;
  scope: string;
  score: number;
  total: number;
  created_at: number;
}
export interface User {
  id: string;
  name: string;
  email: string;
  race?: 'human' | 'elf' | 'orc' | 'dwarf';
}
export type LessonInput = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string[],
  [string, string[], number, string][],
  string,
];
export function lesson(id: string, input: LessonInput): Lesson {
  const [
    title,
    summary,
    concept,
    mechanism,
    example,
    deeper,
    interview,
    takeaway,
    diagram,
    questions,
    source,
  ] = input;
  return {
    id,
    title,
    summary,
    minutes: 8,
    sections: [
      { title: 'Главная идея', text: concept },
      { title: 'Как это работает', text: mechanism },
    ],
    example,
    deeper,
    interview,
    takeaway,
    diagram,
    sources: [{ title: 'Первичная документация', url: source }],
    questions: questions.map((q, i) => ({
      id: `${id}-q${i + 1}`,
      prompt: q[0],
      options: q[1],
      answer: q[2],
      explanation: q[3],
    })),
  };
}
