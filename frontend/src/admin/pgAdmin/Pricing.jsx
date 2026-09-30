import { useState, useContext, useEffect, useCallback } from "react";
import { Check, Clock, Headset, RefreshCw, CreditCard, AlertTriangle, Crown, Loader2 } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import API from "../../services/api";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const statusColors = {
  trial: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  expired: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  cancelled: "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30",
};

const CYCLES = [
  { id: "monthly", label: "Monthly", months: 1, badge: null },
  { id: "3months", label: "3 Months", months: 3, badge: "SAVE 5%" },
  { id: "6months", label: "6 Months", months: 6, badge: "SAVE 10%" },
  { id: "yearly", label: "Yearly", months: 12, badge: "SAVE 20%" },
];

const plans = [
  {
    id: "free",
    name: "Free",
    description: "For new owners — try Dormn with a 30-day free trial on your first property.",
    features: ["1 PG listing", "Standard search placement", "Basic booking requests", "Free listing updates", "Web & mobile access"],
    isPopular: false,
    glowStyle: "border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c1220]/80 shadow-lg shadow-gray-200/50 dark:shadow-none",
    buttonStyle: "bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100 font-extrabold shadow-md hover:scale-[1.02]",
  },
  {
    id: "standard",
    name: "Standard",
    description: "For growing PG businesses that need higher visibility and up to 5 properties.",
    features: ["Up to 5 PG listings", "Featured search ranking", "Advanced editing toolkit", "Team collaboration (up to 5)", "Priority customer support"],
    isPopular: false,
    glowStyle: "border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c1220]/90 shadow-lg shadow-gray-200/50 dark:shadow-none",
    buttonStyle: "bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100 font-extrabold shadow-md hover:scale-[1.02]",
  },
  {
    id: "pro",
    name: "Pro",
    description: "For top-tier PG businesses wanting maximum student bookings, AI insights, and unlimited listings.",
    features: ["Unlimited PG listings", "Top #1 priority placement", "AI-powered content & analytics", "Unlimited team members", "Brand customization"],
    isPopular: true,
    glowStyle: "border-emerald-500/60 dark:border-emerald-400/70 bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-blue-600/10 dark:from-emerald-500/15 dark:via-teal-500/10 dark:to-blue-600/20 shadow-2xl shadow-emerald-500/15 dark:shadow-[0_0_50px_rgba(16,185,129,0.3)] relative",
    buttonStyle: "bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-500 text-gray-950 font-black shadow-lg hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:scale-[1.02]",
    buttonInlineStyle: { backgroundColor: "#10b981", color: "#000000" },
  },
];

