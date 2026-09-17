import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Clock, CheckCircle2, AlertCircle, RefreshCw, LogIn,
  Calendar, Ticket, Users, Share2, Sparkles, ExternalLink, Copy, Check
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import SEOHead from '../components/common/SEOHead';
import { isEventCompleted } from '../services/eventAdminService';

const EventInvite = () => {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inviteData, setInviteData] = useState(null);
  const [allMembers, setAllMembers] = useState([]);
  const [accepting, setAccepting] = useState(false);
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    fetchInvite();
  }, [inviteCode]);

  const fetchInvite = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/event-tickets/invite/${inviteCode}`);
      if (res.data?.success) {
        setInviteData(res.data.invite);
        setAllMembers(res.data.allMembers || []);
      } else {
        setError(res.data?.message || 'Invite not found.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invite link is invalid or no longer available.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!user) {
      navigate(`/auth?redirect=/events/invite/${inviteCode}`);
      return;
    }

    setAccepting(true);
    setError(null);
    try {
      const res = await api.post('/event-tickets/accept-invite', {
        inviteCode,
        phone: user.phone || ''
      });

      if (res.data?.success) {
        const updated = res.data.invite;
        setInviteData(updated);
        if (res.data.allMembers) setAllMembers(res.data.allMembers);

        try {
          const tickets = JSON.parse(localStorage.getItem('dormn_event_tickets') || '[]');
          const newTicket = {
            ticketCode: updated.ticket_code,
            eventId: updated.event_id,
            eventTitle: updated.event_title,
            eventNight: updated.event_date || 'Upcoming Event',
            dateTime: updated.event_date || 'Upcoming Date',
            guestName: user.full_name || user.name || 'Member',
            passType: (updated.ticket_type || 'couple').toUpperCase(),
            status: 'ACTIVE',
            image: updated.event_image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
            bookedAt: new Date().toISOString(),
            isCoAttendee: true,
            organizerName: updated.booker_name
          };
          localStorage.setItem('dormn_event_tickets', JSON.stringify([newTicket, ...tickets.filter(t => t.ticketCode !== updated.ticket_code)]));
          window.dispatchEvent(new Event('dormn_tickets_updated'));
        } catch {}

        setAcceptedSuccess(true);
      } else {
        setError(res.data?.message || 'Failed to accept invite.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept invite.');
    } finally {
      setAccepting(false);
    }
  };

  const copyCode = (code) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const isCompleted = isEventCompleted(inviteData?.event_date, inviteData?.status);
  const isBooker = user && inviteData && user.id === inviteData.booker_user_id;
  const isAlreadyAccepted = user && inviteData && inviteData.invitee_user_id === user.id;
  const isAccepted = inviteData?.status === 'accepted' || isAlreadyAccepted || acceptedSuccess;
  const isCouple = inviteData?.ticket_type === 'couple';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#060911] text-gray-900 dark:text-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#93B733] border-t-transparent"></div>
          <p className="mt-4 text-xs font-bold text-gray-400">Verifying ticket pass invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !inviteData) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#060911] text-gray-900 dark:text-white pb-20">
        <Navbar />
        <div className="max-w-md mx-auto mt-16 p-8 rounded-3xl bg-white dark:bg-[#111625] text-center shadow-xl border border-gray-200 dark:border-white/10 space-y-4">
          <AlertCircle className="mx-auto h-12 w-12 text-rose-500" />
          <h2 className="text-lg font-black">Invite Unavailable</h2>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{error}</p>
          <div className="flex gap-2 justify-center pt-2">
            <button onClick={fetchInvite} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold flex items-center gap-1.5 hover:bg-gray-50 dark:hover:bg-white/5">
              <RefreshCw size={13} /> Retry
            </button>
            <Link to="/events" className="px-5 py-2 rounded-xl bg-[#0D3A1D] text-white text-xs font-bold hover:bg-[#144b27]">
              Browse Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#060911] text-gray-900 dark:text-white transition-colors duration-300 pb-24">
      <SEOHead
        title={`${inviteData.event_title} Pass Invitation | Dormn Events`}
        description="Claim your partner or group pass invitation on Dormn."
      />
      <Navbar />

      {/* Header Strip */}
      <div className="bg-[#0D3A1D] text-white pt-8 pb-10 px-4 text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#93B733]/20 px-3.5 py-1 text-xs font-black text-[#93B733] mb-2 border border-[#93B733]/30">
          <Sparkles size={13} />
          <span>{isCompleted ? 'EVENT CONCLUDED' : 'VIP PASS INVITATION'}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
          {isCompleted ? 'Event Completed' : 'Claim Your Ticket Pass'}
        </h2>
        <p className="text-xs sm:text-sm font-semibold text-gray-300 mt-1">
          {isCompleted
            ? 'This event has concluded. All passes are marked as completed.'
            : 'Accept the invitation to join your partner or group at this event.'}
        </p>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-6 relative z-20">
        <div className={`rounded-3xl bg-white dark:bg-[#111625] overflow-hidden shadow-2xl border ${isCompleted ? 'border-zinc-700/50' : 'border-emerald-500/30'}`}>
          {/* Banner Image - Black and white if event is completed */}
          <div className="relative h-56 w-full overflow-hidden bg-black">
            <img
              src={inviteData.event_image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80'}
              alt={inviteData.event_title}
              className={`w-full h-full object-cover ${isCompleted ? 'grayscale contrast-125 opacity-75' : ''}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

            {/* Badges */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              {isCompleted ? (
                <span className="flex items-center gap-1.5 rounded-xl bg-zinc-800 text-zinc-300 border border-white/20 px-3 py-1 text-xs font-black uppercase tracking-wider shadow-lg">
                  <Clock size={13} /> EVENT COMPLETED
                </span>
              ) : isAccepted ? (
                <span className="flex items-center gap-1.5 rounded-xl bg-emerald-500 text-white px-3 py-1 text-xs font-black uppercase tracking-wider shadow-lg">
                  <CheckCircle2 size={13} /> PASS ACCEPTED
                </span>
              ) : (
                <span className="rounded-xl bg-[#93B733] text-[#0D3A1D] px-3 py-1 text-xs font-black uppercase tracking-wider shadow-lg">
                  INVITATION PENDING
                </span>
              )}
              <span className="rounded-xl bg-black/70 backdrop-blur-md px-3 py-1 text-xs font-black text-[#93B733] uppercase tracking-wider border border-white/15">
                {isCouple ? '👫 COUPLE PASS' : `👥 GROUP (${inviteData.group_size} PAX)`}
              </span>
            </div>

            <div className="absolute bottom-4 left-5 right-5">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#93B733] block">
                {inviteData.category || 'EVENT'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {inviteData.event_title}
              </h1>
            </div>
          </div>

          <div className="p-6 sm:p-7 space-y-5">
            {/* Event Time & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
              <div className="flex items-start gap-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 p-3 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-white/5">
                <Calendar size={16} className={isCompleted ? 'text-gray-400' : 'text-[#93B733]'} />
                <div>
                  <p className="text-[10px] uppercase text-gray-400 font-extrabold">Date & Timing</p>
                  <p className="mt-0.5 font-black text-gray-900 dark:text-white">{inviteData.event_date || 'Event Night'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 p-3 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-white/5">
                <MapPin size={16} className="text-purple-500 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase text-gray-400 font-extrabold">Venue</p>
                  <p className="mt-0.5 font-black text-gray-900 dark:text-white truncate">{inviteData.event_location || 'Venue Details'}</p>
                </div>
              </div>
            </div>

            {/* Official Ticket Code Box */}
            <div className={`rounded-2xl border-2 p-3.5 text-center ${isCompleted ? 'border-zinc-700/60 bg-zinc-900/30' : 'border-[#93B733]/40 bg-[#93B733]/10'}`}>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-0.5">
                {isCompleted ? 'Ticket Number (Event Completed)' : 'Official Gate Ticket Number'}
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className={`text-xl sm:text-2xl font-mono font-black tracking-widest ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                  {inviteData.ticket_code}
                </span>
                <button
                  onClick={() => copyCode(inviteData.ticket_code)}
                  className="p-1.5 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-black/20 text-gray-700 dark:text-gray-200 transition"
                  title="Copy Ticket Code"
                >
                  {copiedCode ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                </button>
              </div>
            </div>

            {/* Attendees details */}
            <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Users size={14} className="text-[#93B733]" />
                  <span>{isCouple ? 'Couple Pass Details' : `Group Attendees (${allMembers.length})`}</span>
                </span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${isCompleted ? 'bg-zinc-800 text-zinc-400' : 'bg-emerald-500/10 text-emerald-500'}`}>
                  {isCompleted ? 'Concluded' : 'Confirmed'}
                </span>
              </div>

              <div className="space-y-2 divide-y divide-gray-100 dark:divide-white/5">
                {allMembers.map((m, idx) => (
                  <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        m.isOrganizer ? 'bg-[#0D3A1D] text-[#93B733]' : m.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {m.isOrganizer ? '👑' : m.status === 'accepted' ? '✓' : '⏳'}
                      </div>
                      <div className="truncate">
                        <p className="font-black text-gray-900 dark:text-white truncate">
                          {m.name || 'Invited Guest'}
                          {m.isOrganizer && <span className="ml-1.5 text-[10px] text-[#93B733] font-bold">(Organizer)</span>}
                        </p>
                        <p className="text-[10px] text-gray-400">{m.role || 'Member'}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                      m.status === 'accepted' || m.isOrganizer ? 'text-emerald-500 bg-emerald-500/10' : 'text-amber-500 bg-amber-500/10'
                    }`}>
                      {m.status === 'accepted' || m.isOrganizer ? 'Accepted' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status & CTA section */}
            {isCompleted ? (
              <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-center space-y-3">
                <p className="text-xs font-bold text-gray-600 dark:text-gray-300">
                  {isAccepted
                    ? '🎉 This event has completed. We hope you and your group had a fantastic night!'
                    : '⏳ This event has already completed. Pass invitations automatically close once the event night ends.'}
                </p>
                <div className="flex gap-2.5">
                  <button
                    onClick={() => navigate(`/events?id=${inviteData.event_id}`)}
                    className="flex-1 py-3 rounded-2xl bg-[#0D3A1D] text-white font-black text-xs hover:bg-[#144b27] transition"
                  >
                    View Event Archive
                  </button>
                  <button
                    onClick={() => navigate('/events?view=tickets')}
                    className="flex-1 py-3 rounded-2xl bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white font-black text-xs hover:opacity-90 transition"
                  >
                    My Tickets
                  </button>
                </div>
              </div>
            ) : isAccepted ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => navigate(`/events?id=${inviteData.event_id}`)}
                  className="py-3.5 px-4 rounded-2xl bg-[#0D3A1D] hover:bg-[#144b27] text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <ExternalLink size={14} className="text-[#93B733]" />
                  <span>Open Event Details</span>
                </button>
                <button
                  onClick={() => navigate('/events?view=tickets')}
                  className="py-3.5 px-4 rounded-2xl bg-[#93B733] hover:bg-[#82a32c] text-[#0D3A1D] font-black text-xs flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <Ticket size={14} />
                  <span>View in My Tickets</span>
                </button>
              </div>
            ) : isBooker ? (
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-500/20 text-center space-y-2.5">
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  You are the primary booker for this pass. Share this link with your {isCouple ? 'partner' : 'group members'}!
                </p>
                <button
                  onClick={() => copyCode(window.location.href)}
                  className="w-full py-3 rounded-xl bg-[#0D3A1D] text-white font-black text-xs flex items-center justify-center gap-2 hover:bg-[#144b27] transition"
                >
                  {copiedCode ? <Check size={15} className="text-[#93B733]" /> : <Share2 size={15} />}
                  <span>{copiedCode ? 'Link Copied!' : 'Copy Invite Link'}</span>
                </button>
              </div>
            ) : !user ? (
              <div className="p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-500/30 text-center space-y-3">
                <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                  Sign In Required to Accept Pass
                </h4>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Sign in or create a Dormn account to verify your name at venue gate entry.
                </p>
                <button
                  onClick={() => navigate(`/auth?redirect=/events/invite/${inviteCode}`)}
                  className="w-full py-3.5 rounded-2xl bg-[#0D3A1D] hover:bg-[#144b27] text-white font-black text-xs shadow-lg transition flex items-center justify-center gap-2"
                >
                  <LogIn size={15} className="text-[#93B733]" />
                  <span>Sign In / Register to Accept Pass</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-400">Accepting as:</span>
                  <span className="text-gray-900 dark:text-white font-black">{user.full_name || user.name || user.email}</span>
                </div>

                {error && <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold">{error}</div>}

                <button
                  onClick={handleAcceptInvite}
                  disabled={accepting}
                  className="w-full py-4 rounded-2xl bg-[#0D3A1D] hover:bg-[#144b27] text-white font-black text-sm shadow-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {accepting ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <CheckCircle2 size={17} className="text-[#93B733]" />
                      <span>Accept Pass & Confirm Entry</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="text-center pt-2">
              <Link to="/events" className="text-xs font-black text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
                ← Back to All Events & Clubs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventInvite;
