import { memo } from "react";

const StatCard = ({ stat }) => {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md md:rounded-[2.5rem]">
      
      {/* Subtle decorative accent instead of neon glow */}
      <div
        className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#93B733]/5 transition-transform duration-500 group-hover:scale-150"
      ></div>

      {/* Content */}
      <div className="relative z-10">
        {/* Number */}
        <h3 className="text-5xl font-black text-[#93B733] md:text-6xl">
          {stat.number}
        </h3>

        {/* Label */}
        <p className="mt-4 text-xl sm:text-2xl font-bold tracking-tight text-[#0D3A1D]">
          {stat.label}
        </p>

        {/* Description */}
        <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:mt-4 sm:text-base sm:leading-7">
          {stat.description}
        </p>
      </div>
    </div>
  );
};

export default memo(StatCard);