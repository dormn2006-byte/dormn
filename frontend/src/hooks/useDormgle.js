import { useState, useRef, useCallback, useEffect } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../services/api";

// Public Google STUN servers for NAT traversal (no TURN fallback for now)
const STUN_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

const SIGNAL_TIMEOUT_MS = 15000;

const getSocketToken = () => {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
};

/**
 * Custom hook that encapsulates the Dormgle (Omegle-style random video chat)
 * lifecycle: socket.io signaling, RTCPeerConnection management, and media
 * track toggling. All WebRTC signaling is relayed by the server — the actual
 * media stream flows P2P.
 */
export default function useDormgle() {
  // ── State (triggers re-renders) ──────────────────────────────
  const [status, setStatus] = useState("idle"); // idle | searching | connecting | connected | partner-left | error
  const [partner, setPartner] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [error, setError] = useState(null);

  // ── Mutable refs (no re-render needed) ────────────────────────
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const pendingOfferRef = useRef(null);
  const pendingAnswerRef = useRef(null);
  const signalTimeoutRef = useRef(null);
  const isCleaningUpRef = useRef(false);
  const statusRef = useRef("idle");

  // ── Peer connection ──────────────────────────────────────────

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });

    // Relay ICE candidates to the partner via the signaling server
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("dormgle:ice-candidate", event.candidate);
      }
    };

    // Receive remote media track
    pc.ontrack = (event) => {
      const stream = event.streams[0];
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    // Track overall connection state for UI transitions
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected" || pc.connectionState === "completed") {
        if (signalTimeoutRef.current) {
          clearTimeout(signalTimeoutRef.current);
          signalTimeoutRef.current = null;
        }
        setStatus("connected");
        statusRef.current = "connected";
      } else if (
        pc.connectionState === "failed" ||
        pc.connectionState === "disconnected"
      ) {
        if (signalTimeoutRef.current) {
          clearTimeout(signalTimeoutRef.current);
          signalTimeoutRef.current = null;
        }
        setStatus("partner-left");
        statusRef.current = "partner-left";
      }
    };

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Flush any pending ICE candidates
    if (pendingCandidatesRef.current.length > 0) {
      pendingCandidatesRef.current.forEach((candidate) => {
        pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      });
      pendingCandidatesRef.current = [];
    }

    pcRef.current = pc;
    return pc;
  }, []);

  // ── Cleanup helpers ──────────────────────────────────────────

  const cleanupPeerConnection = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    pendingCandidatesRef.current = [];
    pendingOfferRef.current = null;
    pendingAnswerRef.current = null;
    setRemoteStream(null);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  }, []);

  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  }, []);

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const clearSignalTimeout = useCallback(() => {
    if (signalTimeoutRef.current) {
      clearTimeout(signalTimeoutRef.current);
      signalTimeoutRef.current = null;
    }
  }, []);

  const fullCleanup = useCallback(() => {
    isCleaningUpRef.current = true;
    clearSignalTimeout();
    cleanupPeerConnection();
    stopLocalStream();
    disconnectSocket();
    setStatus("idle");
    setPartner(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setError(null);
  }, [cleanupPeerConnection, stopLocalStream, disconnectSocket, clearSignalTimeout]);

  // ── WebRTC offer/answer handlers ─────────────────────────────

  const handleRemoteOffer = useCallback(
    async (offer) => {
      const pc = pcRef.current;
      if (!pc) {
        pendingOfferRef.current = offer;
        return;
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        // Flush pending ICE candidates that arrived before the offer
        if (pendingCandidatesRef.current.length > 0) {
          await Promise.all(
            pendingCandidatesRef.current.map((c) =>
              pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {})
            )
          );
          pendingCandidatesRef.current = [];
        }
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (socketRef.current) {
          socketRef.current.emit("dormgle:answer", answer);
        }
      } catch (err) {
        console.error("[Dormgle] Error handling remote offer:", err);
        setError("Failed to establish connection. Please try again.");
        setStatus("error");
      }
    },
    []
  );

  const handleRemoteAnswer = useCallback(
    async (answer) => {
      const pc = pcRef.current;
      if (!pc) {
        pendingAnswerRef.current = answer;
        return;
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        // Flush pending ICE candidates
        if (pendingCandidatesRef.current.length > 0) {
          await Promise.all(
            pendingCandidatesRef.current.map((c) =>
              pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {})
            )
          );
          pendingCandidatesRef.current = [];
        }
      } catch (err) {
        console.error("[Dormgle] Error setting remote answer:", err);
      }
    },
    []
  );

  const handleIceCandidate = useCallback((candidate) => {
    const pc = pcRef.current;
    if (!pc) {
      pendingCandidatesRef.current.push(candidate);
      return;
    }
    pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
  }, []);

  // ── WebRTC offer/answer ──────────────────────────────────────

  const createAndSendOffer = useCallback(async () => {
    const pc = pcRef.current;
    const socket = socketRef.current;
    if (!pc || !socket) return;

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("dormgle:offer", offer);
    } catch (err) {
      console.error("[Dormgle] Error creating offer:", err);
      setError("Failed to start the call. Please try again.");
      setStatus("error");
    }
  }, []);

  // ── Socket setup ─────────────────────────────────────────────

  const connectSocket = useCallback(() => {
    const token = getSocketToken();
    if (!token) {
      setError("You must be logged in to use Dormgle.");
      setStatus("idle");
      return false;
    }

    if (socketRef.current && socketRef.current.connected) {
      return true;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;
    isCleaningUpRef.current = false;

    socket.on("connect", () => {
      if (isCleaningUpRef.current) return;
      socket.emit("dormgle:join");
    });

    socket.on("dormgle:waiting", () => {
      if (isCleaningUpRef.current) return;
      clearSignalTimeout();
      setStatus("searching");
    });

    socket.on("dormgle:matched", (data) => {
      if (isCleaningUpRef.current) return;

      // Close any existing connection before starting a new one
      cleanupPeerConnection();

      setPartner(data.partner);
      setStatus("connecting");

      // Start the offer/answer exchange
      createPeerConnection();

      if (data.role === "caller") {
        // Create and send the offer
        createAndSendOffer(socketRef.current);
      }
      // For callee: wait for dormgle:offer

      // Set a connection timeout
      signalTimeoutRef.current = setTimeout(() => {
        if (statusRef.current === "connecting") {
          console.warn("[Dormgle] Signaling timeout — retrying");
          socketRef.current?.emit("dormgle:skip");
        }
      }, SIGNAL_TIMEOUT_MS);
    });

    socket.on("dormgle:offer", (offer) => {
      if (isCleaningUpRef.current) return;
      // If the PC isn't ready yet, queue the offer
      if (!pcRef.current) {
        pendingOfferRef.current = offer;
        return;
      }
      handleRemoteOffer(offer);
    });

    socket.on("dormgle:answer", (answer) => {
      if (isCleaningUpRef.current) return;
      if (!pcRef.current) {
        pendingAnswerRef.current = answer;
        return;
      }
      handleRemoteAnswer(answer);
    });

    socket.on("dormgle:ice-candidate", (candidate) => {
      if (isCleaningUpRef.current) return;
      handleIceCandidate(candidate);
    });

    socket.on("dormgle:partner-left", () => {
      if (isCleaningUpRef.current) return;
      clearSignalTimeout();
      cleanupPeerConnection();
      setPartner(null);
      setStatus("searching");
      // Server already requeued us; re-emit join to trigger a fresh match attempt
      socket.emit("dormgle:join");
    });

    socket.on("dormgle:ended", () => {
      if (isCleaningUpRef.current) return;
      fullCleanup();
    });

    socket.on("connect_error", () => {
      if (isCleaningUpRef.current) return;
      setError("Unable to connect to the signaling server.");
      setStatus("error");
    });

    // Flush any pending answer that arrived before PC was created
    if (pendingAnswerRef.current && pcRef.current) {
      handleRemoteAnswer(pendingAnswerRef.current);
      pendingAnswerRef.current = null;
    }

    return true;
  }, [createPeerConnection, cleanupPeerConnection, handleRemoteOffer, handleRemoteAnswer, handleIceCandidate, clearSignalTimeout, fullCleanup, createAndSendOffer]);

  // ── Public actions ───────────────────────────────────────────

  const startSearching = useCallback(async () => {
    const token = getSocketToken();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!token || !user) {
      setError("You must be logged in to use Dormgle.");
      setStatus("idle");
      return;
    }

    // Browser compatibility check
    if (!window.RTCPeerConnection || !navigator.mediaDevices) {
      setError("Your browser does not support WebRTC. Please use a modern browser.");
      setStatus("error");
      return;
    }

    setError(null);
    isCleaningUpRef.current = false;
    setStatus("searching");

    // Get local media
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("[Dormgle] getUserMedia error:", err);
      setError("Camera access is required. Please allow camera/microphone permissions and try again.");
      setStatus("error");
      return;
    }

    // Connect to signaling server
    if (connectSocket()) {
      // If socket is already connected, dormgle:join is emitted on "connect"
      const sock = socketRef.current;
      if (sock && sock.connected) {
        sock.emit("dormgle:join");
      }
    }
  }, [connectSocket]);

  const skipPartner = useCallback(() => {
    if (isCleaningUpRef.current) return;
    const socket = socketRef.current;
    if (socket) {
      socket.emit("dormgle:skip");
    }
    clearSignalTimeout();
    cleanupPeerConnection();
    setPartner(null);
    setStatus("searching");
  }, [clearSignalTimeout, cleanupPeerConnection]);

  const endSession = useCallback(() => {
    isCleaningUpRef.current = true;
    const socket = socketRef.current;
    if (socket) {
      socket.emit("dormgle:end");
    }
    clearSignalTimeout();
    cleanupPeerConnection();
    stopLocalStream();
    disconnectSocket();
    setStatus("idle");
    setPartner(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setError(null);
  }, [clearSignalTimeout, cleanupPeerConnection, stopLocalStream, disconnectSocket]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length > 0) {
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!audioTracks[0].enabled);
    }
  }, []);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length > 0) {
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff(!videoTracks[0].enabled);
    }
  }, []);

  const retry = useCallback(() => {
    fullCleanup();
    startSearching();
  }, [fullCleanup, startSearching]);

  // ── Lifecycle ────────────────────────────────────────────────

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      fullCleanup();
    };
  }, [fullCleanup]);

  // Flush pending offer/answer when PC becomes available
  useEffect(() => {
    if (pcRef.current) {
      if (pendingOfferRef.current) {
        const offer = pendingOfferRef.current;
        pendingOfferRef.current = null;
        handleRemoteOffer(offer);
      }
      if (pendingAnswerRef.current) {
        const answer = pendingAnswerRef.current;
        pendingAnswerRef.current = null;
        handleRemoteAnswer(answer);
      }
    }
  }, [handleRemoteOffer, handleRemoteAnswer]);

  // Keep statusRef in sync so the signaling timeout closure always sees the
  // latest state (useCallback doesn't re-create connectSocket on every status change)
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Attach remote stream to the video element. This effect runs AFTER React
  // renders the <video> element (which only mounts when remoteStream is set),
  // fixing the race where ontrack fires before the ref is attached.
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Attach local stream to the local preview element (same race fix)
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  return {
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
  };
}
