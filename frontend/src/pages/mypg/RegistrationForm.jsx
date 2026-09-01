import { useState, useCallback, useMemo, memo } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, User, Users, HeartPulse, GraduationCap, FileText, Star, X, Save, Camera } from 'lucide-react';

const SECTIONS = [
  { id: 'tenant', label: 'Tenant Details', icon: User },
  { id: 'guardian', label: 'Local Guardian', icon: Users },
  { id: 'advanced', label: 'Advanced Details', icon: HeartPulse },
  { id: 'academics', label: 'Academics', icon: GraduationCap },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'interests', label: 'Interests', icon: Star },
];

const LS_KEY = 'dormn_registration_form';
const load = () => { try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; } };
const persist = (d) => localStorage.setItem(LS_KEY, JSON.stringify(d));

const INPUT_CLS = 'w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-4 py-3 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#93B733]/50 focus:border-[#93B733] transition-all';

/* ─── Reusable Field ─── */
const Field = memo(({ label, type = 'text', value, onChange, placeholder, required, options, rows }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {type === 'select' ? (
      <select value={value || ''} onChange={e => onChange(e.target.value)} className={INPUT_CLS}>
        <option value="">Select...</option>
        {options?.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : type === 'textarea' ? (
      <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows || 3} className={`${INPUT_CLS} resize-none`} />
    ) : (
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={INPUT_CLS} />
    )}
  </div>
));
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
          <Field label="Contact Number" value={d[`parent${n}Contact`]} onChange={v => u(`parent${n}Contact`, v)} placeholder="+91 XXXXX XXXXX" required />
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
    <Field label="College / University Name" value={d.college} onChange={v => u('college', v)} placeholder="e.g. Amity University Noida" required />
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
  const [active, setActive] = useState('tenant');
  const [data, setData] = useState(load);
  const [saved, setSaved] = useState(false);

  const update = useCallback((k, v) => {
    setData(p => { const n = { ...p, [k]: v }; persist(n); return n; });
  }, []);

  const save = useCallback(() => {
    persist(data); setSaved(true); setTimeout(() => setSaved(false), 2500);
  }, [data]);

  const idx = SECTIONS.findIndex(s => s.id === active);
  const sec = SECTIONS[idx];
  const SectionView = SECTION_VIEWS[active];
  const done = useMemo(() => SECTIONS.filter(s => isComplete(s.id, data)).length, [data]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#0D3A1D] dark:text-gray-400 dark:hover:text-white transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-black text-[#0D3A1D] dark:text-white tracking-tight">Registration Form</h2>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Complete all sections to verify your profile • {done}/{SECTIONS.length} completed</p>
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
