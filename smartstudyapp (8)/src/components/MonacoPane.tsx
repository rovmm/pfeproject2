import Editor from '@monaco-editor/react';

const MONACO_LANG: Record<string, string> = {
  'Python 3.11': 'python',
  'Java 17': 'java',
  'C++ 20': 'cpp',
  'JavaScript (Node 20)': 'javascript',
};

export default function MonacoPane({
  language,
  value,
  onChange,
  height = '100%',
}: {
  language: string;
  value: string;
  onChange?: (v: string) => void;
  height?: string | number;
}) {
  return (
    <Editor
      height={height}
      theme="vs-dark"
      language={MONACO_LANG[language] ?? 'python'}
      value={value}
      onChange={(v) => onChange?.(v ?? '')}
      options={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 13,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        padding: { top: 14 },
        automaticLayout: true,
      }}
    />
  );
}
