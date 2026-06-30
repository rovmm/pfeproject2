import { useState, useRef } from 'react'
import Editor from '@monaco-editor/react'
import { codeApi } from '../api/code.api'
import { Card } from '../components/ui/Card'
import { LANGUAGES } from '../types'
import type { Language, CodeExecuteResponse } from '../types'
import {
  Play, Loader2, Bot, ChevronDown, RotateCcw,
  CheckCircle, XCircle, Clock, Code2,
} from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

const STARTERS: Record<Language, string> = {
  python: `# Bonjour depuis Python!\nprint("Hello, SmartStudy!")`,
  javascript: `// Bonjour depuis JavaScript!\nconsole.log("Hello, SmartStudy!");`,
  typescript: `// Bonjour depuis TypeScript!\nconst message: string = "Hello, SmartStudy!";\nconsole.log(message);`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, SmartStudy!");\n    }\n}`,
  cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello, SmartStudy!" << endl;\n    return 0;\n}`,
  php: `<?php\necho "Hello, SmartStudy!\\n";`,
}

export function CodeEditor() {
  const { theme } = useTheme()
  const [language, setLanguage] = useState<Language>('python')
  const [code, setCode] = useState(STARTERS.python)
  const [stdin, setStdin] = useState('')
  const [result, setResult] = useState<CodeExecuteResponse | null>(null)
  const [running, setRunning] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [analyzingAi, setAnalyzingAi] = useState(false)
  const [showStdin, setShowStdin] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const editorRef = useRef<any>(null)

  const selectedLang = LANGUAGES.find(l => l.value === language)!

  const handleLangChange = (lang: Language) => {
    setLanguage(lang)
    setCode(STARTERS[lang])
    setResult(null)
    setAiAnalysis('')
    setLangOpen(false)
  }

  const handleRun = async () => {
    if (!code.trim()) return
    setRunning(true)
    setResult(null)
    setAiAnalysis('')
    try {
      const res = await codeApi.execute({ code, language, stdin: stdin || undefined })
      setResult(res)
    } catch (err: any) {
      setResult({
        success: false,
        output: '',
        error: err.response?.data?.message || 'Erreur réseau',
        status: 'ERROR',
        language,
        executionTimeMs: 0,
      })
    } finally {
      setRunning(false)
    }
  }

  const handleAiAnalyze = async () => {
    if (!result) return
    setAnalyzingAi(true)
    setAiAnalysis('')
    try {
      const resp = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('ss_token')}`,
        },
        body: JSON.stringify({
          code,
          language,
          error: result.error,
          output: result.output,
        }),
      })
      const data = await resp.json()
      setAiAnalysis(data.analysis || data.message || JSON.stringify(data))
    } catch {
      setAiAnalysis('Impossible de contacter l\'IA.')
    } finally {
      setAnalyzingAi(false)
    }
  }

  return (
    <div className="space-y-4 page-enter">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
          <Code2 size={20} className="text-primary-500" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text)]">Éditeur de code</h1>
          <p className="text-xs text-[var(--color-muted)]">Écrivez, exécutez et analysez votre code</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Language picker */}
        <div className="relative">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-all"
          >
            {selectedLang.label}
            <ChevronDown size={13} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
          </button>
          {langOpen && (
            <div className="absolute top-full mt-1 left-0 z-20 w-40 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg shadow-lg overflow-hidden">
              {LANGUAGES.map(l => (
                <button
                  key={l.value}
                  onClick={() => handleLangChange(l.value)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-bg)] transition-colors ${l.value === language ? 'text-primary-500 font-semibold' : 'text-[var(--color-text)]'}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleRun}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-green-500/20"
        >
          {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {running ? 'Exécution...' : 'Exécuter'}
        </button>

        <button
          onClick={() => { setCode(STARTERS[language]); setResult(null); setAiAnalysis('') }}
          className="flex items-center gap-2 px-3 py-2 border border-[var(--color-border)] rounded-lg text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] text-sm transition-all"
          title="Réinitialiser"
        >
          <RotateCcw size={13} />
        </button>

        <button
          onClick={() => setShowStdin(!showStdin)}
          className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-all ${showStdin ? 'border-primary-500/40 text-primary-500 bg-primary-500/10' : 'border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-bg)]'}`}
        >
          Entrée standard
        </button>
      </div>

      {/* Stdin */}
      {showStdin && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Entrée (stdin)</label>
          <textarea
            value={stdin}
            onChange={e => setStdin(e.target.value)}
            rows={3}
            placeholder="Données d'entrée pour le programme..."
            className="ss-input font-mono text-xs resize-y"
          />
        </div>
      )}

      {/* Editor */}
      <div className="rounded-xl overflow-hidden border border-[var(--color-border)] shadow-sm">
        <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-card)] border-b border-[var(--color-border)]">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <span className="text-xs text-[var(--color-muted)] font-mono ml-1">main.{language === 'cpp' ? 'cpp' : language === 'typescript' ? 'ts' : language === 'javascript' ? 'js' : language}</span>
        </div>
        <Editor
          height="400px"
          language={selectedLang.monacoLang}
          value={code}
          onChange={v => setCode(v ?? '')}
          onMount={e => { editorRef.current = e }}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            padding: { top: 12, bottom: 12 },
            smoothScrolling: true,
          }}
        />
      </div>

      {/* Output */}
      {result && (
        <Card hover={false} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {result.success
                ? <CheckCircle size={15} className="text-green-500" />
                : <XCircle size={15} className="text-red-500" />
              }
              <span className="text-sm font-semibold text-[var(--color-text)]">
                {result.success ? 'Exécution réussie' : 'Erreur d\'exécution'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
              <Clock size={11} />
              {result.executionTimeMs}ms
            </div>
          </div>

          {result.output && (
            <div>
              <p className="text-xs font-medium text-[var(--color-muted)] mb-1 uppercase tracking-wider">Sortie</p>
              <pre className="p-3 rounded-lg bg-[var(--color-bg)] text-sm font-mono text-[var(--color-text)] overflow-x-auto whitespace-pre-wrap border border-[var(--color-border)]">
                {result.output}
              </pre>
            </div>
          )}

          {result.error && (
            <div>
              <p className="text-xs font-medium text-red-500 mb-1 uppercase tracking-wider">Erreur</p>
              <pre className="p-3 rounded-lg bg-red-500/5 text-sm font-mono text-red-500 overflow-x-auto whitespace-pre-wrap border border-red-500/20">
                {result.error}
              </pre>
            </div>
          )}

          {!result.success && (
            <button
              onClick={handleAiAnalyze}
              disabled={analyzingAi}
              className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-600 text-sm font-medium rounded-lg transition-all"
            >
              {analyzingAi ? <Loader2 size={13} className="animate-spin" /> : <Bot size={13} />}
              {analyzingAi ? 'Analyse IA en cours...' : 'Analyser avec IA (DeepSeek)'}
            </button>
          )}
        </Card>
      )}

      {/* AI Analysis */}
      {aiAnalysis && (
        <Card hover={false} className="border-purple-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Bot size={15} className="text-purple-500" />
            <span className="text-sm font-semibold text-[var(--color-text)]">Analyse IA</span>
          </div>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-[var(--color-text)] font-sans leading-relaxed">
              {aiAnalysis}
            </pre>
          </div>
        </Card>
      )}
    </div>
  )
}
