import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import API, { IMAGE_BASE_URL } from "../services/api";
import { 
  User, ShieldAlert, Activity, Briefcase, FileText, Flag, 
  ChevronDown, ChevronUp, Camera, X, CheckCircle2, AlertCircle
} from "lucide-react";

// Clean, Light Theme Accordion
const AccordionSection = ({ id, title, icon: Icon, isOpen, onToggle, children, badge }) => (
  <div className="border-b border-gray-100 last:border-0 bg-white">
    <button 
      type="button"
      onClick={() => onToggle(id)}
      className="flex w-full items-center justify-between py-4 px-6 hover:bg-gray-50 transition duration-200"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isOpen ? "bg-[#93B733]/10 text-[#93B733]" : "bg-gray-100 text-gray-500"}`}>
          <Icon size={18} />
        </div>
        <span className={`text-[15px] font-bold ${isOpen ? "text-gray-900" : "text-gray-700"}`}>
          {title}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {badge && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{badge}</span>}
        {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
      </div>
    </button>
    {isOpen && (
      <div className="px-6 pb-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
        {children}
      </div>
    )}
  </div>
);

// Clean File Upload Box
const FileUploadBox = ({ label, name, file, onChange, onRemove }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-bold text-gray-700">{label}</label>
    {file ? (
      <div className="relative h-28 w-32 rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <img src={URL.createObjectURL(file)} alt="preview" className="object-cover h-full w-full" />
        <button type="button" onClick={() => onRemove(name)} className="absolute top-1 right-1 bg-white/90 text-red-500 hover:text-red-700 rounded-full p-1 shadow-sm transition">
          <X size={14}/>
        </button>
      </div>
    ) : (
      <label className="flex h-28 w-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition">
        <Camera className="text-gray-400" size={20} />
        <span className="text-[10px] font-semibold text-gray-500">Upload Photo</span>
        <input type="file" name={name} className="hidden" onChange={onChange} accept="image/*" />
      </label>
    )}
  </div>
);

const MyPgs = () => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [showFormModal, setShowFormModal] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openSection, setOpenSection] = useState("basic");

  const [formData, setFormData] = useState({
    dob: "", homeAddress: "", hometown: "", pincode: "",
    parent1Name: "", parent1Relation: "Father", parent1Phone: "",
    parent2Name: "", parent2Relation: "Mother", parent2Phone: "",
    guardianName: "", guardianRelation: "", guardianPhone: "",
    foodPreference: "", bloodGroup: "", allergies: "", medicalDetails: "",
    
    // Dynamic Occupation Fields
    occupation: "Student", 
    workplaceName: "", designation: "", // For working/freelance
    collegeName: "", admissionYear: "", collegeIdNumber: "", courseName: "", courseYear: "", // For students
    
    // Files
    passportPhoto: null, aadharFront: null, aadharBack: null,
    interests: "", suggestions: ""
  });

  useEffect(() => {
    const fetchActiveStay = async () => {
      try {
        const res = await API.get("/bookings/my-pgs");
        if (res.data.success && res.data.booking) {
          setBooking(res.data.booking);
          setFormSubmitted(res.data.booking.kyc_status === 'verified' || res.data.booking.kyc_status === 'pending');
        }
      } catch (err) {
        console.error("Error fetching active stay:", err);
        setError("Failed to load your enrolled PG details.");
      } finally {
        setLoading(false);
      }
    };
    fetchActiveStay();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files[0]) setFormData(prev => ({ ...prev, [name]: files[0] }));
  };

  const removeFile = (name) => setFormData(prev => ({ ...prev, [name]: null }));
  const toggleSection = (section) => setOpenSection(prev => prev === section ? "" : section);

  const submitRegistration = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        booking_id: booking.booking_id,
        pg_id: booking.pg_id,
        ...formData
      };
      
      await API.post("/enrollments/submit", payload);
      
      setTimeout(() => {
        setSubmitting(false);
        // Instantly switch UI to 'pending' state
        setBooking(prev => ({ ...prev, kyc_status: 'pending' }));
        setFormSubmitted(true);
        setShowFormModal(false);
        alert("Registration Submitted! It will be verified within 24 hours.");
      }, 1000);
    } catch (err) {
      console.error(err);
      alert("Failed to save details.");
      setSubmitting(false);
    }
  };

  // Base input style for the clean UI
  const inputClass = "mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#93B733] focus:bg-white focus:ring-2 focus:ring-[#93B733]/20 transition-all";
  const labelClass = "text-[11px] font-bold text-gray-500 uppercase tracking-wide";

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5] text-lg font-bold">Loading Dashboard...</div>;

  // Determine status for dynamic banner
  const isVerified = booking?.kyc_status === 'verified';
  const isPending = booking?.kyc_status === 'pending' || (formSubmitted && !isVerified);

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#3A2935] font-sans pb-24 relative">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-[#3A2935]">My Resident Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your stay and keep your records updated.</p>
        </div>

        {!booking ? (
          <div className="flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-gray-300 bg-white p-16 text-center">
            <h2 className="text-2xl font-black text-[#3A2935]">No Active Enrolled PG Found</h2>
            <p className="mt-2 text-sm text-gray-500 max-w-md">You are not currently enrolled in any verified PG stay.</p>
            <Link to="/" className="mt-6 rounded-2xl bg-[#93B733] px-8 py-3.5 text-sm font-bold text-white transition hover:bg-[#82a32d]">Explore Available PGs</Link>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* DYNAMIC REGISTRATION BANNER */}
            <div className={`rounded-[1.5rem] p-6 shadow-sm border-2 flex flex-col md:flex-row items-center justify-between gap-5 transition-all ${
              isVerified ? 'bg-green-50 border-green-100' : 
              isPending ? 'bg-amber-50 border-amber-200' : 
              'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className={`p-3 rounded-xl ${
                  isVerified ? 'bg-green-100 text-green-600' : 
                  isPending ? 'bg-amber-100 text-amber-600' : 
                  'bg-red-100 text-red-600'
                }`}>
                  {isVerified ? <CheckCircle2 size={28} /> : isPending ? <AlertCircle size={28} /> : <ShieldAlert size={28} />}
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${
                    isVerified ? 'text-green-800' : 
                    isPending ? 'text-amber-800' : 
                    'text-red-800'
                  }`}>
                    Tenant Registration Form
                  </h3>
                  <p className={`text-lg font-black ${
                    isVerified ? 'text-green-700' : 
                    isPending ? 'text-amber-700' : 
                    'text-red-700'
                  }`}>
                    {isVerified ? 'Verification Confirmed' : isPending ? 'Verification on process' : 'Action Required'}
                  </p>
                  <p className="text-xs font-medium text-gray-600 mt-0.5">
                    {isVerified 
                      ? 'Hurray, you are verified and you are good to go.' 
                      : isPending 
                      ? 'You will be verified within 24 hours.' 
                      : 'Please fill out your mandatory details to complete onboarding.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowFormModal(true)}
                className={`w-full md:w-auto rounded-xl px-8 py-3.5 text-sm font-bold text-white shadow-md transition ${
                  isVerified ? 'bg-gray-800 hover:bg-black' : 
                  isPending ? 'bg-amber-600 hover:bg-amber-700' : 
                  'bg-[#93B733] hover:bg-[#82a32d] animate-pulse'
                }`}
              >
                {isVerified || isPending ? "View / Update Details" : "Fill this Form"}
              </button>
            </div>

            {/* Existing Dashboard Card */}
            <div className="overflow-hidden rounded-[2rem] border-2 border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="h-32 w-full md:w-48 rounded-xl overflow-hidden bg-gray-100">
                  <img src={booking.profile_image ? `${IMAGE_BASE_URL}/uploads/${booking.profile_image}` : "https://via.placeholder.com/400x300?text=PG"} alt="PG" className="h-full w-full object-cover" />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{booking.selected_room_type || "Standard Room"}</span>
                  <h2 className="text-2xl font-black text-[#3A2935] mt-1">{booking.title}</h2>
                  <p className="text-xs font-medium text-gray-500 mt-1">📍 {booking.address || `${booking.area}, ${booking.city}`}</p>
                  <p className="text-sm font-bold text-[#93B733] mt-3">Monthly Rent: ₹{Number(booking.amount_paid || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================= */}
      {/* CLEAN, BRIGHT KYC FORM MODAL */}
      {/* ========================================= */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm sm:p-6">
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-[2rem] bg-white shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-5 md:px-8">
              <div>
                <h2 className="text-xl font-black text-gray-900">Registration Details</h2>
                <p className="text-xs text-gray-500 mt-1">Provide accurate information for PG verification.</p>
              </div>
              <button onClick={() => setShowFormModal(false)} className="rounded-full bg-white border border-gray-200 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Accordion) */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4 md:p-6">
              <form id="regForm" onSubmit={submitRegistration} className="flex flex-col gap-4">
                
                <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  {/* 1. Basic Details */}
                  <AccordionSection id="basic" title="Personal & Family Details" icon={User} isOpen={openSection === 'basic'} onToggle={toggleSection}>
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className={labelClass}>Date Of Birth <span className="text-red-500">*</span></label><input required type="date" name="dob" value={formData.dob} onChange={handleChange} className={inputClass} /></div>
                        <div><label className={labelClass}>Hometown <span className="text-red-500">*</span></label><input required type="text" name="hometown" value={formData.hometown} onChange={handleChange} placeholder="City, State" className={inputClass} /></div>
                        <div className="sm:col-span-2"><label className={labelClass}>Permanent Home Address <span className="text-red-500">*</span></label><textarea required rows="2" name="homeAddress" value={formData.homeAddress} onChange={handleChange} placeholder="Full permanent address" className={inputClass}></textarea></div>
                        <div><label className={labelClass}>Pincode <span className="text-red-500">*</span></label><input required type="text" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="e.g. 110001" className={inputClass} /></div>
                      </div>
                      
                      <div className="border-t border-gray-100 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className={labelClass}>Mother / Father Name <span className="text-red-500">*</span></label><input required type="text" name="parent1Name" value={formData.parent1Name} onChange={handleChange} placeholder="Full Name" className={inputClass} /></div>
                        <div><label className={labelClass}>Relation</label><input type="text" name="parent1Relation" value={formData.parent1Relation} onChange={handleChange} placeholder="e.g. Father" className={inputClass} /></div>
                        <div className="sm:col-span-2"><label className={labelClass}>Parent Phone Number <span className="text-red-500">*</span></label><input required type="tel" name="parent1Phone" value={formData.parent1Phone} onChange={handleChange} placeholder="+91" className={inputClass} /></div>
                      </div>
                    </div>
                  </AccordionSection>

                  {/* 2. Local Guardian */}
                  <AccordionSection id="guardian" title="Local Guardian (Optional)" icon={ShieldAlert} isOpen={openSection === 'guardian'} onToggle={toggleSection}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2"><label className={labelClass}>Guardian Name</label><input type="text" name="guardianName" value={formData.guardianName} onChange={handleChange} placeholder="Local contact person" className={inputClass} /></div>
                      <div><label className={labelClass}>Relation</label><input type="text" name="guardianRelation" value={formData.guardianRelation} onChange={handleChange} placeholder="e.g. Uncle" className={inputClass} /></div>
                      <div><label className={labelClass}>Guardian Phone</label><input type="tel" name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} placeholder="+91" className={inputClass} /></div>
                    </div>
                  </AccordionSection>

                  {/* 3. Advance Details */}
                  <AccordionSection id="advance" title="Health & Preferences" icon={Activity} isOpen={openSection === 'advance'} onToggle={toggleSection}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className={labelClass}>Food Preference</label><select name="foodPreference" value={formData.foodPreference} onChange={handleChange} className={inputClass}><option value="">Select</option><option value="Veg">Vegetarian</option><option value="Non-Veg">Non-Vegetarian</option></select></div>
                      <div><label className={labelClass}>Blood Group <span className="text-red-500">*</span></label><select required name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className={inputClass}><option value="">Select</option><option value="A+">A+</option><option value="O+">O+</option><option value="B+">B+</option><option value="AB+">AB+</option><option value="A-">A-</option><option value="O-">O-</option><option value="B-">B-</option><option value="AB-">AB-</option></select></div>
                      <div className="sm:col-span-2"><label className={labelClass}>Allergies</label><input type="text" name="allergies" value={formData.allergies} onChange={handleChange} placeholder="Any food or dust allergies?" className={inputClass} /></div>
                      <div className="sm:col-span-2"><label className={labelClass}>Medical Details / Conditions</label><textarea rows="2" name="medicalDetails" value={formData.medicalDetails} onChange={handleChange} placeholder="Any chronic conditions the owner should know about" className={inputClass}></textarea></div>
                    </div>
                  </AccordionSection>

                  {/* 4. Academic / Professional */}
                  <AccordionSection id="academic" title="Academic & Professional" icon={Briefcase} isOpen={openSection === 'academic'} onToggle={toggleSection}>
                    <div className="space-y-4">
                      <div>
                        <label className={labelClass}>Current Status <span className="text-red-500">*</span></label>
                        <select required name="occupation" value={formData.occupation} onChange={handleChange} className={inputClass}>
                          <option value="Student">Student</option>
                          <option value="Working Professional">Working Professional</option>
                          <option value="Freelancer">Freelancer</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Render fields dynamically based on Occupation */}
                      {formData.occupation === "Student" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                          <div className="sm:col-span-2"><label className={labelClass}>College / University Name <span className="text-red-500">*</span></label><input required type="text" name="collegeName" value={formData.collegeName} onChange={handleChange} placeholder="e.g. Amity University" className={inputClass} /></div>
                          <div><label className={labelClass}>Course Name <span className="text-red-500">*</span></label><input required type="text" name="courseName" value={formData.courseName} onChange={handleChange} placeholder="e.g. B.Tech CS" className={inputClass} /></div>
                          <div><label className={labelClass}>Course Year</label><select name="courseYear" value={formData.courseYear} onChange={handleChange} className={inputClass}><option value="">Select</option><option value="1st Year">1st Year</option><option value="2nd Year">2nd Year</option><option value="3rd Year">3rd Year</option><option value="4th Year">4th Year</option></select></div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                          <div className="sm:col-span-2"><label className={labelClass}>Company / Workplace Name <span className="text-red-500">*</span></label><input required type="text" name="workplaceName" value={formData.workplaceName} onChange={handleChange} placeholder="e.g. TCS or Self-Employed" className={inputClass} /></div>
                          <div className="sm:col-span-2"><label className={labelClass}>Designation / Job Title <span className="text-red-500">*</span></label><input required type="text" name="designation" value={formData.designation} onChange={handleChange} placeholder="e.g. Software Engineer" className={inputClass} /></div>
                        </div>
                      )}
                    </div>
                  </AccordionSection>

                  {/* 5. Documents */}
                  <AccordionSection id="documents" title="Identity Documents" icon={FileText} isOpen={openSection === 'documents'} onToggle={toggleSection}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                      <FileUploadBox label="Passport Photo" name="passportPhoto" file={formData.passportPhoto} onChange={handleFileChange} onRemove={removeFile} />
                      <FileUploadBox label="Govt ID (Front)" name="aadharFront" file={formData.aadharFront} onChange={handleFileChange} onRemove={removeFile} />
                      <FileUploadBox label="Govt ID (Back)" name="aadharBack" file={formData.aadharBack} onChange={handleFileChange} onRemove={removeFile} />
                    </div>
                  </AccordionSection>

                  {/* 6. Interests */}
                  <AccordionSection id="interests" title="Interests & Feedback" icon={Flag} isOpen={openSection === 'interests'} onToggle={toggleSection}>
                    <div className="space-y-4">
                      <div><label className={labelClass}>Hobbies / Interests</label><select name="interests" value={formData.interests} onChange={handleChange} className={inputClass}><option value="">Select</option><option value="Sports">Sports</option><option value="Reading">Reading</option><option value="Music">Music</option><option value="Gaming">Gaming</option><option value="Fitness">Fitness</option></select></div>
                      <div><label className={labelClass}>Any Suggestions / Requests</label><textarea rows="3" name="suggestions" value={formData.suggestions} onChange={handleChange} placeholder="Let the owner know if you need anything specific..." className={inputClass}></textarea></div>
                    </div>
                  </AccordionSection>
                </div>

              </form>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-4 border-t border-gray-100 bg-white px-6 py-4 md:px-8 rounded-b-[2rem]">
              <button type="button" onClick={() => setShowFormModal(false)} className="text-sm font-bold text-gray-500 hover:text-gray-800 transition">
                Cancel
              </button>
              <button type="submit" form="regForm" disabled={submitting} className="rounded-xl bg-[#93B733] px-8 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#82a32d] disabled:opacity-50">
                {submitting ? "Saving..." : formSubmitted ? "Update Details" : "Submit Form"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyPgs;