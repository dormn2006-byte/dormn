import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  Check,
  Copy,
  IndianRupee,
  Pencil,
  Percent,
  Plus,
  Share2,
  Ticket,
  Trash2,
  X,
} from "lucide-react";
import api from "../../services/api";

const dayInput = (date) => new Date(date).toISOString().slice(0, 10);
const inDays = (days) => dayInput(Date.now() + days * 24 * 60 * 60 * 1000);

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const emptyForm = () => ({
  code: "",
  discount_type: "flat",
  discount_value: "",
  max_discount_amount: "",
  min_booking_amount: "",
  pg_ids: [],
  expiry_date: inDays(30),
});

const statusStyle = (status) => {
  switch (status) {
    case "active":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    case "reserved":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
    case "used":
      return "bg-gray-500/15 text-gray-600 dark:text-gray-300 border-gray-500/30";
    default:
      return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
  }
};

const discountLabel = (promo) =>
  promo.discount_type === "percentage"
    ? `${promo.discount_value}% off${promo.max_discount_amount ? ` (max ₹${promo.max_discount_amount})` : ""}`
    : `₹${promo.discount_value} off`;

const PromoCodes = () => {
  const [promoCodes, setPromoCodes] = useState([]);
  const [myPGs, setMyPGs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [copiedId, setCopiedId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError("");
      const [codesRes, pgsRes] = await Promise.all([
        api.get("/promo-codes"),
        api.get("/pg/owner/my-pgs"),
      ]);
      setPromoCodes(codesRes.data?.promoCodes || []);
      setMyPGs(pgsRes.data?.pgs || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load your promo codes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeCodes = useMemo(
    () => promoCodes.filter((p) => p.display_status === "active" || p.display_status === "reserved"),
    [promoCodes]
  );
  const invalidCodes = useMemo(
    () => promoCodes.filter((p) => p.display_status === "used" || p.display_status === "expired"),
    [promoCodes]
  );

  const visibleCodes = activeTab === "active" ? activeCodes : invalidCodes;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setIsModalOpen(true);
  };

  const openEdit = (promo) => {
    setEditing(promo);
    setForm({
      code: promo.code || "",
      discount_type: promo.discount_type || "flat",
      discount_value: String(promo.discount_value ?? ""),
      max_discount_amount: promo.max_discount_amount ? String(promo.max_discount_amount) : "",
      min_booking_amount: promo.min_booking_amount ? String(promo.min_booking_amount) : "",
      pg_ids: Array.isArray(promo.pg_ids) ? promo.pg_ids : [],
      expiry_date: promo.expiry_date ? dayInput(promo.expiry_date) : inDays(30),
    });
    setIsModalOpen(true);
  };

  const togglePg = (pgId) => {
    setForm((prev) => ({
      ...prev,
      pg_ids: prev.pg_ids.includes(pgId)
        ? prev.pg_ids.filter((id) => id !== pgId)
        : [...prev.pg_ids, pgId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.discount_value || Number(form.discount_value) <= 0) {
      return alert("Enter a discount value greater than 0.");
    }

    setSaving(true);
    try {
      const payload = {
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        max_discount_amount: form.max_discount_amount ? Number(form.max_discount_amount) : null,
        min_booking_amount: form.min_booking_amount ? Number(form.min_booking_amount) : 0,
        pg_ids: form.pg_ids,
        expiry_date: form.expiry_date,
      };

      if (editing) {
        await api.put(`/promo-codes/${editing.id}`, payload);
      } else {
        await api.post("/promo-codes", { ...payload, code: form.code.trim() || undefined });
      }

      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || "Could not save the promo code.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (promo) => {
    if (!window.confirm(`Delete promo code "${promo.code}"? Students won't be able to use it.`)) {
      return;
    }

    try {
      await api.delete(`/promo-codes/${promo.id}`);
      await fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete the promo code.");
    }
  };

  const handleCopy = async (promo) => {
    try {
      await navigator.clipboard.writeText(promo.code);
      setCopiedId(promo.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      alert(`Copy failed — the code is ${promo.code}`);
    }
  };

  // WhatsApp share needs no phone number: wa.me opens the picker.
  const handleShare = async (promo) => {
    const message =
      `Hi! Here's a Dormn promo code for you: ${promo.code}\n` +
      `It gives ${discountLabel(promo)} on your rent booking.\n` +
      `Enter it at checkout — it's valid once, so use it soon.`;

    try {
      await navigator.clipboard.writeText(promo.code);
      setCopiedId(promo.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* sharing still works without the clipboard */
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  };

  const tabButton = (key, label, count) => (
    <button
      key={key}
      type="button"
      onClick={() => setActiveTab(key)}
      className={`rounded-2xl px-4 py-2 text-xs font-black transition cursor-pointer ${
        activeTab === key
          ? "bg-[#0D3A1D] text-white shadow-sm"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
      }`}
    >
      {label}
      <span className="ml-1.5 opacity-70">{count}</span>
    </button>
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Ticket className="text-[#93B733]" size={22} />
            Promo Codes
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Create single-use discount codes and share them with a specific student.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#93B733] hover:bg-[#82a32d] px-4 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-black text-white shadow-md transition cursor-pointer active:scale-95"
        >
          <Plus size={17} />
          New Promo Code
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-400">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        {tabButton("active", "Active", activeCodes.length)}
        {tabButton("invalid", "Invalid", invalidCodes.length)}
      </div>

      {loading ? (
        <div className="rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220] p-8 sm:p-16 text-center shadow-sm">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-800 border-t-[#93B733] mx-auto mb-4" />
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Loading promo codes…</p>
        </div>
      ) : visibleCodes.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220] p-8 sm:p-16 text-center shadow-sm">
          <Ticket size={36} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-xl font-black text-gray-900 dark:text-white">
            {activeTab === "active" ? "No active promo codes" : "Nothing here yet"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {activeTab === "active"
              ? "Create a code and share it with a student — it stays valid until someone uses it."
              : "Codes appear here once they've been used or have expired."}
          </p>
          {activeTab === "active" && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 mt-5 rounded-2xl bg-[#93B733] hover:bg-[#82a32d] px-4 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-black text-white transition shadow-md cursor-pointer"
            >
              <Plus size={18} />
              Create a promo code
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleCodes.map((promo) => (
            <div
              key={promo.id}
              className="flex flex-col gap-3 rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220] p-4 sm:p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-xl border border-dashed border-[#93B733]/60 bg-[#93B733]/10 px-3 py-1 font-mono text-sm font-black tracking-wider text-[#0D3A1D] dark:text-[#93B733]">
                    {promo.code}
                  </span>
                  <span
                    className={`rounded-lg border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusStyle(
                      promo.display_status
                    )}`}
                  >
                    {promo.display_status}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-gray-600 dark:text-gray-300">
                  <span className="inline-flex items-center gap-1">
                    {promo.discount_type === "percentage" ? <Percent size={13} /> : <IndianRupee size={13} />}
                    {discountLabel(promo)}
                  </span>

                  <span className="inline-flex items-center gap-1">
                    <Building2 size={13} />
                    {promo.pg_titles?.length
                      ? promo.pg_titles.join(", ")
                      : "All my PGs"}
                  </span>

                  <span className="inline-flex items-center gap-1">
                    <CalendarDays size={13} />
                    Expires {formatDate(promo.expiry_date)}
                  </span>

                  {promo.min_booking_amount > 0 && (
                    <span className="text-gray-400">Min ₹{promo.min_booking_amount}</span>
                  )}

                  {promo.display_status === "used" && promo.used_at && (
                    <span className="text-gray-400">Used {formatDate(promo.used_at)}</span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(promo)}
                  title="Copy code"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:bg-gray-100 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5 cursor-pointer"
                >
                  {copiedId === promo.id ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                </button>

                <button
                  type="button"
                  onClick={() => handleShare(promo)}
                  disabled={promo.display_status !== "active"}
                  title="Share on WhatsApp"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-[#0D3A1D] transition hover:bg-gray-100 disabled:opacity-40 dark:border-white/10 dark:text-[#93B733] dark:hover:bg-white/5 cursor-pointer"
                >
                  <Share2 size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => openEdit(promo)}
                  disabled={promo.display_status === "used"}
                  title={promo.display_status === "used" ? "A used code can't be edited" : "Edit"}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:bg-gray-100 disabled:opacity-40 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5 cursor-pointer"
                >
                  <Pencil size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(promo)}
                  title="Delete"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 text-rose-600 transition hover:bg-rose-50 dark:border-rose-500/25 dark:text-rose-400 dark:hover:bg-rose-500/10 cursor-pointer"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <form
            onSubmit={handleSubmit}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#0c1220] sm:p-7"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-900 dark:text-white">
                {editing ? "Edit Promo Code" : "New Promo Code"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-1.5 text-gray-500 transition hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Code */}
            <label className="mb-1 block text-xs font-black uppercase tracking-wider text-gray-500">
              Code
            </label>
            {editing ? (
              <p className="mb-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 font-mono text-sm font-black tracking-wider text-gray-700 dark:border-white/15 dark:bg-white/5 dark:text-gray-200">
                {form.code}
                <span className="ml-2 font-sans text-[10px] font-bold uppercase text-gray-400">
                  not editable
                </span>
              </p>
            ) : (
              <>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="Leave blank to auto-generate"
                  className="mb-4 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-mono text-sm font-bold uppercase tracking-wider text-gray-900 outline-none transition focus:border-[#93B733] dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </>
            )}

            {/* Discount type */}
            <label className="mb-1 block text-xs font-black uppercase tracking-wider text-gray-500">
              Discount type
            </label>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {[
                { key: "flat", label: "Flat ₹", icon: IndianRupee },
                { key: "percentage", label: "Percent %", icon: Percent },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm({ ...form, discount_type: key })}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition cursor-pointer ${
                    form.discount_type === key
                      ? "bg-[#0D3A1D] text-white shadow-sm"
                      : "border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wider text-gray-500">
                  Discount value
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-900 outline-none transition focus:border-[#93B733] dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>

              {form.discount_type === "percentage" && (
                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-wider text-gray-500">
                    Max discount (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.max_discount_amount}
                    onChange={(e) => setForm({ ...form, max_discount_amount: e.target.value })}
                    placeholder="Optional cap"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-900 outline-none transition focus:border-[#93B733] dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wider text-gray-500">
                  Min booking amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.min_booking_amount}
                  onChange={(e) => setForm({ ...form, min_booking_amount: e.target.value })}
                  placeholder="Optional"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-900 outline-none transition focus:border-[#93B733] dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wider text-gray-500">
                  Expires on
                </label>
                <input
                  type="date"
                  value={form.expiry_date}
                  min={inDays(1)}
                  onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-900 outline-none transition focus:border-[#93B733] dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
            </div>

            {/* PG scope */}
            <label className="mt-4 mb-1 block text-xs font-black uppercase tracking-wider text-gray-500">
              Applies to
            </label>
            <div className="max-h-44 space-y-1.5 overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/5">
              <p className="px-1 pb-1 text-[11px] font-bold text-gray-500 dark:text-gray-400">
                {form.pg_ids.length === 0
                  ? "All your PGs (select specific ones to narrow it)"
                  : `${form.pg_ids.length} selected`}
              </p>
              {myPGs.length === 0 ? (
                <p className="px-1 text-xs text-gray-400">You have no PG listings yet.</p>
              ) : (
                myPGs.map((pg) => (
                  <label
                    key={pg.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-2 transition hover:bg-white dark:hover:bg-white/5"
                  >
                    <input
                      type="checkbox"
                      checked={form.pg_ids.includes(pg.id)}
                      onChange={() => togglePg(pg.id)}
                      className="h-4 w-4 accent-[#93B733] cursor-pointer"
                    />
                    <span className="truncate text-xs font-bold text-gray-700 dark:text-gray-200">
                      {pg.title}
                    </span>
                  </label>
                ))
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-2xl border border-gray-200 px-5 py-3 text-xs font-black text-gray-600 transition hover:bg-gray-100 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-[#93B733] px-6 py-3 text-xs font-black text-white shadow-md transition hover:bg-[#82a32d] disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Saving…" : editing ? "Save changes" : "Create code"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PromoCodes;
