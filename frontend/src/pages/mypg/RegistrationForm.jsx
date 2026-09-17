import { useState, useCallback, useMemo, useEffect, useContext, memo } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, User, Users, HeartPulse, GraduationCap, FileText, Star, X, Save, Camera, Lock, Globe } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import CustomSelect from '../../components/ui/CustomSelect';
import CollegeCombobox from '../../components/ui/CollegeCombobox';

const SECTIONS = [
  { id: 'tenant', label: 'Tenant Details', icon: User },
  { id: 'guardian', label: 'Local Guardian', icon: Users },
  { id: 'advanced', label: 'Advanced Details', icon: HeartPulse },
  { id: 'academics', label: 'Academics', icon: GraduationCap },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'interests', label: 'Interests', icon: Star },
];

const cleanPhone = (val) => {
  if (!val) return "";
  const cleaned = String(val).replace(/\D/g, "");
  if (cleaned.length > 10 && (cleaned.startsWith("91") || cleaned.startsWith("0"))) {
    return cleaned.slice(-10);
  }
  return cleaned.slice(0, 10);
};

const INPUT_CLS = 'w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-4 py-3 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#93B733]/50 focus:border-[#93B733] transition-all';

/* ─── Reusable Field ─── */
const Field = memo(({ label, type = 'text', value, onChange, placeholder, required, options, rows }) => {
  const isPhone = type === 'phone' || type === 'tel';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        {isPhone && value && (
          <span className={`text-[10px] font-bold ${value.length === 10 ? 'text-emerald-500' : 'text-amber-500'}`}>
            {value.length}/10 digits
          </span>
        )}
      </div>
      {type === 'select' ? (
        <CustomSelect options={options || []} value={value || ''} onChange={onChange} placeholder={placeholder || 'Select...'} />
      ) : type === 'college' ? (
        <CollegeCombobox value={value || ''} onChange={onChange} placeholder={placeholder || 'Search or type college...'} />
      ) : type === 'textarea' ? (
        <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows || 3} className={`${INPUT_CLS} resize-none`} />
      ) : isPhone ? (
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 select-none pointer-events-none">+91</span>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={value || ''}
            onChange={e => onChange(cleanPhone(e.target.value))}
            placeholder={placeholder || "XXXXXXXXXX"}
            className={`${INPUT_CLS} pl-12`}
          />
        </div>
      ) : (
        <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={INPUT_CLS} />
      )}
    </div>
  );
});
Field.displayName = 'Field';

/* ─── Image Upload ─── */
const ImgUp = memo(({ label, value, onChange, required }) => {
  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onloadend = () => onChange(r.result);
    r.readAsDataURL(f);
  };
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {value ? (
        <div className="relative group w-36 h-36 rounded-xl overflow-hidden border-2 border-[#93B733]/30">
          <img src={value} alt={label} className="w-full h-full object-cover" />
          <button onClick={() => onChange(null)} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-36 h-36 rounded-xl border-2 border-dashed border-gray-300 dark:border-white/15 bg-gray-50 dark:bg-white/[0.03] cursor-pointer hover:border-[#93B733]/50 transition-colors">
          <Camera className="w-6 h-6 text-gray-400 mb-1" />
          <span className="text-[10px] font-bold text-gray-400 uppercase">Upload</span>
          <input type="file" accept="image/*" onChange={onFile} className="hidden" />
        </label>
      )}
    </div>
  );
});
ImgUp.displayName = 'ImgUp';

/* ─── Completeness Check ─── */
const isComplete = (id, d) => {
  const checks = {
    tenant: ['fullName', 'dob', 'homeAddress', 'homeTown', 'pincode'],
    guardian: ['parent1Name', 'parent1Contact', 'parent2Name', 'parent2Contact'],
    advanced: ['bloodGroup', 'allergies', 'medicalDetails'],
    academics: ['college', 'admissionYear', 'collegeIdNumber', 'courseName', 'courseYear'],
    documents: ['passportPhoto', 'aadharFront', 'aadharBack'],
    interests: ['interests', 'suggestions'],
  };
  return (checks[id] || []).every(k => !!d[k]);
};

/* ─── Section Forms ─── */
const Tenant = ({ d, u }) => (
  <div className="space-y-5">
    <Field label="Full Name" value={d.fullName} onChange={v => u('fullName', v)} placeholder="Enter your full name" required />
    <Field label="Date of Birth" type="date" value={d.dob} onChange={v => u('dob', v)} required />
    <Field label="Home Address" type="textarea" value={d.homeAddress} onChange={v => u('homeAddress', v)} placeholder="Enter your permanent home address" required rows={2} />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Home Town" value={d.homeTown} onChange={v => u('homeTown', v)} placeholder="e.g. Hyderabad" required />
      <Field label="Pincode" value={d.pincode} onChange={v => u('pincode', v)} placeholder="e.g. 500001" required />
    </div>
  </div>
);

