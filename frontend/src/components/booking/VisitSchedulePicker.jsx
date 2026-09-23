import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, X } from "lucide-react";
import { toDateKey } from "../../utils/visitDate";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const TIME_SLOTS = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
  "05:00 PM", "06:00 PM", "07:00 PM",
];

const VisitSchedulePicker = ({ onConfirm, onCancel, loading = false }) => {
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const [viewMonth, setViewMonth] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();

  const cells = useMemo(() => {
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out = [];
    for (let i = 0; i < firstWeekday; i++) out.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const key = toDateKey(new Date(year, month, day));
      out.push({ day, key, disabled: key < todayKey });
    }
    return out;
  }, [year, month, todayKey]);

  const monthLabel = viewMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const isCurrentMonth = year === new Date().getFullYear() && month === new Date().getMonth();
  const canConfirm = Boolean(selectedDate && selectedTime) && !loading;

  const goToPrevMonth = () => {
    if (isCurrentMonth) return;
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <div className="rounded-xl sm:rounded-2xl border-2 border-[#93B733]/40 bg-[#93B733]/[0.04] dark:bg-[#93B733]/[0.06] p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-gray-900 dark:text-white">
          <CalendarDays className="w-4 h-4 text-[#93B733]" />
          <span>Schedule Your Visit</span>
        </h4>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer"
          aria-label="Close calendar"
        >
          <X size={15} />
        </button>
      </div>

      <p className="mt-1 text-[10px] sm:text-[11px] font-semibold text-gray-500 dark:text-gray-400">
        Pick the date &amp; time you'll visit this PG in person.
      </p>

      {/* Month navigation */}
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={goToPrevMonth}
          disabled={isCurrentMonth}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:border-[#93B733] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          aria-label="Previous month"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="text-xs font-black text-gray-900 dark:text-white">{monthLabel}</span>
        <button
          type="button"
          onClick={goToNextMonth}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:border-[#93B733] transition cursor-pointer"
          aria-label="Next month"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="mt-2 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((wd) => (
          <span key={wd} className="text-center text-[9px] font-black uppercase text-gray-400">
            {wd}
          </span>
        ))}
        {cells.map((cell, idx) => {
          if (!cell) return <span key={`empty-${idx}`} />;
          const isSelected = selectedDate === cell.key;
          return (
            <button
              key={cell.key}
              type="button"
              disabled={cell.disabled}
              onClick={() => setSelectedDate(cell.key)}
              className={`aspect-square rounded-lg text-[11px] font-bold transition cursor-pointer ${
                isSelected
                  ? "bg-[#93B733] text-white shadow-sm"
                  : cell.disabled
                  ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                  : "text-gray-800 dark:text-gray-200 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-[#93B733]"
              }`}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      {/* Time slots */}
      <div className="mt-3 pt-3 border-t border-[#93B733]/20">
        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
          <Clock className="w-3.5 h-3.5 text-[#93B733]" />
          Preferred Time
        </span>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {TIME_SLOTS.map((slot) => {
            const isActive = selectedTime === slot;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => setSelectedTime(slot)}
                className={`rounded-lg px-1 py-1.5 text-[10px] font-bold transition cursor-pointer ${
                  isActive
                    ? "bg-[#93B733] text-white shadow-sm"
                    : "bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 hover:border-[#93B733]"
                }`}
              >
                {slot}
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirm */}
      <button
        type="button"
        onClick={() => onConfirm(selectedDate, selectedTime)}
        disabled={!canConfirm}
        className={`mt-3 w-full rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition-all active:scale-[0.98] ${
          canConfirm
            ? "bg-[#93B733] hover:bg-[#82a32d] cursor-pointer"
            : "bg-gray-300 dark:bg-gray-800 text-gray-500 dark:text-gray-500 cursor-not-allowed shadow-none"
        }`}
      >
        {loading ? "Submitting Request..." : "Confirm Visit Request"}
      </button>
    </div>
  );
};

export default VisitSchedulePicker;
