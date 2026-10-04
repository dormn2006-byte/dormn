import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Compass,
  Home,
  IndianRupee,
  Megaphone,
  Sparkles,
  Trash2,
} from "lucide-react";
import api from "../../services/api";
import { loadRazorpayScript } from "../../utils/razorpay";

const PLACEMENTS = [
  {
    id: "home",
    label: "Home Page",
    icon: Home,
    desc: "The hero section, right of “Find Your Dream PG”.",
  },
  {
    id: "explore",
    label: "Explore Page",
    icon: Compass,
    desc: "Shown when students haven't searched or applied filters.",
  },
];

const statusStyle = (status) => {
  switch (status) {
    case "active":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    case "created":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
    case "expired":
      return "bg-gray-500/15 text-gray-600 dark:text-gray-300 border-gray-500/30";
    default:
      return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
  }
};

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const SlotCard = ({ label, icon: Icon, slot }) => {
  const available = slot?.available ?? 0;
  const total = slot?.total ?? 0;
  const used = slot?.used ?? 0;
  const isFull = available <= 0;

  return (
    <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c1220] p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#4E700F] dark:text-[#93B733]">
            <Icon size={18} />
          </span>
          <span className="text-sm font-black text-gray-900 dark:text-white">{label}</span>
        </div>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
            isFull
              ? "border-rose-500/30 bg-rose-500/15 text-rose-600 dark:text-rose-400"
              : "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {isFull ? "Full" : `${available} free`}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">
            {used}
            <span className="text-base font-bold text-gray-400"> / {total}</span>
          </p>
          <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">slots in use</p>
        </div>
        <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
          <div
            className={`h-full rounded-full ${isFull ? "bg-rose-500" : "bg-[#93B733]"}`}
            style={{ width: `${total ? Math.min(100, (used / total) * 100) : 0}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const SponsorPG = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sponsorships, setSponsorships] = useState([]);
  const [slots, setSlots] = useState({ home: null, explore: null });
  const [price, setPrice] = useState(5000);
  const [durationDays, setDurationDays] = useState(30);
  const [myPGs, setMyPGs] = useState([]);
  const [selectedPgId, setSelectedPgId] = useState("");
  const [placement, setPlacement] = useState("home");
  const [paying, setPaying] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const approvedPGs = useMemo(
    () => myPGs.filter((pg) => (pg.status || "").toLowerCase() === "approved"),
    [myPGs]
  );

  const fetchData = useCallback(async () => {
    try {
      const [sponsorRes, pgsRes] = await Promise.all([
        api.get("/sponsors/owner"),
        api.get("/pg/owner/my-pgs").catch(() => ({ data: {} })),
      ]);

      setSponsorships(sponsorRes.data?.sponsorships || []);
      setSlots(sponsorRes.data?.slots || { home: null, explore: null });
      if (sponsorRes.data?.price) setPrice(sponsorRes.data.price);
      if (sponsorRes.data?.durationDays) setDurationDays(sponsorRes.data.durationDays);

      const pgs = pgsRes.data?.pgs || [];
      setMyPGs(Array.isArray(pgs) ? pgs : []);
      setError("");
    } catch (err) {
      console.error("Sponsor data load failed:", err);
      setError(err?.response?.data?.message || "Failed to load sponsorship details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedPlacement = PLACEMENTS.find((p) => p.id === placement) || PLACEMENTS[0];
  const currentSlot = slots?.[placement];
  const placementFull = currentSlot ? currentSlot.available <= 0 : false;

  // pg_id -> set of placements the owner has already paid for (active or pending).
  const paidPlacements = useMemo(() => {
    const map = new Map();
    sponsorships.forEach((s) => {
      if (s.status !== "active" && s.status !== "created") return;
      if (!map.has(s.pg_id)) map.set(s.pg_id, new Set());
      map.get(s.pg_id).add(s.placement);
    });
    return map;
  }, [sponsorships]);

  const selectedAlreadyPaid =
    Boolean(selectedPgId) && Boolean(paidPlacements.get(Number(selectedPgId))?.has(placement));

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      setError("");
      await api.delete(`/sponsors/${deleteTarget.id}`);
      setDeleteTarget(null);
      setNotice("Sponsorship removed — its slot is now free.");
      fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to remove the sponsorship.");
    } finally {
      setDeleting(false);
    }
  };

  const handlePay = async () => {
    setError("");
    setNotice("");

    const pgId = Number(selectedPgId);
    if (!pgId) {
      setError("Please select a PG to sponsor.");
      return;
    }
    if (selectedAlreadyPaid) {
      setError(`You have already paid for this PG on the ${selectedPlacement.label} placement.`);
      return;
    }
    if (placementFull) {
      setError(`All ${selectedPlacement.label} slots are currently taken. Please try again later.`);
      return;
    }

    try {
      setPaying(true);

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        setError("Could not load the payment gateway. Check your connection and try again.");
        return;
      }

      const { data } = await api.post("/sponsors/create-order", {
        pg_id: pgId,
        placement,
      });

      const rzp = new window.Razorpay({
        key: data.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: "Dormn",
        description: `Sponsored listing — ${selectedPlacement.label}`,
        order_id: data.order_id,
        theme: { color: "#93B733" },
        handler: async (response) => {
          try {
            await api.post("/sponsors/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setNotice(`Payment successful — your PG is now sponsored on the ${selectedPlacement.label}!`);
            setSelectedPgId("");
            fetchData();
          } catch (verifyErr) {
            setError(verifyErr?.response?.data?.message || "Payment could not be verified. Contact support if you were charged.");
            fetchData();
          }
        },
      });

      rzp.on("payment.failed", (resp) => {
        setError(resp?.error?.description || "Payment failed. Please try again.");
      });

      rzp.open();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to start the sponsorship payment.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Megaphone className="text-[#93B733]" size={22} />
            Sponsor Your PG
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Pay ₹{Number(price).toLocaleString()} to feature your PG for {durationDays} days — Home and Explore are paid separately.
          </p>
        </div>
      </div>

      {notice && (
        <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-400">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Slot availability */}
      <div className="grid gap-4 sm:grid-cols-2">
        <SlotCard label="Home Page" icon={Home} slot={slots?.home} />
        <SlotCard label="Explore Page" icon={Compass} slot={slots?.explore} />
      </div>

      {/* Purchase */}
      <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c1220] p-5 sm:p-6 shadow-sm space-y-5">
        <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles size={18} className="text-[#93B733]" />
          Buy a Sponsored Slot
        </h2>

        {/* PG */}
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Select a PG
          </label>
          {approvedPGs.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400">
              <AlertCircle size={15} className="shrink-0" />
              <span>You have no approved PGs yet. Only approved listings can be sponsored.</span>
            </div>
          ) : (
            <select
              value={selectedPgId}
              onChange={(e) => setSelectedPgId(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50/60 dark:bg-[#111a2c] px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:border-[#93B733]"
            >
              <option value="">Choose a PG…</option>
              {approvedPGs.map((pg) => (
                <option key={pg.id} value={pg.id}>
                  {pg.title}
                  {pg.city ? ` — ${pg.city}` : ""}
                </option>
              ))}
            </select>
          )}

          {selectedAlreadyPaid && (
            <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
              <AlertCircle size={13} className="shrink-0" />
              You have already paid for this PG on the {selectedPlacement.label} placement.
            </p>
          )}
        </div>

        {/* Placement */}
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Placement
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {PLACEMENTS.map((p) => {
              const Icon = p.icon;
              const isSelected = placement === p.id;
              const slot = slots?.[p.id];
              const full = slot ? slot.available <= 0 : false;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlacement(p.id)}
                  className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-[#93B733] bg-[#93B733]/10"
                      : "border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.03] hover:border-[#93B733]/40"
                  }`}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isSelected ? "bg-[#93B733] text-white" : "bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300"}`}>
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-sm font-black text-gray-900 dark:text-white">
                      {p.label}
                      {full && (
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/15 px-2 py-0.5 text-[9px] font-black uppercase text-rose-600 dark:text-rose-400">
                          Full
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                      {p.desc}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary + pay */}
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Price</p>
              <p className="text-xl font-black text-gray-900 dark:text-white flex items-center">
                <IndianRupee size={16} className="mr-0.5" />
                {Number(price).toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-px bg-gray-200 dark:bg-white/10" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Duration</p>
              <p className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-1">
                {durationDays}
                <span className="text-sm font-bold text-gray-400">days</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePay}
            disabled={paying || !selectedPgId || placementFull || selectedAlreadyPaid || approvedPGs.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#93B733] hover:bg-[#82a32d] px-6 py-3.5 text-sm font-black text-white shadow-md transition cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <BadgeCheck size={18} />
            {paying ? "Starting payment…" : `Pay ₹${Number(price).toLocaleString()} & Sponsor`}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Existing sponsorships */}
      <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c1220] p-5 sm:p-6 shadow-sm">
        <h2 className="mb-4 text-base sm:text-lg font-black text-gray-900 dark:text-white">
          Your Sponsorships
        </h2>

        {loading ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-800 border-t-[#93B733]" />
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Loading…</p>
          </div>
        ) : sponsorships.length === 0 ? (
          <div className="py-12 text-center">
            <Megaphone size={34} className="mx-auto mb-3 text-gray-400" />
            <h3 className="text-base font-black text-gray-900 dark:text-white">No sponsorships yet</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Buy a slot above to feature one of your PGs.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sponsorships.map((s) => (
              <div
                key={s.id}
                className="flex flex-col gap-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#4E700F] dark:text-[#93B733]">
                    <Building2 size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-gray-900 dark:text-white">
                      {s.pg_title || `PG #${s.pg_id}`}
                    </p>
                    <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                      {s.placement === "home" ? "Home Page" : "Explore Page"} • ₹{Number(s.amount).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {s.expires_at && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                      <CalendarDays size={13} />
                      {s.status === "active" ? "Ends" : "Ended"} {formatDate(s.expires_at)}
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${statusStyle(s.status)}`}>
                    {s.status === "active" ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                    {s.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(s)}
                    title="Remove sponsorship"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-200 text-rose-600 transition hover:bg-rose-50 active:scale-95 cursor-pointer dark:border-rose-500/25 dark:text-rose-400 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-2xl dark:border-white/15 dark:bg-[#141414]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/25 bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <Trash2 size={26} />
            </div>
            <h3 className="mt-4 text-lg font-black text-gray-900 dark:text-white">
              Remove this sponsorship?
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
              <strong>{deleteTarget.pg_title || `PG #${deleteTarget.pg_id}`}</strong> will be removed from the{" "}
              {deleteTarget.placement === "home" ? "Home Page" : "Explore Page"} and its slot will be freed.
              This can't be undone.
            </p>
            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-xs font-bold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 cursor-pointer dark:border-white/15 dark:text-gray-300 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl bg-rose-600 px-4 py-3 text-xs font-black text-white shadow-md transition hover:bg-rose-700 active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                {deleting ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SponsorPG;
