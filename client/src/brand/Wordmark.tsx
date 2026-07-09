export default function Wordmark({
  size = 16,
  className = '',
  dim = false,
}: { size?: number; className?: string; dim?: boolean }) {
  return (
    <span
      className={`font-serif font-semibold tracking-tight select-none ${className}`}
      style={{ fontSize: size, lineHeight: 1 }}
    >
      <span className={dim ? 'text-ink' : 'text-ink'}>Allrated</span>
    </span>
  );
}
