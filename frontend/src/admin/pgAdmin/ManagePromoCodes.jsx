import { useState, useEffect, useMemo, useCallback, memo } from "react";
import {
  Tag,
  Plus,
  Search,
  Copy,
  Check,
  Trash2,
  Edit2,
  Percent,
  IndianRupee,
  Building2,
  Calendar,
  Users,
  TrendingUp,
  Sparkles,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  X,
  RefreshCw,
} from "lucide-react";
import api from "../../services/api";
import CustomSelect from "../../components/ui/CustomSelect";

const INITIAL_FORM = {
  code: "",
  discount_type: "flat",
  discount_value: "",
  max_discount_amount: "",
  min_booking_amount: "",
  expiry_date: "",
  usage_limit: 50,
  pg_id: "all",
  description: "",
};

const ManagePromoCodes = () => {
  const [coupons, setCoupons] = useState([]);
  const [pgs, setPgs] = useState([]);
  const [stats, setStats] = useState({
    totalCoupons: 0,
    activeCoupons: 0,
    totalRedemptions: 0,
    totalDiscountGiven: 0,
    promoRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPgFilter, setSelectedPgFilter] = useState("all");
  const [copiedCode, setCopiedCode] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchPromoData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/coupons/owner");
      if (res.data?.success) {
        setCoupons(res.data.coupons || []);
        setPgs(res.data.pgs || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error("Failed to load promo codes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromoData();
  }, [fetchPromoData]);

  const updateField = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setFormError("");
  };

  const handleCopy = useCallback((code) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  }, []);

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setForm(INITIAL_FORM);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = useCallback((coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      discount_type: coupon.discount_type || "flat",
      discount_value: coupon.discount_value,
      max_discount_amount: coupon.max_discount_amount || "",
      min_booking_amount: coupon.min_booking_amount || "",
      expiry_date: coupon.expiry_date ? coupon.expiry_date.split("T")[0] : "",
      usage_limit: coupon.usage_limit || "",
      pg_id: coupon.pg_id ? String(coupon.pg_id) : "all",
      description: coupon.description || "",
    });
    setFormError("");
    setIsModalOpen(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) {
      setFormError("Promo code is required");
      return;
    }
    if (!form.discount_value || Number(form.discount_value) <= 0) {
      setFormError("Valid discount value is required");
      return;
    }
    if (form.discount_type === "percentage" && Number(form.discount_value) > 100) {
      setFormError("Percentage discount cannot exceed 100%");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");

      const payload = {
        code: form.code.toUpperCase().trim(),
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        max_discount_amount: form.max_discount_amount ? Number(form.max_discount_amount) : null,
        min_booking_amount: form.min_booking_amount ? Number(form.min_booking_amount) : 0,
        expiry_date: form.expiry_date || null,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        pg_id: form.pg_id === "all" ? null : Number(form.pg_id),
        description: form.description.trim(),
      };

      if (editingCoupon) {
        await api.put(`/coupons/owner/${editingCoupon.id}`, payload);
      } else {
        await api.post("/coupons/owner", payload);
      }

      setIsModalOpen(false);
      setEditingCoupon(null);
      setForm(INITIAL_FORM);
      await fetchPromoData();
    } catch (err) {
      console.error("Save promo code error:", err);
      setFormError(err?.response?.data?.message || "Failed to save promo code.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = useCallback(async (id) => {
    try {
      // Optimistic update
      setCoupons((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_active: c.is_active ? 0 : 1 } : c))
      );
      await api.patch(`/coupons/owner/${id}/status`);
      fetchPromoData();
    } catch (err) {
      console.error("Toggle coupon status error:", err);
      fetchPromoData();
    }
  }, [fetchPromoData]);

  const handleDelete = useCallback(async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete promo code "${code}"?`)) return;
    try {
      await api.delete(`/coupons/owner/${id}`);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      fetchPromoData();
    } catch (err) {
      console.error("Delete promo code error:", err);
      alert(err?.response?.data?.message || "Failed to delete promo code.");
    }
  }, [fetchPromoData]);

  const filteredCoupons = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return coupons.filter((c) => {
      const matchesSearch =
        !q ||
        c.code.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.pg_title && c.pg_title.toLowerCase().includes(q));

      const matchesPg =
        selectedPgFilter === "all" ||
        (selectedPgFilter === "global" && !c.pg_id) ||
        String(c.pg_id) === String(selectedPgFilter);

      return matchesSearch && matchesPg;
    });
  }, [coupons, searchTerm, selectedPgFilter]);

  return (
    <div className="space-y-2.5 sm:space-y-6 max-w-[1600px] mx-auto animate-fadeIn pb-12">
      {/* ── HEADER CARD ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 rounded-2xl sm:rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0C1220] p-3 sm:p-6 shadow-xs sm:shadow-sm">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-xl sm:rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black shrink-0">
              <Tag size={15} className="sm:hidden" />
              <Tag size={20} className="hidden sm:block" />
            </div>
            <div className="min-w-0">
              <span className="rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider inline-block">
                Marketing
              </span>
              <h1 className="text-sm sm:text-2xl font-black text-gray-900 dark:text-white truncate leading-tight">
                Promo Codes & Discounts
              </h1>
            </div>
          </div>

          {/* Mobile Quick Action Buttons */}
          <div className="flex sm:hidden items-center gap-1.5 shrink-0">
            <button
              onClick={fetchPromoData}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-purple-500 hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer"
              title="Refresh Codes"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-2.5 py-1.5 text-xs font-black text-white shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Plus size={13} />
              <span>Create</span>
            </button>
          </div>
        </div>

        <p className="hidden sm:block text-xs font-medium text-gray-500 dark:text-gray-400 mt-2 max-w-xl">
          Create custom promo codes for your properties. Students can apply these codes during booking or rent payments to receive discounts.
        </p>

        {/* Desktop Action Buttons */}
        <div className="hidden sm:flex items-center gap-3 flex-wrap">
          <button
            onClick={fetchPromoData}
            className="flex items-center justify-center rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition shrink-0 cursor-pointer"
            title="Refresh Codes"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-purple-500" : "text-purple-500"} />
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-5 py-3 text-xs font-black text-white shadow-md hover:shadow-lg transition cursor-pointer active:scale-95"
          >
            <Plus size={16} />
            <span>Create Promo Code</span>
          </button>
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3.5">
        <div className="rounded-xl sm:rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0C1220] p-2.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider">Total Codes</span>
            <Tag size={13} className="text-purple-500 sm:w-3.5 sm:h-3.5" />
          </div>
          <p className="text-base sm:text-2xl font-black text-gray-900 dark:text-white mt-0.5 sm:mt-1.5 leading-tight">{stats.totalCoupons}</p>
          <p className="hidden sm:block text-[10px] font-semibold text-gray-400 mt-0.5">Created across your PGs</p>
        </div>

        <div className="rounded-xl sm:rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-2.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider">Active Codes</span>
            <Sparkles size={13} className="sm:w-3.5 sm:h-3.5" />
          </div>
          <p className="text-base sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 sm:mt-1.5 leading-tight">{stats.activeCoupons}</p>
          <p className="hidden sm:block text-[10px] font-semibold text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">Currently redeemable</p>
        </div>

        <div className="rounded-xl sm:rounded-2xl border border-blue-500/20 bg-blue-500/5 p-2.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider">Redemptions</span>
            <Users size={13} className="sm:w-3.5 sm:h-3.5" />
          </div>
          <p className="text-base sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5 sm:mt-1.5 leading-tight">{stats.totalRedemptions}</p>
          <p className="hidden sm:block text-[10px] font-semibold text-blue-600/70 dark:text-blue-400/70 mt-0.5">Students joined with promo</p>
        </div>

        <div className="rounded-xl sm:rounded-2xl border border-amber-500/20 bg-amber-500/5 p-2.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider">Discount Given</span>
            <Percent size={13} className="sm:w-3.5 sm:h-3.5" />
          </div>
          <p className="text-base sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-1.5 leading-tight">
            ₹{stats.totalDiscountGiven.toLocaleString()}
          </p>
          <p className="hidden sm:block text-[10px] font-semibold text-amber-600/70 dark:text-amber-400/70 mt-0.5">Total concessions provided</p>
        </div>

        <div className="rounded-xl sm:rounded-2xl border border-purple-500/20 bg-purple-500/5 p-2.5 sm:p-4 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider">Promo Revenue</span>
            <TrendingUp size={13} className="sm:w-3.5 sm:h-3.5" />
          </div>
          <p className="text-base sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5 sm:mt-1.5 leading-tight">
            ₹{stats.promoRevenue.toLocaleString()}
          </p>
          <p className="hidden sm:block text-[10px] font-semibold text-purple-600/70 dark:text-purple-400/70 mt-0.5">Earned from promo bookings</p>
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0C1220] p-2 sm:p-3.5 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Search promo codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 py-1.5 sm:py-2 pl-8.5 pr-3 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-purple-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="hidden sm:inline text-xs font-bold text-gray-400 shrink-0">Property Filter:</label>
          <CustomSelect
            value={selectedPgFilter}
            onChange={(val) => setSelectedPgFilter(val)}
            colorScheme="purple"
            className="w-full sm:w-64"
            buttonClassName="py-1.5 sm:py-2 text-xs font-bold"
            options={[
              { value: "all", label: `All Properties (${coupons.length})` },
              { value: "global", label: "Global (Any PG)" },
              ...pgs.map((pg) => ({
                value: String(pg.id),
                label: `${pg.title} (${pg.city || pg.area || ""})`,
              })),
            ]}
          />
        </div>
      </div>

      {/* ── PROMO CODES GRID ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-8 sm:p-16 rounded-2xl sm:rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0C1220] text-center">
          <div className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-2 sm:border-3 border-gray-200 dark:border-gray-800 border-t-purple-600 mb-2 sm:mb-3" />
          <p className="text-xs font-bold text-gray-500">Loading your promo codes...</p>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 sm:p-16 rounded-2xl sm:rounded-3xl border border-dashed border-gray-200 dark:border-white/10 bg-white dark:bg-[#0C1220] text-center">
          <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-2xl sm:rounded-3xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-2.5 sm:mb-3">
            <Tag size={20} className="sm:hidden" />
            <Tag size={28} className="hidden sm:block" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">No Promo Codes Found</h3>
          <p className="text-[11px] sm:text-xs text-gray-400 max-w-sm mt-1 mb-3.5 sm:mb-5">
            {searchTerm || selectedPgFilter !== "all"
              ? "No promo codes match your filter criteria. Try resetting the filters."
              : "You haven't created any promotional codes yet. Create a promo code to offer flat or percentage discounts to prospective students."}
          </p>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs font-bold shadow-md transition cursor-pointer"
          >
            <Plus size={14} /> Create First Promo Code
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {filteredCoupons.map((coupon) => (
            <PromoCodeCard
              key={coupon.id}
              coupon={coupon}
              isCopied={copiedCode === coupon.code}
              onCopy={handleCopy}
              onToggleStatus={handleToggleStatus}
              onOpenEdit={handleOpenEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ── CREATE / EDIT MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0C1220] p-4 sm:p-6 shadow-2xl space-y-3 sm:space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                  <Tag size={16} />
                </div>
                <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                  {editingCoupon ? "Edit Promo Code" : "Create New Promo Code"}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-2.5 sm:p-3 flex items-center gap-2 text-rose-600 text-xs font-bold">
                <AlertCircle size={14} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 text-xs font-bold text-gray-700 dark:text-gray-300">
              {/* Code Name */}
              <div>
                <label className="block mb-1 text-gray-500">
                  Promo Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. WELCOME100, SUMMER20"
                  value={form.code}
                  disabled={Boolean(editingCoupon)}
                  onChange={(e) => updateField("code", e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))}
                  className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 py-2 sm:py-2.5 px-3 sm:px-3.5 font-mono text-xs sm:text-sm font-black uppercase text-gray-900 dark:text-white outline-none focus:border-purple-500 disabled:opacity-50"
                  required
                />
                <p className="text-[10px] text-gray-400 mt-1">Alphanumeric, no spaces (e.g. DORM500)</p>
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="block mb-1 text-gray-500">Discount Type</label>
                  <CustomSelect
                    value={form.discount_type}
                    onChange={(val) => updateField("discount_type", val)}
                    colorScheme="purple"
                    buttonClassName="py-2 sm:py-2.5 text-xs font-bold bg-gray-50 dark:bg-[#111625]"
                    options={[
                      { value: "flat", label: "Flat Amount (₹)", icon: <IndianRupee size={14} className="text-purple-500" /> },
                      { value: "percentage", label: "Percentage (%)", icon: <Percent size={14} className="text-purple-500" /> },
                    ]}
                  />
                </div>

                <div>
                  <label className="block mb-1 text-gray-500">
                    Discount Value <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                      {form.discount_type === "percentage" ? "%" : "₹"}
                    </span>
                    <input
                      type="number"
                      placeholder={form.discount_type === "percentage" ? "15" : "500"}
                      value={form.discount_value}
                      onChange={(e) => updateField("discount_value", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 py-2 sm:py-2.5 pl-8 pr-3 font-black text-gray-900 dark:text-white outline-none focus:border-purple-500"
                      min="1"
                      max={form.discount_type === "percentage" ? "100" : undefined}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Max Cap (for percentage) & Min Booking */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {form.discount_type === "percentage" ? (
                  <div>
                    <label className="block mb-1 text-gray-500">Max Cap (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 1000"
                      value={form.max_discount_amount}
                      onChange={(e) => updateField("max_discount_amount", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 py-2 sm:py-2.5 px-3 font-semibold text-gray-900 dark:text-white outline-none focus:border-purple-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block mb-1 text-gray-500">Min Booking (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      value={form.min_booking_amount}
                      onChange={(e) => updateField("min_booking_amount", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 py-2 sm:py-2.5 px-3 font-semibold text-gray-900 dark:text-white outline-none focus:border-purple-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block mb-1 text-gray-500">Usage Limit</label>
                  <input
                    type="number"
                    placeholder="e.g. 100"
                    value={form.usage_limit}
                    onChange={(e) => updateField("usage_limit", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 py-2 sm:py-2.5 px-3 font-semibold text-gray-900 dark:text-white outline-none focus:border-purple-500"
                    min="1"
                  />
                </div>
              </div>

              {/* Target Property */}
              <div>
                <label className="block mb-1 text-gray-500">Applicable Property</label>
                <CustomSelect
                  value={form.pg_id}
                  onChange={(val) => updateField("pg_id", val)}
                  colorScheme="purple"
                  buttonClassName="py-2 sm:py-2.5 text-xs font-bold bg-gray-50 dark:bg-[#111625]"
                  options={[
                    { value: "all", label: "All My Properties (Global Code)", icon: <Sparkles size={14} className="text-amber-500" /> },
                    ...pgs.map((p) => ({
                      value: String(p.id),
                      label: `${p.title} (${p.city || p.area || ""})`,
                      icon: <Building2 size={14} className="text-purple-500" />,
                    })),
                  ]}
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Restrict this promo code to a specific PG or allow it across all your listings.
                </p>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block mb-1 text-gray-500">Expiry Date</label>
                <input
                  type="date"
                  value={form.expiry_date}
                  onChange={(e) => updateField("expiry_date", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 py-2 sm:py-2.5 px-3 font-semibold text-gray-900 dark:text-white outline-none focus:border-purple-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block mb-1 text-gray-500">Description / Terms (Optional)</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Special festive offer for semester 1 room admissions."
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 py-2 px-3 font-normal text-gray-900 dark:text-white outline-none focus:border-purple-500 resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 sm:gap-2.5 pt-2.5 sm:pt-3 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-gray-300 dark:border-white/10 px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-4 py-2 sm:px-5 sm:py-2.5 text-xs font-black text-white shadow-md transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingCoupon ? "Update Promo Code" : "Create Promo Code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ── MEMOIZED PROMO CODE CARD COMPONENT ──
const PromoCodeCard = memo(
  ({ coupon, isCopied, onCopy, onToggleStatus, onOpenEdit, onDelete }) => {
    const isPercentage = coupon.discount_type === "percentage";
    const isActive = Boolean(coupon.is_active);
    const isExpired = coupon.expiry_date && new Date(coupon.expiry_date) < new Date();
    const usageFull = coupon.usage_limit && coupon.used_count >= coupon.usage_limit;

    return (
      <div
        className={`relative rounded-2xl sm:rounded-3xl border transition-all duration-200 flex flex-col justify-between p-3.5 sm:p-6 shadow-xs sm:shadow-sm hover:shadow-md ${
          isActive && !isExpired && !usageFull
            ? "border-purple-500/25 bg-white dark:bg-[#0C1220]"
            : "border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] opacity-80"
        }`}
      >
        <div className="space-y-2.5 sm:space-y-4">
          {/* Top: Code Pill + Copy + Status Toggle */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-mono text-xs sm:text-base font-black text-purple-700 dark:text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 sm:px-3.5 sm:py-1 rounded-lg sm:rounded-xl tracking-wider">
                {coupon.code}
              </span>
              <button
                onClick={() => onCopy(coupon.code)}
                className="p-1 sm:p-1.5 rounded-lg text-gray-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-white/5 transition cursor-pointer"
                title="Copy Code"
              >
                {isCopied ? <Check size={14} className="text-emerald-500 sm:w-4 sm:h-4" /> : <Copy size={14} className="sm:w-4 sm:h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleStatus(coupon.id)}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-bold transition cursor-pointer ${
                  isActive && !isExpired && !usageFull
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    : isExpired
                    ? "bg-rose-500/15 text-rose-600 border border-rose-500/30"
                    : usageFull
                    ? "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                    : "bg-gray-200 dark:bg-white/10 text-gray-500"
                }`}
                title="Click to toggle active status"
              >
                {isExpired ? "Expired" : usageFull ? "Exhausted" : isActive ? "Active" : "Paused"}
              </button>
            </div>
          </div>

          {/* Discount Value Display */}
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white">
              {isPercentage ? `${coupon.discount_value}% OFF` : `₹${Number(coupon.discount_value).toLocaleString()} OFF`}
            </span>
            {coupon.max_discount_amount && isPercentage && (
              <span className="text-[10px] sm:text-xs font-semibold text-gray-400">
                (Up to ₹{Number(coupon.max_discount_amount).toLocaleString()})
              </span>
            )}
          </div>

          {/* Description */}
          {coupon.description && (
            <p className="text-[11px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 line-clamp-1 sm:line-clamp-2">
              {coupon.description}
            </p>
          )}

          {/* Property Scope */}
          <div className="rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.03] p-2 sm:p-2.5 space-y-1 sm:space-y-1.5 text-[10px] sm:text-[11px]">
            <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-semibold truncate">
              <Building2 size={12} className="text-purple-500 shrink-0 sm:w-3.5 sm:h-3.5" />
              <span className="truncate">
                {coupon.pg_title ? `Valid for: ${coupon.pg_title}` : "Valid across all your PGs"}
              </span>
            </div>

            {coupon.min_booking_amount > 0 && (
              <div className="flex items-center gap-1.5 text-gray-400">
                <IndianRupee size={12} className="shrink-0 sm:w-3.5 sm:h-3.5" />
                <span>Min Booking: ₹{Number(coupon.min_booking_amount).toLocaleString()}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-gray-400 pt-1 border-t border-gray-200/50 dark:border-white/5">
              <div className="flex items-center gap-1">
                <Users size={11} className="sm:w-3 sm:h-3" />
                <span>
                  {coupon.used_count || 0} / {coupon.usage_limit || "∞"} used
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={11} className="sm:w-3 sm:h-3" />
                <span>
                  {coupon.expiry_date
                    ? new Date(coupon.expiry_date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "No Expiry"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions: Edit & Delete */}
        <div className="mt-3 sm:mt-5 pt-2 sm:pt-3.5 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
          <span className="text-[9px] sm:text-[10px] font-mono text-gray-400">
            ID #{coupon.id}
          </span>

          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={() => onOpenEdit(coupon)}
              className="p-1 sm:p-1.5 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-white/5 transition cursor-pointer"
              title="Edit Promo Code"
            >
              <Edit2 size={13} className="sm:w-3.5 sm:h-3.5" />
            </button>
            <button
              onClick={() => onDelete(coupon.id, coupon.code)}
              className="p-1 sm:p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
              title="Delete Promo Code"
            >
              <Trash2 size={13} className="sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }
);
PromoCodeCard.displayName = "PromoCodeCard";

export default ManagePromoCodes;
