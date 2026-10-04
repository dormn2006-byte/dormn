import { useContext } from "react";
import { Navigate } from "react-router-dom";
import {
  Mic, MicOff, Video, VideoOff, SkipForward, Phone,
  Loader2, User,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import useDormgle from "../hooks/useDormgle";
import Navbar from "../components/Navbar";

const Dormgle = () => {
  const { user, token } = useContext(AuthContext);

  // Only logged-in users can use Dormgle
  if (!token || !user) {
    return <Navigate to="/auth?redirect=/dormgle" replace />;
  }

  const {
    status,
    partner,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    error,
    localVideoRef,
    remoteVideoRef,
    startSearching,
    skipPartner,
    endSession,
    toggleMute,
    toggleCamera,
    retry,
  } = useDormgle();

  // ── Idle / Landing / Error screen ─────────────────────────────
  if (status === "idle" || status === "error") {
    return (
      <div className="h-screen flex flex-col bg-[#FAF9F5] dark:bg-[#070A11] text-[#0D3A1D] dark:text-white overflow-hidden">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md text-center">
            <div className="mb-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#93B733]/20 text-[#93B733]">
                <Video size={32} />
              </div>
              <h1 className="mt-4 text-[2.2rem] font-black text-[#0D3A1D] dark:text-white">
                Dormgle
              </h1>
              <p className="mt-2 text-base font-medium text-gray-600 dark:text-gray-400">
                Random video chat with Dormn residents
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-bold text-red-600">
                {error}
              </div>
            )}

            <button
              onClick={status === "error" ? retry : startSearching}
              className="w-full rounded-2xl border-2 border-[#0D3A1D] bg-[#0D3A1D] px-8 py-4 text-center text-base font-black text-white shadow-[4px_4px_0px_#93B733] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#93B733]"
            >
              {status === "error" ? "Try Again" : "Start Searching"}
            </button>

            <p className="mt-4 text-xs font-medium text-gray-500 dark:text-gray-400">
              Account required • Matched with a random Dormn user
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ── Searching / Connecting / Connected ────────────────────────
  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
      <Navbar />

      <main className="relative flex-1 flex items-center justify-center p-4">
        {/* Remote video / placeholder */}
        <div className="relative h-full w-full max-w-5xl rounded-2xl overflow-hidden bg-gray-900">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="text-center">
                {partner ? (
                  <>
                    <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-700">
                      {partner.avatar ? (
                        <img
                          src={partner.avatar}
                          alt={partner.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <User size={48} className="text-gray-400" />
                      )}
                    </div>
                    <p className="text-lg font-semibold">{partner.name}</p>
                  </>
                ) : (
                  <>
                    <User size={48} className="mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-400">Waiting for a stranger…</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Local video (picture-in-picture) — shown when camera is on */}
          {!isCameraOff && localStream && (
            <div className="absolute bottom-4 right-4 h-28 w-20 overflow-hidden rounded-xl border-2 border-white/30 shadow-lg">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover scale-x-[-1]"
              />
            </div>
          )}

          {/* Status overlay */}
          {status === "searching" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="text-center">
                <Loader2 size={36} className="mx-auto animate-spin text-[#93B733]" />
                <p className="mt-3 text-lg font-semibold">Looking for someone…</p>
              </div>
            </div>
          )}

          {status === "connecting" && partner && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="text-center">
                <Loader2 size={36} className="mx-auto animate-spin text-[#93B733]" />
                <p className="mt-3 text-lg font-semibold">
                  Connecting with {partner.name}…
                </p>
              </div>
            </div>
          )}

          {status === "connected" && (
            <div className="absolute top-4 left-4 rounded-lg bg-black/40 px-3 py-1.5 text-sm font-medium">
              Connected with {partner?.name || "stranger"}
            </div>
          )}
        </div>
      </main>

      {/* Bottom control bar */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 bg-[#0D3A1D] p-4">
        <button
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
          className={`flex h-12 w-12 items-center justify-center rounded-full text-lg transition-colors ${
            isMuted
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-white/20 text-white hover:bg-white/30"
          }`}
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        <button
          onClick={toggleCamera}
          aria-label={isCameraOff ? "Turn on camera" : "Turn off camera"}
          className={`flex h-12 w-12 items-center justify-center rounded-full text-lg transition-colors ${
            isCameraOff
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-white/20 text-white hover:bg-white/30"
          }`}
        >
          {isCameraOff ? <VideoOff size={22} /> : <Video size={22} />}
        </button>

        <button
          onClick={skipPartner}
          aria-label="Skip to next person"
          disabled={status !== "connected" && status !== "connecting"}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-black shadow transition-colors hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <SkipForward size={24} />
        </button>

        <button
          onClick={endSession}
          aria-label="End session"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-all hover:scale-105 hover:bg-red-700"
        >
          <Phone size={26} />
        </button>
      </div>
    </div>
  );
};

export default Dormgle;
