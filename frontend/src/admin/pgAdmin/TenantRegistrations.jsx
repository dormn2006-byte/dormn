import { useEffect, useState } from "react";
import API from "../../services/api";
import { FileText, Download, CheckCircle2, AlertCircle, XCircle, Users, ShieldCheck, Loader2 } from "lucide-react";
import RejectReasonModal from "../shared/RejectReasonModal";

const TenantRegistrations = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchRegistrations = async () => {
    try {
      const res = await API.get("/enrollments/owner-list");
      if (res.data.success) setEnrollments(res.data.enrollments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleStatusUpdate = async (enrollment_id, newStatus, rejection_note) => {
    if (!window.confirm(`Are you sure you want to mark this application as ${newStatus.toUpperCase()}?`)) return;

    setSubmitting(true);
    try {
      const res = await API.put("/enrollments/status", {
        enrollment_id,
        status: newStatus,
        ...(rejection_note ? { rejection_note } : {}),
      });
      setEnrollments(prev => prev.map(student =>
        student.id === enrollment_id
          ? {
              ...student,
              status: newStatus,
              rejection_note: newStatus === "rejected" ? rejection_note : null,
            }
          : student
      ));
      setRejectTarget(null);
      return res;
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to update status.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const generatePDF = async (student) => {
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable")
      ]);
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const safe = (val) => {
        if (val === undefined || val === null || val === 'undefined' || val === '') return 'N/A';
        return val;
      };

      // --- BRANDING HEADER & WATERMARK ---
      doc.setTextColor(240, 245, 240); // Very light gray watermark
      doc.setFontSize(60);
      doc.setFont("helvetica", "bold");
      doc.text("DORMN VERIFIED", pageWidth / 2 - 80, pageHeight / 2 + 20, { angle: 45 });

      doc.setFillColor(147, 183, 51); // Dormn Green Background (#93B733)
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.text("DORMN", 14, 26);
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("Official Tenant KYC Verification Report", 14, 34);

      // --- DOCUMENT METADATA ---
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(10);
      doc.text(`Generated Date: ${new Date().toLocaleDateString()}`, 14, 50);
      doc.text(`Application Status: ${safe(student.status).toUpperCase()}`, 14, 56);
      doc.text(`Property Name: ${safe(student.pg_title)}`, 14, 62);
      doc.text(`Registration ID: DORMN-KYC-${safe(student.id)}`, 14, 68);

      // --- DATA TABLE ---
      const tableData = [
        [{ content: '1. Personal Details', colSpan: 2, styles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' } }],
        ['Full Name', safe(student.student_name)],
        ['Email Address', safe(student.student_email)],
        ['Date of Birth', student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'],
        ['Hometown & Pincode', `${safe(student.hometown)} - ${safe(student.pincode)}`],
        ['Permanent Address', safe(student.home_address)],
        ['Aadhar Number', student.aadhar_number ? safe(student.aadhar_number) : 'N/A'],
        
        [{ content: '2. Parent & Emergency Contacts', colSpan: 2, styles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' } }],
        ['Parent/Guardian 1', `${safe(student.parent_1_name)} (${safe(student.parent_1_relation)}) - ${safe(student.parent_1_phone)}`],
        ['Parent/Guardian 2', student.parent_2_name ? `${safe(student.parent_2_name)} (${safe(student.parent_2_relation)}) - ${safe(student.parent_2_phone)}` : 'N/A'],
        ['Local Guardian', student.guardian_name ? `${safe(student.guardian_name)} - ${safe(student.guardian_phone)}` : 'N/A'],
        ['Guardian Email', student.guardian_email ? safe(student.guardian_email) : 'N/A'],

        [{ content: '3. Medical & Health Preferences', colSpan: 2, styles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' } }],
        ['Food Preference', safe(student.food_preference)],
        ['Blood Group', safe(student.blood_group)],
        ['Allergies/Medical', student.allergies || student.medical_details || 'None reported'],

        [{ content: '4. Academic / Professional Background', colSpan: 2, styles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' } }],
        ['Current Status', safe(student.occupation)],
        [student.occupation === 'Student' ? 'College/University' : 'Workplace/Company', safe(student.college_name) !== 'N/A' ? safe(student.college_name) : safe(student.workplace_name)],
        [student.occupation === 'Student' ? 'Course & Year' : 'Designation', `${safe(student.course_name)} ${safe(student.course_year)}`.trim() !== 'N/A' ? `${safe(student.course_name)} ${safe(student.course_year)}`.trim() : safe(student.designation)],
      ];

      // FIX 2: Explicitly call autoTable(doc, ...) instead of doc.autoTable(...)
      autoTable(doc, {
        startY: 75,
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 6, textColor: [40, 40, 40] },
        columnStyles: { 0: { cellWidth: 65, fontStyle: 'bold', fillColor: [250, 250, 250] } }
      });

      // --- FOOTER & SIGNATURE ---
      const finalY = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(10);
      doc.text("I hereby declare that the details furnished above are true and correct.", 14, finalY);
      
      doc.setLineWidth(0.5);
      doc.line(14, finalY + 20, 70, finalY + 20);
      doc.text("Tenant Signature", 14, finalY + 26);

      doc.line(pageWidth - 70, finalY + 20, pageWidth - 14, finalY + 20);
      doc.text("Authorized PG Manager", pageWidth - 70, finalY + 26);

      doc.save(`DORMN_KYC_${safe(student.student_name).replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("PDF Generation Failed:", error);
      alert("Failed to download PDF. Please check the console for details.");
    }
  };

  if (loading) return <div className="p-10 text-center font-bold text-gray-500">Loading Records...</div>;

  return (
    <div className="space-y-6 w-full pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Tenant Registrations</h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Review, approve, and download KYC details securely.</p>
      </div>

      <div className="grid gap-3 sm:gap-6">
        {enrollments.length === 0 ? (
          <div className="p-8 sm:p-16 text-center rounded-2xl sm:rounded-3xl bg-white dark:bg-[#111]">
            <FileText size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <h3 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">No Registrations Yet</h3>
          </div>
        ) : (
          enrollments.map((student) => (
            <div key={student.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-6 bg-white dark:bg-[#111] rounded-2xl transition">
              
              {/* Info Section */}
              <div className="flex items-start gap-3 sm:gap-4 w-full md:w-auto">
                <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-full shrink-0 ${
                  student.status === 'verified' ? 'bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400' : 
                  student.status === 'rejected' ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'
                }`}>
                  {student.status === 'verified' ? <CheckCircle2 size={20} /> : 
                   student.status === 'rejected' ? <XCircle size={20} /> : <AlertCircle size={20} />}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">{student.student_name || "New Tenant"}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{student.pg_title || "Unknown Property"}</p>
                  <p className="text-[11px] font-medium text-gray-400 mt-0.5">Submitted: {new Date(student.created_at).toLocaleDateString()}</p>
                  {(student.guardian_email || student.aadhar_number) && (
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                      {student.guardian_email && (
                        <span className="inline-flex items-center gap-1 truncate max-w-full">
                          <Users size={11} className="text-gray-400 shrink-0" />
                          Guardian: <strong className="text-gray-700 dark:text-gray-300 truncate">{student.guardian_name || 'N/A'}</strong>
                        </span>
                      )}
                      {student.aadhar_number && (
                        <span className="inline-flex items-center gap-1">
                          <ShieldCheck size={11} className="text-gray-400 shrink-0" />
                          Aadhar: <strong className="text-gray-700 dark:text-gray-300 tracking-wide">{student.aadhar_number}</strong>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Section */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto pt-2 border-t border-gray-100 dark:border-white/5 md:pt-0 md:border-0 justify-between sm:justify-start">
                
                {student.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleStatusUpdate(student.id, 'verified')} className="rounded-xl bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold border border-green-200 dark:border-green-500/30 hover:bg-green-100 transition cursor-pointer">
                      Accept
                    </button>
                    <button onClick={() => setRejectTarget(student)} disabled={submitting} className="rounded-xl bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold border border-red-200 dark:border-red-500/30 hover:bg-red-100 transition disabled:opacity-50 cursor-pointer">
                      Reject
                    </button>
                  </div>
                )}

                {student.status === 'verified' && <span className="px-3 py-1 sm:px-4 sm:py-2 text-xs font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/15 rounded-xl border border-green-200 dark:border-green-500/30">Enrolled ✅</span>}
                {student.status === 'rejected' && (
                  <div className="flex flex-col items-start sm:items-end gap-1">
                    <span className="px-3 py-1 sm:px-4 sm:py-2 text-xs font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/15 rounded-xl border border-red-200 dark:border-red-500/30">Rejected ❌</span>
                    {student.rejection_note && (
                      <p className="max-w-xs text-left sm:text-right text-[10px] sm:text-[11px] font-medium text-gray-500 dark:text-gray-400">
                        Reason: {student.rejection_note}
                      </p>
                    )}
                  </div>
                )}

                {/* PDF Download */}
                <button onClick={() => generatePDF(student)} className="flex items-center justify-center gap-1.5 rounded-xl bg-gray-900 dark:bg-white dark:text-gray-900 px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold text-white transition hover:bg-gray-800 cursor-pointer ml-auto sm:ml-0">
                  <Download size={14} /> Print PDF
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <RejectReasonModal
        isOpen={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        onSubmit={(note) => handleStatusUpdate(rejectTarget.id, "rejected", note)}
        tenantName={rejectTarget?.student_name}
        pgTitle={rejectTarget?.pg_title}
        submitting={submitting}
      />
    </div>
  );
};

export default TenantRegistrations;