import { useCallback, useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  MapPin,
  ExternalLink,
  Edit3,
  Trash2,
  Plus,
  Building2,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Eye,
  Bed,
  Users,
  X,
  Share2,
  Copy,
  Check,
  CreditCard,
  ArrowRight,
  Sparkles
} from "lucide-react";
import api, { IMAGE_BASE_URL } from "../../services/api";

const MyPGs = () => {
  const navigate = useNavigate();
  const [pgPages, setPgPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedPgForView, setSelectedPgForView] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [payoutConfigured, setPayoutConfigured] = useState(true);

  const handleCopyLink = (pgId, e) => {
    e?.stopPropagation();
    const url = `${window.location.origin}/pg/${pgId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedId(pgId);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const fetchMyPGs = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/pg/owner/my-pgs");
      setPgPages(data?.pgs || []);
    } catch (error) {
      console.error("Error fetching PGs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyPGs();
    api.get("/auth/payout-status")
      .then((res) => setPayoutConfigured(Boolean(res.data?.is_configured)))
      .catch(() => setPayoutConfigured(false));
  }, [fetchMyPGs]);

  const handleAddPgClick = (e) => {
    if (e) e.preventDefault();
    navigate("/owner/add-pg");
  };

  // Counts for status tabs (single pass)
  const counts = useMemo(() => {
    const c = { all: pgPages.length, approved: 0, pending: 0, rejected: 0, removed: 0 };
    for (const p of pgPages) {
      if (c[p.status] !== undefined) c[p.status]++;
    }
    return c;
  }, [pgPages]);

  // Filtered properties
  const filteredPGs = useMemo(() => {
    return pgPages.filter((pg) => {
      const matchesSearch =
        pg.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pg.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pg.area?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === "all" ? true : pg.status?.toLowerCase() === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [pgPages, searchTerm, activeTab]);

  const handleDelete = useCallback(async (pgId, title) => {
    if (window.confirm(`Are you sure you want to delete property: "${title}"?`)) {
      try {
        await api.delete(`/pg/delete/${pgId}`);
        fetchMyPGs();
      } catch (error) {
        alert(error?.response?.data?.message || "Failed to delete PG");
      }
    }
  }, [fetchMyPGs]);

  const handleResubmit = useCallback(async (pgId, title) => {
    if (window.confirm(`Re-submit "${title}" for admin approval?`)) {
      try {
        const res = await api.put(`/pg/resubmit/${pgId}`);
        alert(res?.data?.message || "Property re-submitted for approval successfully!");
        fetchMyPGs();
      } catch (error) {
        alert(error?.response?.data?.message || "Failed to re-submit property");
      }
    }
  }, [fetchMyPGs]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">

      {/* Missing Payout Alert Banner if any approved PGs exist */}
      {!payoutConfigured && pgPages.some((p) => p.status === "approved") && (
        <div className="p-4 sm:p-5 rounded-3xl border border-amber-500/40 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <CreditCard size={24} />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
                Action Required: Configure Bank Details to Publish Live
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 leading-snug">
                Your property has been approved by admin! Please add your settlement bank details in your profile so students can view and book it on the Explore page.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/owner/profile?tab=payouts")}
            className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold transition shadow-sm shrink-0 cursor-pointer flex items-center gap-2 self-start sm:self-center"
          >
            <span>Configure Bank Details</span>
            <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* Big Bold Search & Category Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220] p-3 sm:p-5 shadow-sm">
        
        {/* Large Prominent Filter Tabs */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          {[
            { id: "all", label: "All Properties", count: counts.all },
            { id: "approved", label: "Approved Live", count: counts.approved },
            { id: "pending", label: "Pending Review", count: counts.pending },
            { id: "rejected", label: "Needs Revision", count: counts.rejected },
            { id: "removed", label: "Removed", count: counts.removed },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 rounded-2xl px-3 py-2 sm:px-5 sm:py-3.5 text-xs sm:text-sm font-black transition-all shrink-0 ${
                activeTab === tab.id
                  ? tab.id === "removed" ? "bg-rose-600 text-white shadow-lg shadow-rose-500/25" : "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`rounded-xl px-2 sm:px-2.5 py-0.5 text-xs font-black ${
                activeTab === tab.id ? "bg-white/20 text-white" : "bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-gray-200"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Large Search Field & Add PG Button */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-white/5 py-2.5 sm:py-3.5 pl-10 sm:pl-12 pr-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-[#141b2d]"
            />
          </div>

          <button
            type="button"
            onClick={handleAddPgClick}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 px-4 py-2.5 sm:px-6 sm:py-3.5 text-xs sm:text-sm font-black text-white shadow-lg shadow-blue-500/25 transition-all shrink-0 cursor-pointer"
          >
            <Plus size={18} />
            <span>Add PG</span>
          </button>
        </div>
      </div>

      {/* Property Grid Showcase - Big & Clear */}
      {loading ? (
        <div className="rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220] p-8 sm:p-16 text-center shadow-sm">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-800 border-t-blue-500 mx-auto mb-4"></div>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Loading property listings...</p>
        </div>
      ) : filteredPGs.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220] p-8 sm:p-16 text-center shadow-sm">
          <Building2 size={36} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-xl font-black text-gray-900 dark:text-white">No properties found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Try switching status filters or adding a new PG listing.</p>
          <button
            type="button"
            onClick={handleAddPgClick}
            className="inline-flex items-center gap-2 mt-5 rounded-2xl bg-blue-600 px-4 py-2.5 sm:px-6 sm:py-3.5 text-xs sm:text-sm font-black text-white hover:bg-blue-500 transition shadow-md cursor-pointer"
          >
            <Plus size={18} />
            <span>Add New Property</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-6">
          {filteredPGs.map((pg) => (
            <div
              key={pg.id}
              className="group flex flex-col rounded-xl sm:rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220] overflow-hidden shadow-xs hover:shadow-2xl transition-all duration-300"
            >
              {/* Image Banner */}
              <div className="relative h-28 sm:h-56 w-full overflow-hidden bg-gray-100 dark:bg-white/5">
                <img
                  src={
                    pg.profile_image
                      ? `${IMAGE_BASE_URL}/uploads/${pg.profile_image}`
                      : "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80"
                  }
                  alt={pg.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Status Badge */}
                <div className="absolute left-1.5 top-1.5 sm:left-4 sm:top-4">
                  <span className={`rounded-md sm:rounded-xl px-1.5 py-0.5 sm:px-3.5 sm:py-1.5 text-[8px] sm:text-xs font-black uppercase tracking-wider shadow-md backdrop-blur-md border ${
                    pg.status === "approved"
                      ? payoutConfigured
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                        : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                      : pg.status === "rejected"
                      ? "bg-amber-500/20 text-amber-500 border-amber-500/40"
                      : pg.status === "removed"
                      ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                      : "bg-blue-500/20 text-blue-400 border-blue-500/40"
                  }`}>
                    {pg.status === "approved"
                      ? payoutConfigured
                        ? "LIVE"
                        : "NEEDS BANK"
                      : pg.status === "rejected"
                      ? "REVISION"
                      : pg.status === "removed"
                      ? "REMOVED"
                      : "PENDING"}
                  </span>
                </div>

                {/* ID Pill */}
                <div className="absolute right-1.5 top-1.5 sm:right-4 sm:top-4">
                  <span className="rounded-md sm:rounded-xl bg-black/80 border border-white/20 px-1.5 py-0.5 sm:px-3 sm:py-1.5 text-[8px] sm:text-xs font-black text-white shadow-md backdrop-blur-md">
                    #{pg.id}
                  </span>
                </div>

                {/* Price Tag Overlay */}
                <div className="absolute bottom-1.5 right-1.5 sm:bottom-4 sm:right-4 rounded-lg sm:rounded-2xl bg-black/85 backdrop-blur-md border border-white/15 px-1.5 py-0.5 sm:px-4 sm:py-2 text-right shadow-lg">
                  <span className="text-[7px] sm:text-[10px] font-black text-gray-300 uppercase block tracking-wider">Rent</span>
                  <span className="text-[10px] sm:text-base font-black text-emerald-400 leading-tight">
                    ₹{Number(pg.price || 0).toLocaleString("en-IN")}<span className="text-[8px] sm:text-xs font-normal text-gray-300">/m</span>
                  </span>
                </div>
              </div>

              {/* Main Card Content */}
              <div className="flex flex-1 flex-col p-2 sm:p-6 space-y-1.5 sm:space-y-4">
                <div>
                  <h3 className="text-xs sm:text-xl font-black text-gray-900 dark:text-white leading-tight truncate">
                    {pg.title}
                  </h3>
                  <p className="flex items-center gap-1 text-[10px] sm:text-sm font-bold text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1.5 truncate">
                    <MapPin size={11} className="text-blue-500 shrink-0 sm:hidden" />
                    <MapPin size={16} className="text-blue-500 shrink-0 hidden sm:inline" />
                    <span className="truncate">{pg.area || pg.city}</span>
                  </p>
                </div>

                {/* Info Pills */}
                <div className="flex items-center gap-1 sm:gap-2 flex-wrap pt-0.5">
                  <span className="flex items-center gap-1 rounded-md sm:rounded-xl bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 sm:px-3 sm:py-1.5 text-[9px] sm:text-xs font-black text-gray-800 dark:text-gray-200">
                    <Bed size={10} className="text-blue-500 sm:hidden" />
                    <Bed size={14} className="text-blue-500 hidden sm:inline" />
                    <span>{pg.spots_left !== undefined ? `${pg.spots_left} Spots Left` : `${pg.available_rooms || 0} Total Spots`}</span>
                  </span>
                  <span className="flex items-center gap-1 rounded-md sm:rounded-xl bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 sm:px-3 sm:py-1.5 text-[9px] sm:text-xs font-black text-gray-800 dark:text-gray-200">
                    <Users size={10} className="text-cyan-500 sm:hidden" />
                    <Users size={14} className="text-cyan-500 hidden sm:inline" />
                    <span>{pg.occupied_spots !== undefined ? `${pg.occupied_spots} Booked` : pg.pg_type || "Boys"}</span>
                  </span>
                </div>

                {/* Shareable Public URL Bar / Status Bar */}
                {pg.status === "approved" ? (
                  payoutConfigured ? (
                    <div className="flex items-center justify-between gap-1 px-1.5 py-1 sm:px-3 sm:py-2 rounded-lg sm:rounded-2xl bg-emerald-50/50 dark:bg-emerald-500/[0.05] border border-emerald-500/20">
                      <span className="text-[9px] sm:text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400 truncate">
                        /pg/{pg.id || pg._id}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => handleCopyLink(pg.id || pg._id, e)}
                          title="Copy Public Link"
                          className="flex items-center gap-0.5 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-xl text-[9px] sm:text-xs font-black bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition cursor-pointer"
                        >
                          {copiedId === (pg.id || pg._id) ? (
                            <>
                              <Check size={9} className="text-emerald-600" />
                              <span className="text-emerald-700 dark:text-emerald-300">Done</span>
                            </>
                          ) : (
                            <>
                              <Copy size={9} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        <a
                          href={`/pg/${pg.id || pg._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open Live Public Listing"
                          className="p-0.5 sm:p-1 rounded-md sm:rounded-xl text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition"
                        >
                          <ExternalLink size={11} className="sm:hidden" />
                          <ExternalLink size={14} className="hidden sm:inline" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-1 px-1.5 py-1 sm:px-3 sm:py-2 rounded-lg sm:rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-500/30">
                      <span className="text-[9px] sm:text-[11px] font-bold text-amber-700 dark:text-amber-300 truncate">
                        Approved — Add Bank Details to Publish
                      </span>
                      <button
                        onClick={() => navigate("/owner/profile?tab=payouts")}
                        className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg bg-amber-500 text-white font-bold text-[9px] sm:text-xs hover:bg-amber-600 transition shrink-0 cursor-pointer"
                      >
                        Add Bank
                      </button>
                    </div>
                  )
                ) : pg.status === "rejected" ? (
                  <div className="flex flex-col gap-1.5 p-2 sm:p-3 rounded-lg sm:rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                    <div className="flex items-center justify-between gap-1">
                      <span className="flex items-center gap-1 font-bold text-[10px] sm:text-xs truncate">
                        <Clock size={12} className="shrink-0 text-amber-500" />
                        <span className="truncate">Needs Revision</span>
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => navigate(`/owner/edit-pg/${pg.id || pg._id}`)}
                          className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-amber-500 text-white text-[9px] sm:text-xs font-bold hover:bg-amber-600 cursor-pointer shadow-xs"
                          title="Edit details and address admin note"
                        >
                          Fix Now
                        </button>
                        <button
                          onClick={() => handleResubmit(pg.id || pg._id, pg.title)}
                          className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-emerald-600 text-white text-[9px] sm:text-xs font-bold hover:bg-emerald-500 cursor-pointer shadow-xs"
                          title="Re-submit this listing for admin approval"
                        >
                          Re-submit
                        </button>
                      </div>
                    </div>
                    {pg.admin_note && (
                      <div className="bg-amber-500/15 dark:bg-black/30 p-2 rounded-md border border-amber-500/25 text-[10px] sm:text-xs text-amber-800 dark:text-amber-300">
                        <span className="font-bold">Admin Note: </span>
                        <span className="leading-snug">{pg.admin_note}</span>
                      </div>
                    )}
                  </div>
                ) : pg.status === "removed" ? (
                  <div className="flex flex-col gap-1.5 p-2 sm:p-3 rounded-lg sm:rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400">
                    <div className="flex items-center justify-between gap-1">
                      <span className="flex items-center gap-1 font-bold text-[10px] sm:text-xs truncate">
                        <AlertTriangle size={12} className="shrink-0 text-rose-500" />
                        <span className="truncate">Delisted / Removed</span>
                      </span>
                      <button
                        onClick={() => navigate(`/owner/edit-pg/${pg.id || pg._id}`)}
                        className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-md border border-rose-500/30 bg-rose-500/20 text-rose-600 dark:text-rose-300 text-[9px] sm:text-xs font-bold hover:bg-rose-500/30 shrink-0 cursor-pointer shadow-xs"
                      >
                        Edit Listing
                      </button>
                    </div>
                    <div className="bg-rose-500/15 dark:bg-black/30 p-2 rounded-md border border-rose-500/25 text-[10px] sm:text-xs text-rose-800 dark:text-rose-300">
                      <span className="font-bold">Admin Note: </span>
                      <span className="leading-snug">{pg.admin_note || "This property was delisted by administrator and is hidden from Explore."}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-1.5 py-1 sm:px-3 sm:py-2 rounded-lg sm:rounded-2xl bg-amber-50/60 dark:bg-amber-500/[0.04] border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] sm:text-[11px] font-bold">
                    <Clock size={10} className="shrink-0 sm:hidden" />
                    <Clock size={13} className="shrink-0 hidden sm:inline" />
                    <span className="truncate">Under admin review</span>
                  </div>
                )}
              </div>

              {/* Action Buttons Toolbar */}
              <div className="grid grid-cols-3 gap-1 sm:gap-2.5 border-t border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] p-1.5 sm:p-4">
                <button
                  onClick={() => navigate(`/owner/pg-analytics/${pg.id || pg._id}`)}
                  className="flex items-center justify-center gap-1 rounded-lg sm:rounded-2xl bg-blue-600 hover:bg-blue-500 py-1.5 sm:py-3 text-[9px] sm:text-xs font-black text-white transition shadow-xs cursor-pointer"
                >
                  <Eye size={11} className="sm:hidden" />
                  <Eye size={16} className="hidden sm:inline" />
                  <span>View</span>
                </button>

                <button
                  onClick={() => navigate(`/owner/edit-pg/${pg.id || pg._id}`)}
                  className="flex items-center justify-center gap-1 rounded-lg sm:rounded-2xl border border-gray-200 dark:border-white/15 bg-white dark:bg-white/5 py-1.5 sm:py-3 text-[9px] sm:text-xs font-black text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer"
                >
                  <Edit3 size={11} className="sm:hidden" />
                  <Edit3 size={16} className="hidden sm:inline" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => handleDelete(pg.id || pg._id, pg.title)}
                  className="flex items-center justify-center gap-1 rounded-lg sm:rounded-2xl border border-rose-500/30 bg-rose-500/10 py-1.5 sm:py-3 text-[9px] sm:text-xs font-black text-rose-500 hover:bg-rose-500/20 transition cursor-pointer"
                >
                  <Trash2 size={11} className="sm:hidden" />
                  <Trash2 size={16} className="hidden sm:inline" />
                  <span>Delete</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default MyPGs;