export function SpotlightCard({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md transition-all duration-300 hover:border-violet-500/40 hover:bg-slate-900/80 hover:shadow-xl hover:shadow-violet-500/5 ${className}`}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
