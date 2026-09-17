import React from "react";
import {
  Ticket,
  ArrowLeft,
  Clock,
  Calendar,
  Users,
  Check,
  Copy,
  Share2,
  ExternalLink,
} from "lucide-react";
import SEOHead from "../common/SEOHead";
import Navbar from "../Navbar";

export default function EventTicketsView({
  tickets,
  isEventCompleted,
  copyTicketCode,
  copiedCode,
  setActiveInviteModal,
  onBack,
  onSelectEvent,
  renderInviteModal,
  renderMacOSDock,
}) {
  return (
    <div className="min-h-screen events-page-wrapper bg-[#FAF9FD] dark:bg-[#06080F] text-gray-900 dark:text-white selection:bg-pink-500 selection:text-white relative overflow-x-hidden">
      {/* Dynamic Ambient Background Glows */}
      <div className="pointer-events-none fixed -left-32 -top-32 h-96 w-96 rounded-full bg-purple-300/25 dark:bg-purple-600/20 blur-[120px] z-0"></div>
      <div className="pointer-events-none fixed -right-32 top-1/3 h-96 w-96 rounded-full bg-pink-300/25 dark:bg-pink-600/20 blur-[120px] z-0"></div>
      <div className="pointer-events-none fixed bottom-0 left-1/3 h-96 w-96 rounded-full bg-amber-300/15 dark:bg-amber-500/10 blur-[120px] z-0"></div>

      <SEOHead
        title="My Tickets | Dormn Events & Nightlife"
        description="View and manage all your active club and concert passes."
      />
      <Navbar />

      {/* Electric Party Hero Banner */}
      <div className="events-hero-bg relative overflow-hidden bg-gradient-to-r from-purple-50 via-pink-50/70 to-indigo-50/60 dark:from-purple-950/90 dark:via-[#120D26] dark:to-[#0A0718] border-b border-purple-200/70 dark:border-purple-500/20 text-gray-900 dark:text-white pt-6 pb-8 sm:pt-8 sm:pb-10 px-4 sm:px-6 lg:px-12 z-10">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300 hover:text-purple-950 dark:hover:text-white mb-4 transition cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Experiences</span>
          </button>

          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-2xl bg-pink-100 dark:bg-pink-500/20 border border-pink-200 dark:border-pink-500/30 flex items-center justify-center text-pink-600 dark:text-pink-400 shadow-sm">
              <Ticket size={22} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-950 via-pink-900 to-indigo-950 dark:from-white dark:via-pink-100 dark:to-purple-300">
              My VIP Tickets & Passes
            </h1>
          </div>
          <p className="text-xs sm:text-sm font-medium text-purple-800/80 dark:text-purple-200/80">
            All your active passes, guestlists, and ticket archives in one place
          </p>
        </div>

        {/* Ambient shapes */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-purple-500/15 dark:bg-purple-500/20 blur-3xl pointer-events-none"></div>
      </div>

      {/* Tickets Grid Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 mt-6 sm:mt-8 pb-20 relative z-10">
        {tickets.length === 0 ? (
          <div className="events-card-bg bg-white dark:bg-[#0D0B1C]/90 border border-purple-200 dark:border-purple-500/25 rounded-3xl p-12 text-center shadow-xl backdrop-blur-xl">
            <Ticket className="mx-auto text-pink-500 dark:text-pink-400/80 mb-4" size={48} />
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
              No Active Passes Found
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Explore the latest club nights, concerts, and party fests to reserve your spot!
            </p>
            <button
              onClick={onBack}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-sm transition shadow-lg shadow-pink-600/30 cursor-pointer"
            >
              Browse Parties & Events
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {tickets.map((t, idx) => {
              const completed = isEventCompleted(t);
              return (
                <div
                  key={t.ticketCode || idx}
                  className={`events-card-bg bg-white dark:bg-[#0D0B1C]/90 border rounded-[16px] overflow-hidden shadow-md hover:shadow-2xl transition-[transform,box-shadow] duration-200 flex flex-col backdrop-blur-md ${
                    completed
                      ? "border-gray-200 dark:border-zinc-800 opacity-85"
                      : "border-purple-200/90 dark:border-purple-500/30 hover:border-purple-400 dark:hover:border-pink-500/50"
                  }`}
                >
                  {/* Top Thumbnail Image */}
                  <div className="relative h-44 w-full bg-black overflow-hidden">
                    <img
                      src={t.image}
                      alt={t.eventTitle}
                      className={`w-full h-full object-cover transition-all duration-300 ${
                        completed ? "grayscale contrast-125 opacity-70" : ""
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    {completed ? (
                      <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-md bg-zinc-900/90 text-zinc-300 border border-white/20 text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <Clock size={11} /> EVENT COMPLETED
                      </span>
                    ) : (
                      <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-md bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-pink-500/30">
                        VIP ACTIVE
                      </span>
                    )}
                  </div>

                  {/* Ticket Details Body */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base sm:text-[17px] font-black text-gray-900 dark:text-white leading-tight capitalize">
                        {t.eventTitle}
                      </h3>
                      <p className="text-xs font-semibold text-purple-700 dark:text-purple-300/80 mt-0.5 capitalize">
                        {t.eventNight}
                      </p>

                      <div className="flex items-center gap-3 text-xs font-bold text-gray-700 dark:text-gray-300 mt-3.5">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-pink-600 dark:text-pink-400" />
                          <span>{t.dateTime}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2.5 text-xs font-bold text-gray-800 dark:text-gray-200 flex-wrap">
                        <Users size={14} className="text-purple-600 dark:text-purple-400 shrink-0" />
                        <span>{t.guestName}</span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 text-[10px] font-black uppercase">
                          {t.passType}
                        </span>
                      </div>
                    </div>

                    {/* Centered Ticket Code Box */}
                    <div className="mt-4 pt-3 border-t border-purple-100 dark:border-purple-500/20 space-y-2.5">
                      <div
                        className={`events-upcoming-box rounded-xl border p-3 text-center relative group ${
                          completed
                            ? "bg-gray-100 dark:bg-zinc-900/50 border-gray-200 dark:border-zinc-800"
                            : "bg-purple-50/80 dark:bg-black/60 border-purple-200 dark:border-purple-500/30"
                        }`}
                      >
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-purple-700/80 dark:text-purple-300/70 block mb-1">
                          {completed ? "TICKET ARCHIVE" : "TICKET CODE"}
                        </span>
                        <div
                          className={`text-base sm:text-[17px] font-black tracking-wider font-mono flex items-center justify-center gap-2 ${
                            completed
                              ? "text-gray-400 dark:text-gray-500 line-through"
                              : "text-purple-900 dark:text-pink-300"
                          }`}
                        >
                          <span>{t.ticketCode}</span>
                          <button
                            onClick={() => copyTicketCode(t.ticketCode)}
                            className="text-gray-400 hover:text-purple-700 dark:hover:text-pink-400 transition cursor-pointer"
                            title="Copy code"
                          >
                            {copiedCode === t.ticketCode ? (
                              <Check size={15} className="text-emerald-500" />
                            ) : (
                              <Copy size={15} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Partner / Group Invite Sharing on Ticket Card */}
                      {(t.passType === "COUPLE" || t.passType === "GROUP") &&
                        (completed ? (
                          <div className="w-full py-2 px-3 rounded-xl bg-gray-100 dark:bg-zinc-900/60 text-gray-500 dark:text-zinc-500 text-[11px] font-black uppercase tracking-wider text-center border border-gray-200 dark:border-zinc-800">
                            Event Completed · Passes Closed
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (t.invites && t.invites.length > 0) {
                                setActiveInviteModal({
                                  ticket: t,
                                  invites: t.invites,
                                  ticketType: t.passType.toLowerCase(),
                                });
                              } else {
                                const code = `INV-${
                                  t.passType === "COUPLE" ? "CPL" : "GRP"
                                }-${(t.ticketCode || "PASS").split("-").pop()}`;
                                setActiveInviteModal({
                                  ticket: t,
                                  invites: [
                                    {
                                      inviteCode: code,
                                      inviteLink: `/events/invite/${code}`,
                                      slotNumber: 1,
                                      status: "pending",
                                      slotLabel:
                                        t.passType === "COUPLE"
                                          ? "Partner Pass Link"
                                          : "Group Pass Link",
                                    },
                                  ],
                                  ticketType: t.passType.toLowerCase(),
                                });
                              }
                            }}
                            className="w-full py-2.5 px-3 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-500/20 dark:hover:bg-purple-500/30 text-purple-900 dark:text-pink-300 text-xs font-black flex items-center justify-center gap-1.5 border border-purple-300/70 dark:border-purple-500/30 transition cursor-pointer shadow-xs"
                          >
                            <Share2 size={13} />
                            <span>
                              {t.passType === "COUPLE"
                                ? "Invite Partner / Share Link"
                                : "Invite Group Members"}
                            </span>
                          </button>
                        ))}

                      {/* View Event Details Button */}
                      <button
                        type="button"
                        onClick={() => onSelectEvent(t.eventId)}
                        className="w-full py-2 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white border border-gray-200 dark:border-white/10 text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <ExternalLink size={13} className="text-pink-500 dark:text-pink-400" />
                        <span>View Experience Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {renderInviteModal && renderInviteModal()}
      {renderMacOSDock && renderMacOSDock()}
    </div>
  );
}
