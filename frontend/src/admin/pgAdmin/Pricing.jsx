import { useState, useContext, useMemo } from "react";
import { Check, Zap, Sparkles, Shield, ArrowRight, Clock, Headset, RefreshCw, CreditCard, IndianRupee } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import API from "../../services/api";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Pricing = () => {
  const { user } = useContext(AuthContext);
  const [isYearly, setIsYearly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("Standard");
  const [showModal, setShowModal] = useState(false);
  const [activePlanObj, setActivePlanObj] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectPlan = (plan) => {
    setActivePlanObj(plan);
    setShowModal(true);
  };

  const handleConfirmPlanPayment = async () => {
    if (!activePlanObj) return;

    const amountInRupees = isYearly ? activePlanObj.yearlyPrice * 12 : activePlanObj.monthlyPrice;

    if (amountInRupees === 0 || activePlanObj.name === "Free") {
      setSelectedPlan("Free");
      setShowModal(false);
      alert("Free Plan activated successfully!");
      return;
    }

    const res = await loadRazorpayScript();
    if (!res) {
      alert("Razorpay SDK failed to load. Please check your internet connection.");
      return;
    }

    setIsProcessing(true);
    try {
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_TO9ZZJaaKuESBz";
      const options = {
        key: razorpayKey,
        amount: Math.round(amountInRupees * 100), // in paise
        currency: "INR",
        name: "Dormn Platform",
        description: `Owner ${activePlanObj.name} Membership (${isYearly ? "Annual" : "Monthly"})`,
        handler: async function (response) {
          try {
            setSelectedPlan(activePlanObj.name);
            setShowModal(false);
            alert(`🎉 Payment Successful! Your ${activePlanObj.name} Plan is now active.`);
          } catch (err) {
            console.error("Subscription update error:", err);
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user?.name || user?.full_name || "PG Owner",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: "#0D3A1D"
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error("Subscription payment error:", err);
      alert(`Failed to start payment: ${err.message || "Please check Razorpay configuration."}`);
      setIsProcessing(false);
    }
  };

  const plans = [
    {
      name: "Free",
      tagline: "Free",
      description: "For owners taking their first steps with property listings.",
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        "Up to 1 PG listing",
        "Standard search placement",
        "Basic booking requests",
        "Free listing updates",
        "Access via web and mobile app",
      ],
      isPopular: false,
      glowStyle:
        "border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c1220]/80 shadow-lg shadow-gray-200/50 dark:shadow-none",
      buttonStyle:
        "bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100 font-extrabold shadow-md hover:scale-[1.02]",
    },
    {
      name: "Standard",
      tagline: isYearly ? "₹799/m" : "₹999/m",
      description: "For freelancers and small teams who need more freedom and flexibility.",
      monthlyPrice: 999,
      yearlyPrice: 799,
      features: [
        "Up to 5 PG listings in cloud",
        "Featured search ranking",
        "Advanced editing toolkit",
        "Team collaboration (up to 5 members)",
        "Access to premium template library",
      ],
      isPopular: false,
      glowStyle:
        "border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c1220]/90 shadow-lg shadow-gray-200/50 dark:shadow-none",
      buttonStyle:
        "bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100 font-extrabold shadow-md hover:scale-[1.02]",
    },
    {
      name: "Pro",
      tagline: isYearly ? "₹1,599/m" : "₹1,999/m",
      description: "For studios, agencies, and professional creators working with brands.",
      monthlyPrice: 1999,
      yearlyPrice: 1599,
      features: [
        "Unlimited PG listings",
        "Top #1 priority placement",
        "AI-powered content & analytics tools",
        "Unlimited team members",
        "Brand customization (logos, fonts, color palettes)",
      ],
      isPopular: true,
      glowStyle:
        "border-emerald-500/60 dark:border-emerald-400/70 bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-blue-600/10 dark:from-emerald-500/15 dark:via-teal-500/10 dark:to-blue-600/20 shadow-2xl shadow-emerald-500/15 dark:shadow-[0_0_50px_rgba(16,185,129,0.3)] relative",
      buttonStyle:
        "bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-500 text-gray-950 font-black shadow-lg hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:scale-[1.02]",
      buttonInlineStyle: { backgroundColor: "#10b981", color: "#000000" },
    },
  ];

  return (
    <div className="relative min-h-full w-full overflow-hidden -m-4 md:-m-6 lg:-m-8 p-6 md:p-12 bg-[#FAFAFA] dark:bg-[#060911] text-gray-900 dark:text-white transition-colors duration-300">
      {/* Dynamic Ambient Background Glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[550px] w-[550px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 blur-[140px]" />
      <div className="pointer-events-none absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-blue-500/10 dark:bg-blue-600/25 blur-[150px]" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-[500px] w-[500px] rounded-full bg-teal-500/10 dark:bg-teal-500/15 blur-[130px]" />

      {/* Header Watermark & Title */}
      <div className="relative z-10 mb-12 text-center">
        {/* Soft Background Watermark (Behind text) */}
        <span 
          aria-hidden="true" 
          style={{ opacity: 0.06 }}
          className="pointer-events-none select-none absolute left-1/2 -top-10 -translate-x-1/2 -z-10 text-7xl sm:text-[130px] font-black uppercase tracking-widest text-gray-900 dark:text-white blur-[2px]"
        >
          PRICING
        </span>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 backdrop-blur-md mb-4 shadow-sm">
          <Sparkles size={14} className="text-emerald-500 dark:text-emerald-400" />
          <span>Owner Membership Plans</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
          <span className="text-gray-900 dark:bg-gradient-to-r dark:from-white dark:via-gray-100 dark:to-gray-400 dark:bg-clip-text dark:text-transparent">
            Flexible Plans for
          </span>{" "}
          <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-blue-600 dark:from-emerald-400 dark:via-teal-300 dark:to-blue-400 bg-clip-text text-transparent">
            Every PG Owner
          </span>
        </h1>

        <p className="mx-auto mt-3 max-w-2xl text-sm font-medium text-gray-600 dark:text-gray-400 sm:text-base leading-relaxed">
          Scale your PG business, boost booking conversion, and get priority visibility among students.
        </p>

        {/* Top-Centered Monthly / Yearly Billing Toggle */}
        <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-gray-200 dark:border-white/10 bg-white/90 dark:bg-white/5 p-1.5 backdrop-blur-xl shadow-lg">
          <button
            onClick={() => setIsYearly(false)}
            className={`rounded-full px-5 py-2 text-xs font-black transition-all duration-200 ${
              !isYearly
                ? "bg-gradient-to-r from-emerald-500 to-blue-600 text-white shadow-md"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-black transition-all duration-200 ${
              isYearly
                ? "bg-gradient-to-r from-emerald-500 to-blue-600 text-white shadow-md"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <span>Yearly Billing</span>
            <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-black text-emerald-700 dark:text-emerald-300">
              SAVE 20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="relative z-10 grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8 w-full max-w-7xl mx-auto items-stretch">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.name;
          return (
            <div
              key={plan.name}
              className={`group flex flex-col justify-between rounded-3xl border p-8 backdrop-blur-xl transition-all duration-300 ${plan.glowStyle} ${
                isSelected
                  ? "ring-2 ring-emerald-500/90 dark:ring-emerald-400/90 scale-[1.02]"
                  : "hover:-translate-y-1 hover:border-gray-300 dark:hover:border-white/20"
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                    {plan.name}
                  </h3>
                  {plan.isPopular && (
                    <span className="rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                      Popular
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                    {plan.tagline}
                  </span>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-gray-600 dark:text-gray-400 min-h-[36px]">
                  {plan.description}
                </p>

                {/* Features Divider */}
                <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-gray-200 dark:via-white/15 to-transparent" />

                {/* Feature List */}
                <ul className="space-y-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
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

              {/* Action Button */}
              <div className="mt-8">
                <button
                  onClick={() => handleSelectPlan(plan)}
                  style={isSelected && plan.buttonInlineStyle ? plan.buttonInlineStyle : {}}
                  className={`w-full rounded-2xl py-4 text-xs font-black tracking-wide transition-all duration-200 ${plan.buttonStyle}`}
                >
                  {isSelected ? "Current Active Plan" : "Choose Plan"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust & Features Footer Row */}
      <div className="relative z-10 mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-8 border-t border-gray-200 dark:border-white/10 text-center">
        <div className="flex items-center justify-center gap-3 text-gray-700 dark:text-gray-300">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Clock size={20} />
          </div>
          <div className="text-left">
            <h4 className="text-xs font-black text-gray-900 dark:text-white">Instant Activation</h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Features unlock immediately upon upgrade</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 text-gray-700 dark:text-gray-300">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Headset size={20} />
          </div>
          <div className="text-left">
            <h4 className="text-xs font-black text-gray-900 dark:text-white">24/7 Dedicated Support</h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Priority assistance for verified owners</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 text-gray-700 dark:text-gray-300">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <RefreshCw size={20} />
          </div>
          <div className="text-left">
            <h4 className="text-xs font-black text-gray-900 dark:text-white">Flexible Upgrades</h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Switch or cancel plans anytime seamlessly</p>
          </div>
        </div>
      </div>

      {/* Plan Selection Confirmation & Razorpay Checkout Modal */}
      {showModal && activePlanObj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 dark:border-emerald-500/30 bg-white dark:bg-[#0c1220] p-7 text-gray-900 dark:text-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CreditCard size={24} />
            </div>
            <h3 className="text-xl font-black">Upgrade to {activePlanObj.name} Plan</h3>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              You selected the <strong className="text-gray-900 dark:text-white">{activePlanObj.name} Plan</strong> ({isYearly ? "Annual Billing" : "Monthly Billing"}).
            </p>

            <div className="my-5 rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Payable</span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {isYearly ? "12 Months Access (20% OFF)" : "1 Month Access"}
                </p>
              </div>
              <span className="text-2xl font-black text-[#93B733]">
                ₹{Number(isYearly ? activePlanObj.yearlyPrice * 12 : activePlanObj.monthlyPrice).toLocaleString()}
              </span>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={isProcessing}
                className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPlanPayment}
                disabled={isProcessing}
                className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 py-3.5 text-xs font-black text-white hover:opacity-90 transition shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <CreditCard size={14} />
                {isProcessing
                  ? "Initializing..."
                  : `Pay ₹${Number(isYearly ? activePlanObj.yearlyPrice * 12 : activePlanObj.monthlyPrice).toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pricing;
