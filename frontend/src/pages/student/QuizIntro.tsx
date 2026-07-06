import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBreadcrumb } from '../../layout/breadcrumb';
import Icon from '../../components/Icon';
import Badge from '../../components/Badge';
import { SkeletonTableRow } from '../../components/Skeleton';
import { sessionApi } from '../../api/session.api';
import { quizApi } from '../../api/quiz.api';
import { useToast } from '../../components/Toast';
import type { QuizResponse, SessionResponse } from '../../types';

export default function QuizIntro() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pushToast = useToast();
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const submitted = typeof window !== 'undefined' && localStorage.getItem(`quiz-submitted-${id}`) === '1';

  useEffect(() => {
    if (!id) return;
    const sessionId = Number(id);
    sessionApi.getById(sessionId).then(setSession).catch(() => pushToast('error', 'Could not load session'));
    quizApi.getQuiz(sessionId).then(setQuiz).catch(() => pushToast('error', 'Could not load quiz'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useBreadcrumb(['Sessions', quiz?.title ?? '…']);

  if (!session || !quiz) {
    return (
      <div style={{ padding: 40 }}>
        <SkeletonTableRow />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div className="card" style={{ padding: '44px 40px', width: 440, textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: 'var(--tint-indigo)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 18px',
            color: 'var(--navy)',
          }}
        >
          <Icon name="lightbulb" size={30} />
        </div>
        <Badge kind="quiz">QUIZ</Badge>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 25, color: 'var(--ink)', margin: '14px 0 6px' }}>{quiz.title}</h1>
        <p style={{ fontSize: 13.5, color: 'var(--ink-muted)', margin: '0 0 24px' }}>{session.profName}</p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
          <div style={{ flex: 1, background: 'var(--surface-alt)', border: '1px solid var(--surface-muted)', borderRadius: 13, padding: 14 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: 'var(--navy)' }}>{quiz.questionCount}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', marginTop: 2 }}>Questions</div>
          </div>
          <div style={{ flex: 1, background: 'var(--surface-alt)', border: '1px solid var(--surface-muted)', borderRadius: 13, padding: 14 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: 'var(--navy)' }}>
              {String(quiz.timeLimitMinutes).padStart(2, '0')}:00
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', marginTop: 2 }}>Time limit</div>
          </div>
        </div>
        <button
          className="btn btn-primary btn-lg btn-full"
          onClick={() => navigate(submitted ? `/student/session/${id}/results` : `/student/session/${id}/quiz/take`)}
        >
          {submitted ? 'View Results' : 'Start Quiz'} <Icon name="arrow-right" size={16} />
        </button>
      </div>
    </div>
  );
}