const Guardian = ({ d, u }) => (
  <div className="space-y-6">
    {[1, 2].map(n => (
      <div key={n} className={n === 2 ? 'border-t border-gray-100 dark:border-white/5 pt-6' : ''}>
        <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#93B733]/15 text-[#93B733] flex items-center justify-center text-xs font-black">{n}</span>
          Parent / Guardian {n}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name" value={d[`parent${n}Name`]} onChange={v => u(`parent${n}Name`, v)} placeholder="Parent / Guardian name" required />
          <Field label="Contact Number" type="phone" value={d[`parent${n}Contact`]} onChange={v => u(`parent${n}Contact`, v)} placeholder="XXXXXXXXXX" required />
        </div>
      </div>
    ))}
  </div>
);

const Advanced = ({ d, u }) => (
  <div className="space-y-5">
    <Field label="Blood Group" type="select" value={d.bloodGroup} onChange={v => u('bloodGroup', v)} required options={['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']} />
    <Field label="Allergies" type="textarea" value={d.allergies} onChange={v => u('allergies', v)} placeholder="List any known allergies (e.g. dust, peanuts, medications)" required rows={2} />
    <Field label="Other Medical Details" type="textarea" value={d.medicalDetails} onChange={v => u('medicalDetails', v)} placeholder="Any chronic conditions, ongoing medications, or medical notes" required rows={3} />
  </div>
);

