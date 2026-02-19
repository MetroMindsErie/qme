interface DisplayFieldProps {
  id: string;
  label: string;
  value: string;
  className?: string;
  hidden?: boolean;
  readOnly?: boolean;
  onChange?: (value: string) => void;
}

export default function DisplayField({
  id,
  label,
  value,
  className = 'displayInput',
  hidden = false,
  readOnly = true,
  onChange,
}: DisplayFieldProps) {
  if (hidden) return null;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        className={className}
        id={id}
        value={value}
        readOnly={readOnly}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      />
    </div>
  );
}
