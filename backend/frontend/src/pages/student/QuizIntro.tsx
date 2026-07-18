import { useNavigate, useParams } from 'react-router-dom';
import { useBreadcrumb } from '../../layout/breadcrumb';
import Icon from '../../components/Icon';
import Badge from '../../components/Badge';
import { quizMeta } from '../../lib/mockData';

export default function QuizIntro() {
  const { id } = useParams();
  const navigate = useNavigate();
  useBreadcrumb(['Sessions', quizMeta.title]);
  const submitted = typeof window !== 'undefined' && localStorage.getItem(`quiz-submitted-${id}`) === '1';

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
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 25, color: 'var(--ink)', margin: '14px 0 6px' }}>{quizMeta.title}</h1>
        <p style={{ fontSize: 13.5, color: 'var(--ink-muted)', margin: '0 0 24px' }}>{quizMeta.professor}</p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
          <div style={{ flex: 1, background: 'var(--surface-alt)', border: '1px solid var(--surface-muted)', borderRadius: 13, padding: 14 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: 'var(--navy)' }}>{quizMeta.questionCount}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', marginTop: 2 }}>Questions</div>
          </div>
          <div style={{ flex: 1, background: 'var(--surface-alt)', border: '1px solid var(--surface-muted)', borderRadius: 13, padding: 14 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: 'var(--navy)' }}>
              {String(Math.floor(quizMeta.timeLimitSec / 60)).padStart(2, '0')}:00
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
