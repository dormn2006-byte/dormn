const AdminCard = ({
  title,
  value,
  subtitle,
  icon,
  color = "from-pink-500 to-violet-500",
  loading = false,
}) => {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/30">
      <div
        className={`absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gradient-to-br ${color} opacity-20 blur-3xl`}
      />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
            {title}
          </p>

          <h2 className="mt-3 truncate text-3xl font-black text-white md:text-4xl">
            {loading ? "..." : value}
          </h2>

          {subtitle && (
            <p className="mt-2 line-clamp-2 text-sm text-cyan-300">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-xl`}
        >
          {icon}
        </div>
      </div>

      <div className="relative z-10 mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-gray-400">
        <span>Live Data</span>
        <span>{new Date().getFullYear()}</span>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100" />
    </div>
  );
};

export default AdminCard;