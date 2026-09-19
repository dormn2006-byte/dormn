import React, { useState, useEffect, useContext, memo, useRef, useMemo } from 'react';
import {
  ArrowLeft, Lock, User, Mail, Phone, MapPin, ShieldCheck,
  Loader2, AlertCircle, Pencil, Users, CreditCard
} from 'lucide-react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AADHAR_RE = /^[2-9]\d{11}$/;

const digitsOnly = (v) => String(v || '').replace(/\D/g, '');
const clean10 = (v) => digitsOnly(v).slice(-10);
const formatAadhar = (v) => digitsOnly(v).slice(0, 12).replace(/(\d{4})(?=\d)/g, '$1 ');

const INPUT_CLS =
  'w-full rounded-xl border bg-gray-50/60 dark:bg-[#111] px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#0D3A1D] dark:text-gray-100 outline-none transition-all placeholder:text-gray-400 placeholder:font-normal';
const OK_BORDER = 'border-gray-200 dark:border-gray-800 focus:border-[#93B733] focus:bg-white';
const BAD_BORDER = 'border-rose-300 dark:border-rose-500/50 bg-rose-50/40 focus:border-rose-400';

/**
 * Mandatory tenant details captured immediately before payment.
 * Every field is required; the Continue button stays disabled until all are valid.
 */
