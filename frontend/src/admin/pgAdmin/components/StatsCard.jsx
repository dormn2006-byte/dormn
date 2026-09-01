

const StatsCard = ({
  title,
  value,
  icon,
  growth,
  color = "black",
}) => {
  const colorVariants = {
    black: "bg-black text-white",
    blue: "bg-blue-600 text-white",
    green: "bg-green-600 text-white",
    purple: "bg-purple-600 text-white",
    orange: "bg-[#93B733] text-white",
  };

  return (
    <div className="group rounded-[30px] border border-gray-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <h2 className="mt-4 text-4xl font-black tracking-tight text-gray-900">
            {value}
          </h2>

          {growth && (
            <div className="mt-4 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
              ↑ {growth}
            </div>
          )}
        </div>

        <div
          className={`flex h-16 w-16 items-center justify-center rounded-3xl text-3xl shadow-lg transition duration-300 group-hover:scale-110 ${colorVariants[color]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;