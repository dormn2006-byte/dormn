import { useState, useMemo, useRef, useEffect, memo } from "react";
import API from "../../services/api";
import { calcStayDays, calcDailyPrice } from "../../utils/shortStayUtils";
import {
  KeyRound,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarRange,
  Clock,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  AlertCircle,
  ShieldCheck,
  Tag,
  Sparkles,
} from "lucide-react";

// ── CALENDAR CONSTANTS & HELPERS ──
export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
export const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
export const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
export const formatDateYYYYMMDD = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const addDaysToDateStr = (dateStr, days) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + Number(days));
  return formatDateYYYYMMDD(date);
};

export const formatBadgeDate = (dateStr) => {
  if (!dateStr) return "Select date";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// ── REUSABLE CALENDAR HOOK ──
export const useCalendarMonth = () => {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(() => formatDateYYYYMMDD(today));

  const handlePrevMonth = () => {
    if (currentYear === today.getFullYear() && currentMonth === today.getMonth()) return;
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const isPrevDisabled = currentYear === today.getFullYear() && currentMonth === today.getMonth();

  const handleQuickPreset = (preset) => {
    const d = new Date(today);
    if (preset === "tomorrow") d.setDate(d.getDate() + 1);
    else if (preset === "week") d.setDate(d.getDate() + 7);
    else if (preset === "next_month") d.setMonth(d.getMonth() + 1, 1);
    setCurrentYear(d.getFullYear());
    setCurrentMonth(d.getMonth());
    setSelectedDate(formatDateYYYYMMDD(d));
  };

  const formattedSelected = useMemo(() => {
    if (!selectedDate) return "";
    const [y, m, d] = selectedDate.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [selectedDate]);

  return {
    today,
    currentYear,
    currentMonth,
    selectedDate,
    setSelectedDate,
    handlePrevMonth,
    handleNextMonth,
    isPrevDisabled,
    handleQuickPreset,
    formattedSelected,
  };
};

// ── REUSABLE MODAL SHELL ──
export const ModalShell = memo(({ onClose, children, maxWidth = "max-w-md" }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
    onClick={onClose}
  >
    <div
      className={`relative w-full ${maxWidth} max-h-[92vh] overflow-y-auto rounded-[2rem] sm:rounded-[2.5rem] border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111111] p-5 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 scrollbar-none`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer"
      >
        <X size={18} />
      </button>
      {children}
    </div>
  </div>
));
ModalShell.displayName = "ModalShell";

// ── REUSABLE CALENDAR PICKER GRID ──
export const MonthCalendarPicker = memo(({
  currentYear,
  currentMonth,
  selectedDate,
  startDate,
  endDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  isPrevDisabled,
  today,
  className = "",
}) => {
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  return (
    <div className={`rounded-2xl border border-gray-200 dark:border-white/10 p-3 sm:p-4 bg-gray-50/50 dark:bg-black/30 ${className}`}>
      {/* Month Navigator */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs sm:text-sm font-black text-gray-900 dark:text-white">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevMonth}
            disabled={isPrevDisabled}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {WEEKDAYS.map((d) => (
          <span key={d} className="text-[10px] sm:text-[11px] font-bold text-gray-400">
            {d}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div key={`empty-${i}`} className="h-8 w-8 sm:h-9 sm:w-9 mx-auto" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const cellDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isPast = new Date(currentYear, currentMonth, day) < today;
          const isToday = cellDateStr === formatDateYYYYMMDD(today);

          const isStart = startDate && cellDateStr === startDate;
          const isEnd = endDate && cellDateStr === endDate;
          const isInRange = startDate && endDate && cellDateStr > startDate && cellDateStr < endDate;
          const isSelected = selectedDate === cellDateStr;

          let cellClass = "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl cursor-pointer";
          if (isPast) {
            cellClass = "text-gray-300 dark:text-gray-700 cursor-not-allowed";
          } else if (isStart && isEnd) {
            cellClass = "bg-indigo-600 text-white font-black rounded-xl shadow-md";
          } else if (isStart) {
            cellClass = "bg-indigo-600 text-white font-black rounded-l-xl rounded-r-none shadow-md z-10";
          } else if (isEnd) {
            cellClass = "bg-indigo-600 text-white font-black rounded-r-xl rounded-l-none shadow-md z-10";
          } else if (isInRange) {
            cellClass = "bg-indigo-500/20 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200 font-bold rounded-none";
          } else if (isSelected) {
            cellClass = "bg-[#93B733] text-black shadow-md font-black scale-105 rounded-xl";
          } else if (isToday) {
            cellClass = "border-2 border-[#93B733] text-[#355008] dark:text-[#bbf246] font-black hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl cursor-pointer";
          }

          return (
            <button
              key={day}
              type="button"
              disabled={isPast}
              onClick={() => onSelectDate(cellDateStr)}
              className={`h-8 w-full sm:h-9 flex items-center justify-center text-xs font-bold transition-all ${cellClass}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
});
MonthCalendarPicker.displayName = "MonthCalendarPicker";

// ── CHECK-IN CALENDAR MODAL ──
export const CheckInCalendarModal = ({ pgId, pgTitle, selectedRoom, loading, onClose, onConfirm }) => {
  const cal = useCalendarMonth();
  const [promoInput, setPromoInput] = useState("");
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState("");

  const handleApplyPromo = async () => {
    const cleanCode = promoInput.trim().toUpperCase();
    if (!cleanCode) return;
    try {
      setValidatingPromo(true);
      setPromoError("");
      const res = await API.post("/coupons/validate", {
        code: cleanCode,
        pg_id: Number(pgId),
        original_amount: selectedRoom?.price || 0,
      });
      if (res.data?.success) {
        setAppliedPromo(res.data);
      } else {
        setPromoError(res.data?.message || "Invalid promo code");
      }
    } catch (err) {
      setPromoError(err?.response?.data?.message || "Invalid or inapplicable promo code.");
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError("");
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#93B733]/20 text-[#355008] dark:text-[#bbf246]">
          <KeyRound size={22} />
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight">
            Select Check-in Date
          </h3>
          <p className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400">
            When do you plan to move into {pgTitle || "this PG"}?
          </p>
        </div>
      </div>

      {selectedRoom && (
        <div className="mb-3 rounded-xl bg-gray-50 dark:bg-white/[0.04] p-2.5 flex items-center justify-between text-xs border border-gray-100 dark:border-white/5">
          <span className="font-bold text-gray-700 dark:text-gray-300 truncate">{selectedRoom.label}</span>
          <span className="font-black text-gray-950 dark:text-[#bbf246] shrink-0">
            ₹{selectedRoom.price?.toLocaleString()} / mo
          </span>
        </div>
      )}

      {/* ── PROMO CODE SECTION ── */}
      <div className="mb-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02] p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <Tag size={13} className="text-purple-600 dark:text-purple-400" />
            Have a Promo Code?
          </span>
          {appliedPromo && (
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              ✓ Applied
            </span>
          )}
        </div>

        {!appliedPromo ? (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. DORM500, SUMMER20"
              value={promoInput}
              onChange={(e) => {
                setPromoInput(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""));
                setPromoError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleApplyPromo();
                }
              }}
              className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white outline-none focus:border-purple-500"
            />
            <button
              type="button"
              onClick={handleApplyPromo}
              disabled={validatingPromo || !promoInput.trim()}
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 text-xs font-black shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {validatingPromo ? "..." : "Apply"}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-xl bg-purple-500/10 border border-purple-500/25 p-2.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black text-purple-700 dark:text-purple-300 tracking-wider">
                {appliedPromo.code}
              </span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                (-₹{Number(appliedPromo.discount_applied).toLocaleString()})
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemovePromo}
              className="text-[11px] font-bold text-rose-500 hover:text-rose-600 underline cursor-pointer"
            >
              Remove
            </button>
          </div>
        )}

        {promoError && (
          <p className="text-[11px] font-semibold text-rose-500 flex items-center gap-1">
            <AlertCircle size={12} className="shrink-0" />
            {promoError}
          </p>
        )}

        {appliedPromo && selectedRoom && (
          <div className="pt-2 border-t border-gray-200/60 dark:border-white/10 space-y-1 text-xs">
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Standard Rent:</span>
              <span>₹{Number(selectedRoom.price).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
              <span>Promo Concession ({appliedPromo.code}):</span>
              <span>-₹{Number(appliedPromo.discount_applied).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-900 dark:text-white font-black pt-1 border-t border-dashed border-gray-200 dark:border-white/10">
              <span>Discounted Monthly Rent:</span>
              <span className="text-[#0D3A1D] dark:text-[#bbf246]">
                ₹{Number(appliedPromo.final_amount).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      <MonthCalendarPicker
        currentYear={cal.currentYear}
        currentMonth={cal.currentMonth}
        selectedDate={cal.selectedDate}
        onSelectDate={cal.setSelectedDate}
        onPrevMonth={cal.handlePrevMonth}
        onNextMonth={cal.handleNextMonth}
        isPrevDisabled={cal.isPrevDisabled}
        today={cal.today}
      />

      {/* Quick Date Presets */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none">
        {[
          { key: "today", label: "Today" },
          { key: "tomorrow", label: "Tomorrow" },
          { key: "week", label: "In 1 Week" },
          { key: "next_month", label: "1st Next Month" },
        ].map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => cal.handleQuickPreset(p.key)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-[#93B733]/20 hover:text-black dark:hover:text-[#bbf246] transition shrink-0 cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-2.5 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-xs">
        Planned Check-in: <span className="font-black text-gray-950 dark:text-[#bbf246]">{cal.formattedSelected}</span>
      </div>

      <div className="mt-4 flex gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-gray-300 dark:border-white/10 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm(cal.selectedDate, appliedPromo)}
          disabled={loading || !cal.selectedDate}
          className="flex-[2] rounded-xl bg-[#93B733] hover:bg-[#82a32d] py-3 text-xs font-black text-black shadow-md hover:shadow-lg transition active:scale-[0.98] disabled:opacity-60 cursor-pointer"
        >
          {loading
            ? "Submitting..."
            : appliedPromo
            ? `Book at ₹${Number(appliedPromo.final_amount).toLocaleString()} →`
            : "Proceed to Book →"}
        </button>
      </div>
    </ModalShell>
  );
};

// ── SCHEDULE PG VISIT MODAL ──
export const ScheduleVisitModal = ({
  pgTitle,
  user,
  loading,
  onClose,
  onConfirm,
}) => {
  const cal = useCalendarMonth();
  const [selectedSlot, setSelectedSlot] = useState("10:00 AM - 01:00 PM");
  const [studentName, setStudentName] = useState(user?.full_name || user?.name || "");
  const [studentPhone, setStudentPhone] = useState(user?.phone || "");
  const studentEmail = user?.email || "";
  const [notes, setNotes] = useState("");

  const timeSlots = [
    { slot: "10:00 AM - 01:00 PM", label: "Morning", icon: "☀️" },
    { slot: "01:00 PM - 04:00 PM", label: "Afternoon", icon: "🌤️" },
    { slot: "04:00 PM - 07:00 PM", label: "Evening", icon: "🌆" },
    { slot: "07:00 PM - 08:30 PM", label: "Late Evening", icon: "🌙" },
  ];

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!cal.selectedDate) return;
    onConfirm({
      visitDate: cal.selectedDate,
      visitTimeSlot: selectedSlot,
      studentName,
      studentPhone,
      studentEmail,
      notes,
    });
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#93B733]/20 text-[#355008] dark:text-[#bbf246]">
          <CalendarClock size={22} />
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight">
            Schedule PG Visit
          </h3>
          <p className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400">
            Pick a date & time to tour {pgTitle || "the property"}
          </p>
        </div>
      </div>

      <MonthCalendarPicker
        currentYear={cal.currentYear}
        currentMonth={cal.currentMonth}
        selectedDate={cal.selectedDate}
        onSelectDate={cal.setSelectedDate}
        onPrevMonth={cal.handlePrevMonth}
        onNextMonth={cal.handleNextMonth}
        isPrevDisabled={cal.isPrevDisabled}
        today={cal.today}
        className="mb-3"
      />

      {/* Time Slot Picker */}
      <div className="mb-3">
        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
          Preferred Time Slot
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {timeSlots.map((ts) => (
            <button
              key={ts.slot}
              type="button"
              onClick={() => setSelectedSlot(ts.slot)}
              className={`flex items-center gap-1.5 p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                selectedSlot === ts.slot
                  ? "border-2 border-[#93B733] bg-[#93B733]/20 dark:bg-[#93B733]/30 text-gray-950 dark:text-white shadow-xs"
                  : "border-gray-200 dark:border-white/10 bg-white dark:bg-[#181818] text-gray-600 dark:text-gray-300 hover:border-gray-300"
              }`}
            >
              <span>{ts.icon}</span>
              <div className="text-left">
                <div className="text-[10px] text-gray-500 dark:text-gray-400 leading-none">{ts.label}</div>
                <div className={`text-[11px] truncate ${selectedSlot === ts.slot ? "font-black text-gray-950 dark:text-[#bbf246]" : "font-extrabold"}`}>{ts.slot}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Contact info */}
      <div className="space-y-2 mb-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-0.5">Your Name</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Full Name"
              className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#93B733]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-0.5">Phone Number</label>
            <input
              type="tel"
              value={studentPhone}
              onChange={(e) => setStudentPhone(e.target.value)}
              placeholder="Mobile Number"
              className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#93B733]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-0.5">Notes / Message for Owner (Optional)</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Visiting with parents, want to see 2-sharing room..."
            className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#93B733] resize-none"
          />
        </div>
      </div>

      <div className="rounded-xl bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-2.5 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-xs">
        Visit: <span className="font-black text-gray-950 dark:text-[#bbf246]">{cal.formattedSelected}</span> at <span className="font-black text-gray-950 dark:text-white">{selectedSlot}</span>
      </div>

      <div className="mt-4 flex gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-gray-300 dark:border-white/10 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !cal.selectedDate}
          className="flex-[2] rounded-xl bg-[#93B733] hover:bg-[#82a32d] py-3 text-xs font-black text-black shadow-md hover:shadow-lg transition active:scale-[0.98] disabled:opacity-60 cursor-pointer"
        >
          {loading ? "Submitting..." : "Confirm Visit Request"}
        </button>
      </div>
    </ModalShell>
  );
};

// ── CUSTOM ROOM SELECT COMPONENT ──
export const CustomRoomSelect = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const selectedItem = options.find((opt) => opt.value === value) || options[0] || { label: value, value };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white hover:border-indigo-400 dark:hover:border-indigo-500/50 transition cursor-pointer shadow-xs"
      >
        <span className="truncate">{selectedItem?.label || value}</span>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform duration-200 shrink-0 ml-2 ${isOpen ? "rotate-180 text-indigo-500" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-2xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#1a1a1a] shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-150">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left font-bold transition cursor-pointer ${
                  isSelected
                    ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── SHORT STAY RANGE CALENDAR MODAL ──
export const ShortStayCalendarModal = ({
  pgTitle,
  pgPrice,
  selectedRoom,
  availableRooms = [],
  user,
  loading,
  onClose,
  onConfirm,
  onVerifyAccount,
}) => {
  const cal = useCalendarMonth();
  const todayStr = useMemo(() => formatDateYYYYMMDD(cal.today), [cal.today]);

  const [activePresetDays, setActivePresetDays] = useState(4);
  const [checkInDate, setCheckInDate] = useState(todayStr);
  const [checkOutDate, setCheckOutDate] = useState(() => addDaysToDateStr(todayStr, 4));

  const handleSelectDate = (cellDateStr) => {
    setCheckInDate(cellDateStr);
    setCheckOutDate(addDaysToDateStr(cellDateStr, activePresetDays));
  };

  const handlePresetDays = (days) => {
    setActivePresetDays(days);
    const base = checkInDate || todayStr;
    setCheckOutDate(addDaysToDateStr(base, days));
  };

  const roomOptions = useMemo(() => {
    if (Array.isArray(availableRooms) && availableRooms.length > 0) {
      return availableRooms.map((r) => ({
        label: r.label || r.room_type || r.type || "Standard Room",
        value: r.label || r.room_type || r.type || "Standard Room",
      }));
    }
    return [
      { label: "Single Room", value: "Single Room" },
      { label: "2 Sharing Room", value: "2 Sharing Room" },
      { label: "3 Sharing Room", value: "3 Sharing Room" },
      { label: "Standard Room", value: "Standard Room" },
    ];
  }, [availableRooms]);

  const [roomType, setRoomType] = useState(
    selectedRoom?.label || selectedRoom?.type || roomOptions[0]?.value || "Standard Room"
  );
  const [isAc, setIsAc] = useState(selectedRoom?.isAc || false);
  const [guestCount] = useState(1);
  const [purpose, setPurpose] = useState("");

  const userKey = user?.id ? `u_${user.id}` : user?.email ? `e_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}` : null;
  const storedProfile = useMemo(() => {
    if (!userKey) return {};
    try {
      return JSON.parse(localStorage.getItem(`dormn_student_profile_${userKey}`) || "{}");
    } catch {
      return {};
    }
  }, [userKey]);

  const profileName = (user?.full_name || user?.name || storedProfile?.fullName || storedProfile?.name || "").trim();
  const profilePhone = (user?.phone || storedProfile?.phone || "").trim();

  const [studentName, setStudentName] = useState(profileName);
  const [studentPhone, setStudentPhone] = useState(profilePhone);

  const hasName = Boolean(profileName);
  const hasPhone = Boolean(profilePhone);
  const hasCompleteProfile = hasName && hasPhone;

  const isVerified = Boolean(user?.is_email_verified || user?.email_verified) || user?.auth_provider === "google";

  const totalDays = useMemo(() => calcStayDays(checkInDate, checkOutDate), [checkInDate, checkOutDate]);
  const dailyPrice = useMemo(() => calcDailyPrice(selectedRoom?.price || pgPrice, isAc), [selectedRoom?.price, pgPrice, isAc]);
  const totalAmount = useMemo(() => dailyPrice * totalDays, [dailyPrice, totalDays]);

  const handleSubmit = (e) => {
    e?.preventDefault();

    if (!isVerified) {
      if (onVerifyAccount) {
        onVerifyAccount();
      } else {
        alert("Please verify your account email before requesting a short stay.");
      }
      return;
    }

    const finalName = (hasName ? profileName : studentName).trim();
    const finalPhone = (hasPhone ? profilePhone : studentPhone).trim();

    if (!finalName) {
      alert("Please provide your name.");
      return;
    }
    if (!finalPhone) {
      alert("Please provide your contact phone number.");
      return;
    }
    if (!checkInDate || !checkOutDate || totalDays <= 0) {
      alert("Please choose a valid stay date range.");
      return;
    }
    if (totalDays > 30) {
      alert("Short stay bookings are for up to 30 days. For longer stays, please use regular Check-in booking.");
      return;
    }

    onConfirm({
      checkInDate,
      checkOutDate,
      totalDays,
      roomType,
      isAc,
      guestCount,
      dailyPrice,
      totalAmount,
      studentName: finalName,
      studentPhone: finalPhone,
      studentEmail: user?.email || "",
      purpose,
    });
  };

  return (
    <ModalShell onClose={onClose} maxWidth="max-w-lg">
      <div className="flex items-center gap-3 mb-3.5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-700 dark:text-indigo-400">
          <CalendarRange size={22} />
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight">
            Short Stay Booking (4–5 Days / Daily)
          </h3>
          <p className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400">
            Select check-in date — duration automatically sets check-out
          </p>
        </div>
      </div>

      {!isVerified && (
        <div className="mb-3.5 rounded-2xl border border-amber-300 dark:border-amber-600/40 bg-amber-50 dark:bg-amber-950/30 p-3 sm:p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-amber-900 dark:text-amber-200 leading-tight">
                Account Verification Required
              </p>
              <p className="text-[11px] font-semibold text-amber-700/90 dark:text-amber-300/80 mt-0.5">
                Verify your account email before requesting a short stay.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onVerifyAccount}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black transition cursor-pointer shadow-xs"
          >
            Verify Now
          </button>
        </div>
      )}

      {/* Quick Duration Presets */}
      <div className="mb-3.5">
        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
          Stay Duration
        </label>
        <div className="grid grid-cols-5 gap-1.5">
          {[
            { days: 4, label: "4 Days" },
            { days: 5, label: "5 Days" },
            { days: 7, label: "1 Week" },
            { days: 10, label: "10 Days" },
            { days: 14, label: "2 Weeks" },
          ].map((p) => {
            const isSelected = activePresetDays === p.days;
            return (
              <button
                key={p.days}
                type="button"
                onClick={() => handlePresetDays(p.days)}
                className={`py-1.5 px-2 rounded-xl text-xs font-black transition border cursor-pointer ${
                  isSelected
                    ? "border-2 border-indigo-600 bg-indigo-600 text-white shadow-xs"
                    : "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:border-indigo-400"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Stay Range Visual Badges */}
      <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 p-2.5 sm:p-3">
        <div className="min-w-0">
          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block truncate">
            Check-in (From)
          </span>
          <span className="text-xs sm:text-sm font-black text-gray-900 dark:text-white block truncate">
            {formatBadgeDate(checkInDate)}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center px-1">
          <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-[10px] font-black text-white shadow-xs">
            {totalDays} Days
          </span>
          <span className="text-indigo-400 text-xs">→</span>
        </div>

        <div className="min-w-0 text-right">
          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block truncate">
            Check-out (To)
          </span>
          <span className="text-xs sm:text-sm font-black text-gray-900 dark:text-white block truncate">
            {formatBadgeDate(checkOutDate)}
          </span>
        </div>
      </div>

      {/* Interactive Range Calendar */}
      <MonthCalendarPicker
        currentYear={cal.currentYear}
        currentMonth={cal.currentMonth}
        startDate={checkInDate}
        endDate={checkOutDate}
        onSelectDate={handleSelectDate}
        onPrevMonth={cal.handlePrevMonth}
        onNextMonth={cal.handleNextMonth}
        isPrevDisabled={cal.isPrevDisabled}
        today={cal.today}
        className="mb-3.5"
      />

      {/* Room Preference & AC */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-1">Room Preference</label>
          <CustomRoomSelect
            value={roomType}
            onChange={(val) => setRoomType(val)}
            options={roomOptions}
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-1">AC Preference</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsAc(false)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                !isAc ? "bg-gray-900 text-white dark:bg-white dark:text-black border-transparent shadow-xs" : "border-gray-200 dark:border-white/10"
              }`}
            >
              Non-AC
            </button>
            <button
              type="button"
              onClick={() => setIsAc(true)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                isAc ? "bg-sky-600 text-white border-transparent shadow-xs" : "border-gray-200 dark:border-white/10"
              }`}
            >
              AC (+₹100/d)
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Summary */}
      <div className="mb-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/40 p-3 sm:p-3.5 flex items-center justify-between text-xs">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block">
            Pricing Breakdown
          </span>
          <span className="font-black text-gray-950 dark:text-white text-xs sm:text-sm">
            ₹{dailyPrice}/day × {totalDays} {totalDays === 1 ? "day" : "days"}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-gray-500 dark:text-gray-400 block">
            Total Estimated Amount
          </span>
          <span className="text-base font-black text-indigo-700 dark:text-indigo-300">
            ₹{totalAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Resident Details Check */}
      {hasCompleteProfile ? (
        <div className="mb-3 rounded-2xl border border-emerald-200/60 dark:border-emerald-500/25 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck size={14} /> Resident Profile Linked
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              Verified
            </span>
          </div>
          <div className="text-xs">
            <p className="font-black text-gray-900 dark:text-white">{profileName}</p>
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              {profilePhone} {user?.email ? `• ${user.email}` : ""}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2 mb-3">
          <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <AlertCircle size={13} /> Complete your contact details for this stay:
          </div>
          <div className="grid grid-cols-2 gap-2">
            {!hasName ? (
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-0.5">Your Name</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ) : null}
            {!hasPhone ? (
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-0.5">Phone Number</label>
                <input
                  type="tel"
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  placeholder="Mobile Number"
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Purpose */}
      <div className="mb-3.5">
        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">
          Purpose of Short Stay (Optional)
        </label>
        <input
          type="text"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="e.g. Attending semester exams / internship / personal visit"
          className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-gray-300 dark:border-white/10 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || totalDays <= 0}
          className="flex-[2] rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3 text-xs font-black text-white shadow-md hover:shadow-lg transition active:scale-[0.98] disabled:opacity-60 cursor-pointer"
        >
          {loading
            ? "Submitting..."
            : !isVerified
            ? "Verify Account to Request Stay →"
            : `Confirm Short Stay (${totalDays} Days) →`}
        </button>
      </div>
    </ModalShell>
  );
};

// ── REUSABLE ACTION MODAL CARD ──
export const ActionModalCard = memo(({
  onClose,
  icon: Icon,
  iconGradient,
  title,
  subtitle,
  details = [],
  children,
  primaryBtn,
  secondaryBtn,
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
    onClick={onClose}
  >
    <div
      className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border-2 border-[#93B733]/40 bg-white dark:bg-[#111111] p-6 sm:p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer"
      >
        <X size={20} />
      </button>

      <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl text-white shadow-lg mb-4 ${iconGradient}`}>
        <Icon className="w-10 h-10 text-white" />
      </div>

      <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
        {title}
      </h3>
      <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 mt-2 max-w-md mx-auto leading-relaxed">
        {subtitle}
      </p>

      {details.length > 0 && (
        <div className="mt-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.03] p-4 text-left space-y-2.5 text-xs">
          {details.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between ${
                idx < details.length - 1 ? "pb-2 border-b border-gray-200 dark:border-white/10" : ""
              }`}
            >
              <span className="font-semibold text-gray-500 dark:text-gray-400">{item.label}</span>
              {typeof item.value === "string" ? (
                <span className={`font-black ${item.highlight ? "text-gray-950 dark:text-[#bbf246]" : "text-gray-900 dark:text-white"}`}>
                  {item.value}
                </span>
              ) : (
                item.value
              )}
            </div>
          ))}
        </div>
      )}

      {children}

      <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
        {primaryBtn && (
          <button
            onClick={primaryBtn.onClick}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-[#93B733] hover:bg-[#82a32d] px-6 py-3.5 text-xs sm:text-sm font-black text-black shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            {primaryBtn.label}
          </button>
        )}
        {secondaryBtn && (
          <button
            onClick={secondaryBtn.onClick || onClose}
            className="inline-flex items-center justify-center rounded-2xl border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 px-5 py-3.5 text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10 transition cursor-pointer"
          >
            {secondaryBtn.label || "Close"}
          </button>
        )}
      </div>
    </div>
  </div>
));
ActionModalCard.displayName = "ActionModalCard";

export const VisitSuccessModal = ({ pgTitle, visitInfo, onClose }) => (
  <ActionModalCard
    onClose={onClose}
    icon={CalendarCheck}
    iconGradient="bg-gradient-to-tr from-emerald-500 to-[#93B733] shadow-emerald-500/25"
    title="Visit Scheduled!"
    subtitle={<>Your visit request for <strong className="text-gray-950 dark:text-[#bbf246] font-black">{pgTitle}</strong> has been received by the owner.</>}
    details={[
      { label: "Scheduled Date", value: visitInfo?.visitDate },
      { label: "Time Slot", value: visitInfo?.visitTimeSlot, highlight: true },
      {
        label: "Visit Status",
        value: (
          <span className="inline-flex items-center gap-1 font-extrabold text-blue-700 dark:text-blue-400 bg-blue-100/80 dark:bg-blue-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider text-[10px]">
            <Clock size={12} /> Pending Owner Confirmation
          </span>
        ),
      },
    ]}
    secondaryBtn={{ label: "Got it, Thanks!", onClick: onClose }}
  >
    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-4 leading-relaxed">
      The property owner will be expecting your visit. You can also chat on WhatsApp or call them directly.
    </p>
  </ActionModalCard>
);

export const VisitAlreadyRequestedModal = ({ pgTitle, visit, onClose, onNavigate }) => {
  const isConfirmed = visit?.status === "confirmed";
  return (
    <ActionModalCard
      onClose={onClose}
      icon={isConfirmed ? CalendarCheck : Clock}
      iconGradient={isConfirmed ? "bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-blue-500/25" : "bg-gradient-to-tr from-amber-500 to-[#93B733] shadow-amber-500/25"}
      title={isConfirmed ? "Visit Confirmed!" : "Visit Already Requested"}
      subtitle={
        isConfirmed ? (
          <>The owner has <strong className="text-blue-600 dark:text-blue-400 font-black">confirmed</strong> your visit to <strong className="text-gray-950 dark:text-[#bbf246] font-black">{pgTitle}</strong>. We look forward to seeing you!</>
        ) : (
          <>You already submitted a visit request for <strong className="text-gray-950 dark:text-[#bbf246] font-black">{pgTitle}</strong>. Please wait for the owner to verify and confirm in your dashboard.</>
        )
      }
      details={[
        { label: "Scheduled Date", value: visit?.visit_date },
        { label: "Time Slot", value: visit?.visit_time_slot, highlight: true },
        {
          label: "Current Status",
          value: (
            <span className={`inline-flex items-center gap-1 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider text-[10px] ${
              isConfirmed 
                ? "text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20" 
                : "text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20"
            }`}>
              {isConfirmed ? <CheckCircle2 size={12} /> : <Clock size={12} />}
              {isConfirmed ? "Confirmed by Owner" : "Pending Verification"}
            </span>
          ),
        },
      ]}
      primaryBtn={{
        label: <span className="inline-flex items-center gap-1">Track in My Requests <ChevronRight size={16} /></span>,
        onClick: onNavigate,
      }}
      secondaryBtn={{ label: "Close", onClick: onClose }}
    />
  );
};

export const ShortStaySuccessModal = ({ data, onClose, onNavigate }) => (
  <ActionModalCard
    onClose={onClose}
    icon={CalendarRange}
    iconGradient="bg-gradient-to-tr from-indigo-600 to-emerald-500 shadow-indigo-500/25"
    title="Short Stay Requested!"
    subtitle={<>Your request for <strong className="text-gray-950 dark:text-[#bbf246] font-black">{data?.pgTitle}</strong> has been sent to the property owner for review.</>}
    details={[
      { label: "Check-in Date", value: data?.check_in_date },
      { label: "Check-out Date", value: data?.check_out_date },
      { label: "Duration", value: `${data?.total_days} Days`, highlight: true },
      { label: "Estimated Total", value: `₹${Number(data?.total_amount || 0).toLocaleString()}`, highlight: true },
      {
        label: "Request Status",
        value: (
          <span className="inline-flex items-center gap-1 font-extrabold text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider text-[10px]">
            <Clock size={12} /> Pending Owner Approval
          </span>
        ),
      },
    ]}
    primaryBtn={{
      label: <span className="inline-flex items-center gap-1">View in My Short Stays <ChevronRight size={16} /></span>,
      onClick: onNavigate,
    }}
    secondaryBtn={{ label: "Done", onClick: onClose }}
  >
    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-4 leading-relaxed">
      The property owner has received your request. When approved, you will see confirmation and direct contact details on your dedicated Short Stays page.
    </p>
  </ActionModalCard>
);

export const ShortStayAlreadyRequestedModal = ({ pgTitle, stay, onClose, onNavigate }) => {
  const isApproved = stay?.status === "approved";
  return (
    <ActionModalCard
      onClose={onClose}
      icon={isApproved ? CalendarCheck : CalendarRange}
      iconGradient={isApproved ? "bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/25" : "bg-gradient-to-tr from-amber-500 to-indigo-500 shadow-amber-500/25"}
      title={isApproved ? "Short Stay Approved!" : "Short Stay Already Requested"}
      subtitle={
        isApproved ? (
          <>Your short stay for <strong className="text-gray-950 dark:text-[#bbf246] font-black">{pgTitle}</strong> has been <strong className="text-emerald-600 dark:text-emerald-400 font-black">APPROVED</strong> by the owner! Check your dashboard to view contact details.</>
        ) : (
          <>You already submitted a short stay request for <strong className="text-gray-950 dark:text-[#bbf246] font-black">{pgTitle}</strong>. Status: <strong className="text-amber-600 font-black">PENDING OWNER APPROVAL</strong>.</>
        )
      }
      details={[
        { label: "Dates", value: `${stay?.check_in_date} → ${stay?.check_out_date}` },
        { label: "Duration", value: `${stay?.total_days || '—'} Days`, highlight: true },
        {
          label: "Current Status",
          value: (
            <span className={`inline-flex items-center gap-1 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider text-[10px] ${
              isApproved 
                ? "text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20" 
                : "text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20"
            }`}>
              {isApproved ? <CheckCircle2 size={12} /> : <Clock size={12} />}
              {isApproved ? "Approved by Owner" : "Pending Verification"}
            </span>
          ),
        },
      ]}
      primaryBtn={{
        label: <span className="inline-flex items-center gap-1">Open My Short Stays <ChevronRight size={16} /></span>,
        onClick: onNavigate,
      }}
      secondaryBtn={{ label: "Close", onClick: onClose }}
    />
  );
};

export const BookingSuccessModal = ({ pgTitle, roomLabel, price, checkInDate, onClose, onTrack }) => (
  <div 
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
    onClick={onClose}
  >
    <div 
      className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border-2 border-emerald-500/40 bg-white dark:bg-[#111111] p-6 sm:p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer"
      >
        <X size={20} />
      </button>

      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-emerald-500 to-[#93B733] text-white shadow-lg shadow-emerald-500/25 mb-4">
        <Sparkles className="w-10 h-10 text-white" />
      </div>

      <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
        Booking Request Sent!
      </h3>
      <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 mt-2 max-w-md mx-auto leading-relaxed">
        Your booking application for <strong className="text-gray-950 dark:text-[#bbf246] font-black">{pgTitle}</strong> has been received by the property owner.
      </p>

      <div className="mt-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.03] p-4 text-left space-y-2.5 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-white/10">
          <span className="font-semibold text-gray-500 dark:text-gray-400">Selected Room</span>
          <span className="font-black text-gray-900 dark:text-white">{roomLabel || "Base Room"}</span>
        </div>
        <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-white/10">
          <span className="font-semibold text-gray-500 dark:text-gray-400">Monthly Rent</span>
          <span className="font-black text-gray-950 dark:text-[#bbf246]">₹{price?.toLocaleString()} / mo</span>
        </div>
        {checkInDate && (
          <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-white/10">
            <span className="font-semibold text-gray-500 dark:text-gray-400">Planned Check-in</span>
            <span className="font-black text-emerald-600 dark:text-emerald-400">{checkInDate}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-500 dark:text-gray-400">Application Status</span>
          <span className="inline-flex items-center gap-1 font-extrabold text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider text-[10px]">
            <Clock size={12} /> Under Owner Review
          </span>
        </div>
      </div>

      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-4 leading-relaxed">
        Once the owner approves your application, you can view your approval and access the resident stay dashboard.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          onClick={onTrack}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#93B733] hover:bg-[#82a32d] px-6 py-3.5 text-xs sm:text-sm font-black text-black shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
        >
          Track in My Requests <ChevronRight size={16} />
        </button>
        <button
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-2xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 px-5 py-3.5 text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10 transition cursor-pointer"
        >
          Back to Details
        </button>
      </div>
    </div>
  </div>
);

export const AuthPromptModal = ({ onClose, onLogin }) => (
  <div 
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
    onClick={onClose}
  >
    <div 
      className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] p-6 sm:p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white"
      >
        <X size={18} />
      </button>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#93B733]/15 text-[#93B733] text-2xl mb-4">
        🔒
      </div>
      <h3 className="text-xl font-black text-gray-900 dark:text-white">
        Login Required
      </h3>
      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
        Please sign in or create an account to send a visit/booking request to the property owner.
      </p>
      <div className="mt-6 flex flex-col gap-2.5">
        <button
          onClick={onLogin}
          className="w-full rounded-xl bg-[#0D3A1D] hover:bg-[#16502a] py-3 text-xs font-bold text-white transition shadow-sm"
        >
          Log In / Register
        </button>
        <button
          onClick={onClose}
          className="w-full rounded-xl border border-gray-200 dark:border-white/10 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);
