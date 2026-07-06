export type SessionType = 'code' | 'quiz';
export type SessionStatus = 'open' | 'closed';

export type StudentSession = {
  id: string;
  type: SessionType;
  title: string;
  professor: string;
  when: string;
  status: SessionStatus;
  language?: string;
  joinCode: string;
};

export const studentSessions: StudentSession[] = [
  {
    id: 's1',
    type: 'code',
    title: 'Recursion warm-up',
    professor: 'Prof. Diallo',
    when: 'Today, 14:00',
    status: 'open',
    language: 'PYTHON',
    joinCode: '7K9P4T',
  },
  {
    id: 's2',
    type: 'quiz',
    title: 'Chapter 4 — Databases',
    professor: 'Prof. Nakamura',
    when: 'Today, 10:30',
    status: 'open',
    joinCode: 'M2X8QR',
  },
  {
    id: 's3',
    type: 'code',
    title: 'Sorting algorithms',
    professor: 'Prof. Diallo',
    when: 'Jul 2',
    status: 'closed',
    language: 'JAVA',
    joinCode: 'A1B2C3',
  },
];

export type ProfessorSession = {
  id: string;
  type: SessionType;
  title: string;
  filiere: string;
  language?: string;
  joinCode: string;
  studentsJoined: number;
  status: SessionStatus;
};

export const professorSessions: ProfessorSession[] = [
  {
    id: 'p1',
    type: 'code',
    title: 'Recursion warm-up',
    filiere: 'L2 INFO',
    language: 'PYTHON',
    joinCode: '7K9P4T',
    studentsJoined: 24,
    status: 'open',
  },
  {
    id: 'p2',
    type: 'quiz',
    title: 'Chapter 4 — Databases',
    filiere: 'L3 INFO',
    joinCode: 'M2X8QR',
    studentsJoined: 31,
    status: 'open',
  },
];

export const exercisePrompt = {
  language: 'PYTHON',
  professor: 'Prof. Diallo',
  title: 'Exercise prompt',
  body: "Write a function factorial(n) that returns n! using recursion. Handle n = 0 → 1. Read n from standard input and print the result.",
  example: { input: '5', output: '120' },
  starterCode: `def factorial(n):
    if n == 0:
        return 1
    return n * factorial(n - 1)

print(factorial(int(input())))`,
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: { letter: 'A' | 'B' | 'C' | 'D'; text: string }[];
  correct: 'A' | 'B' | 'C' | 'D';
};

export const quizMeta = {
  title: 'Chapter 4 — Databases',
  professor: 'Prof. Nakamura',
  questionCount: 10,
  timeLimitSec: 15 * 60,
};

export const quizQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    prompt: 'Which SQL clause is used to filter rows returned by a query?',
    options: [
      { letter: 'A', text: 'GROUP BY' },
      { letter: 'B', text: 'WHERE' },
      { letter: 'C', text: 'ORDER BY' },
      { letter: 'D', text: 'HAVING' },
    ],
    correct: 'B',
  },
  {
    id: 'q2',
    prompt: 'Which join returns only rows with matches in both tables?',
    options: [
      { letter: 'A', text: 'LEFT JOIN' },
      { letter: 'B', text: 'RIGHT JOIN' },
      { letter: 'C', text: 'INNER JOIN' },
      { letter: 'D', text: 'FULL OUTER JOIN' },
    ],
    correct: 'C',
  },
  {
    id: 'q3',
    prompt: 'What must be true of a primary key column?',
    options: [
      { letter: 'A', text: 'Can contain duplicates' },
      { letter: 'B', text: 'Can be null' },
      { letter: 'C', text: 'Unique & not null' },
      { letter: 'D', text: 'Must be text type' },
    ],
    correct: 'C',
  },
];

export const quizResult = {
  studentName: 'Manar',
  correct: 8,
  total: 10,
  pct: 80,
  timeTaken: '6:12',
  classAverage: 71,
  breakdown: [
    { question: 'Q3 · SQL filter clause', yourAnswer: 'WHERE', correct: true },
    { question: 'Q7 · INNER vs OUTER join', yourAnswer: 'LEFT JOIN', correctAnswer: 'INNER JOIN', correct: false },
    { question: 'Q8 · Primary key property', yourAnswer: 'Unique & not null', correct: true },
  ],
};

