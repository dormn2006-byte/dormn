import { useContext } from "react";
import { Music, Pause, Play, SkipForward } from "lucide-react";
import { AudioContext } from "../../context/audioContextValue";

const GlobalAudioPlayer = () => {
  const audioContext = useContext(AudioContext);

  if (!audioContext || audioContext.playlist.length === 0) return null;

  const {
    currentTrackIndex,
    isPlaying,
    isOpen,
    audioRef,
    togglePlay,
    nextTrack,
    toggleOpen,
    playlist,
    setIsPlaying
  } = audioContext;

  return (
    <>
      {/* Persistent Audio Element */}
      <audio
        ref={audioRef}
        src={playlist[currentTrackIndex]}
        preload="none"
        onEnded={nextTrack}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Desktop Floating Player (hidden on phone/mobile, visible on lg screens) */}
      <div className="hidden lg:flex fixed bottom-6 right-6 z-50 items-center gap-3">
        {isOpen && (
          <div className="flex animate-[fadeIn_0.2s_ease-out_forwards] items-center gap-3 rounded-full border border-gray-200 bg-white p-2 shadow-lg">
            <div className="px-3 flex flex-col justify-center max-w-[200px]">
              <p className="truncate text-xs font-bold text-[#0D3A1D]">
                {playlist[currentTrackIndex].split("/").pop().replace(".mp3", "")}
              </p>
              <p className="text-[10px] text-gray-500">Playing {currentTrackIndex + 1} of {playlist.length}</p>
            </div>
            <button
              onClick={togglePlay}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#93B733]/10 text-[#93B733] hover:bg-[#93B733] hover:text-white transition-colors"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
            </button>
            <button
              onClick={nextTrack}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
              title="Next Track"
            >
              <SkipForward size={14} />
            </button>
          </div>
        )}

        <button
          onClick={toggleOpen}
          aria-label={isOpen ? "Close music player" : "Open music player"}
          className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-300 ${
            isPlaying
              ? "bg-[#93B733] text-white shadow-[#93B733]/40 hover:scale-105"
              : "bg-white text-[#93B733] border-2 border-[#93B733]/20 hover:border-[#93B733] hover:scale-105"
          }`}
          title="Background Music"
        >
          <Music size={20} className={isPlaying ? "animate-spin-slow" : ""} />
        </button>
      </div>

      <style>{`@keyframes spin-slow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}.animate-spin-slow{animation:spin-slow 4s linear infinite}`}</style>
    </>
  );
};

export default GlobalAudioPlayer;
