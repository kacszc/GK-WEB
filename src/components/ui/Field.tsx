/** Labelled form field with optional error text. Wraps any control. */
export function Field({
  label,
  error,
  className,
  children,
}: {
  label?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      {label && <label className="mb-1.5 block text-[12px] font-semibold text-ink-3">{label}</label>}
      {children}
      {error && <p className="mt-1 text-[12px] text-[#b07400]">{error}</p>}
    </div>
  );
}
