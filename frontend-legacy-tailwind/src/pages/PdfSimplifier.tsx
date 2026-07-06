import { useState, useRef } from 'react'
import { pdfApi } from '../api/pdf.api'
import { Card, CardHeader } from '../components/ui/Card'
import type { PdfSummaryResponse } from '../types'
import {
  FileText, Upload, Loader2, CheckCircle,
  FileUp, X, BookOpen,
} from 'lucide-react'

export function PdfSimplifier() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<PdfSummaryResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setError('Seuls les fichiers PDF sont acceptés.')
      return
    }
    setFile(f)
    setResult(null)
    setError('')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await pdfApi.summarize(file)
      setResult(res)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du résumé. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setFile(null)
    setResult(null)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-6 page-enter max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
          <FileText size={20} className="text-purple-500" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text)]">PDF Simplifier</h1>
          <p className="text-xs text-[var(--color-muted)]">Résumez n'importe quel document PDF grâce à l'IA DeepSeek</p>
        </div>
      </div>

      {/* Upload zone */}
      <Card hover={false}>
        <CardHeader title="Téléverser un fichier PDF" subtitle="Taille maximale : 50 Mo" />
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`
              relative flex flex-col items-center justify-center gap-3
              border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all
              ${dragging
                ? 'border-purple-500 bg-purple-500/5'
                : file
                ? 'border-green-500/50 bg-green-500/5'
                : 'border-[var(--color-border)] hover:border-purple-500/50 hover:bg-purple-500/5'
              }
            `}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {file ? (
              <>
                <CheckCircle size={32} className="text-green-500" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-[var(--color-text)]">{file.name}</p>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">
                    {(file.size / 1024 / 1024).toFixed(2)} Mo
                  </p>
                </div>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); reset() }}
                  className="absolute top-3 right-3 p-1 rounded-md text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/40"
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                  <FileUp size={24} className="text-purple-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    Glissez-déposez votre PDF ici
                  </p>
                  <p className="text-xs text-[var(--color-muted)] mt-1">
                    ou <span className="text-purple-500">parcourir vos fichiers</span>
                  </p>
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/20"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Génération du résumé... (peut prendre 30–60s)
              </>
            ) : (
              <>
                <Upload size={16} />
                Générer le résumé IA
              </>
            )}
          </button>
        </form>
      </Card>

      {/* Result */}
      {result && (
        <Card hover={false} className="border-purple-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-purple-500" />
              <span className="text-sm font-bold text-[var(--color-text)]">Résumé généré</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--color-muted)]">
              <span>{result.fileName}</span>
              <span>·</span>
              <span>{result.pageCount} page(s)</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]">
            <p className="text-sm text-[var(--color-text)] leading-relaxed whitespace-pre-wrap">
              {result.summary}
            </p>
          </div>

          <button
            onClick={reset}
            className="text-xs text-purple-500 hover:underline"
          >
            Analyser un autre PDF
          </button>
        </Card>
      )}
    </div>
  )
}
