export default function QuizOptionButton({
  letter,
  text,
  selected,
  onClick,
  disabled,
}: {
  letter: string;
  text: string;
  selected: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`quiz-option ${selected ? 'quiz-option-selected' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className={`quiz-option-letter ${selected ? 'quiz-option-letter-selected' : ''}`}>{letter}</span>
      <span className="quiz-option-text" style={selected ? { fontWeight: 600 } : undefined}>
        {text}
      </span>
      {selected && <span style={{ marginLeft: 'auto', color: 'var(--navy)' }}>●</span>}
    </button>
  );
}
