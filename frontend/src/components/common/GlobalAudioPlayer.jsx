import { useContext } from "react";
import { Music, Pause, Play, SkipForward, X } from "lucide-react";
import { AudioContext } from "../../context/audioContextValue";

const GlobalAudioPlayer = () => {
  const audioContext = useContext(AudioContext);

  if (!audioContext || audioContext.playlist.length === 0) return null;

  const {
    currentTrackIndex,
    isPlaying,
    isOpen,
    togglePlay,
    nextTrack,
    toggleOpen,
    playlist,
    setIsOpen,
  } = audioContext;

  const trackName = decodeURIComponent(
    playlist[currentTrackIndex]?.split("/").pop().replace(".mp3", "").replace(/_/g, " ") || ""
  );

  return (
    <>
      {/* Desktop Floating Player (hidden on phone/mobile, visible on lg screens) */}
      <div className="hidden lg:flex fixed bottom-6 right-6 z-50 items-center gap-3">
        {isOpen && (
          <div className="flex animate-[fadeIn_0.2s_ease-out_forwards] items-center gap-3 rounded-full border border-gray-200 dark:border-white/10 bg-white/95 dark:bg-[#141414]/95 backdrop-blur-xl p-2 shadow-xl">
            <div className="px-3 flex flex-col justify-center max-w-[200px]">
              <p className="truncate text-xs font-bold text-[#0D3A1D] dark:text-white">
                {trackName}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                Playing {currentTrackIndex + 1} of {playlist.length}
              </p>
            </div>
            <button
              onClick={togglePlay}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#93B733]/10 text-[#93B733] hover:bg-[#93B733] hover:text-white transition-colors cursor-pointer"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
            </button>
            <button
              onClick={nextTrack}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 dark:bg-white/10 text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/20 transition-colors cursor-pointer"
              title="Next Track"
            >
              <SkipForward size={14} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer mr-1"
              title="Close panel"
            >
              <X size={12} />
            </button>
          </div>
        )}

        <button
          onClick={() => {
            if (!isPlaying) {
              togglePlay();
              setIsOpen(true);
            } else {
              togglePlay();
            }
          }}
          aria-label={isPlaying ? "Pause background music" : "Play background music"}
          className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-300 cursor-pointer ${
            isPlaying
              ? "bg-[#93B733] text-white shadow-[#93B733]/40 hover:scale-105"
              : "bg-white dark:bg-[#121212] text-[#93B733] border-2 border-[#93B733]/20 hover:border-[#93B733] hover:scale-105"
          }`}
          title={isPlaying ? "Pause Background Music" : "Play Background Music"}
        >
          <Music size={20} className={isPlaying ? "animate-spin-slow" : ""} />
        </button>
      </div>

      <style>{`@keyframes spin-slow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}.animate-spin-slow{animation:spin-slow 4s linear infinite}`}</style>
    </>
  );
};

export default GlobalAudioPlayer;
