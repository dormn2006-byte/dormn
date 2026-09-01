import { useContext, memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, User, Mail, Phone, Shield, FileText,
  HelpCircle, LogOut, ChevronRight, CheckCircle, ExternalLink
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

export default function MyAccount({ onBack }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
      navigate('/auth');
    }
  };

  const POLICY_LINKS = [
    {
      title: 'Terms & Conditions',
      desc: 'Platform usage rules and resident agreement',
      icon: FileText,
      path: '/terms',
    },
    {
      title: 'Privacy Policy',
      desc: 'How your personal data and documents are protected',
      icon: Shield,
      path: '/privacy',
    },
    {
      title: 'Cancellation & Refund Policy',
      desc: 'Booking cancellation, notice period, and deposit refunds',
      icon: HelpCircle,
      path: '/terms#cancellation',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#0D3A1D] dark:text-gray-400 dark:hover:text-white transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-black text-[#0D3A1D] dark:text-white tracking-tight">
          My Account
        </h2>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
          Manage your account credentials, security, and view platform policies
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Details Card */}
        <div className="rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 sm:p-8">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-white/5">
            <div className="w-16 h-16 rounded-2xl bg-[#93B733]/15 text-[#93B733] flex items-center justify-center text-2xl font-black shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight truncate">
                  {user?.name || user?.full_name || 'Resident'}
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#93B733]/15 text-[#0D3A1D] dark:text-[#93B733]">
                  <CheckCircle className="w-3 h-3" /> Verified
                </span>
              </div>
              <p className="text-xs font-semibold text-gray-400 mt-0.5 capitalize">
                Role: {user?.role || 'Resident Student'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/70 dark:bg-white/[0.02] p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-1.5">
                <User className="w-3.5 h-3.5 text-[#93B733]" /> Full Name
              </span>
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {user?.name || user?.full_name || 'Not provided'}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/70 dark:bg-white/[0.02] p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-1.5">
                <Mail className="w-3.5 h-3.5 text-[#93B733]" /> Email Address
              </span>
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {user?.email || 'Not provided'}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/70 dark:bg-white/[0.02] p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-1.5">
                <Phone className="w-3.5 h-3.5 text-[#93B733]" /> Mobile Number
              </span>
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {user?.phone || user?.mobile || 'Not provided'}
              </p>
            </div>
          </div>
        </div>

        {/* Legal & Policies Section */}
        <div className="rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 sm:p-8">
          <h3 className="text-lg font-black text-[#0D3A1D] dark:text-white tracking-tight mb-4">
            Legal & Platform Policies
          </h3>
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {POLICY_LINKS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Link
                  key={idx}
                  to={item.path}
                  className="group flex items-center justify-between py-4 hover:px-2 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/[0.05] group-hover:bg-[#93B733]/15 text-gray-600 dark:text-gray-400 group-hover:text-[#93B733] flex items-center justify-center shrink-0 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-[#93B733] transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Logout Action Card */}
        <div className="rounded-3xl border border-red-500/20 bg-red-500/[0.03] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-black text-red-600 dark:text-red-400">
              Account Session
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Securely sign out of your resident portal session across this device
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
