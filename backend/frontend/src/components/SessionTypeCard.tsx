import Icon, { type IconName } from './Icon';

export default function SessionTypeCard({
  icon,
  title,
  description,
  selected,
  onClick,
}: {
  icon: IconName;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`session-type-card ${selected ? 'session-type-card-selected' : ''}`}
      onClick={onClick}
    >
      <div className="session-type-icon" style={{ background: selected ? 'var(--tint-indigo-strong)' : 'var(--tint-indigo)' }}>
        <Icon name={icon} size={20} />
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14.5, color: 'var(--ink)' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{description}</div>
      </div>
      {selected && (
        <span
          style={{
            marginLeft: 'auto',
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'var(--navy)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="check" size={11} />
        </span>
      )}
    </button>
  );
}
