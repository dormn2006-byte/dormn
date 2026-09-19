import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Users, Mail, Phone, Building2, Search, CheckCircle2, Clock, XCircle,
  CreditCard, BedDouble, AlertCircle, ChevronDown, ChevronUp, ShieldCheck,
  MapPin, UserCheck, Loader2,
} from "lucide-react";
import api from "../../services/api";
import RejectReasonModal from "../shared/RejectReasonModal";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [bookRes, enrollRes] = await Promise.all([
        api.get("/bookings/owner-bookings").catch(() => ({ data: {} })),
        api.get("/enrollments/owner-list").catch(() => ({ data: {} })),
      ]);
      setStudents(bookRes.data?.bookings || []);
      setEnrollments(enrollRes.data?.enrollments || []);
    } catch (error) {
      console.error("Students Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // booking_id -> KYC/enrollment record submitted before payment
  const enrollmentByBooking = useMemo(() => {
    const map = new Map();
    enrollments.forEach((e) => {
      if (e.booking_id != null) map.set(Number(e.booking_id), e);
    });
    return map;
  }, [enrollments]);

  // Filter out paused bookings and deduplicate (same student + same PG → keep latest only)
  const visibleStudents = useMemo(() => {
    const filtered = students.filter((s) => s.status !== "paused");
    const grouped = {};
    filtered.forEach((s) => {
      const studentKey = (s.student_email || s.email || s.student_name || String(s.student_id || s.user_id || '')).toLowerCase().trim();
      const pgKey = (s.title || s.pg_title || s.pg_name || String(s.pg_id || '')).toLowerCase().trim();
      const key = `${studentKey}_${pgKey}`;

      const sTime = new Date(s.created_at || 0).getTime() || Number(s.id) || 0;
      const gTime = grouped[key] ? (new Date(grouped[key].created_at || 0).getTime() || Number(grouped[key].id) || 0) : -1;

      if (!grouped[key] || sTime > gTime) {
        grouped[key] = s;
      }
    });

    return Object.values(grouped).map((s) => ({
      ...s,
      enrollment: enrollmentByBooking.get(Number(s.id)) || null,
    }));
  }, [students, enrollmentByBooking]);

  const kycOf = (s) => s.enrollment?.status || null;

  const counts = useMemo(() => ({
    all: visibleStudents.length,
    kyc: visibleStudents.filter((s) => s.payment_status === "paid" && kycOf(s) === "pending").length,
    paid: visibleStudents.filter((s) => s.status === "approved" && s.payment_status === "paid").length,
    unpaid: visibleStudents.filter((s) => s.status === "approved" && s.payment_status !== "paid").length,
    pending: visibleStudents.filter((s) => s.status === "pending").length,
    rejected: visibleStudents.filter((s) => s.status === "rejected").length,
  }), [visibleStudents]);

  const filteredStudents = useMemo(() => {
    return visibleStudents.filter((s) => {
      const studentName = s.student_name || "";
      const studentEmail = s.student_email || "";
      const matchesSearch =
        studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        studentEmail.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesTab = true;
      if (activeTab === "kyc") {
        matchesTab = s.payment_status === "paid" && kycOf(s) === "pending";
      } else if (activeTab === "paid") {
        matchesTab = s.status === "approved" && s.payment_status === "paid";
      } else if (activeTab === "unpaid") {
        matchesTab = s.status === "approved" && s.payment_status !== "paid";
      } else if (activeTab === "pending") {
        matchesTab = s.status === "pending";
      } else if (activeTab === "rejected") {
        matchesTab = s.status === "rejected";
      }

      return matchesSearch && matchesTab;
    });
  }, [visibleStudents, searchTerm, activeTab]);

  const handleDecision = async (enrollmentId, status, note) => {
    setSubmitting(true);
    try {
      await api.put("/enrollments/status", {
        enrollment_id: enrollmentId,
        status,
        ...(note ? { rejection_note: note } : {}),
      });
      setToast({
        type: "success",
        message: status === "verified"
          ? "Tenant accepted — the student is now enrolled."
          : "Tenant details rejected. The student can correct them and reapply.",
      });
      setRejectTarget(null);
      await fetchAll();
    } catch (err) {
      setToast({
        type: "error",
        message: err?.response?.data?.message || "Failed to update the tenant status.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">

      {toast && (
        <div className={`rounded-2xl border px-5 py-3.5 text-sm font-bold ${
          toast.type === "success"
            ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
            : "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400"
        }`}>
          {toast.message}
        </div>
      )}

      {/* Big Bold Action Bar & Filter Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220] p-3 sm:p-5 shadow-sm">

        {/* Large Status Filter Tabs */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          {[
            { id: "all", label: "All Applicants", count: counts.all },
            { id: "kyc", label: "KYC Review", count: counts.kyc },
            { id: "paid", label: "Paid & Verified", count: counts.paid },
            { id: "unpaid", label: "Approved (Unpaid)", count: counts.unpaid },
            { id: "pending", label: "Pending Approval", count: counts.pending },
            { id: "rejected", label: "Declined", count: counts.rejected },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 rounded-2xl px-3 py-2 sm:px-5 sm:py-3.5 text-xs sm:text-sm font-black transition-all shrink-0 ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
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

        {/* Large Search Field */}
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search tenant name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-white/5 py-2.5 sm:py-3.5 pl-10 sm:pl-12 pr-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-[#141b2d]"
          />
        </div>
      </div>

      {/* Tenant Cards Showcase - Big, Clear & Bold */}
      {loading ? (
        <div className="rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220] p-8 sm:p-16 text-center shadow-sm">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-800 border-t-blue-500 mx-auto mb-4"></div>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Loading tenant directory...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220] p-8 sm:p-16 text-center shadow-sm">
          <Users size={36} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-xl font-black text-gray-900 dark:text-white">No tenants found</h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">No tenants match your current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {filteredStudents.map((s) => {
            const kyc = kycOf(s);
            const details = s.enrollment;
            const isExpanded = expandedId === s.id;

            return (
              <div
                key={s.id}
                className="group flex flex-col rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220] overflow-hidden p-4 sm:p-6 shadow-md hover:shadow-2xl transition-all duration-300 justify-between space-y-3 sm:space-y-5"
              >
                {/* Header Details */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-sm sm:text-xl font-black text-white shadow-md">
                      {(s.student_name || "T").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-lg font-black text-gray-900 dark:text-white leading-tight truncate">
                        {s.student_name || "Tenant Applicant"}
                      </h3>
                      <span className="text-xs font-bold text-gray-400">ID #{s.student_id || s.id}</span>
                    </div>
                  </div>

                  {s.status === "approved" ? (
                    s.payment_status === "paid" ? (
                      <span className="rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-wider border bg-emerald-500/20 text-emerald-400 border-emerald-500/40 flex items-center gap-1 shrink-0">
                        <CheckCircle2 size={13} />
                        <span>PAID &amp; ACTIVE</span>
                      </span>
                    ) : (
                      <span className="rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-wider border bg-amber-500/20 text-amber-400 border-amber-500/40 flex items-center gap-1 shrink-0">
                        <AlertCircle size={13} />
                        <span>APPROVED (UNPAID)</span>
                      </span>
                    )
                  ) : s.status === "rejected" ? (
                    <span className="rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-wider border bg-rose-500/20 text-rose-400 border-rose-500/40 shrink-0">
                      DECLINED
                    </span>
                  ) : (
                    <span className="rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-wider border bg-blue-500/20 text-blue-400 border-blue-500/40 shrink-0">
                      PENDING REVIEW
                    </span>
                  )}
                </div>

                {/* KYC review state */}
                {s.payment_status === "paid" && (
                  <div className={`rounded-2xl border p-3.5 space-y-2 ${
                    kyc === "verified"
                      ? "border-emerald-300/60 bg-emerald-500/10"
                      : kyc === "rejected"
                      ? "border-rose-300/60 bg-rose-500/10"
                      : kyc === "pending"
                      ? "border-amber-300/60 bg-amber-500/10"
                      : "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Tenant KYC</span>
                      {kyc === "verified" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400">
                          <UserCheck size={13} /> Enrolled
                        </span>
                      ) : kyc === "rejected" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-black text-rose-600 dark:text-rose-400">
                          <XCircle size={13} /> Rejected
                        </span>
                      ) : kyc === "pending" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400">
                          <Clock size={13} /> Awaiting your review
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-gray-400">Not submitted</span>
                      )}
                    </div>

                    {details?.rejection_note && (
                      <div className="rounded-xl bg-white/70 dark:bg-black/20 border border-rose-200/70 dark:border-rose-500/20 p-2.5">
                        <p className="text-[10px] font-black uppercase tracking-wider text-rose-500 mb-0.5">Your rejection reason</p>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-relaxed">{details.rejection_note}</p>
                      </div>
                    )}

                    {/* Submitted details */}
                    {details && (
                      <>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : s.id)}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-white/15 bg-white/70 dark:bg-white/5 py-2 text-[11px] font-bold text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-white/10 transition"
                        >
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          {isExpanded ? "Hide submitted details" : "View submitted details"}
                        </button>

                        {isExpanded && (
                          <dl className="grid grid-cols-1 gap-1.5 rounded-xl bg-white/70 dark:bg-black/20 border border-gray-200 dark:border-white/10 p-3 text-xs">
                            {[
                              ["Name", details.student_name || s.student_name],
                              ["Email", details.student_email || s.student_email],
                              ["Mobile", details.student_phone || s.student_phone],
                              ["Guardian", details.guardian_name],
                              ["Guardian email", details.guardian_email],
                              ["Guardian mobile", details.guardian_phone],
                              ["Current address", details.home_address],
                              ["Aadhar", details.aadhar_number],
                            ].map(([label, value]) => (
                              <div key={label} className="flex items-start justify-between gap-3">
                                <dt className="shrink-0 font-bold uppercase tracking-wider text-[10px] text-gray-400 pt-0.5">{label}</dt>
                                <dd className="text-right font-semibold text-gray-900 dark:text-gray-200 break-words">
                                  {value || <span className="font-normal italic text-gray-400">Not provided</span>}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        )}
                      </>
                    )}

                    {/* Review actions */}
                    {details && kyc !== "verified" && (
                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          onClick={() => handleDecision(details.id, "verified")}
                          disabled={submitting}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2 text-[11px] font-black text-white transition disabled:opacity-50"
                        >
                          {submitting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                          Accept
                        </button>
                        <button
                          onClick={() => setRejectTarget({ enrollment: details, tenant: s })}
                          disabled={submitting}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 py-2 text-[11px] font-black text-white transition disabled:opacity-50"
                        >
                          <XCircle size={13} />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* PG Assignment & Payment Info Box */}
                <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-bold uppercase text-[10px]">Property Stay</span>
                    <span className="font-black text-blue-500 flex items-center gap-1.5 text-sm">
                      <Building2 size={15} />
                      {s.title || s.pg_title || "PG Accommodations"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs border-t border-gray-200/60 dark:border-white/10 pt-2.5">
                    <span className="text-gray-400 font-bold uppercase text-[10px]">Room Plan</span>
                    <span className="font-bold text-gray-900 dark:text-gray-200 flex items-center gap-1">
                      <BedDouble size={13} className="text-purple-500" />
                      {s.selected_room_type || "Standard Room"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs border-t border-gray-200/60 dark:border-white/10 pt-2.5">
                    <span className="text-gray-400 font-bold uppercase text-[10px]">Payment Status</span>
                    {s.payment_status === "paid" ? (
                      <span className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CreditCard size={13} />
                        <span>Paid ₹{(Number(s.booked_price || s.price || 0)).toLocaleString()}</span>
                      </span>
                    ) : s.status === "approved" ? (
                      <span className="font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Clock size={13} />
                        <span>Unpaid (₹{(Number(s.booked_price || s.price || 0)).toLocaleString()} Due)</span>
                      </span>
                    ) : (
                      <span className="font-bold text-gray-500 flex items-center gap-1">
                        <span>₹{(Number(s.booked_price || s.price || 0)).toLocaleString()} (Pending)</span>
                      </span>
                    )}
                  </div>

                  {s.student_email && (
                    <div className="flex items-center justify-between text-xs border-t border-gray-200/60 dark:border-white/10 pt-2.5">
                      <span className="text-gray-400 font-bold uppercase text-[10px]">Email</span>
                      <span className="font-bold text-gray-900 dark:text-gray-200 truncate max-w-[180px]">
                        {s.student_email}
                      </span>
                    </div>
                  )}

                  {s.student_phone && (
                    <div className="flex items-center justify-between text-xs border-t border-gray-200/60 dark:border-white/10 pt-2.5">
                      <span className="text-gray-400 font-bold uppercase text-[10px]">Contact</span>
                      <span className="font-bold text-gray-900 dark:text-gray-200">
                        {s.student_phone}
                      </span>
                    </div>
                  )}
                </div>

                {/* Big Action Buttons */}
                <div className="flex items-center gap-3 pt-1">
                  {s.student_phone && (
                    <a
                      href={`tel:${s.student_phone}`}
                      className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 py-2.5 sm:py-3.5 text-xs font-black text-white transition shadow-md shadow-blue-500/20"
                    >
                      <Phone size={16} />
                      <span>Call Tenant</span>
                    </a>
                  )}

                  {s.student_email && (
                    <a
                      href={`mailto:${s.student_email}`}
                      className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-white/5 py-2.5 sm:py-3.5 text-xs font-bold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition"
                    >
                      <Mail size={16} />
                      <span>Email</span>
                    </a>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      <RejectReasonModal
        isOpen={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        onSubmit={(note) => handleDecision(rejectTarget.enrollment.id, "rejected", note)}
        tenantName={rejectTarget?.tenant?.student_name}
        pgTitle={rejectTarget?.tenant?.title || rejectTarget?.tenant?.pg_title}
        submitting={submitting}
      />

    </div>
  );
};

export default Students;
