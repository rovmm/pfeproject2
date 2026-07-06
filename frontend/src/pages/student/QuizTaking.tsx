import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/Icon';
import QuizOptionButton from '../../components/QuizOptionButton';
import { SkeletonTableRow } from '../../components/Skeleton';
import { quizApi } from '../../api/quiz.api';
import { useToast } from '../../components/Toast';
import type { QuestionResponse, QuizResponse } from '../../types';

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function QuizTaking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pushToast = useToast();
  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [seconds, setSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    quizApi
      .getQuiz(Number(id))
      .then((q) => {
        setQuiz(q);
        setSeconds(q.timeLimitMinutes * 60);
      })
      .catch(() => pushToast('error', 'Could not load quiz'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!quiz) return;
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [quiz]);

  if (!quiz) {
    return (
      <div style={{ padding: 40 }}>
        <SkeletonTableRow />
      </div>
    );
  }

  const questions = quiz.questions;
  const question: QuestionResponse = questions[index];
  const total = questions.length;
  const current = index + 1;
  const isLast = current === total;
  const selected = answers[question.id];
  const urgent = seconds < 60;
  const options = [
    { letter: 'A' as const, text: question.optionA },
    { letter: 'B' as const, text: question.optionB },
    { letter: 'C' as const, text: question.optionC },
    { letter: 'D' as const, text: question.optionD },
  ];

  function submitQuiz() {
    if (!id || submitting) return;
    setSubmitting(true);
    quizApi
      .submitAnswers(Number(id), {
        answers: Object.entries(answers).map(([questionId, selectedOption]) => ({
          questionId: Number(questionId),
          selectedOption,
        })),
      })
      .then((attempt) => {
        localStorage.setItem(`quiz-submitted-${id}`, '1');
        localStorage.setItem(`quiz-attempt-${id}`, JSON.stringify(attempt));
        navigate(`/student/session/${id}/results`);
      })
      .catch(() => {
        pushToast('error', 'Could not submit quiz');
        setSubmitting(false);
      });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="card" style={{ padding: '18px 30px', borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 11 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>
            Question {current} / {total}
          </span>
          <span
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: 14,
              color: urgent ? 'var(--error-strong)' : 'var(--ink-secondary)',
              background: urgent ? 'var(--error-bg)' : 'var(--surface-muted)',
              padding: '5px 12px',
              borderRadius: 999,
            }}
          >
            <Icon name="clock" size={14} /> {formatTime(seconds)}
          </span>
        </div>
        <div style={{ height: 7, background: 'var(--tint-indigo)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${(current / total) * 100}%`, height: '100%', background: 'var(--brand-gradient)', borderRadius: 999 }} />
        </div>
      </div>
      <div style={{ flex: 1, padding: '34px 40px', overflowY: 'auto' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 22, color: 'var(--ink)', lineHeight: 1.4, margin: '0 0 26px' }}>
          {question.questionText}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {options.map((opt) => (
            <QuizOptionButton
              key={opt.letter}
              letter={opt.letter}
              text={opt.text}
              selected={selected === opt.letter}
              onClick={() => setAnswers((a) => ({ ...a, [question.id]: opt.letter }))}
            />
          ))}
        </div>
      </div>
      <div className="card" style={{ display: 'flex', gap: 12, padding: '18px 40px', borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderBottom: 'none' }}>
        <button className="btn btn-secondary" style={{ border: '1.5px solid var(--border-input)', color: 'var(--ink-muted)' }} disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
          <Icon name="chevron-left" size={14} /> Previous
        </button>
        {isLast ? (
          <button className="btn" style={{ marginLeft: 'auto', background: 'var(--success)', color: '#fff' }} onClick={submitQuiz} disabled={!selected || submitting}>
            Submit Quiz
          </button>
        ) : (
          <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setIndex((i) => i + 1)} disabled={!selected}>
            Next <Icon name="chevron-right" size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
