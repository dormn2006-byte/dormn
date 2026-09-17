import React from "react";
import { X, Check, Copy } from "lucide-react";

export default function EventInviteModal({
  activeInviteModal,
  onClose,
  copiedInviteUrl,
  setCopiedInviteUrl,
  onViewTickets,
}) {
  if (!activeInviteModal) return null;
  const isCouple = activeInviteModal.ticketType === "couple";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md">
      <div className="events-card-bg relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#0D0B1C] border border-purple-200 dark:border-purple-500/30 p-6 sm:p-7 shadow-2xl text-gray-900 dark:text-white space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-pink-500/25 shrink-0">
              {isCouple ? "👫" : "👥"}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white truncate">
                {isCouple ? "Invite Your Partner" : "Invite Group Members"}
              </h3>
              <p className="text-xs font-semibold text-purple-700 dark:text-purple-300/80">
                Pass: <span className="font-mono text-pink-600 dark:text-pink-400 font-bold">{activeInviteModal.ticket?.ticketCode}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Description */}
        <div className="events-upcoming-box p-4 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-500/30 text-xs font-bold text-purple-900 dark:text-purple-200 leading-relaxed">
          {isCouple
            ? "Share this invite link with your partner. When they open it and sign in to Dormn, their pass is instantly confirmed with verified gate entry!"
            : `Share with your ${(activeInviteModal.ticket?.groupSize || 4) - 1} group members! Each friend signs in to claim their pass.`}
        </div>

        {/* Links list */}
        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
          {activeInviteModal.invites.map((inv, idx) => {
            const fullUrl = `${window.location.origin}${inv.inviteLink}`;
            const isCopied = copiedInviteUrl === fullUrl;
            return (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-gray-50 dark:bg-black/50 border border-purple-100 dark:border-purple-500/20 space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="text-purple-900 dark:text-purple-200">
                    {inv.slotLabel || (isCouple ? "Partner Pass Link" : `Member ${idx + 2} Pass Link`)}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-500/30">
                    Pending
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={fullUrl}
                    className="events-input-bg flex-1 px-3 py-2 text-xs font-mono rounded-xl bg-white dark:bg-white/5 border border-purple-200 dark:border-white/10 text-gray-800 dark:text-gray-200 select-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(fullUrl);
                      setCopiedInviteUrl(fullUrl);
                      setTimeout(() => setCopiedInviteUrl(null), 2000);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-black flex items-center gap-1.5 hover:opacity-90 transition shrink-0 cursor-pointer shadow-md shadow-pink-500/20"
                  >
                    {isCopied ? <Check size={14} className="text-pink-200" /> : <Copy size={14} />}
                    <span>{isCopied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* WhatsApp Share */}
        {activeInviteModal.invites.length > 0 && (
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `Hey! I've booked our ${
                isCouple ? "Couple Pass" : "Group Pass"
              } for ${activeInviteModal.ticket?.eventTitle}! 🎉\n\nClaim and accept your ticket pass here:\n${
                window.location.origin
              }${activeInviteModal.invites[0].inviteLink}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
          >
            <span>Share on WhatsApp</span>
          </a>
        )}

        {/* Close CTA */}
        <button
          type="button"
          onClick={() => {
            onClose();
            if (onViewTickets) onViewTickets();
          }}
          className="w-full py-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-white font-black text-xs transition cursor-pointer border border-gray-200 dark:border-white/10"
        >
          Done & View in My Tickets →
        </button>
      </div>
    </div>
  );
}
