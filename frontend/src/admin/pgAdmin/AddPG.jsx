import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Upload, ImagePlus, MapPin, Wifi, Snowflake, ShieldCheck, Utensils,
  IndianRupee, Plus, X, Sparkles, Building2, Check, ArrowRight,
  ArrowLeft, Clock, BedDouble, CheckCircle2, AlertCircle, FileText,
  Home, Phone, User as UserIcon, HelpCircle, ChevronRight, Eye, Users
} from "lucide-react";
import api from "../../services/api";

/* ═══════════════════════════════════════════
   DEFAULT AMENITIES LIST
   ═══════════════════════════════════════════ */
const DEFAULT_AMENITIES = [
  "High-Speed WiFi",
  "AC Rooms",
  "Daily Food Included",
  "Laundry & Washing",
  "Dedicated Parking",
  "24/7 CCTV Security",
  "100% Power Backup",
  "Attached Bathroom",
  "Daily Housekeeping",
  "RO Purified Water",
  "Refrigerator",
  "Geyser / Hot Water",
];

/* ═══════════════════════════════════════════
   MEDIUM ILLUSTRATED STUDENT CHARACTER AVATARS
   ═══════════════════════════════════════════ */
const BoyCharacter = memo(({ isSelected }) => (
  <svg viewBox="0 0 64 64" className="w-13 h-13 sm:w-14 sm:h-14 transition-transform group-hover:scale-105 drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" className={isSelected ? "fill-blue-400/25" : "fill-blue-500/10 dark:fill-blue-500/20"} />
    <path d="M16 58C16 48 23 44 32 44C41 44 48 48 48 58" className={isSelected ? "fill-blue-400" : "fill-blue-600 dark:fill-blue-500"} />
    <path d="M26 44L32 50L38 44" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="28" y="38" width="8" height="8" rx="3" fill="#FCD5B5" />
    <ellipse cx="32" cy="27" rx="12" ry="13" fill="#FCD5B5" />
    <circle cx="28" cy="27" r="1.8" fill="#2C3E50" />
    <circle cx="36" cy="27" r="1.8" fill="#2C3E50" />
    <path d="M29 32C30.5 34 33.5 34 35 32" stroke="#E67E22" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M20 24C19 18 24 13 32 13C40 13 45 18 44 24C42 21 39 19 32 19C25 19 22 21 20 24Z" fill="#4A3728" />
    <path d="M19 25C19 20 24 13 33 13C36 13 42 15 44 20C40 17 35 17 31 18C25 19.5 22 23 19 25Z" fill="#38291E" />
    <ellipse cx="25" cy="30" rx="2" ry="1" fill="#F5B7B1" opacity="0.6" />
    <ellipse cx="39" cy="30" rx="2" ry="1" fill="#F5B7B1" opacity="0.6" />
  </svg>
));
BoyCharacter.displayName = "BoyCharacter";

const GirlCharacter = memo(({ isSelected }) => (
  <svg viewBox="0 0 64 64" className="w-13 h-13 sm:w-14 sm:h-14 transition-transform group-hover:scale-105 drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" className={isSelected ? "fill-rose-400/25" : "fill-rose-500/10 dark:fill-rose-500/20"} />
    <path d="M18 24C16 35 18 44 22 47C23 44 24 38 24 35" fill="#7D4F27" />
    <path d="M46 24C48 35 46 44 42 47C41 44 40 38 40 35" fill="#7D4F27" />
    <path d="M18 58C18 48 24 44 32 44C40 44 46 48 46 58" className={isSelected ? "fill-rose-400" : "fill-rose-500 dark:fill-rose-500"} />
    <rect x="28" y="38" width="8" height="7" rx="3" fill="#FCD5B5" />
    <ellipse cx="32" cy="27" rx="11.5" ry="12.5" fill="#FCD5B5" />
    <circle cx="28" cy="27" r="1.8" fill="#2C3E50" />
    <circle cx="36" cy="27" r="1.8" fill="#2C3E50" />
    <path d="M26 25L28 26" stroke="#2C3E50" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M38 25L36 26" stroke="#2C3E50" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M29 32C30.5 33.8 33.5 33.8 35 32" stroke="#E74C3C" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M20 23C20 16 25 13 32 13C39 13 44 16 44 23C42 18 38 17 32 17C26 17 22 18 20 23Z" fill="#935E34" />
    <circle cx="23" cy="18" r="2.5" fill="#FFD700" />
    <ellipse cx="25" cy="30" rx="2" ry="1.2" fill="#F1948A" opacity="0.7" />
    <ellipse cx="39" cy="30" rx="2" ry="1.2" fill="#F1948A" opacity="0.7" />
  </svg>
));
GirlCharacter.displayName = "GirlCharacter";

