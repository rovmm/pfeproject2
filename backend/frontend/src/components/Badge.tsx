export type BadgeKind =
  | 'open'
  | 'closed'
  | 'student'
  | 'professor'
  | 'admin'
  | 'free'
  | 'premium'
  | 'success'
  | 'error'
  | 'timeout'
  | 'python'
  | 'java'
  | 'cpp'
  | 'quiz'
  | 'code';

const kindClass: Record<BadgeKind, string> = {
  open: 'badge-success',
  closed: 'badge-closed',
  student: 'badge-student',
  professor: 'badge-professor',
  admin: 'badge-admin',
  free: 'badge-free',
  premium: 'badge-premium',
  success: 'badge-success',
  error: 'badge-error',
  timeout: 'badge-timeout',
  python: 'badge-python',
  java: 'badge-java',
  cpp: 'badge-cpp',
  quiz: 'badge-quiz',
  code: 'badge-python',
};

const kindLabel: Partial<Record<BadgeKind, string>> = {
  open: 'OPEN',
  closed: 'CLOSED',
};

const chipKinds: BadgeKind[] = ['python', 'java', 'cpp', 'quiz', 'code'];

export default function Badge({ kind, children }: { kind: BadgeKind; children?: React.ReactNode }) {
  const isChip = chipKinds.includes(kind);
  return (
    <span className={`badge ${kindClass[kind]} ${isChip ? 'badge-chip' : ''}`}>
      {children ?? kindLabel[kind] ?? kind.toUpperCase()}
    </span>
  );
}
