export default function ToggleSwitch({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="toggle-row"
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
    >
      <div style={{ flex: 1 }}>
        <div className="toggle-label">{label}</div>
        {description && <div className="toggle-description">{description}</div>}
      </div>
      <div className={`toggle-pill ${checked ? 'toggle-pill-on' : ''}`}>
        <div className={`toggle-knob ${checked ? 'toggle-knob-on' : ''}`} />
      </div>
    </button>
  );
}
