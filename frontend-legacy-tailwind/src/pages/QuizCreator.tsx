import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { quizApi } from '../api/quiz.api'
import { sessionApi } from '../api/session.api'
import { Card } from '../components/ui/Card'
import { useToast } from '../components/ui/Toast'
import type { QuestionResponse } from '../types'
import {
  ArrowLeft, Plus, Trash2, Loader2, FileUp,
  CheckCircle, X, Brain, Save, ChevronUp, ChevronDown,
} from 'lucide-react'

// ── Local draft type (before saving) ─────────────────────────────────────
interface QuestionDraft {
  questionText: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctOption: 'A' | 'B' | 'C' | 'D' | ''
  position: number
}

const EMPTY_Q = (pos: number): QuestionDraft => ({
  questionText: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctOption: '',
  position: pos,
})

// ── Small option input row ─────────────────────────────────────────────────
function OptionInput({
  label,
  value,
  onChange,
  isCorrect,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  isCorrect: boolean
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
        isCorrect
          ? 'bg-green-500 text-white'
          : 'bg-[var(--color-border)]/50 text-[var(--color-muted)]'
      }`}>
        {label}
      </span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={`Option ${label}`}
        className={`ss-input text-xs py-1.5 transition-all ${
          isCorrect ? 'border-green-500/50 bg-green-500/5' : ''
        }`}
      />
    </div>
  )
}

// ── Question card ──────────────────────────────────────────────────────────
function QuestionCard({
  q,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  q: QuestionDraft
  index: number
  total: number
  onChange: (field: keyof QuestionDraft, value: string) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const missing =
    !q.questionText.trim() ||
    !q.optionA.trim() || !q.optionB.trim() ||
    !q.optionC.trim() || !q.optionD.trim() ||
    !q.correctOption

  return (
    <div className={`relative p-4 rounded-xl border transition-all ${
      missing
        ? 'border-amber-500/30 bg-amber-500/5'
        : 'border-[var(--color-border)] bg-[var(--color-card)]'
    }`}>
      {/* Number badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold">
          <span className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs">
            {index + 1}
          </span>
          <span className="text-[var(--color-muted)]">Question {index + 1}</span>
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-1 rounded text-[var(--color-muted)] hover:text-[var(--color-text)] disabled:opacity-30 transition-colors"
            title="Monter"
          >
            <ChevronUp size={14} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="p-1 rounded text-[var(--color-muted)] hover:text-[var(--color-text)] disabled:opacity-30 transition-colors"
            title="Descendre"
          >
            <ChevronDown size={14} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1 rounded text-[var(--color-muted)] hover:text-red-500 transition-colors"
            title="Supprimer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Question text */}
      <textarea
        value={q.questionText}
        onChange={e => onChange('questionText', e.target.value)}
        rows={2}
        placeholder="Saisissez la question..."
        className="ss-input text-sm resize-none mb-3"
      />

      {/* Options 2×2 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        {(['A', 'B', 'C', 'D'] as const).map(opt => (
          <OptionInput
            key={opt}
            label={opt}
            value={q[`option${opt}` as 'optionA' | 'optionB' | 'optionC' | 'optionD']}
            onChange={v => onChange(`option${opt}` as keyof QuestionDraft, v)}
            isCorrect={q.correctOption === opt}
          />
        ))}
      </div>

      {/* Correct answer selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-[var(--color-muted)] font-medium">Bonne réponse :</span>
        {(['A', 'B', 'C', 'D'] as const).map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange('correctOption', q.correctOption === opt ? '' : opt)}
            className={`w-7 h-7 rounded-full text-xs font-bold transition-all ${
              q.correctOption === opt
                ? 'bg-green-500 text-white shadow-sm shadow-green-500/30'
                : 'bg-[var(--color-border)]/50 text-[var(--color-muted)] hover:bg-green-500/20 hover:text-green-500'
            }`}
          >
            {opt}
          </button>
        ))}
        {!q.correctOption && (
          <span className="text-xs text-amber-500">Sélectionnez la bonne réponse</span>
        )}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export function QuizCreator() {
  const { id }    = useParams<{ id: string }>()
  const sessionId = parseInt(id ?? '0')
  const navigate  = useNavigate()
  const { showToast } = useToast()
  const pdfInputRef   = useRef<HTMLInputElement>(null)

  // Session info
  const [sessionTitle, setSessionTitle] = useState('')

  // Manual editor state
  const [quizTitle, setQuizTitle]         = useState('')
  const [description, setDescription]     = useState('')
  const [timeLimit, setTimeLimit]         = useState(0)
  const [questions, setQuestions]         = useState<QuestionDraft[]>([EMPTY_Q(0)])
  const [saving, setSaving]               = useState(false)
  const [errors, setErrors]               = useState<string[]>([])

  // AI panel state
  const [pdfFile, setPdfFile]             = useState<File | null>(null)
  const [pdfTitle, setPdfTitle]           = useState('')
  const [numQuestions, setNumQuestions]   = useState(5)
  const [generating, setGenerating]       = useState(false)
  const [dragging, setDragging]           = useState(false)
  const [aiError, setAiError]             = useState('')
  const [aiSaved, setAiSaved]             = useState(false)

  useEffect(() => {
    sessionApi.getById(sessionId)
      .then(s => setSessionTitle(s.title))
      .catch(() => {})
  }, [sessionId])

  // ── Question mutations ─────────────────────────────────────────────────
  const addQuestion = () =>
    setQuestions(prev => [...prev, EMPTY_Q(prev.length)])

  const removeQuestion = (i: number) =>
    setQuestions(prev => prev.filter((_, idx) => idx !== i).map((q, idx) => ({ ...q, position: idx })))

  const updateQuestion = (i: number, field: keyof QuestionDraft, value: string) =>
    setQuestions(prev => prev.map((q, idx) => idx === i ? { ...q, [field]: value } : q))

  const moveQuestion = (i: number, dir: 'up' | 'down') => {
    const j = dir === 'up' ? i - 1 : i + 1
    if (j < 0 || j >= questions.length) return
    setQuestions(prev => {
      const arr = [...prev]
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return arr.map((q, idx) => ({ ...q, position: idx }))
    })
  }

  // ── Populate from AI response ──────────────────────────────────────────
  const populateFromAi = (qs: QuestionResponse[]) =>
    qs.map((q, i): QuestionDraft => ({
      questionText: q.questionText,
      optionA:      q.optionA,
      optionB:      q.optionB,
      optionC:      q.optionC,
      optionD:      q.optionD,
      correctOption: (['A', 'B', 'C', 'D'].includes(q.correctOption ?? '')
        ? q.correctOption as 'A' | 'B' | 'C' | 'D'
        : 'A'),
      position: i,
    }))

  // ── PDF drag-and-drop ──────────────────────────────────────────────────
  const handlePdfFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setAiError('Seuls les fichiers PDF sont acceptés.')
      return
    }
    setPdfFile(f)
    setAiError('')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handlePdfFile(f)
  }

  // ── AI generation ──────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!pdfFile) { setAiError('Sélectionnez un fichier PDF.'); return }
    const titleToUse = pdfTitle.trim() || quizTitle.trim()
    if (!titleToUse) { setAiError('Entrez un titre pour le quiz.'); return }
    if (numQuestions < 1 || numQuestions > 20) { setAiError('Entre 1 et 20 questions.'); return }

    setGenerating(true)
    setAiError('')
    try {
      const quiz = await quizApi.generateFromPdf(sessionId, pdfFile, numQuestions, titleToUse)
      setQuizTitle(quiz.title)
      setQuestions(populateFromAi(quiz.questions))
      setAiSaved(true)
      showToast(`${quiz.questions.length} questions générées et sauvegardées !`, 'success')
    } catch (err: any) {
      setAiError(err.response?.data?.message || 'Erreur lors de la génération IA.')
    } finally {
      setGenerating(false)
    }
  }

  // ── Manual save ────────────────────────────────────────────────────────
  const validate = (): string[] => {
    const errs: string[] = []
    if (!quizTitle.trim()) errs.push('Le titre du quiz est obligatoire.')
    if (questions.length === 0) errs.push('Ajoutez au moins une question.')
    questions.forEach((q, i) => {
      if (!q.questionText.trim())
        errs.push(`Question ${i + 1} : le texte est manquant.`)
      if (!q.optionA.trim() || !q.optionB.trim() || !q.optionC.trim() || !q.optionD.trim())
        errs.push(`Question ${i + 1} : toutes les options sont obligatoires.`)
      if (!q.correctOption)
        errs.push(`Question ${i + 1} : sélectionnez la bonne réponse.`)
    })
    return errs
  }

  const handleSave = async () => {
    const errs = validate()
    if (errs.length > 0) { setErrors(errs); return }
    setErrors([])
    setSaving(true)
    try {
      await quizApi.createQuiz(sessionId, {
        title: quizTitle.trim(),
        description: description.trim() || undefined,
        timeLimitMinutes: timeLimit,
        questions: questions.map((q, i) => ({
          questionText: q.questionText.trim(),
          optionA:      q.optionA.trim(),
          optionB:      q.optionB.trim(),
          optionC:      q.optionC.trim(),
          optionD:      q.optionD.trim(),
          correctOption: q.correctOption as 'A' | 'B' | 'C' | 'D',
          position: i,
        })),
      })
      showToast('Quiz créé avec succès !', 'success')
      navigate(`/professor/session/${sessionId}`)
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Erreur lors de la sauvegarde.', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 page-enter">
      {/* Back + breadcrumb */}
      <button
        onClick={() => navigate(`/professor/session/${sessionId}`)}
        className="flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
      >
        <ArrowLeft size={15} />
        {sessionTitle ? `Retour — ${sessionTitle}` : 'Retour'}
      </button>

      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
          <Brain size={20} className="text-purple-500" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text)]">Créer un quiz</h1>
          <p className="text-xs text-[var(--color-muted)]">Éditez les questions manuellement ou générez-les depuis un PDF</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ════════════════════════════════════════════════
            LEFT — AI Generation panel
        ════════════════════════════════════════════════ */}
        <Card hover={false} className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Brain size={16} className="text-purple-500" />
            <h2 className="text-sm font-bold text-[var(--color-text)]">Générer avec l'IA</h2>
          </div>

          {/* PDF drop zone */}
          <div
            onClick={() => !generating && pdfInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`
              relative flex flex-col items-center justify-center gap-3
              border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all
              ${generating ? 'pointer-events-none opacity-60' : ''}
              ${dragging
                ? 'border-purple-500 bg-purple-500/5'
                : pdfFile
                ? 'border-green-500/50 bg-green-500/5'
                : 'border-[var(--color-border)] hover:border-purple-500/50 hover:bg-purple-500/5'
              }
            `}
          >
            <input
              ref={pdfInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={e => e.target.files?.[0] && handlePdfFile(e.target.files[0])}
            />
            {pdfFile ? (
              <>
                <CheckCircle size={28} className="text-green-500" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-[var(--color-text)]">{pdfFile.name}</p>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">
                    {(pdfFile.size / 1024 / 1024).toFixed(2)} Mo
                  </p>
                </div>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setPdfFile(null); if (pdfInputRef.current) pdfInputRef.current.value = '' }}
                  className="absolute top-2 right-2 p-1 rounded-md text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/40"
                >
                  <X size={13} />
                </button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                  <FileUp size={22} className="text-purple-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[var(--color-text)]">Glissez votre PDF ici</p>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">
                    ou <span className="text-purple-500">parcourir</span>
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Title for PDF quiz */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
              Titre du quiz
            </label>
            <input
              value={pdfTitle}
              onChange={e => setPdfTitle(e.target.value)}
              placeholder="Sera utilisé si le champ de droite est vide"
              className="ss-input text-sm"
            />
          </div>

          {/* Number of questions */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
              Nombre de questions <span className="text-[var(--color-muted)] normal-case">(max 20)</span>
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={numQuestions}
              onChange={e => setNumQuestions(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
              className="ss-input text-sm w-28"
            />
          </div>

          {aiError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {aiError}
            </div>
          )}

          {aiSaved && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-xs">
              <CheckCircle size={14} />
              Quiz sauvegardé — les questions apparaissent à droite pour vérification.
            </div>
          )}

          {/* Generate button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || !pdfFile || aiSaved}
            className="w-full flex items-center justify-center gap-2 py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/15 text-sm"
          >
            {generating ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                L'IA génère vos questions… (15–30s)
              </>
            ) : (
              <>
                <Brain size={15} />
                Générer {numQuestions} question{numQuestions > 1 ? 's' : ''}
              </>
            )}
          </button>

          {aiSaved && (
            <button
              onClick={() => navigate(`/professor/session/${sessionId}`)}
              className="w-full py-2.5 text-sm font-semibold text-green-500 border border-green-500/30 rounded-xl hover:bg-green-500/10 transition-all"
            >
              Voir la session →
            </button>
          )}
        </Card>

        {/* ════════════════════════════════════════════════
            RIGHT — Manual question editor
        ════════════════════════════════════════════════ */}
        <div className="space-y-4">
          <Card hover={false} className="space-y-4">
            <h2 className="text-sm font-bold text-[var(--color-text)]">Éditeur de quiz</h2>

            {/* Quiz title */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                Titre du quiz *
              </label>
              <input
                value={quizTitle}
                onChange={e => setQuizTitle(e.target.value)}
                placeholder="ex: Quiz — Algorithmique et structures de données"
                className="ss-input"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                Description <span className="normal-case text-[var(--color-muted)]">(optionnelle)</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                placeholder="Consignes ou contexte pour les étudiants..."
                className="ss-input resize-y"
              />
            </div>

            {/* Time limit */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                Limite de temps <span className="normal-case text-[var(--color-muted)]">(minutes — 0 = illimité)</span>
              </label>
              <input
                type="number"
                min={0}
                value={timeLimit}
                onChange={e => setTimeLimit(Math.max(0, parseInt(e.target.value) || 0))}
                className="ss-input w-28"
              />
            </div>
          </Card>

          {/* Validation errors */}
          {errors.length > 0 && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 space-y-1">
              {errors.map((e, i) => (
                <p key={i} className="text-xs text-red-400 flex items-start gap-1.5">
                  <span className="mt-0.5 flex-shrink-0">•</span>
                  {e}
                </p>
              ))}
            </div>
          )}

          {/* Question cards */}
          <div className="space-y-3">
            {questions.map((q, i) => (
              <QuestionCard
                key={i}
                q={q}
                index={i}
                total={questions.length}
                onChange={(field, value) => updateQuestion(i, field, value)}
                onRemove={() => removeQuestion(i)}
                onMoveUp={() => moveQuestion(i, 'up')}
                onMoveDown={() => moveQuestion(i, 'down')}
              />
            ))}
          </div>

          {/* Add question */}
          {!aiSaved && (
            <button
              type="button"
              onClick={addQuestion}
              className="w-full py-3 border-2 border-dashed border-[var(--color-border)] rounded-xl text-sm text-[var(--color-muted)] hover:border-primary-500/40 hover:text-primary-500 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={15} />
              Ajouter une question
            </button>
          )}

          {/* Bottom action bar */}
          <div className="flex gap-3 pt-1">
            {aiSaved ? (
              <button
                onClick={() => navigate(`/professor/session/${sessionId}`)}
                className="flex-1 py-2.5 text-sm font-semibold bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
              >
                <CheckCircle size={15} />
                Voir la session
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate(`/professor/session/${sessionId}`)}
                  className="flex-1 py-2.5 text-sm border border-[var(--color-border)] rounded-xl text-[var(--color-muted)] hover:bg-[var(--color-bg)] transition-all"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 text-sm font-semibold bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {saving ? 'Sauvegarde...' : `Enregistrer le quiz (${questions.length} Q)`}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
