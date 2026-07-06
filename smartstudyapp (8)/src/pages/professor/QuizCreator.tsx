import { useRef, useState } from 'react';
import { useBreadcrumb } from '../../layout/breadcrumb';
import Icon from '../../components/Icon';
import { useToast } from '../../components/Toast';

type Option = { letter: 'A' | 'B' | 'C' | 'D'; text: string };
type Question = { id: string; prompt: string; options: Option[]; correct: string; open: boolean };

let qid = 0;
function newQuestion(prompt = '', options = ['', '', '', '']): Question {
  qid += 1;
  return {
    id: `q${qid}`,
    prompt,
    options: options.map((text, i) => ({ letter: 'ABCD'[i] as Option['letter'], text })),
    correct: 'A',
    open: true,
  };
}

export default function QuizCreator() {
  useBreadcrumb(['Quiz Creator']);
  const pushToast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [numQuestions, setNumQuestions] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([
    { ...newQuestion('Which SQL clause filters rows?', ['GROUP BY', 'WHERE', 'ORDER BY', 'HAVING']), correct: 'B' },
    { ...newQuestion('A primary key must be…', ['Nullable', 'Duplicated', 'Unique & not null', 'Text only']), open: false, correct: 'C' },
  ]);

  function updateQuestion(id: string, patch: Partial<Question>) {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }
  function updateOption(id: string, letter: string, text: string) {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, options: q.options.map((o) => (o.letter === letter ? { ...o, text } : o)) } : q)));
  }
  function removeQuestion(id: string) {
    setQuestions((qs) => qs.filter((q) => q.id !== id));
  }
  function generateFromPdf() {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      const generated = Array.from({ length: Math.min(numQuestions, 3) }, (_, i) => newQuestion(`Generated question ${i + 1} from ${pdfName ?? 'PDF'}`, ['Option A', 'Option B', 'Option C', 'Option D']));
      setQuestions((qs) => [...qs, ...generated]);
      pushToast('success', `${numQuestions} questions generated`);
    }, 1100);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 26px 0' }}>
        <button className="btn btn-primary btn-sm" onClick={() => pushToast('success', 'Quiz saved')}>
          Save Quiz
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
              <input ref={fileInput} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && setPdfName(e.target.files[0].name)} />
              <div style={{ marginBottom: 8, color: 'var(--navy)' }}>
                <Icon name="file-text" size={26} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{pdfName ?? 'Drop lecture PDF'}</div>
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
                                ...(isCorrect ? { border: '1.5px solid #9bd9b6', background: '#f4fbf7' } : {}),
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