const Pricing = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [selectedCycle, setSelectedCycle] = useState("monthly");
  const [showModal, setShowModal] = useState(false);
  const [activePlanObj, setActivePlanObj] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [subData, setSubData] = useState(null);
  const [subLoading, setSubLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    try {
      setSubLoading(true);
      const res = await API.get("/subscriptions/my-subscription");
      if (res.data?.success) setSubData(res.data.data);
    } catch (err) {
      console.error("Failed to fetch subscription:", err);
    } finally {
      setSubLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "owner") fetchSubscription();
  }, [user, fetchSubscription]);

  const currentCycleConfig = CYCLES.find((c) => c.id === selectedCycle) || CYCLES[0];

  const getPlanPrice = (planId) => {
    if (planId === "free") {
      return {
        originalMonthly: null,
        monthlyEffective: 0,
        totalAmount: 0,
        label: "Free",
        discountBadge: null,
        totalLabel: "30-day free trial • 1 PG listing",
      };
    }

    const serverPlanConfig = subData?.calculated_plans?.[planId]?.[selectedCycle];
    if (serverPlanConfig) {
      return serverPlanConfig;
    }

    const baseMonthly = planId === "pro" ? 1999 : 999;
    if (selectedCycle === "3months") {
      const monthlyEffective = Math.round(baseMonthly * 0.95);
      return {
        originalMonthly: baseMonthly,
        monthlyEffective,
        totalAmount: monthlyEffective * 3,
        label: `₹${monthlyEffective.toLocaleString()}/m`,
        discountBadge: "5% OFF",
        totalLabel: `Billed ₹${(monthlyEffective * 3).toLocaleString()} for 3 months (Save 5%)`,
      };
    }
    if (selectedCycle === "6months") {
      const monthlyEffective = Math.round(baseMonthly * 0.90);
      return {
        originalMonthly: baseMonthly,
        monthlyEffective,
        totalAmount: monthlyEffective * 6,
        label: `₹${monthlyEffective.toLocaleString()}/m`,
        discountBadge: "10% OFF",
        totalLabel: `Billed ₹${(monthlyEffective * 6).toLocaleString()} for 6 months (Save 10%)`,
      };
    }
    if (selectedCycle === "yearly") {
      const monthlyEffective = Math.round(baseMonthly * 0.80);
      return {
        originalMonthly: baseMonthly,
        monthlyEffective,
        totalAmount: monthlyEffective * 12,
        label: `₹${monthlyEffective.toLocaleString()}/m`,
        discountBadge: "20% OFF",
        totalLabel: `Billed ₹${(monthlyEffective * 12).toLocaleString()} for 1 year (Save 20%)`,
      };
    }

    return {
      originalMonthly: null,
      monthlyEffective: baseMonthly,
      totalAmount: baseMonthly,
      label: `₹${baseMonthly.toLocaleString()}/m`,
      discountBadge: null,
      totalLabel: "Billed monthly",
    };
  };

  const handleSelectPlan = (plan) => {
    if (subData?.tier === plan.id && subData?.status !== "expired" && subData?.status !== "cancelled") return;
    const priceInfo = getPlanPrice(plan.id);
    setActivePlanObj({ ...plan, ...priceInfo });
    setShowModal(true);
  };

  const handleConfirmPlanPayment = async () => {
    if (!activePlanObj) return;
    if (activePlanObj.id === "free") {
      try {
        setIsProcessing(true);
        const res = await API.post("/subscriptions/activate-free");
        if (res.data?.success) {
          updateUser({ subscription_tier: "free", subscription_status: "trial" });
          await fetchSubscription();
          setShowModal(false);
        } else {
          alert(res.data?.message || "Could not activate free plan.");
        }
      } catch (err) {
        alert(err.response?.data?.message || "Failed to activate free plan.");
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      alert("Razorpay SDK failed to load.");
      return;
    }

    setIsProcessing(true);
    try {
      const orderPayload = { plan: activePlanObj.id, cycle: selectedCycle };
      const orderRes = await API.post("/subscriptions/create-order", orderPayload);
      if (!orderRes.data?.success) {
        alert(orderRes.data?.message || "Failed to create order.");
        setIsProcessing(false);
        return;
      }

      const { order_id, amount, currency } = orderRes.data;
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        alert("Payment gateway key not configured.");
        setIsProcessing(false);
        return;
      }

      const options = {
        key: razorpayKey,
        amount,
        currency: currency || "INR",
        name: "Dormn Platform",
        description: `Owner ${activePlanObj.name} Membership (${currentCycleConfig.label})`,
        order_id,
        handler: async function (response) {
          try {
            const verifyRes = await API.post("/subscriptions/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (verifyRes.data?.success) {
              updateUser({ subscription_tier: activePlanObj.id, subscription_status: "active" });
              await fetchSubscription();
              setShowModal(false);
            } else {
              alert("Payment verification failed. Contact support if amount was deducted.");
            }
          } catch {
            alert("Payment verification failed. Contact support if amount was deducted.");
          } finally {
            setIsProcessing(false);
          }
        },
        modal: { ondismiss: () => setIsProcessing(false) },
        prefill: { name: user?.full_name || "PG Owner", email: user?.email || "", contact: user?.phone || "" },
        theme: { color: "#0D3A1D" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to start payment.");
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setIsProcessing(true);
      const res = await API.post("/subscriptions/cancel");
      if (res.data?.success) {
        updateUser({ subscription_status: "cancelled" });
        await fetchSubscription();
        setShowCancelModal(false);
      } else {
        alert(res.data?.message || "Could not cancel.");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel.");
    } finally {
      setIsProcessing(false);
    }
  };

  const currentTier = subData?.tier || user?.subscription_tier || "free";
  const currentStatus = subData?.status || user?.subscription_status || "trial";
  const daysRemaining = subData?.days_remaining ?? null;
  const expiresAt = subData?.expires_at ? new Date(subData.expires_at) : null;
  const currentPgCount = subData?.current_pg_count ?? 0;
  const maxPgListings = subData?.max_pg_listings ?? 1;

  return (
    <div className="relative min-h-full w-full overflow-hidden p-4 sm:p-6 md:p-8 lg:p-12 bg-[#FAFAFA] dark:bg-[#060911] text-gray-900 dark:text-white transition-colors duration-300">
      <div className="pointer-events-none absolute -top-40 -left-40 h-[550px] w-[550px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 blur-[140px]" />
      <div className="pointer-events-none absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-blue-500/10 dark:bg-blue-600/25 blur-[150px]" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-[500px] w-[500px] rounded-full bg-teal-500/10 dark:bg-teal-500/15 blur-[130px]" />

      {/* ══════ SUBSCRIPTION STATUS BAR ══════ */}
      {!subLoading && subData && (
        <div className="relative z-10 mb-8 max-w-6xl mx-auto">
          <div className="rounded-2xl border bg-white dark:bg-[#0c1220] border-gray-200 dark:border-white/10 p-5 sm:p-6 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${currentTier === "pro" ? "bg-gradient-to-br from-emerald-500 to-teal-500" : currentTier === "standard" ? "bg-blue-500" : currentTier === "custom" ? "bg-purple-500" : "bg-gray-500"} text-white shadow-lg`}>
                  <Crown size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">{currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} Plan</h3>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusColors[currentStatus] || statusColors.trial}`}>
                      {currentStatus === "trial" ? "Free Trial" : currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {daysRemaining !== null && daysRemaining >= 0 ? `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining${expiresAt ? ` • Expires ${expiresAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}` : currentStatus === "expired" ? "Your subscription has expired. Please renew to continue." : ""}
                    {subData?.cycle ? ` • ${subData.cycle.charAt(0).toUpperCase() + subData.cycle.slice(1)} billing` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">PG Listings</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${currentPgCount >= maxPgListings ? "bg-red-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, (currentPgCount / Math.max(1, maxPgListings)) * 100)}%` }} />
                    </div>
                    <span className="text-xs font-black text-gray-700 dark:text-gray-300">{currentPgCount}/{maxPgListings >= 999 ? "∞" : maxPgListings}</span>
                  </div>
                </div>
                {currentStatus === "active" && currentTier !== "free" && (
                  <button onClick={() => setShowCancelModal(true)} className="text-[11px] font-bold text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-200 dark:border-red-500/30 rounded-lg px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 transition cursor-pointer">Cancel Plan</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {subLoading && (
        <div className="relative z-10 mb-8 flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-emerald-500" />
          <span className="ml-2 text-sm font-bold text-gray-500">Loading subscription...</span>
        </div>
      )}

      {/* ══════ 4-TAB BILLING CYCLE SWITCHER ══════ */}
      <div className="relative z-10 mb-10 text-center max-w-4xl mx-auto">
        <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 rounded-2xl sm:rounded-full border border-gray-200 dark:border-white/10 bg-white/95 dark:bg-[#0c1220]/95 p-1.5 backdrop-blur-xl shadow-lg">
          {CYCLES.map((cycle) => {
            const isSelected = selectedCycle === cycle.id;
            return (
              <button
                key={cycle.id}
                onClick={() => setSelectedCycle(cycle.id)}
                className={`flex items-center gap-1.5 rounded-full px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-black transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 text-white shadow-md scale-[1.02]"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
              >
                <span>{cycle.label}</span>
                {cycle.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${
                      isSelected
                        ? "bg-black/20 text-white border border-white/20"
                        : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30"
                    }`}
                  >
                    {cycle.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════ 3 PRICING CARDS ══════ */}
      <div className="relative z-10 grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8 w-full max-w-6xl mx-auto items-stretch">
        {plans.map((plan) => {
          const isCurrentPlan = currentTier === plan.id && currentStatus !== "expired";
          const priceInfo = getPlanPrice(plan.id);

          return (
            <div
              key={plan.name}
              className={`group flex flex-col justify-between rounded-3xl border p-6 sm:p-8 backdrop-blur-xl transition-all duration-300 ${plan.glowStyle} ${
                isCurrentPlan ? "ring-2 ring-emerald-500/90 dark:ring-emerald-400/90 scale-[1.02]" : "hover:-translate-y-1 hover:border-gray-300 dark:hover:border-white/20"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">{plan.name}</h3>
                  {plan.isPopular && (
                    <span className="rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                      Popular
                    </span>
                  )}
                  {isCurrentPlan && (
                    <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Active
                    </span>
                  )}
                </div>

                {/* ══════ PRICING DISPLAY: CANCELLED ORIGINAL + DISCOUNT PRICE ══════ */}
                <div className="mt-4 flex flex-col gap-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    {priceInfo.originalMonthly && priceInfo.originalMonthly > priceInfo.monthlyEffective && (
                      <span className="text-xl sm:text-2xl font-bold text-gray-400 dark:text-gray-500 line-through">
                        ₹{priceInfo.originalMonthly.toLocaleString()}
                      </span>
                    )}
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-gray-900 dark:text-white">
                      {priceInfo.label}
                    </span>
                    {priceInfo.discountBadge && (
                      <span className="rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-black">
                        {priceInfo.discountBadge}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {priceInfo.totalLabel}
                  </p>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-gray-600 dark:text-gray-400 min-h-[36px]">
                  {plan.description}
                </p>

                <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-gray-200 dark:via-white/15 to-transparent" />

                <ul className="space-y-3.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isCurrentPlan}
                  style={!isCurrentPlan && plan.buttonInlineStyle ? plan.buttonInlineStyle : {}}
                  className={`w-full rounded-2xl py-3.5 sm:py-4 text-xs font-black tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${plan.buttonStyle}`}
                >
                  {isCurrentPlan ? "Current Plan" : currentTier !== "free" && plan.id === "free" ? "Downgrade" : "Choose Plan"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ══════ TRUST FOOTER ══════ */}
      <div className="relative z-10 mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-8 border-t border-gray-200 dark:border-white/10 text-center">
        {[
          { icon: Clock, color: "emerald", title: "Instant Activation", sub: "Features unlock immediately upon upgrade" },
          { icon: Headset, color: "blue", title: "24/7 Dedicated Support", sub: "Priority assistance for verified owners" },
          { icon: RefreshCw, color: "teal", title: "Flexible Upgrades", sub: "Switch or cancel plans anytime seamlessly" },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-center gap-3 text-gray-700 dark:text-gray-300">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${item.color}-500/10 text-${item.color}-600 dark:text-${item.color}-400`}>
              <item.icon size={20} />
            </div>
            <div className="text-left">
              <h4 className="text-xs font-black text-gray-900 dark:text-white">{item.title}</h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ══════ PAYMENT CONFIRMATION MODAL ══════ */}
      {showModal && activePlanObj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 dark:border-emerald-500/30 bg-white dark:bg-[#0c1220] p-7 text-gray-900 dark:text-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CreditCard size={24} />
            </div>
            <h3 className="text-xl font-black">{activePlanObj.id === "free" ? "Activate Free Trial" : `Upgrade to ${activePlanObj.name} Plan`}</h3>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              {activePlanObj.id === "free" ? (
                "You'll get 30 days free with 1 PG listing. No payment required."
              ) : (
                <>
                  You selected the <strong className="text-gray-900 dark:text-white">{activePlanObj.name} Plan</strong> ({currentCycleConfig.label} Billing).
                </>
              )}
            </p>
            {activePlanObj.id !== "free" && (
              <div className="my-5 rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Payable</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {currentCycleConfig.months} Month{currentCycleConfig.months > 1 ? "s" : ""} Access{" "}
                    {activePlanObj.discountBadge ? `(${activePlanObj.discountBadge})` : ""}
                  </p>
                </div>
                <span className="text-2xl font-black text-[#93B733]">₹{Number(activePlanObj.totalAmount).toLocaleString()}</span>
              </div>
            )}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={isProcessing}
                className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPlanPayment}
                disabled={isProcessing}
                className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 py-3.5 text-xs font-black text-white hover:opacity-90 transition shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Processing...
                  </>
                ) : activePlanObj.id === "free" ? (
                  "Activate Free Trial"
                ) : (
                  <>
                    <CreditCard size={14} /> Pay ₹{Number(activePlanObj.totalAmount).toLocaleString()}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════ CANCEL SUBSCRIPTION MODAL ══════ */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-red-200 dark:border-red-500/30 bg-white dark:bg-[#0c1220] p-7 text-gray-900 dark:text-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-xl font-black">Cancel Subscription?</h3>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Your subscription will remain active until{" "}
              <strong className="text-gray-900 dark:text-white">
                {expiresAt?.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) || "the end of your billing period"}
              </strong>
              . After that, your PGs will be hidden from search results until you resubscribe.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={isProcessing}
                className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition cursor-pointer"
              >
                Keep Plan
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isProcessing}
                className="flex-1 rounded-xl bg-red-500 py-3 text-xs font-black text-white hover:bg-red-600 transition shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Cancelling...
                  </>
                ) : (
                  "Yes, Cancel"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pricing;
