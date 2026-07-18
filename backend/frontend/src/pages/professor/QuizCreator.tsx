import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBreadcrumb } from '../../layout/breadcrumb';
import Icon from '../../components/Icon';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import { sessionApi } from '../../api/session.api';
import { quizApi } from '../../api/quiz.api';
import type { CreateQuestionRequest } from '../../types';

type Option = { letter: 'A' | 'B' | 'C' | 'D'; text: string };
type Question = { id: string; prompt: string; options: Option[]; correct: string; open: boolean };

let qid = 0;
function newQuestion(prompt = '', options = ['', '', '', ''], correct = 'A'): Question {
  qid += 1;
  return {
    id: `q${qid}`,
    prompt,
    options: options.map((text, i) => ({ letter: 'ABCD'[i] as Option['letter'], text })),
    correct,
    open: true,
  };
}

function fromGeneratedQuestion(q: CreateQuestionRequest): Question {
  return {
    ...newQuestion(q.questionText, [q.optionA, q.optionB, q.optionC, q.optionD], (q.correctOption || 'A').toUpperCase()),
    open: false,
  };
}

export default function QuizCreator() {
  useBreadcrumb(['Quiz Creator']);
  const pushToast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const fileInput = useRef<HTMLInputElement>(null);

  const [sessionTitle, setSessionTitle] = useState('Quiz');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(0);
  const [numQuestions, setNumQuestions] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (!sessionId) return;
    sessionApi
      .getById(Number(sessionId))
      .then((s) => {
        setSessionTitle(s.title);
        setTimeLimitMinutes(s.timeLimitMinutes);
      })
      .catch(() => pushToast('error', 'Could not load session'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  function updateQuestion(id: string, patch: Partial<Question>) {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }
  function updateOption(id: string, letter: string, text: string) {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, options: q.options.map((o) => (o.letter === letter ? { ...o, text } : o)) } : q)));
  }
  function removeQuestion(id: string) {
    setQuestions((qs) => qs.filter((q) => q.id !== id));
  }

  async function generateFromPdf() {
    if (!sessionId) {
      pushToast('error', 'Missing session — go back and create the session again.');
      return;
    }
    if (!pdfFile) {
      pushToast('error', 'Please upload a PDF file first.');
      return;
    }
    setGenerating(true);
    try {
      const generated = await quizApi.generatePreview(Number(sessionId), pdfFile, numQuestions);
      if (!generated || generated.length === 0) {
        pushToast('error', "No questions could be generated from this PDF.");
        return;
      }
      setQuestions((qs) => [...qs, ...generated.map(fromGeneratedQuestion)]);
      pushToast('success', `${generated.length} questions generated`);
    } catch (err: any) {
      pushToast('error', err.response?.data?.message || 'Could not generate questions from this PDF.');
    } finally {
      setGenerating(false);
    }
  }

  async function saveQuiz() {
    if (!sessionId) {
      pushToast('error', 'Missing session — go back and create the session again.');
      return;
    }
    if (questions.length === 0) {
      pushToast('error', 'Add at least one question before saving.');
      return;
    }
    for (const q of questions) {
      if (!q.prompt.trim() || q.options.some((o) => !o.text.trim())) {
        pushToast('error', 'Please fill in all question fields before saving.');
        return;
      }
    }
    setSaving(true);
    try {
      await quizApi.createQuiz(Number(sessionId), {
        title: sessionTitle,
        timeLimitMinutes,
        questions: questions.map((q, i) => ({
          questionText: q.prompt,
          optionA: q.options[0].text,
          optionB: q.options[1].text,
          optionC: q.options[2].text,
          optionD: q.options[3].text,
          correctOption: q.correct,
          position: i,
        })),
      });
      pushToast('success', 'Quiz saved');
      navigate(`/professor/session/${sessionId}/quiz`);
    } catch (err: any) {
      pushToast('error', err.response?.data?.message || 'Could not save the quiz.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 26px 0' }}>
        <button className="btn btn-primary btn-sm" onClick={saveQuiz} disabled={saving}>
          {saving ? 'Saving…' : 'Save Quiz'}
        </button>
      </div>
      <div style={{ flex: 1, display: 'flex', gap: 22, padding: '14px 30px 24px', minHeight: 0 }}>
        <div style={{ width: 340, flexShrink: 0 }}>
          <div
            className="card"
            style={{ background: 'linear-gradient(160deg,var(--tint-indigo-strong),var(--surface-alt))', padding: 22 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
              <span className="badge badge-quiz">
                <Icon name="sparkles" size={11} /> AI
              </span>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15.5, color: 'var(--ink)' }}>Generate from PDF</span>
            </div>
            <div
              onClick={() => fileInput.current?.click()}
              style={{ border: '2px dashed var(--border-dashed)', borderRadius: 14, padding: 26, textAlign: 'center', background: 'var(--surface)', marginBottom: 16, cursor: 'pointer' }}
            >
              <input ref={fileInput} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && setPdfFile(e.target.files[0])} />
              <div style={{ marginBottom: 8, color: 'var(--navy)' }}>
                <Icon name="file-text" size={26} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{pdfFile?.name ?? 'Drop lecture PDF'}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', marginTop: 3 }}>or click to browse</div>
            </div>
            <label className="field-label">Number of questions</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <input
                type="range"
                min={1}
                max={20}
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--navy)' }}
              />
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15, color: 'var(--navy)', width: 26 }}>{numQuestions}</span>
            </div>
            <button className="btn btn-primary btn-full" onClick={generateFromPdf} disabled={generating}>
              <Icon name="sparkles" size={14} /> {generating ? 'Generating…' : 'Generate questions'}
            </button>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: 'var(--ink)', margin: 0 }}>Questions</h2>
            <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--ink-muted)' }}>{questions.length} added</span>
            <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setQuestions((qs) => [...qs, newQuestion()])}>
              + Add question
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {generating && (
              <div className="card card-pad" style={{ textAlign: 'center', color: 'var(--ink-muted)', fontSize: 13.5 }}>
                Reading the PDF and generating questions with AI…
              </div>
            )}
            {!generating && questions.length === 0 && (
              <EmptyState
                icon={<Icon name="file-text" size={26} />}
                title="No questions added yet."
                message="Click 'Add Question' or 'Generate with AI' to begin."
              />
            )}
            {questions.map((q, qi) => (
              <div key={q.id} className="card card-pad">
                {q.open ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 7,
                          background: 'var(--tint-indigo)',
                          color: 'var(--navy)',
                          fontFamily: 'var(--font-heading)',
                          fontWeight: 700,
                          fontSize: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {qi + 1}
                      </span>
                      <input
                        className="input"
                        style={{ flex: 1, fontWeight: 600 }}
                        value={q.prompt}
                        onChange={(e) => updateQuestion(q.id, { prompt: e.target.value })}
                      />
                      <span style={{ color: 'var(--ink-faint)', cursor: 'pointer' }} onClick={() => removeQuestion(q.id)}>
                        <Icon name="trash" size={16} />
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {q.options.map((o) => {
                        const isCorrect = o.letter === q.correct;
                        return (
                          <div key={o.letter} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 7,
                                background: isCorrect ? 'var(--success-bg)' : 'var(--surface-muted)',
                                color: isCorrect ? 'var(--success)' : 'var(--ink-secondary)',
                                fontFamily: 'var(--font-heading)',
                                fontWeight: 700,
                                fontSize: 11,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {o.letter}
                            </span>
                            <input
                              className="input"
                              style={{
                                flex: 1,
                                padding: '8px 11px',
                                fontSize: 13,
                                ...(isCorrect ? { border: '1.5px solid var(--tint-green-border)', background: 'var(--tint-green)' } : {}),
                              }}
                              value={o.text}
                              onChange={(e) => updateOption(q.id, o.letter, e.target.value)}
                            />
                            <button
                              className="btn btn-sm"
                              style={{
                                border: isCorrect ? 'none' : '1px solid var(--border-input)',
                                background: isCorrect ? 'var(--success)' : 'var(--surface)',
                                color: isCorrect ? '#fff' : 'var(--ink-placeholder)',
                                padding: '5px 12px',
                                borderRadius: 999,
                                fontSize: 11,
                              }}
                              onClick={() => updateQuestion(q.id, { correct: o.letter })}
                            >
                              {isCorrect && <Icon name="check" size={11} />} Correct
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 7,
                        background: 'var(--tint-indigo)',
                        color: 'var(--navy)',
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 700,
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {qi + 1}
                    </span>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{q.prompt}</span>
                    <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>
                      <Icon name="check" size={12} /> answer set
                    </span>
                    <span style={{ color: 'var(--ink-faint)', cursor: 'pointer' }} onClick={() => updateQuestion(q.id, { open: true })}>
                      <Icon name="chevron-down" size={16} />
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