const PaymentKycForm = memo(({ onDone, onBack, mode = 'payment', bookingId = null }) => {
  const { user } = useContext(AuthContext);
  const isReapply = mode === 'reapply';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dueBooking, setDueBooking] = useState(null);
  const [serverError, setServerError] = useState(null);
  const [touched, setTouched] = useState({});
  const [locked, setLocked] = useState({ name: false, email: false, phone: false });
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    guardianName: '', guardianEmail: '', guardianPhone: '',
    currentAddress: '', aadharNumber: '',
  });

  // Held in a ref so a new callback identity from the parent can't re-trigger loading.
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  // Load once on mount.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [profRes, bookRes] = await Promise.all([
          api.get('/student/profile').catch(() => ({ data: {} })),
          api.get('/bookings/my-bookings').catch(() => ({ data: { bookings: [] } })),
        ]);

        if (cancelled) return;

        const p = profRes.data?.profile || {};
        const raw = bookRes.data?.bookings || bookRes.data;
        const list = Array.isArray(raw) ? raw : [];

        const name = p.name || user?.full_name || user?.name || '';
        const email = p.email || user?.email || '';
        const phone = clean10(p.phone || user?.phone || '');

        setForm({
          name,
          email,
          phone,
          guardianName: p.guardianName || '',
          guardianEmail: p.guardianEmail || '',
          guardianPhone: clean10(p.guardianPhone || ''),
          currentAddress: p.homeAddress || '',
          aadharNumber: digitsOnly(p.aadharNumber).slice(0, 12),
        });

        // Lock only what we already hold — anything missing stays editable.
        setLocked({
          name: Boolean(name.trim()),
          email: Boolean(email.trim()),
          phone: phone.length === 10,
        });

        // Re-applying after a rejection: there is no unpaid booking to find, so
        // bind to the booking the rejected submission belongs to.
        if (isReapply) {
          setDueBooking(bookingId ? { id: bookingId } : null);
          return;
        }

        // Nothing left to pay → no payment to gate, go straight through.
        const due = list.find((b) => b.status === 'approved' && b.payment_status !== 'paid');
        if (!due) {
          onDoneRef.current?.();
          return;
        }
        setDueBooking(due);
      } catch {
        if (!cancelled) setServerError('Failed to load your details. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const up = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const errors = useMemo(() => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!EMAIL_RE.test(form.email.trim())) e.email = 'Enter a valid email address.';
    if (form.phone.length !== 10) e.phone = 'Enter a valid 10-digit mobile number.';
    if (!form.guardianName.trim()) e.guardianName = 'Guardian name is required.';
    if (!EMAIL_RE.test(form.guardianEmail.trim())) e.guardianEmail = 'Enter a valid guardian email address.';
    if (form.guardianPhone.length !== 10) e.guardianPhone = 'Enter a valid 10-digit guardian mobile number.';
    if (!form.currentAddress.trim()) e.currentAddress = 'Current address is required.';
    if (!AADHAR_RE.test(form.aadharNumber)) e.aadharNumber = 'Enter a valid 12-digit Aadhar number.';
    return e;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({
      name: true, email: true, phone: true, guardianName: true, guardianEmail: true,
      guardianPhone: true, currentAddress: true, aadharNumber: true,
    });

    if (!isValid || saving) return;

    setSaving(true);
    setServerError(null);
    try {
      await api.post('/student/payment-kyc', {
        booking_id: dueBooking?.id || dueBooking?.booking_id,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone,
        guardianName: form.guardianName.trim(),
        guardianEmail: form.guardianEmail.trim(),
        guardianPhone: form.guardianPhone,
        currentAddress: form.currentAddress.trim(),
        aadharNumber: form.aadharNumber,
      });
      onDone();
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Failed to save your details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="w-8 h-8 border-4 border-[#93B733] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-xs">Loading your details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-2 pb-3 border-b border-gray-200/80 dark:border-white/10">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 hover:text-[#0D3A1D] dark:hover:text-[#93B733] transition shadow-xs cursor-pointer active:scale-95"
        >
          <ArrowLeft size={16} /> <span>Back to My PG</span>
        </button>
        <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">Payment Portal</span>
      </div>

      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#0D3A1D] dark:text-white tracking-tight">
          {isReapply ? 'Update Your Details' : 'Tenant Details'}
        </h2>
        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
          {isReapply
            ? 'Correct the details below and re-submit for your owner to review. You do not need to pay again.'
            : 'Please confirm your details before proceeding to payment.'}
        </p>
      </div>

      <div className={`flex items-start gap-3 rounded-2xl border p-4 ${isReapply ? 'border-rose-300/50 bg-rose-50 dark:bg-rose-500/10' : 'border-[#93B733]/30 bg-[#93B733]/10'}`}>
        <ShieldCheck className={`w-5 h-5 shrink-0 mt-0.5 ${isReapply ? 'text-rose-500' : 'text-[#93B733]'}`} />
        <p className={`text-[11px] sm:text-xs font-medium leading-relaxed ${isReapply ? 'text-rose-700 dark:text-rose-400' : 'text-[#4E700F] dark:text-[#93B733]'}`}>
          All fields are mandatory. Your Aadhar number is stored securely and only shared with your PG owner in masked form.
          {dueBooking?.title || dueBooking?.pg_name ? ` For: ${dueBooking.title || dueBooking.pg_name}.` : ''}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">

        {/* Locked-from-profile section */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <User size={14} className="text-[#93B733]" /> Your Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Full Name" icon={<User size={13} />}
              value={form.name} onChange={(v) => up('name', v)}
              error={errors.name} touched={touched.name} locked={locked.name}
              placeholder="Full legal name"
              onTouch={() => setTouched((t) => ({ ...t, name: true }))}
            />
            <Field
              label="Email" icon={<Mail size={13} />} type="email"
              value={form.email} onChange={(v) => up('email', v)}
              error={errors.email} touched={touched.email} locked={locked.email}
              placeholder="you@example.com"
              onTouch={() => setTouched((t) => ({ ...t, email: true }))}
            />
            <Field
              label="Mobile Number" icon={<Phone size={13} />} type="tel"
              value={form.phone} onChange={(v) => up('phone', clean10(v))}
              error={errors.phone} touched={touched.phone} locked={locked.phone}
              placeholder="10-digit mobile number" maxLength={10}
              onTouch={() => setTouched((t) => ({ ...t, phone: true }))}
            />
          </div>

          {!locked.phone && (
            <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <AlertCircle size={12} /> We don&apos;t have your mobile number yet — please enter it.
            </p>
          )}
        </div>

        {/* Guardian */}
        <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-white/5">
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-2 pt-4">
            <Users size={14} className="text-blue-500" /> Guardian Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Guardian Name" icon={<User size={13} />}
              value={form.guardianName} onChange={(v) => up('guardianName', v)}
              error={errors.guardianName} touched={touched.guardianName}
              placeholder="Parent / guardian name"
              onTouch={() => setTouched((t) => ({ ...t, guardianName: true }))}
            />
            <Field
              label="Guardian Email" icon={<Mail size={13} />} type="email"
              value={form.guardianEmail} onChange={(v) => up('guardianEmail', v)}
              error={errors.guardianEmail} touched={touched.guardianEmail}
              placeholder="guardian@example.com"
              onTouch={() => setTouched((t) => ({ ...t, guardianEmail: true }))}
            />
            <Field
              label="Guardian Mobile Number" icon={<Phone size={13} />} type="tel"
              value={form.guardianPhone} onChange={(v) => up('guardianPhone', clean10(v))}
              error={errors.guardianPhone} touched={touched.guardianPhone}
              placeholder="10-digit mobile number" maxLength={10}
              onTouch={() => setTouched((t) => ({ ...t, guardianPhone: true }))}
            />
          </div>
        </div>

        {/* Address & identity */}
        <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-white/5">
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-2 pt-4">
            <MapPin size={14} className="text-rose-500" /> Address & Identity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Current Address" icon={<MapPin size={13} />} textarea
              value={form.currentAddress} onChange={(v) => up('currentAddress', v)}
              error={errors.currentAddress} touched={touched.currentAddress}
              placeholder="Your current residential address"
              span="sm:col-span-2"
              onTouch={() => setTouched((t) => ({ ...t, currentAddress: true }))}
            />
            <Field
              label="Aadhar Number" icon={<CreditCard size={13} />}
              value={formatAadhar(form.aadharNumber)}
              onChange={(v) => up('aadharNumber', digitsOnly(v).slice(0, 12))}
              error={errors.aadharNumber} touched={touched.aadharNumber}
              placeholder="XXXX XXXX XXXX" maxLength={14}
              onTouch={() => setTouched((t) => ({ ...t, aadharNumber: true }))}
            />
          </div>
        </div>

        {serverError && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-3.5">
            <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">{serverError}</p>
          </div>
        )}

        <div className="pt-2 border-t border-gray-100 dark:border-white/5">
          <button
            type="submit"
            disabled={!isValid || saving}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#93B733] hover:bg-[#82a32d] active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {saving ? (
              <><Loader2 size={16} className="animate-spin" /> Saving details...</>
            ) : isReapply ? (
              <><ShieldCheck size={16} /> Re-submit for Review</>
            ) : (
              <><CreditCard size={16} /> Continue to Payment</>
            )}
          </button>
          {!isValid && (
            <p className="text-center text-[11px] font-medium text-gray-400 mt-2.5">
              Please complete all mandatory fields to continue.
            </p>
          )}
        </div>
      </form>
    </div>
  );
});

