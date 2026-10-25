import React, { memo } from "react";
import { Clock, MapPin, Calendar } from "lucide-react";
import { getEventTimeStatus } from "../../services/eventAdminService";

const EventCard = memo(({ item, onSelect }) => {
  const timeStatus = getEventTimeStatus(item);

  return (
    <div
      onClick={() => onSelect(item.id)}
      className="events-card-bg group bg-white dark:bg-[#0D0B1C]/95 border border-purple-200/80 dark:border-purple-500/20 hover:border-purple-400 dark:hover:border-pink-500/60 rounded-[18px] overflow-hidden shadow-md hover:shadow-2xl hover:shadow-purple-500/10 dark:hover:shadow-pink-500/15 transition-[box-shadow] duration-200 flex flex-col cursor-pointer"
    >
      {/* Thumbnail Image with Price Badge & Time Left Badge */}
      <div className="relative h-44 sm:h-48 lg:h-52 w-full bg-black overflow-hidden">
        <img
          src={item.coverImage}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

        {/* Top Left Countdown Badge when event time is close */}
        {timeStatus.label && (
          <span
            className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] lg:text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-sm border flex items-center gap-1.5 ${
              timeStatus.isUrgent
                ? "bg-amber-100 dark:bg-amber-950/85 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/50"
                : "bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-pink-300 border-purple-200 dark:border-pink-500/40"
            }`}
          >
            <Clock
              size={11}
              className={
                timeStatus.isUrgent
                  ? "text-amber-500 dark:text-amber-400 animate-pulse lg:w-3.5 lg:h-3.5"
                  : "text-pink-600 dark:text-pink-400 lg:w-3.5 lg:h-3.5"
              }
            />
            <span>{timeStatus.label}</span>
          </span>
        )}
      </div>

      {/* Card Body */}
      <div className="p-3.5 sm:p-4.5 lg:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="text-[15px] sm:text-[17px] lg:text-lg font-black text-gray-900 group-hover:text-purple-700 dark:text-white dark:group-hover:text-pink-400 transition-colors leading-tight capitalize">
            {item.title}
          </h3>

          <div className="mt-1 text-[12px] sm:text-[13px] lg:text-[14px] font-black text-pink-600 dark:text-pink-400">
            {typeof item.singlePrice === "number"
              ? `₹${item.singlePrice} Single`
              : `${item.singlePrice}`}
          </div>

          <p className="text-[11px] sm:text-xs lg:text-sm font-semibold text-purple-700/80 dark:text-purple-200/70 mt-1 capitalize truncate">
            {item.tagline}
          </p>

          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs lg:text-sm font-bold text-gray-600 dark:text-gray-300 mt-2">
            <MapPin size={12} className="text-pink-600 dark:text-pink-400 shrink-0 lg:w-4 lg:h-4" />
            <span className="capitalize truncate">{item.location}</span>
          </div>
        </div>

        {/* Highlight Box for Upcoming Night */}
        <div className="events-upcoming-box rounded-xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-500/30 p-2.5 sm:p-3">
          {timeStatus.label && (
            <div
              className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider mb-1.5 ${
                timeStatus.isUrgent ? "text-amber-600 dark:text-amber-400" : "text-pink-600 dark:text-pink-400"
              }`}
            >
              <Clock
                size={11}
                className={
                  timeStatus.isUrgent
                    ? "text-amber-600 dark:text-amber-400 animate-pulse"
                    : "text-pink-600 dark:text-pink-400"
                }
              />
              <span>{timeStatus.label}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs font-black text-gray-900 dark:text-white capitalize mb-1">
            <span className="truncate">{item.upcomingNight?.title || "Upcoming Show"}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-1.5">
              <Calendar size={12} className="text-pink-600 dark:text-pink-400" />
              <span>
                {item.upcomingNight?.shortDate || ""} - {item.upcomingNight?.shortTime || ""}
              </span>
            </div>
            <span className="text-pink-600 dark:text-pink-400 text-[10px] font-black">
              • {item.upcomingNight?.spotsLeft || 50} spots left
            </span>
          </div>
        </div>

        {/* Badge Row */}
        <div className="pt-0.5">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 text-[10px] font-black uppercase tracking-wider border border-purple-200 dark:border-purple-500/30">
            {item.badge || "VIP ACCESS"}
          </span>
        </div>
      </div>
    </div>
  );
});

export default EventCard;
