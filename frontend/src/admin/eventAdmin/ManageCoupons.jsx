import { useState, useMemo } from "react";
import {
  Tag,
  Plus,
  Search,
  Copy,
  Check,
  Trash2,
  IndianRupee,
  Percent,
  ChevronDown
} from "lucide-react";
import { getAdminCoupons, saveAdminCoupon, deleteAdminCoupon, computeEventAnalytics } from "../../services/eventAdminService";

const CATEGORY_OPTIONS = [
  { id: "all", label: "All (Events, Concerts, Clubs)", icon: "🌟" },
  { id: "events", label: "Events & Fests Only", icon: "🎟️" },
  { id: "concerts", label: "Live Concerts Only", icon: "🎸" },
  { id: "clubs", label: "Nightlife & Clubs Only", icon: "🍸" }
];

const INITIAL_FORM = {
  code: "",
  discountType: "percent",
  discountVal: 20,
  maxUses: 100,
  applicableCategory: "all",
  description: ""
};

const ManageCoupons = () => {
  const [coupons, setCoupons] = useState(() => getAdminCoupons());
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedCode, setCopiedCode] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  const updateField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const analytics = useMemo(() => computeEventAnalytics("all", "month"), [coupons]);
  const { couponsList } = analytics;

  const filteredCoupons = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return coupons;
    return coupons.filter((c) =>
      c.code.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  }, [coupons, searchTerm]);

  const handleCopy = (code) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const handleCreateCoupon = (e) => {
    e.preventDefault();
    if (!form.code.trim()) return;

    const couponObj = {
      code: form.code.toUpperCase().trim(),
      discountPercent: form.discountType === "percent" ? Number(form.discountVal) : null,
      discountAmount: form.discountType === "flat" ? Number(form.discountVal) : null,
      maxUses: Number(form.maxUses) || 100,
      applicableCategory: form.applicableCategory,
      description: form.description || `Special promo coupon offering ${form.discountType === "percent" ? `${form.discountVal}% off` : `₹${form.discountVal} flat discount`}.`
    };

    const updated = saveAdminCoupon(couponObj);
    setCoupons(updated);
    setIsCreateOpen(false);
    setIsCatOpen(false);
    setForm(INITIAL_FORM);
  };

  const handleDelete = (id, code) => {
    if (window.confirm(`Delete coupon code: ${code}?`)) {
      setCoupons(deleteAdminCoupon(id));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0C1220] p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center font-black">
              <Tag size={18} />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">
              Coupons & Discount Promotions ({coupons.length})
            </h2>
          </div>
          <p className="text-xs font-semibold text-gray-400 mt-1">
            Create and track promotional codes, redemption limits, and gross revenue driven.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search coupons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 py-2.5 pl-10 pr-4 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-pink-500"
            />
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-4 py-2.5 text-xs font-black text-white shadow-md transition cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Promo Code</span>
          </button>
        </div>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCoupons.map((coupon) => {
          const stats = couponsList.find(c => c.code === coupon.code) || {
            usedCount: coupon.usedCount || 0,
            totalDiscountGiven: 0,
            revenueGenerated: 0
          };

          return (
            <div
              key={coupon.id}
              className="rounded-3xl border border-purple-500/20 bg-white dark:bg-[#0C1220] p-6 shadow-sm hover:shadow-xl transition-all space-y-4 flex flex-col justify-between"
            >
              <div>
                {/* Code Pill + Copy */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-purple-600 dark:text-purple-300 bg-purple-500/15 border border-purple-500/30 px-3.5 py-1.5 rounded-2xl tracking-wider">
                      {coupon.code}
                    </span>
                    <button
                      onClick={() => handleCopy(coupon.code)}
                      className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-gray-600 dark:text-gray-300 transition cursor-pointer"
                      title="Copy Code"
                    >
                      {copiedCode === coupon.code ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>

                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    {coupon.status || "ACTIVE"}
                  </span>
                </div>

                {/* Discount value & description */}
                <div className="mt-3">
                  <div className="text-2xl font-black text-gray-900 dark:text-white">
                    {coupon.discountPercent ? `${coupon.discountPercent}% OFF` : `₹${coupon.discountAmount} FLAT OFF`}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mt-1">
                    {coupon.description}
                  </p>
                </div>

                {/* Details Pills */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-white/5 text-xs font-bold">
                  <div className="p-2 rounded-xl bg-gray-50 dark:bg-white/5">
                    <span className="text-[10px] uppercase text-gray-400 block">Member Capacity</span>
                    <span className="font-black text-purple-600 dark:text-purple-400">
                      {coupon.maxUses ? `${coupon.maxUses} members` : "Unlimited"}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-gray-50 dark:bg-white/5">
                    <span className="text-[10px] uppercase text-gray-400 block">Applicable To</span>
                    <span className="font-black text-gray-800 dark:text-gray-200 uppercase">
                      {coupon.applicableCategory || "ALL"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Performance Stats Strip */}
              <div className="p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-500/20 flex items-center justify-between text-xs font-bold">
                <div>
                  <span className="text-[10px] uppercase text-gray-400 block font-bold">Members Used</span>
                  <span className="font-black text-gray-900 dark:text-white">
                    {stats.usedCount} / {coupon.maxUses || 100}
                  </span>
                  <span className="text-[9px] text-gray-400 block font-bold">
                    ({Math.max(0, (coupon.maxUses || 100) - stats.usedCount)} spots left)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-gray-400 block font-bold">Revenue Driven</span>
                  <span className="font-black text-emerald-500">₹{stats.revenueGenerated.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Delete footer button */}
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => handleDelete(coupon.id, coupon.code)}
                  className="text-xs font-black text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Remove Coupon</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* ─── Create Coupon Modal ─── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#111728] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3">
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Create Promo Code</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-white font-black text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Coupon Code (e.g. FESTIVAL50)</label>
                <input
                  type="text"
                  required
                  placeholder="CODE NAME"
                  value={form.code}
                  onChange={(e) => updateField("code", e.target.value.toUpperCase())}
                  className="w-full uppercase font-mono px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 font-black text-sm outline-none focus:border-purple-500"
                />
              </div>

              {/* Row 2: Discount Value & Member Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-gray-400">
                      Discount Value
                    </label>
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                      {form.discountType === "percent" ? "Percentage Off" : "Flat Cash Off"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Modern Segmented Switch for % vs ₹ */}
                    <div className="inline-flex p-1 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateField("discountType", "percent")}
                        className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                          form.discountType === "percent"
                            ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        <Percent size={13} />
                        <span>% Off</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateField("discountType", "flat")}
                        className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                          form.discountType === "flat"
                            ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        <IndianRupee size={13} />
                        <span>₹ Flat</span>
                      </button>
                    </div>

                    {/* Numeric Input with clear inline badge */}
                    <div className="relative flex-1">
                      <input
                        type="number"
                        required
                        min="1"
                        max={form.discountType === "percent" ? 100 : undefined}
                        value={form.discountVal}
                        onChange={(e) => updateField("discountVal", e.target.value)}
                        placeholder={form.discountType === "percent" ? "20" : "150"}
                        className="w-full pl-3.5 pr-14 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 font-black text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-purple-600 dark:text-purple-300 pointer-events-none bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 rounded-lg border border-purple-200 dark:border-purple-500/30">
                        {form.discountType === "percent" ? "% OFF" : "₹ OFF"}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 block mt-1 ml-1">
                    {form.discountType === "percent"
                      ? "User saves this % on their booking total"
                      : "User gets this flat ₹ amount deducted from total"}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    How Many Members Can Use It
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 100"
                    value={form.maxUses}
                    onChange={(e) => updateField("maxUses", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 font-black text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition"
                  />
                  <span className="text-[10px] text-gray-400 block mt-1 ml-1">
                    Member limit before code automatically expires
                  </span>
                </div>
              </div>

              {/* Row 3: Custom Styled Category Dropdown */}
              <div className="relative">
                <label className="block text-xs font-bold text-gray-400 mb-1.5">
                  Applicable Category
                </label>
                <button
                  type="button"
                  onClick={() => setIsCatOpen(!isCatOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 font-bold text-xs text-gray-900 dark:text-white outline-none hover:border-purple-500 focus:border-purple-500 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {CATEGORY_OPTIONS.find((c) => c.id === form.applicableCategory)?.icon || "🌟"}
                    </span>
                    <span>
                      {CATEGORY_OPTIONS.find((c) => c.id === form.applicableCategory)?.label || "All (Events, Concerts, Clubs)"}
                    </span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform duration-200 ${
                      isCatOpen ? "rotate-180 text-purple-500" : ""
                    }`}
                  />
                </button>

                {isCatOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsCatOpen(false)}
                    />
                    <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#151C2E] p-1.5 shadow-2xl z-40 backdrop-blur-xl animate-fadeIn space-y-1">
                      {CATEGORY_OPTIONS.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            updateField("applicableCategory", cat.id);
                            setIsCatOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                            form.applicableCategory === cat.id
                              ? "bg-purple-600 text-white font-black shadow-md shadow-purple-600/30"
                              : "text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-white/5 hover:text-purple-600 dark:hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-sm">{cat.icon}</span>
                            <span>{cat.label}</span>
                          </div>
                          {form.applicableCategory === cat.id && <Check size={15} />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Short Description</label>
                <input
                  type="text"
                  placeholder="e.g. Flat 20% off on all student pass bookings"
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 font-semibold text-xs outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-xs font-black text-white shadow-md cursor-pointer"
                >
                  Create & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageCoupons;
