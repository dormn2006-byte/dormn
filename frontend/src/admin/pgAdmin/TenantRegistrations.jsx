import { useEffect, useState } from "react";
import API from "../../services/api";
import { FileText, Download, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { jsPDF } from "jspdf";
// FIX 1: Explicitly import autoTable instead of relying on prototype injection
import autoTable from "jspdf-autotable"; 

const TenantRegistrations = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegistrations();
  }, []);

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

  const handleStatusUpdate = async (enrollment_id, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this application as ${newStatus.toUpperCase()}?`)) return;
    
    try {
      await API.put("/enrollments/status", { enrollment_id, status: newStatus });
      setEnrollments(prev => prev.map(student => 
        student.id === enrollment_id ? { ...student, status: newStatus } : student
      ));
    } catch (err) {
      alert("Failed to update status.");
      console.error(err);
    }
  };

  const generatePDF = (student) => {
    try {
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
        
        [{ content: '2. Parent & Emergency Contacts', colSpan: 2, styles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' } }],
        ['Parent/Guardian 1', `${safe(student.parent_1_name)} (${safe(student.parent_1_relation)}) - ${safe(student.parent_1_phone)}`],
        ['Parent/Guardian 2', student.parent_2_name ? `${safe(student.parent_2_name)} (${safe(student.parent_2_relation)}) - ${safe(student.parent_2_phone)}` : 'N/A'],
        ['Local Guardian', student.guardian_name ? `${safe(student.guardian_name)} - ${safe(student.guardian_phone)}` : 'N/A'],

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
    <div className="p-6 md:p-10 space-y-8 font-sans max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Tenant Registrations</h1>
        <p className="text-sm text-gray-500 mt-1">Review, approve, and download KYC details securely.</p>
      </div>

      <div className="grid gap-6">
        {enrollments.length === 0 ? (
          <div className="p-16 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-white">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900">No Registrations Yet</h3>
          </div>
        ) : (
          enrollments.map((student) => (
            <div key={student.id} className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition">
              
              {/* Info Section */}
              <div className="flex items-start gap-4 w-full md:w-auto">
                <div className={`p-3 rounded-full ${
                  student.status === 'verified' ? 'bg-green-100 text-green-600' : 
                  student.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  {student.status === 'verified' ? <CheckCircle2 size={24} /> : 
                   student.status === 'rejected' ? <XCircle size={24} /> : <AlertCircle size={24} />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{student.student_name || "New Tenant"}</h3>
                  <p className="text-sm text-gray-500">{student.pg_title || "Unknown Property"}</p>
                  <p className="text-xs font-medium text-gray-400 mt-1">Submitted: {new Date(student.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Actions Section */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                
                {student.status === 'pending' && (
                  <>
                    <button onClick={() => handleStatusUpdate(student.id, 'verified')} className="rounded-xl bg-green-50 text-green-700 px-4 py-2 text-sm font-bold border border-green-200 hover:bg-green-100 transition">
                      Approve
                    </button>
                    <button onClick={() => handleStatusUpdate(student.id, 'rejected')} className="rounded-xl bg-red-50 text-red-700 px-4 py-2 text-sm font-bold border border-red-200 hover:bg-red-100 transition">
                      Reject
                    </button>
                  </>
                )}

                {student.status === 'verified' && <span className="px-4 py-2 text-xs font-bold text-green-700 bg-green-50 rounded-xl border border-green-200">Verified ✅</span>}
                {student.status === 'rejected' && <span className="px-4 py-2 text-xs font-bold text-red-700 bg-red-50 rounded-xl border border-red-200">Rejected ❌</span>}

                {/* PDF Download */}
                <button onClick={() => generatePDF(student)} className="flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800">
                  <Download size={16} /> Print PDF
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TenantRegistrations;