const DuoCharacter = memo(({ isSelected }) => (
  <svg viewBox="0 0 64 64" className="w-13 h-13 sm:w-14 sm:h-14 transition-transform group-hover:scale-105 drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" className={isSelected ? "fill-purple-400/25" : "fill-purple-500/10 dark:fill-purple-500/20"} />
    <path d="M10 58C10 50 16 46 23 46C27 46 30 48 32 52C28 54 26 56 26 58" className={isSelected ? "fill-blue-400" : "fill-blue-600 dark:fill-blue-500"} />
    <circle cx="22" cy="27" r="9" fill="#FCD5B5" />
    <path d="M13 24C13 18 17 15 22 15C27 15 31 18 31 24C29 21 26 19 22 19C18 19 15 21 13 24Z" fill="#4A3728" />
    <circle cx="19.5" cy="26.5" r="1.3" fill="#2C3E50" />
    <circle cx="25" cy="26.5" r="1.3" fill="#2C3E50" />
    <path d="M21 31C22 32 23.5 32 24.5 31" stroke="#E67E22" strokeWidth="1.4" strokeLinecap="round" />

    <path d="M38 58C38 56 36 54 32 52C34 48 37 46 41 46C48 46 54 50 54 58" className={isSelected ? "fill-rose-400" : "fill-rose-500 dark:fill-rose-500"} />
    <path d="M49 27C51 34 50 40 47 43" stroke="#935E34" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="42" cy="27" r="9" fill="#FCD5B5" />
    <path d="M33 23C33 17 37 15 42 15C47 15 51 17 51 23C49 19 46 18 42 18C38 18 35 19 33 23Z" fill="#935E34" />
    <circle cx="39" cy="26.5" r="1.3" fill="#2C3E50" />
    <circle cx="44.5" cy="26.5" r="1.3" fill="#2C3E50" />
    <path d="M40.5 31C41.5 32 43 32 44 31" stroke="#E74C3C" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="36" cy="20" r="1.8" fill="#FFD700" />
    <path d="M32 42C32 42 29 39.5 29 37.8C29 36.5 30 35.5 31.2 35.5C31.8 35.5 32 35.8 32 35.8C32 35.8 32.2 35.5 32.8 35.5C34 35.5 35 36.5 35 37.8C35 39.5 32 42 32 42Z" fill="#93B733" />
  </svg>
));
DuoCharacter.displayName = "DuoCharacter";

const PG_TYPES = [
  { id: "boys", label: "Boys PG", tag: "Male Only", Component: BoyCharacter },
  { id: "girls", label: "Girls PG", tag: "Female Only", Component: GirlCharacter },
  { id: "coed", label: "Boys & Girls", tag: "Co-Living / Unisex", Component: DuoCharacter },
];

/* ═══════════════════════════════════════════
   5-STEP DEFINITIONS
   ═══════════════════════════════════════════ */
const STEPS = [
  { num: 1, title: "Basic Info", icon: Building2, desc: "Name, type & price" },
  { num: 2, title: "Location", icon: MapPin, desc: "Address & area details" },
  { num: 3, title: "Rooms & Pricing", icon: BedDouble, desc: "Occupancy & AC rates" },
  { num: 4, title: "Amenities", icon: Sparkles, desc: "Included facilities" },
  { num: 5, title: "Photos & Review", icon: ImagePlus, desc: "Gallery & submission" },
];

