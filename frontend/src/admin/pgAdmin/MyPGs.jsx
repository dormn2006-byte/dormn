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
  Users
} from "lucide-react";
import api, { IMAGE_BASE_URL } from "../../services/api";

const MyPGs = () => {
  const navigate = useNavigate();
  const [pgPages, setPgPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

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
  }, [fetchMyPGs]);

  // Counts for status tabs
  const counts = useMemo(() => ({
    all: pgPages.length,
    approved: pgPages.filter((p) => p.status === "approved").length,
    pending: pgPages.filter((p) => p.status === "pending").length,
    rejected: pgPages.filter((p) => p.status === "rejected").length,
  }), [pgPages]);

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

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      
      {/* Big Bold Search & Category Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220] p-5 shadow-sm">
        
        {/* Large Prominent Filter Tabs */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          {[
            { id: "all", label: "All Properties", count: counts.all },
            { id: "approved", label: "Approved Live", count: counts.approved },
            { id: "pending", label: "Pending Review", count: counts.pending },
            { id: "rejected", label: "Needs Revision", count: counts.rejected },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 rounded-2xl px-5 py-3.5 text-sm font-black transition-all shrink-0 ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`rounded-xl px-2.5 py-0.5 text-xs font-black ${
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-white/5 py-3.5 pl-12 pr-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-[#141b2d]"
            />
          </div>

          <Link
            to="/owner/add-pg"
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-500/25 transition-all shrink-0"
          >
            <Plus size={18} />
            <span>Add PG</span>
          </Link>
        </div>
      </div>

      {/* Property Grid Showcase - Big & Clear */}
      {loading ? (
        <div className="rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220] p-16 text-center shadow-sm">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-800 border-t-blue-500 mx-auto mb-4"></div>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Loading property listings...</p>
        </div>
      ) : filteredPGs.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220] p-16 text-center shadow-sm">
          <Building2 size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-black text-gray-900 dark:text-white">No properties found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Try switching status filters or adding a new PG listing.</p>
          <Link
            to="/owner/add-pg"
            className="inline-flex items-center gap-2 mt-5 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-black text-white hover:bg-blue-500 transition shadow-md"
          >
            <Plus size={18} />
            <span>Add New Property</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPGs.map((pg) => (
            <div
              key={pg.id}
              className="group flex flex-col rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220] overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300"
            >
              {/* Image Banner */}
              <div className="relative h-56 w-full overflow-hidden bg-gray-100 dark:bg-white/5">
                <img
                  src={
                    pg.profile_image
                      ? `${IMAGE_BASE_URL}/uploads/${pg.profile_image}`
                      : "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80"
                  }
                  alt={pg.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Big Status Badge */}
                <div className="absolute left-4 top-4">
                  <span className={`rounded-xl px-3.5 py-1.5 text-xs font-black uppercase tracking-wider shadow-lg backdrop-blur-md border ${
                    pg.status === "approved"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : pg.status === "rejected"
                      ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                      : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                  }`}>
                    {pg.status === "approved" ? "APPROVED LIVE" : pg.status?.toUpperCase() || "PENDING"}
                  </span>
                </div>

                {/* ID Pill */}
                <div className="absolute right-4 top-4">
                  <span className="rounded-xl bg-black/80 border border-white/20 px-3 py-1.5 text-xs font-black text-white shadow-md backdrop-blur-md">
                    ID #{pg.id}
                  </span>
                </div>

                {/* Price Tag Overlay */}
                <div className="absolute bottom-4 right-4 rounded-2xl bg-black/85 backdrop-blur-md border border-white/15 px-4 py-2 text-right shadow-lg">
                  <span className="text-[10px] font-black text-gray-300 uppercase block tracking-wider">Monthly Rent</span>
                  <span className="text-base font-black text-emerald-400">
                    ₹{Number(pg.price || 0).toLocaleString("en-IN")}<span className="text-xs font-normal text-gray-300">/mo</span>
                  </span>
                </div>
              </div>

              {/* Main Card Content - Big & Bold */}
              <div className="flex flex-1 flex-col p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight truncate">
                    {pg.title}
                  </h3>
                  <p className="flex items-center gap-1.5 text-sm font-bold text-gray-500 dark:text-gray-400 mt-1.5">
                    <MapPin size={16} className="text-blue-500 shrink-0" />
                    <span>{pg.area || pg.city}, {pg.city}</span>
                  </p>
                </div>

                {/* Info Pills */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className="flex items-center gap-1.5 rounded-xl bg-gray-100 dark:bg-white/5 px-3 py-1.5 text-xs font-black text-gray-800 dark:text-gray-200">
                    <Bed size={14} className="text-blue-500" />
                    {pg.available_rooms || 2} Rooms Available
                  </span>
                  <span className="flex items-center gap-1.5 rounded-xl bg-gray-100 dark:bg-white/5 px-3 py-1.5 text-xs font-black text-gray-800 dark:text-gray-200">
                    <Users size={14} className="text-cyan-500" />
                    {pg.pg_type || "Boys"} PG
                  </span>
                </div>
              </div>

              {/* Large Action Buttons Toolbar */}
              <div className="grid grid-cols-3 gap-2.5 border-t border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] p-4">
                <button
                  onClick={() => navigate(`/pg/${pg.id}`)}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 py-3 text-xs font-black text-white transition shadow-md"
                >
                  <Eye size={16} />
                  <span>View</span>
                </button>

                <button
                  onClick={() => navigate(`/owner/edit-pg/${pg.id}`)}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 dark:border-white/15 bg-white dark:bg-white/5 py-3 text-xs font-black text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition"
                >
                  <Edit3 size={16} />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => handleDelete(pg.id, pg.title)}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 py-3 text-xs font-black text-rose-500 hover:bg-rose-500/20 transition"
                >
                  <Trash2 size={16} />
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