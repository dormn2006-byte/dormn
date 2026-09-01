

const FeatureCard = ({ feature, active }) => {
  return (
    <div
      className={`group relative overflow-hidden rounded-[2.5rem] border ${feature.border} bg-gradient-to-br ${feature.color} p-8 shadow-2xl backdrop-blur-2xl transition-all duration-500 ${
        active ? "scale-[1.02]" : "opacity-90"
      }`}
    >
      {/* Glow */}
      <div
        className={`absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br ${feature.color} opacity-20 blur-3xl transition duration-500 group-hover:opacity-30`}
      ></div>

      <div className="relative z-10">
        {/* Icon */}
        <div
          className={`mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] border ${feature.border} bg-white/10 text-5xl shadow-2xl ${feature.glow} backdrop-blur-2xl transition-all duration-500`}
        >
          {feature.icon}
        </div>

        {/* Title */}
        <h3 className="text-3xl font-black tracking-tight text-white md:text-4xl">
          {feature.title}
        </h3>

        {/* Description */}
        <p className="mt-6 text-lg leading-8 text-gray-300 md:text-xl">
          {feature.description}
        </p>
      </div>
    </div>
  );
};

export default FeatureCard;