/* ═══════════════════════════════════════════
   MAIN ADD PG COMPONENT (BALANCED MEDIUM SIZE)
   ═══════════════════════════════════════════ */
export default function AddPG() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);

  // Step state: 0 = Hero, 1-5 = Form Steps, 6 = Verification Screen
  const [currentStep, setCurrentStep] = useState(0);
  const [submittedPg, setSubmittedPg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasExistingPgs, setHasExistingPgs] = useState(false);

  // Form Data State
  const [formData, setFormData] = useState({
    title: "",
    owner_name: "",
    mobile: "",
    price: "",
    description: "",
    address: "",
    google_map_link: "",
    nearby_college: "",
    pg_type: "",
    city: "",
    area: "",
    available_rooms: "",
    rules: "",
  });

  const [sharingOptions, setSharingOptions] = useState({
    single: { available: false, ac_price: "", non_ac_price: "" },
    double: { available: false, ac_price: "", non_ac_price: "" },
    triple: { available: false, ac_price: "", non_ac_price: "" },
  });

  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [customAmenities, setCustomAmenities] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAmenityInput, setNewAmenityInput] = useState("");

  useEffect(() => {
    const checkPgs = async () => {
      try {
        const { data } = await api.get("/pg/owner/my-pgs").catch(() => ({ data: {} }));
        const pgs = data?.pgs || [];
        setHasExistingPgs(pgs.length > 0);
        if (pgs.length > 0 && searchParams.get("start") === "1") {
          setCurrentStep(1);
        }
      } catch (err) {
        console.error("Check PGs Error:", err);
      }
    };
    checkPgs();
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSharingCheckboxChange = (roomType) => {
    setSharingOptions((prev) => ({
      ...prev,
      [roomType]: {
        ...prev[roomType],
        available: !prev[roomType].available,
      },
    }));
  };

  const handleSharingPriceChange = (roomType, field, value) => {
    setSharingOptions((prev) => ({
      ...prev,
      [roomType]: {
        ...prev[roomType],
        [field]: value,
      },
    }));
  };

  const toggleAmenity = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((item) => item !== amenity)
        : [...prev, amenity]
    );
  };

  const handleAddCustomAmenity = (e) => {
    e.preventDefault();
    const trimmed = newAmenityInput.trim();
    if (!trimmed) return;

    if (!DEFAULT_AMENITIES.includes(trimmed) && !customAmenities.includes(trimmed)) {
      setCustomAmenities((prev) => [...prev, trimmed]);
    }
    if (!selectedAmenities.includes(trimmed)) {
      setSelectedAmenities((prev) => [...prev, trimmed]);
    }
    setNewAmenityInput("");
    setIsModalOpen(false);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (selectedImages.length + files.length > 20) {
      alert(`You can upload a maximum of 20 images. You already have ${selectedImages.length}, so you can only add ${20 - selectedImages.length} more.`);
      return;
    }
    setSelectedImages((prev) => [...prev, ...files]);
    if (e.target) e.target.value = "";
  };

  const handleRemoveImage = (indexToRemove) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.title.trim()) {
        alert("Please enter the PG Name.");
        return false;
      }
      if (!formData.price || Number(formData.price) <= 0) {
        alert("Please enter a valid monthly starting price.");
        return false;
      }
      if (!formData.pg_type) {
        alert("Please select a PG Type (Boys, Girls, or Boys & Girls).");
        return false;
      }
    } else if (step === 2) {
      if (!formData.city.trim()) {
        alert("Please enter the City.");
        return false;
      }
      if (!formData.area.trim()) {
        alert("Please enter the Area / Locality.");
        return false;
      }
      if (!formData.address.trim()) {
        alert("Please enter the complete street address.");
        return false;
      }
    } else if (step === 3) {
      const hasAnySharing = Object.values(sharingOptions).some((opt) => opt.available);
      if (!hasAnySharing && !formData.available_rooms) {
        alert("Please select at least one Room Sharing type or enter available rooms.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateStep(1) || !validateStep(2)) return;

    try {
      setLoading(true);
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("pg_type", formData.pg_type);
      data.append("price", formData.price);
      data.append("address", formData.address);
      data.append("google_map_link", formData.google_map_link);
      data.append("city", formData.city);
      data.append("area", formData.area);
      data.append("nearby_college", formData.nearby_college);
      data.append("available_rooms", formData.available_rooms || "1");
      data.append("rules", formData.rules);
      data.append("amenities", JSON.stringify(selectedAmenities));
      data.append("sharing_options", JSON.stringify(sharingOptions));

      if (selectedImages.length > 0) {
        selectedImages.forEach((img) => {
          data.append("images", img);
        });
      }

      const response = await api.post("/pg/create", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const createdPg = response?.data?.pg || {
        ...formData,
        id: "new",
        status: "pending",
      };

      setSubmittedPg(createdPg);
      setCurrentStep(6);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("PG Submit Error:", error?.response?.data || error);
      alert(error?.response?.data?.message || "Failed to submit PG for verification.");
    } finally {
      setLoading(false);
    }
  };

  const allAmenities = useMemo(() => [...DEFAULT_AMENITIES, ...customAmenities], [customAmenities]);

  /* ═══════════════════════════════════════════
     VIEW 0: BIG ONBOARDING HERO BANNER (CENTERED)
     ═══════════════════════════════════════════ */
  if (currentStep === 0) {
    return (
      <div className="min-h-[calc(100vh-150px)] flex items-center justify-center py-6 px-4 animate-fadeIn">
        {/* Big Spacious Hero Banner Centered */}
        <div className="w-full max-w-5xl relative overflow-hidden rounded-[2.5rem] border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] p-10 sm:p-16 lg:p-20 text-center shadow-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#93B733]/15 text-[#0D3A1D] dark:text-[#93B733] font-black text-xs sm:text-sm uppercase tracking-widest mb-6">
            <Sparkles className="w-4 h-4" /> Property Onboarding Portal
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-tight max-w-3xl mx-auto">
            List Your PG on Dormn in <span className="text-[#93B733]">5 Easy Steps</span>
          </h1>

          <p className="mt-5 text-base sm:text-xl font-medium text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Reach thousands of verified student tenants, automate monthly rent collection with Razorpay, and manage resident verification effortlessly.
          </p>

          <div className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-3 rounded-2xl bg-[#0D3A1D] hover:bg-[#16502a] dark:bg-[#93B733] dark:hover:bg-[#82a32d] px-9 py-4.5 text-base sm:text-lg font-black text-white dark:text-[#0D3A1D] shadow-xl hover:shadow-[#93B733]/30 transition active:scale-[0.98]"
            >
              <span>{hasExistingPgs ? "+ Add Another Property" : "Start PG Onboarding"}</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {hasExistingPgs && (
              <button
                onClick={() => navigate("/owner/my-pgs")}
                className="inline-flex items-center gap-2.5 rounded-2xl border-2 border-gray-300 dark:border-white/15 bg-white dark:bg-[#181818] px-7 py-4.5 text-base font-bold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition"
              >
                <Building2 className="w-5 h-5 text-[#93B733]" />
                View My Properties
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     VIEW 6: PROPERTY UNDER VERIFICATION STATUS
     ═══════════════════════════════════════════ */
  if (currentStep === 6) {
    return (
      <div className="max-w-3xl mx-auto py-8 sm:py-12 px-4 space-y-6 animate-fadeIn text-center">
        <div className="rounded-3xl border-2 border-dashed border-amber-400 dark:border-amber-500/40 bg-white dark:bg-[#111] p-8 sm:p-12 shadow-xl">
          {/* Animated Status Badge */}
          <div className="relative mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center mb-5 shadow-lg shadow-amber-500/20">
            <Clock className="w-10 h-10 animate-spin-slow" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider mb-3">
            Status: Under Quality Verification
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Property Submitted Successfully!
          </h1>

          <p className="mt-2 text-sm sm:text-base font-medium text-gray-600 dark:text-gray-300 max-w-xl mx-auto leading-relaxed">
            Your accommodation <strong className="text-[#0D3A1D] dark:text-[#93B733] font-bold">{formData.title || "Your PG"}</strong> is now undergoing administrative verification.
          </p>

          {/* Timeline Box */}
          <div className="mt-6 p-5 rounded-2xl bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-white/10 text-left space-y-3 shadow-xs max-w-lg mx-auto text-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-200 dark:border-white/10">
              <span className="font-semibold text-gray-500">Property Title</span>
              <span className="font-bold text-gray-900 dark:text-white">{formData.title}</span>
            </div>
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-200 dark:border-white/10">
              <span className="font-semibold text-gray-500">Location</span>
              <span className="font-bold text-gray-900 dark:text-white">{formData.area}, {formData.city}</span>
            </div>
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-200 dark:border-white/10">
              <span className="font-semibold text-gray-500">Monthly Rent</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{Number(formData.price).toLocaleString()} / mo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-500">Review Timeline</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">Estimated 2 – 4 hours</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => navigate("/owner/my-pgs")}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0D3A1D] hover:bg-[#16502a] px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-md transition active:scale-[0.98]"
            >
              <Building2 size={16} />
              View in My PGs
            </button>
            <button
              onClick={() => navigate("/owner/dashboard")}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-[#181818] px-5 py-3 text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => {
                setFormData({
                  title: "", owner_name: "", mobile: "", price: "", description: "",
                  address: "", google_map_link: "", nearby_college: "", pg_type: "",
                  city: "", area: "", available_rooms: "", rules: "",
                });
                setSelectedImages([]);
                setSelectedAmenities([]);
                setCurrentStep(1);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#93B733] hover:bg-[#82a32d] px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-sm transition"
            >
              <Plus size={16} />
              Add Another PG
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     VIEW 1-5: MEDIUM-PROPORTION 5-STEP WIZARD
     ═══════════════════════════════════════════ */
  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <button
            onClick={() => setCurrentStep(0)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#0D3A1D] dark:text-gray-400 dark:hover:text-white transition mb-1"
          >
            <ArrowLeft size={14} /> Back to Overview
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Add New Property
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
            Step {currentStep} of 5
          </p>
        </div>

        {/* Current Step Indicator */}
        <div className="self-start sm:self-center px-3.5 py-1.5 rounded-xl bg-[#93B733]/15 text-[#0D3A1D] dark:text-[#93B733] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-xs">
          <span>Step {currentStep} of 5</span>
          <span className="w-2 h-2 rounded-full bg-[#93B733] animate-pulse" />
        </div>
      </div>

      {/* Sleek Step Progress Moving Line */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] p-3 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between gap-2 sm:gap-2.5">
          {[1, 2, 3, 4, 5].map((stepNum) => {
            const isCompleted = currentStep > stepNum;
            const isCurrent = currentStep === stepNum;
            return (
              <div
                key={stepNum}
                onClick={() => {
                  if (isCompleted) setCurrentStep(stepNum);
                }}
                className={`flex-1 h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-white/10 relative transition-all ${
                  isCompleted ? "cursor-pointer hover:opacity-80" : ""
                }`}
                title={`Step ${stepNum}`}
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    isCompleted || isCurrent
                      ? "bg-[#93B733] shadow-xs shadow-[#93B733]/50 w-full"
                      : "w-0"
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── SINGLE ACTIVE SECTION CONTAINER (BALANCED MEDIUM) ─── */}
      <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] p-6 sm:p-8 lg:p-9 shadow-md min-h-[420px] flex flex-col justify-between">
        <div>
          {/* STEP 1: Basic Information & PG Type */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-gray-200 dark:border-white/10 pb-4">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                  Basic Property Details
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Enter your property name, starting price, and resident category.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    PG Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder="e.g. Royal Palace Luxury PG"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50/50 dark:bg-[#181818] px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:border-[#93B733] focus:bg-white dark:focus:bg-[#1c1c1c] transition"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Owner / Manager Name
                  </label>
                  <input
                    type="text"
                    name="owner_name"
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.owner_name}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50/50 dark:bg-[#181818] px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:border-[#93B733] focus:bg-white dark:focus:bg-[#1c1c1c] transition"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Contact Mobile Number
                  </label>
                  <input
                    type="text"
                    name="mobile"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.mobile}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50/50 dark:bg-[#181818] px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:border-[#93B733] focus:bg-white dark:focus:bg-[#1c1c1c] transition"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Starting Monthly Rent (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <IndianRupee size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      name="price"
                      required
                      placeholder="e.g. 7500"
                      value={formData.price}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50/50 dark:bg-[#181818] pl-10 pr-4 py-3 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:border-[#93B733] focus:bg-white dark:focus:bg-[#1c1c1c] transition"
                    />
                  </div>
                </div>
              </div>

              {/* PG Type with Medium Character Avatars */}
              <div>
                <label className="mb-2.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Select PG Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {PG_TYPES.map(({ id, label, tag, Component }) => {
                    const isSelected = formData.pg_type === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, pg_type: id }))}
                        className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 p-4 sm:p-5 transition-all duration-200 active:scale-[0.98] ${
                          isSelected
                            ? "border-[#0D3A1D] dark:border-[#93B733] bg-[#0D3A1D] text-white shadow-md ring-2 ring-[#93B733]/40 scale-[1.01]"
                            : "border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#181818] text-gray-900 dark:text-gray-100 hover:border-[#93B733]/50"
                        }`}
                      >
                        <div className="mb-2.5">
                          <Component isSelected={isSelected} />
                        </div>
                        <div className="font-bold text-base">{label}</div>
                        <div className={`text-xs font-medium mt-0.5 ${isSelected ? "text-gray-300" : "text-gray-500 dark:text-gray-400"}`}>
                          {tag}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Property Description & Highlights
                </label>
                <textarea
                  rows={3}
                  name="description"
                  placeholder="Describe your PG, key highlights, food quality, safety features, proximity to universities..."
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50/50 dark:bg-[#181818] px-4 py-3 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-[#93B733] focus:bg-white dark:focus:bg-[#1c1c1c] transition"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Location & Address */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-gray-200 dark:border-white/10 pb-4">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                  Location & Address Details
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Accurate location details help students easily discover and navigate to your PG.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    placeholder="e.g. Noida, Delhi, Bangalore"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50/50 dark:bg-[#181818] px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:border-[#93B733]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Area / Locality <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="area"
                    required
                    placeholder="e.g. Sector 62, Koramangala"
                    value={formData.area}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50/50 dark:bg-[#181818] px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:border-[#93B733]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Nearby College / Landmark
                  </label>
                  <input
                    type="text"
                    name="nearby_college"
                    placeholder="e.g. Near Amity University Gate 2 / City Metro Station"
                    value={formData.nearby_college}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50/50 dark:bg-[#181818] px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:border-[#93B733]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Full Street Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    required
                    placeholder="Plot / House No., Main Street, Landmark, Pincode"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50/50 dark:bg-[#181818] px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:border-[#93B733]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Google Maps Link
                  </label>
                  <input
                    type="url"
                    name="google_map_link"
                    placeholder="https://maps.google.com/?q=..."
                    value={formData.google_map_link}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50/50 dark:bg-[#181818] px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:border-[#93B733]"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Paste your Google Maps share link to let tenants view live directions in their portal.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Room Sharing & Rules */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-gray-200 dark:border-white/10 pb-4">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                  Room Sharing & House Rules
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Configure occupancy options, AC/Non-AC rates, and property rules.
                </p>
              </div>

              {/* Room Sharing Toggles */}
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Sharing Configurations & Pricing
                </label>
                {["single", "double", "triple"].map((roomType) => {
                  const isAvailable = sharingOptions[roomType].available;
                  return (
                    <div
                      key={roomType}
                      className={`rounded-2xl border-2 p-4 transition-all ${
                        isAvailable
                          ? "border-[#93B733]/60 bg-[#93B733]/5 dark:bg-[#93B733]/10"
                          : "border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#181818]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id={`sharing-${roomType}`}
                          checked={isAvailable}
                          onChange={() => handleSharingCheckboxChange(roomType)}
                          className="h-5 w-5 accent-[#0D3A1D] rounded-md cursor-pointer"
                        />
                        <label
                          htmlFor={`sharing-${roomType}`}
                          className="text-base font-bold text-gray-900 dark:text-white capitalize cursor-pointer flex-1"
                        >
                          {roomType} Sharing Room
                        </label>
                      </div>

                      {isAvailable && (
                        <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2 pt-3 border-t border-gray-200 dark:border-white/10 animate-fadeIn">
                          <div>
                            <label className="mb-1 block text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                              AC Monthly Price (₹)
                            </label>
                            <input
                              type="number"
                              placeholder="e.g. 10500"
                              value={sharingOptions[roomType].ac_price}
                              onChange={(e) => handleSharingPriceChange(roomType, "ac_price", e.target.value)}
                              className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-[#111] px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:border-[#93B733]"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                              Non-AC Monthly Price (₹)
                            </label>
                            <input
                              type="number"
                              placeholder="e.g. 8500"
                              value={sharingOptions[roomType].non_ac_price}
                              onChange={(e) => handleSharingPriceChange(roomType, "non_ac_price", e.target.value)}
                              className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-[#111] px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:border-[#93B733]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 pt-1">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Total Available Rooms
                  </label>
                  <input
                    type="number"
                    name="available_rooms"
                    placeholder="e.g. 16"
                    value={formData.available_rooms}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50/50 dark:bg-[#181818] px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:border-[#93B733]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Curfew / Gate Rules
                  </label>
                  <input
                    type="text"
                    name="rules"
                    placeholder="e.g. 10:30 PM Gate Closing"
                    value={formData.rules}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50/50 dark:bg-[#181818] px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:border-[#93B733]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Amenities & Facilities */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 dark:border-white/10 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                    Amenities & Facilities
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Select all facilities and features included in this accommodation.
                  </p>
                </div>
                <div className="text-xs font-bold text-[#4E700F] dark:text-[#93B733] bg-[#93B733]/15 px-3 py-1.5 rounded-lg">
                  {selectedAmenities.length} Selected
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {allAmenities.map((amenity) => {
                  const isChecked = selectedAmenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`flex items-center gap-2.5 p-3.5 rounded-xl border-2 text-left transition-all active:scale-95 ${
                        isChecked
                          ? "border-[#0D3A1D] dark:border-[#93B733] bg-[#0D3A1D] text-white dark:bg-[#93B733] dark:text-[#0D3A1D] shadow-xs font-bold"
                          : "border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#181818] text-gray-700 dark:text-gray-300 hover:border-gray-300 font-semibold"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${isChecked ? "bg-white/20 dark:bg-black/20" : "border border-gray-300 dark:border-white/20"}`}>
                        {isChecked && <Check size={13} strokeWidth={2.5} />}
                      </div>
                      <span className="text-xs sm:text-sm truncate">{amenity}</span>
                    </button>
                  );
                })}

                {/* Add Custom Amenity Card */}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 p-3.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-white/20 bg-transparent text-gray-600 dark:text-gray-300 hover:border-[#93B733] hover:text-[#93B733] text-xs font-bold transition"
                >
                  <Plus size={16} />
                  <span>Add Other</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Photos & Review */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-gray-200 dark:border-white/10 pb-4">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                  Upload Photos & Final Review
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Upload property photos and confirm accommodation details before submitting.
                </p>
              </div>

              {/* Photo Upload Zone */}
              <div className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/15 bg-gray-50/80 dark:bg-[#181818] p-6 sm:p-8 text-center transition hover:border-[#93B733]/60">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0D3A1D] text-white shadow-md mb-3">
                  <Upload size={24} />
                </div>

                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                  {selectedImages.length >= 20 ? "Maximum Limit Reached (20/20)" : "Upload PG Photos"}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1 leading-relaxed">
                  Add room photos, washroom, building exterior, kitchen, and common areas. (Max 20 images)
                </p>

                <input
                  type="file"
                  multiple
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={selectedImages.length >= 20}
                />

                <div className="mt-4 flex flex-wrap gap-2.5 justify-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={selectedImages.length >= 20}
                    className="rounded-xl bg-[#0D3A1D] hover:bg-[#16502a] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-40"
                  >
                    {selectedImages.length > 0 ? "+ Add More Photos" : "Choose Files"}
                  </button>
                  {selectedImages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedImages([])}
                      className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 transition"
                    >
                      Remove All
                    </button>
                  )}
                </div>

                {/* Uploaded Thumbnails */}
                {selectedImages.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-gray-200 dark:border-white/10 text-left">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        Uploaded Photos ({selectedImages.length}/20)
                      </p>
                      <p className="text-xs font-bold text-[#4E700F] dark:text-[#93B733]">
                        {20 - selectedImages.length} slots remaining
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                      {selectedImages.map((image, index) => {
                        const previewUrl = URL.createObjectURL(image);
                        return (
                          <div
                            key={`${image.name}-${index}`}
                            className="group relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-black/5 shadow-xs"
                          >
                            <img
                              src={previewUrl}
                              alt={image.name}
                              className="w-full h-full object-cover"
                            />
                            {index === 0 && (
                              <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-[#0D3A1D] text-white font-bold text-[9px] uppercase tracking-wider">
                                ⭐ Cover
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white shadow-md transition hover:scale-110 active:scale-90"
                              title="Remove photo"
                            >
                              <X size={13} strokeWidth={2.5} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Review Summary */}
              <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-[#181818] p-5 space-y-3">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-wider">
                  Listing Review Summary:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-medium text-gray-700 dark:text-gray-300">
                  <p><strong>PG Name:</strong> {formData.title || "—"}</p>
                  <p><strong>Category:</strong> {formData.pg_type ? formData.pg_type.toUpperCase() + " PG" : "—"}</p>
                  <p><strong>Starting Rent:</strong> ₹{Number(formData.price || 0).toLocaleString()} / month</p>
                  <p><strong>Location:</strong> {formData.area ? `${formData.area}, ${formData.city}` : "—"}</p>
                  <p><strong>Amenities:</strong> {selectedAmenities.length} selected</p>
                  <p><strong>Photos:</strong> {selectedImages.length} attached</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── BOTTOM ACTION BUTTONS BAR ─── */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/10 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrevious}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-[#181818] px-6 py-2.5 text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition active:scale-95"
          >
            <ArrowLeft size={16} />
            <span>{currentStep === 1 ? "Overview" : "Previous Step"}</span>
          </button>

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0D3A1D] hover:bg-[#16502a] dark:bg-[#93B733] dark:hover:bg-[#82a32d] px-7 py-3 text-xs sm:text-sm font-bold text-white dark:text-[#0D3A1D] shadow-md transition active:scale-95"
            >
              <span>Next Step</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#93B733] hover:bg-[#82a32d] px-7 py-3 text-xs sm:text-sm font-bold text-white shadow-lg transition active:scale-95 disabled:opacity-50"
            >
              <Sparkles size={16} />
              <span>{loading ? "Submitting PG..." : "Submit PG For Verification"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Custom Amenity Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white dark:bg-[#141414] p-6 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="text-[#93B733]" size={18} />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add Custom Facility</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
              Add any special facility unique to your PG (e.g., "Gaming Console", "EV Charging Point", "Rooftop Garden").
            </p>

            <form onSubmit={handleAddCustomAmenity} className="mt-5 space-y-3.5">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Facility Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Gym Access, Rooftop Garden"
                  value={newAmenityInput}
                  onChange={(e) => setNewAmenityInput(e.target.value)}
                  autoFocus
                  required
                  className="w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-[#181818] px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:border-[#93B733]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-5 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#0D3A1D] hover:bg-[#16502a] px-6 py-2.5 text-xs font-bold text-white shadow-md transition"
                >
                  Add Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}