const Academics = ({ d, u }) => (
  <div className="space-y-5">
    <Field label="College / University Name" type="college" value={d.college} onChange={v => u('college', v)} placeholder="Search or type college name" required />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Admission Year" value={d.admissionYear} onChange={v => u('admissionYear', v)} placeholder="e.g. 2024" required />
      <Field label="College ID Number" value={d.collegeIdNumber} onChange={v => u('collegeIdNumber', v)} placeholder="e.g. A12345678" required />
    </div>
    <ImgUp label="College ID Card Image" value={d.collegeIdImage} onChange={v => u('collegeIdImage', v)} />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Course Name" value={d.courseName} onChange={v => u('courseName', v)} placeholder="e.g. B.Tech Computer Science" required />
      <Field label="Course Year" type="select" value={d.courseYear} onChange={v => u('courseYear', v)} required options={['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'PG 1st Year', 'PG 2nd Year']} />
    </div>
  </div>
);

const Documents = ({ d, u }) => (
  <div className="space-y-6">
    <ImgUp label="Passport Size Photo" value={d.passportPhoto} onChange={v => u('passportPhoto', v)} required />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <ImgUp label="Aadhaar Card (Front)" value={d.aadharFront} onChange={v => u('aadharFront', v)} required />
      <ImgUp label="Aadhaar Card (Back)" value={d.aadharBack} onChange={v => u('aadharBack', v)} required />
    </div>
  </div>
);

const Interests = ({ d, u }) => (
  <div className="space-y-5">
    <Field label="Your Interests / Hobbies" type="textarea" value={d.interests} onChange={v => u('interests', v)} placeholder="e.g. Cricket, Music, Coding, Gym, Photography..." required rows={3} />
    <Field label="Any Suggestions for the PG" type="textarea" value={d.suggestions} onChange={v => u('suggestions', v)} placeholder="Share any ideas to improve your stay experience..." required rows={3} />
  </div>
);

const SECTION_VIEWS = { tenant: Tenant, guardian: Guardian, advanced: Advanced, academics: Academics, documents: Documents, interests: Interests };

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export default function RegistrationForm({ onBack }) {
  const { user } = useContext(AuthContext);
  const userKey = user?.id ? `u_${user.id}` : user?.email ? `e_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}` : null;
  const regKey = userKey ? `dormn_registration_form_${userKey}` : null;
  const profKey = userKey ? `dormn_student_profile_${userKey}` : null;

  const [active, setActive] = useState('tenant');
  const [data, setData] = useState(() => {
    try {
      const saved = regKey ? JSON.parse(localStorage.getItem(regKey) || '{}') : {};
      const profSaved = profKey ? JSON.parse(localStorage.getItem(profKey) || '{}') : {};
      return {
        fullName: user?.full_name || user?.name || '',
        ...profSaved,
        ...saved,
      };
    } catch {
      return { fullName: user?.full_name || user?.name || '' };
    }
  });
  const [saved, setSaved] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  // Auto-fetch profile from database on mount to auto-populate registration form
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const { data: res } = await api.get('/student/profile');
        if (res.success && res.profile) {
          const prof = res.profile;
          setIsPublic(prof.isPublic ?? true);
          setData(prev => {
            const merged = {
              ...prev,
              fullName: prof.name || prof.fullName || user?.full_name || prev.fullName || '',
              dob: prof.dob !== undefined ? prof.dob : (prev.dob || ''),
              homeAddress: prof.homeAddress !== undefined ? prof.homeAddress : (prev.homeAddress || ''),
              homeTown: prof.homeTown !== undefined ? prof.homeTown : (prev.homeTown || ''),
              pincode: prof.pincode !== undefined ? prof.pincode : (prev.pincode || ''),
              parent1Name: prof.parent1Name !== undefined ? prof.parent1Name : (prev.parent1Name || ''),
              parent1Contact: prof.parent1Phone !== undefined ? prof.parent1Phone : (prev.parent1Contact || ''),
              parent2Name: prof.parent2Name !== undefined ? prof.parent2Name : (prev.parent2Name || ''),
              parent2Contact: prof.parent2Phone !== undefined ? prof.parent2Phone : (prev.parent2Contact || ''),
              guardianName: prof.guardianName !== undefined ? prof.guardianName : (prev.guardianName || ''),
              guardianPhone: prof.guardianPhone !== undefined ? prof.guardianPhone : (prev.guardianPhone || ''),
              bloodGroup: prof.bloodGroup !== undefined ? prof.bloodGroup : (prev.bloodGroup || ''),
              allergies: prof.allergies !== undefined ? prof.allergies : (prev.allergies || ''),
              medicalDetails: prof.medicalDetails !== undefined ? prof.medicalDetails : (prev.medicalDetails || ''),
              college: prof.college !== undefined ? prof.college : (prev.college || ''),
              admissionYear: prof.admissionYear !== undefined ? prof.admissionYear : (prev.admissionYear || ''),
              collegeIdNumber: prof.collegeIdNumber !== undefined ? prof.collegeIdNumber : (prev.collegeIdNumber || ''),
              courseName: prof.courseName !== undefined ? prof.courseName : (prev.courseName || ''),
              courseYear: prof.courseYear !== undefined ? prof.courseYear : (prev.courseYear || ''),
              passportPhoto: prof.passportPhoto || prev.passportPhoto || null,
              aadharFront: prof.aadharFront || prev.aadharFront || null,
              aadharBack: prof.aadharBack || prev.aadharBack || null,
              collegeIdImage: prof.collegeIdImage || prev.collegeIdImage || null,
              interests: prof.interests !== undefined ? (Array.isArray(prof.interests) ? prof.interests.join(', ') : prof.interests) : (prev.interests || ''),
              suggestions: prof.suggestions !== undefined ? prof.suggestions : (prev.suggestions || ''),
            };
            if (regKey) {
              try { localStorage.setItem(regKey, JSON.stringify(merged)); } catch {}
            }
            return merged;
          });
        }
      } catch (err) {
        console.error("Auto-fetch registration profile error:", err);
      }
    };

    fetchProfileData();
  }, [user, regKey]);

  const update = useCallback((k, v) => {
    setData(p => {
      const n = { ...p, [k]: v };
      if (regKey) {
        try { localStorage.setItem(regKey, JSON.stringify(n)); } catch {}
      }
      if (profKey) {
        try { localStorage.setItem(profKey, JSON.stringify(n)); } catch {}
      }
      return n;
    });
  }, [regKey, profKey]);

  const save = useCallback(async () => {
    try {
      if (regKey) {
        try { localStorage.setItem(regKey, JSON.stringify(data)); } catch {}
      }
      if (profKey) {
        try { localStorage.setItem(profKey, JSON.stringify({ ...data, isPublic })); } catch {}
      }
      localStorage.removeItem('dormn_registration_form');
      localStorage.removeItem('dormn_student_profile');
      window.dispatchEvent(new Event('dormn_profile_updated'));
      setSaved(true);

      // Two-way sync to backend student profile
      await api.post('/student/profile', {
        name: data.fullName,
        fullName: data.fullName,
        dob: data.dob,
        homeAddress: data.homeAddress,
        homeTown: data.homeTown,
        pincode: data.pincode,
        parent1Name: data.parent1Name,
        parent1Phone: data.parent1Contact,
        parent2Name: data.parent2Name,
        parent2Phone: data.parent2Contact,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
        bloodGroup: data.bloodGroup,
        allergies: data.allergies,
        medicalDetails: data.medicalDetails,
        college: data.college,
        collegeName: data.college,
        admissionYear: data.admissionYear,
        collegeIdNumber: data.collegeIdNumber,
        courseName: data.courseName,
        courseYear: data.courseYear,
        passportPhoto: data.passportPhoto,
        aadharFront: data.aadharFront,
        aadharBack: data.aadharBack,
        collegeIdImage: data.collegeIdImage,
        interests: data.interests,
        suggestions: data.suggestions,
        isPublic: isPublic,
      }).catch(err => console.error("Profile sync error:", err));

      window.dispatchEvent(new Event('dormn_profile_updated'));
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error(e);
    }
  }, [data, isPublic]);

  const idx = SECTIONS.findIndex(s => s.id === active);
  const sec = SECTIONS[idx];
  const SectionView = SECTION_VIEWS[active];
  const done = useMemo(() => SECTIONS.filter(s => isComplete(s.id, data)).length, [data]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200/80 dark:border-white/10">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 hover:text-[#0D3A1D] dark:hover:text-[#93B733] transition shadow-xs cursor-pointer active:scale-95"
        >
          <ArrowLeft size={16} /> <span>Back to My PG</span>
        </button>
        <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">KYC & Registration</span>
      </div>

      {/* Header & Privacy Status */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0D3A1D] dark:text-white tracking-tight">Registration Form</h2>
          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
            Auto-synced with your profile • {done}/{SECTIONS.length} completed
          </p>
        </div>

        {/* Privacy Pill */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const next = !isPublic;
              setIsPublic(next);
              api.post('/student/profile', { isPublic: next }).catch(() => {});
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all border ${
              isPublic
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
            }`}
          >
            {isPublic ? (
              <>
                <Globe className="w-4 h-4 text-blue-500" />
                <span>Profile: Public</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-amber-500" />
                <span>Profile: Private</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ─── LEFT SIDEBAR (sticky, bigger) ─── */}
        <div className="lg:w-72 shrink-0">
          <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4 lg:sticky lg:top-24">
            <div className="space-y-1.5">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const filled = isComplete(s.id, data);
                const on = active === s.id;
                return (
                  <button key={s.id} onClick={() => setActive(s.id)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-left transition-all duration-200 ${on ? 'bg-[#93B733]/10 dark:bg-[#93B733]/15' : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'}`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${on ? 'bg-[#93B733]/20 text-[#93B733]' : 'bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-gray-500'}`}>
                      <Icon className="w-[18px] h-[18px]" strokeWidth={2.2} />
                    </div>
                    <span className={`text-[15px] font-bold flex-1 truncate ${on ? 'text-[#0D3A1D] dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{s.label}</span>
                    {filled
                      ? <CheckCircle2 className="w-5.5 h-5.5 text-[#93B733] shrink-0" strokeWidth={2.5} />
                      : <Circle className="w-5.5 h-5.5 text-gray-300 dark:text-gray-600 shrink-0" strokeWidth={2} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── RIGHT CONTENT (centered) ─── */}
        <div className="flex-1 flex justify-center min-w-0">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 sm:p-8 lg:p-10">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100 dark:border-white/5">
              <div className="w-10 h-10 rounded-xl bg-[#93B733]/10 dark:bg-[#93B733]/15 flex items-center justify-center text-[#93B733]">
                <sec.icon className="w-5 h-5" strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-[#0D3A1D] dark:text-white tracking-tight">{sec.label}</h3>
                <p className="text-xs font-medium text-gray-400">Step {idx + 1} of {SECTIONS.length}</p>
              </div>
              {isComplete(active, data) && (
                <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#93B733]/10 text-[#93B733] text-[10px] font-black uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3" /> Complete
                </span>
              )}
            </div>

            {/* Fields */}
            {SectionView && <SectionView d={data} u={update} />}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100 dark:border-white/5">
              <button onClick={() => idx > 0 && setActive(SECTIONS[idx - 1].id)} disabled={idx === 0}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
              <div className="flex items-center gap-3">
                <button onClick={save} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-[#93B733] border border-[#93B733]/30 hover:bg-[#93B733]/10 transition-all">
                  <Save className="w-4 h-4" /> {saved ? 'Saved!' : 'Save'}
                </button>
                {idx === SECTIONS.length - 1 ? (
                  <button onClick={save} className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#93B733] hover:bg-[#82a32d] shadow-md hover:shadow-lg transition-all active:scale-[0.98]">
                    <CheckCircle2 className="w-4 h-4" /> Submit
                  </button>
                ) : (
                  <button onClick={() => setActive(SECTIONS[idx + 1].id)} className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#93B733] hover:bg-[#82a32d] shadow-md hover:shadow-lg transition-all active:scale-[0.98]">
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
