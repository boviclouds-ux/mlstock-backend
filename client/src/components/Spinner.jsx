export default function Spinner({ size = "md", label = "Chargement…" }) {
  const dim = size === "sm" ? "w-5 h-5" : size === "lg" ? "w-10 h-10" : "w-7 h-7";
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-2" role="status" aria-label={label}>
      <svg className={`${dim} animate-spin text-blue-600`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <span className="text-xs font-medium text-slate-400">{label}</span>
    </div>
  );
}
