import { useState, useRef, useEffect, useCallback } from "react";
import { playlist } from "../data/playlist";
import { AudioContext } from "./audioContextValue";

export const AudioProvider = ({ children }) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const audioRef = useRef(null);
  const isFirstMount = useRef(true);

  // Play / Pause toggle without state race condition
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn("Audio playback prevented:", err);
            setIsPlaying(false);
          });
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  // Next Track
  const nextTrack = useCallback(() => {
    setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
  }, []);

  // Previous Track
  const prevTrack = useCallback(() => {
    setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
  }, []);

  // When track index changes, reload and resume playback if active
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;

    audio.src = playlist[currentTrackIndex];
    audio.load();
    if (isPlaying) {
      const p = audio.play();
      if (p !== undefined) {
        p.catch((e) => console.warn("Track switch playback prevented:", e));
      }
    }
  }, [currentTrackIndex]);

  const toggleOpen = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <AudioContext.Provider
      value={{
        currentTrackIndex,
        isPlaying,
        isOpen,
        setIsOpen,
        audioRef,
        togglePlay,
        nextTrack,
        prevTrack,
        toggleOpen,
        playlist,
        setIsPlaying,
      }}
    >
      {/* Persistent Audio Element mounted directly with the provider so it is never delayed by lazy loading */}
      <audio
        ref={audioRef}
        src={playlist[currentTrackIndex]}
        preload="metadata"
        onEnded={nextTrack}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={(e) => {
          console.warn("Audio element error:", e);
          setIsPlaying(false);
        }}
      />
      {children}
    </AudioContext.Provider>
  );
};
