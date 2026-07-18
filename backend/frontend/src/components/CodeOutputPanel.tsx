export type ExecStatus = 'success' | 'error' | 'timeout';

export default function CodeOutputPanel({
  status,
  durationMs,
  output,
  label = 'OUTPUT',
}: {
  status: ExecStatus;
  durationMs: number;
  output: string;
  label?: string;
}) {
  const ok = status === 'success';
  return (
    <div className="output-panel">
      <div className="output-header">
        <span className="output-label">{label}</span>
        <span className={`output-status ${ok ? 'output-status-ok' : 'output-status-err'}`}>
          {ok ? `EXIT 0 · ${durationMs}ms` : status === 'timeout' ? `TIMEOUT · ${durationMs}ms` : `EXIT 1 · ${durationMs}ms`}
        </span>
      </div>
      <div className={`output-body ${ok ? '' : 'output-body-error'}`}>{output}</div>
    </div>
  );
}
