export default function Spinner({ label = "Loading…" }) {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin" />
      <p className="mt-4 text-xl text-font">{label}</p>
    </div>
  );
}