export const leaderboard = [
  { initials: 'AT', name: 'Amina T.', score: 90, time: '5:40', avatarBg: 'var(--tint-indigo-strong)', avatarColor: 'var(--blue-accent)' },
  { initials: 'LM', name: 'Léa M.', score: 80, time: '6:12', isYou: true },
  { initials: 'YK', name: 'Youssef K.', score: 70, time: '7:03', avatarBg: 'var(--tint-green)', avatarColor: 'var(--success)' },
  { initials: 'SN', name: 'Sara N.', score: 60, time: '8:20', avatarBg: 'var(--tint-pink)', avatarColor: '#c14a7a' },
  { initials: 'HB', name: 'Hana B.', score: 50, time: '9:01', avatarBg: 'var(--tint-amber)', avatarColor: 'var(--amber-strong)' },
];

export const liveSubmissions = [
  {
    initials: 'AT',
    name: 'Amina T.',
    status: 'PASSED' as const,
    code: 'def factorial(n):\n    return 1 if n==0…',
    avatarBg: 'var(--tint-indigo-strong)',
    avatarColor: 'var(--blue-accent)',
  },
  {
    initials: 'YK',
    name: 'Youssef K.',
    status: 'WORKING' as const,
    code: 'typing…',
    avatarBg: 'var(--tint-indigo)',
    avatarColor: 'var(--navy-light)',
  },
  {
    initials: 'SN',
    name: 'Sara N.',
    status: 'ERROR' as const,
    code: 'RecursionError: max depth',
    avatarBg: 'var(--tint-pink)',
    avatarColor: '#c14a7a',
  },
  {
    initials: 'HB',
    name: 'Hana B.',
    status: 'PASSED' as const,
    code: 'n=5 → 120 ✓',
    avatarBg: 'var(--tint-green)',
    avatarColor: 'var(--success)',
  },
];

export const codeHistory = [
  { label: 'Run · 38ms', desc: 'math.sqrt loop', when: 'just now', ok: true },
  { label: 'Error · 21ms', desc: 'NameError', when: '2 min ago', ok: false },
  { label: 'Run · 44ms', desc: 'fibonacci(10)', when: '10 min ago', ok: true },
];

export const pastSummaries = [
  { name: 'lecture-04-databases.pdf', when: 'Today, 09:14' },
  { name: 'algo-complexity.pdf', when: 'Jul 3' },
  { name: 'os-scheduling.pdf', when: 'Jul 1' },
];

export type AdminUser = {
  initials: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'PROFESSOR' | 'ADMIN';
  joined: string;
  avatarBg: string;
  avatarColor: string;
};

export const adminUsers: AdminUser[] = [
  { initials: 'AT', name: 'Amina Toure', email: 'amina.t@etu.uae.ac.ma', role: 'STUDENT', joined: 'Jun 12', avatarBg: 'var(--tint-indigo-strong)', avatarColor: 'var(--blue-accent)' },
  { initials: 'MD', name: 'M. Diallo', email: 'm.diallo@etu.uae.ac.ma', role: 'PROFESSOR', joined: 'May 3', avatarBg: 'var(--tint-indigo)', avatarColor: 'var(--navy-light)' },
  { initials: 'YK', name: 'Youssef Kane', email: 'y.kane@etu.uae.ac.ma', role: 'STUDENT', joined: 'Jul 1', avatarBg: 'var(--tint-green)', avatarColor: 'var(--success)' },
  { initials: 'SN', name: 'Sara Nour', email: 'sara.n@etu.uae.ac.ma', role: 'STUDENT', joined: 'Jun 28', avatarBg: 'var(--tint-pink)', avatarColor: '#c14a7a' },
];

export const adminStats = {
  totalUsers: 1284,
  sessions: 3912,
  codeExecutions: '48.2k',
  pdfSummaries: 6740,
};