PaymentKycForm.displayName = 'PaymentKycForm';

const Field = ({
  label, icon, value, onChange, error, touched, locked,
  placeholder, type = 'text', maxLength, span = '', textarea = false, onTouch,
}) => {
  const invalid = touched && Boolean(error);

  const inputCls = `${INPUT_CLS} ${invalid ? BAD_BORDER : OK_BORDER} ${locked ? 'pr-10 cursor-not-allowed opacity-90' : ''}`;

  return (
    <div className={span}>
      <label className="mb-1 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-400">
        {icon} {label} <span className="text-rose-500">*</span>
        {locked && (
          <span className="ml-auto inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 dark:text-emerald-400 normal-case">
            <Lock size={10} /> From profile
          </span>
        )}
      </label>

      <div className="relative">
        {textarea ? (
          <textarea
            rows={2}
            value={value}
            readOnly={locked}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onTouch}
            placeholder={placeholder}
            className={`${inputCls} resize-none`}
          />
        ) : (
          <input
            type={type}
            value={value}
            readOnly={locked}
            maxLength={maxLength}
            inputMode={type === 'tel' ? 'numeric' : undefined}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onTouch}
            placeholder={placeholder}
            className={inputCls}
          />
        )}
        {locked && !textarea && (
          <Lock size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500" />
        )}
        {locked && textarea && (
          <Lock size={13} className="absolute right-3.5 top-3 text-emerald-500" />
        )}
      </div>

      {!locked && (
        <div className="mt-1 flex items-start gap-1">
          {invalid ? (
            <p className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
              <AlertCircle size={10} /> {error}
            </p>
          ) : (
            <p className="text-[10px] font-medium text-gray-400 inline-flex items-center gap-1">
              <Pencil size={9} /> Editable — you can update this
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentKycForm;
