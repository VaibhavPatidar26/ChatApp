import { useEffect, useRef, useState, useContext } from "react";
import { PhoneOff, Phone, Video, VideoOff, Mic, MicOff, AlertCircle } from "lucide-react";
import { AppContext } from "../Context/AppContext";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
  ],
};

export const VideoChat = ({
  socketRef,
  onClose,
  incomingCallData,
  setIncomingCallData,
  contacts = [],
}) => {
  const { receiverId, receiverName } = useContext(AppContext);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pc = useRef(null);
  const localStream = useRef(null);
  const queuedCandidates = useRef([]);

  const [isReady, setIsReady] = useState(false);
  const [callState, setCallState] = useState(incomingCallData ? "incoming" : "idle"); // idle | calling | in-call | incoming
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Determine who we are calling or being called by
  const activePeerId = incomingCallData?.from || receiverId;
  const callerContact = contacts?.find(
    (c) => String(c._id) === String(incomingCallData?.from)
  );
  const activePeerName =
    callerContact?.Name ||
    (incomingCallData?.from ? "Incoming caller" : receiverName) ||
    "User";

  // Watch incomingCallData prop
  useEffect(() => {
    if (incomingCallData) {
      setCallState("incoming");
    }
  }, [incomingCallData]);

  // Clean up media and peer connection
  const cleanupCall = () => {
    queuedCandidates.current = [];
    if (pc.current) {
      try {
        pc.current.close();
      } catch (e) {
        console.error("Error closing peer connection:", e);
      }
      pc.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (localStream.current) {
      try {
        localStream.current.getTracks().forEach((t) => t.stop());
      } catch (e) {
        console.error("Error stopping tracks:", e);
      }
      localStream.current = null;
    }
    setIsReady(false);
    setCallState("idle");
  };

  const send = (payload) => {
    const ws = socketRef?.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  };

  // Safe camera + mic acquisition
  useEffect(() => {
    let isCancelled = false;

    const requestMedia = async () => {
      // Check if mediaDevices API is supported (requires secure context HTTPS / localhost)
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        const isSecure = typeof window !== "undefined" && window.isSecureContext;
        const msg = !isSecure
          ? "Camera/mic access requires a secure context (HTTPS or http://localhost). Running over HTTP on local network IP disables media devices in modern browsers."
          : "Camera and microphone are not supported in this browser environment.";
        setErrorMessage(msg);
        return;
      }

      try {
        // Try requesting both video and audio
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStream.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setIsReady(true);
        setErrorMessage("");
      } catch (primaryErr) {
        console.warn("Full video+audio access failed, trying audio-only:", primaryErr);
        // Fallback to audio only if webcam is missing or denied
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });

          if (isCancelled) {
            audioStream.getTracks().forEach((t) => t.stop());
            return;
          }

          localStream.current = audioStream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = audioStream;
          }
          setIsReady(true);
          setIsVideoOff(true);
          setErrorMessage("Camera unavailable. Operating in audio-only mode.");
        } catch (audioErr) {
          console.error("Audio access also denied:", audioErr);
          if (!isCancelled) {
            setErrorMessage(
              audioErr?.name === "NotAllowedError"
                ? "Permission to access camera/mic was denied in browser settings."
                : audioErr?.message || "Unable to access media devices."
            );
          }
        }
      }
    };

    requestMedia();

    return () => {
      isCancelled = true;
      cleanupCall();
    };
  }, []);

  const drainCandidateQueue = async () => {
    if (!pc.current || !pc.current.remoteDescription) return;
    while (queuedCandidates.current.length > 0) {
      const candidate = queuedCandidates.current.shift();
      try {
        await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("Error adding queued ICE candidate:", err);
      }
    }
  };

  // Listen for signaling messages (accept-Call, ice-candidate, Reject-Call)
  useEffect(() => {
    if (!socketRef?.current) return;
    const ws = socketRef.current;

    const handleMessage = async (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      switch (data.type) {
        case "accept-Call":
          if (pc.current && data.answer) {
            try {
              await pc.current.setRemoteDescription(
                new RTCSessionDescription(data.answer)
              );
              setCallState("in-call");
              await drainCandidateQueue();
            } catch (err) {
              console.error("Error setting remote description on accept:", err);
            }
          }
          break;

        case "Reject-Call":
          cleanupCall();
          setIncomingCallData?.(null);
          onClose?.();
          break;

        case "ice-candidate":
          if (data.candidate) {
            if (
              pc.current &&
              pc.current.remoteDescription &&
              pc.current.remoteDescription.type
            ) {
              try {
                await pc.current.addIceCandidate(new RTCIceCandidate(data.candidate));
              } catch (err) {
                console.error("Error adding ice candidate:", err);
              }
            } else {
              queuedCandidates.current.push(data.candidate);
            }
          }
          break;

        default:
          break;
      }
    };

    ws.addEventListener("message", handleMessage);
    return () => ws.removeEventListener("message", handleMessage);
  }, [socketRef, onClose, setIncomingCallData]);

  const createPeerConnection = () => {
    if (pc.current) return pc.current;

    const newPc = new RTCPeerConnection(ICE_SERVERS);
    pc.current = newPc;

    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => {
        try {
          newPc.addTrack(track, localStream.current);
        } catch (e) {
          console.error("Error adding track:", e);
        }
      });
    }

    newPc.ontrack = (event) => {
      console.log("Remote stream received:", event.streams);
      if (remoteVideoRef.current && event.streams?.[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        remoteVideoRef.current.play().catch((err) => {
          console.warn("Mobile autoplay restriction, interaction needed:", err);
        });
      }
    };

    newPc.onicecandidate = (event) => {
      if (event.candidate && activePeerId) {
        send({
          type: "ice-candidate",
          candidate: event.candidate,
          to: activePeerId,
        });
      }
    };

    newPc.onconnectionstatechange = () => {
      console.log("WebRTC ConnectionState:", newPc.connectionState);
      if (newPc.connectionState === "connected") {
        setCallState("in-call");
      } else if (newPc.connectionState === "failed") {
        setErrorMessage("Peer connection failed. Check if both devices are on compatible networks.");
      }
    };

    return newPc;
  };

  // Initiator: start the call
  const startCall = async () => {
    if (!activePeerId) {
      setErrorMessage("Please select a user to call.");
      return;
    }
    setCallState("calling");
    createPeerConnection();

    try {
      const offer = await pc.current.createOffer();
      await pc.current.setLocalDescription(offer);
      send({ type: "offer", offer, to: activePeerId });
    } catch (err) {
      console.error("Failed to create offer:", err);
      setErrorMessage(err?.message || "Failed to initiate call");
      setCallState("idle");
    }
  };

  // Receiver: accept incoming call
  const acceptCall = async () => {
    if (!incomingCallData?.offer) return;
    createPeerConnection();

    try {
      await pc.current.setRemoteDescription(
        new RTCSessionDescription(incomingCallData.offer)
      );
      const answer = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answer);

      send({ type: "accept-Call", answer, to: incomingCallData.from });
      setCallState("in-call");
      await drainCandidateQueue();
    } catch (err) {
      console.error("Failed to answer call:", err);
      setErrorMessage(err?.message || "Failed to accept call");
    }
  };

  // Receiver: reject incoming call
  const rejectCall = () => {
    if (incomingCallData?.from) {
      send({ type: "Reject-Call", to: incomingCallData.from });
    }
    cleanupCall();
    setIncomingCallData?.(null);
    onClose?.();
  };

  // Hang up
  const hangUp = () => {
    if (activePeerId) {
      send({ type: "Reject-Call", to: activePeerId });
    }
    cleanupCall();
    setIncomingCallData?.(null);
    onClose?.();
  };

  const toggleMute = () => {
    if (!localStream.current) return;
    localStream.current.getAudioTracks().forEach((t) => {
      t.enabled = isMuted;
    });
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (!localStream.current) return;
    localStream.current.getVideoTracks().forEach((t) => {
      t.enabled = isVideoOff;
    });
    setIsVideoOff(!isVideoOff);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
              {activePeerName?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="font-semibold text-white">{activePeerName}</p>
              <p className="text-xs text-slate-400">
                {callState === "idle" && (isReady ? "Ready to call" : "Preparing media…")}
                {callState === "calling" && "Calling…"}
                {callState === "incoming" && "Incoming call…"}
                {callState === "in-call" && "In call"}
              </p>
            </div>
          </div>
          <button
            onClick={hangUp}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="flex items-center gap-2 bg-amber-500/10 border-b border-amber-500/20 px-5 py-2 text-xs text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Video Stage */}
        <div className="relative flex min-h-[360px] items-center justify-center bg-slate-950">
          {/* Remote Video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ transform: "scaleX(-1)" }}
            className="h-full w-full object-cover min-h-[360px]"
          />

          {callState !== "in-call" && callState !== "incoming" && (
            <div className="absolute flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-slate-300 text-2xl font-semibold">
                {activePeerName?.[0]?.toUpperCase() ?? "?"}
              </div>
              <p>{callState === "calling" ? "Ringing…" : "Ready to start call"}</p>
            </div>
          )}

          {/* Local PiP Video */}
          <div className="absolute bottom-3 right-3 overflow-hidden rounded-xl border-2 border-slate-700 bg-slate-800 shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{ transform: "scaleX(-1)" }}
              className="h-28 w-40 object-cover"
            />
          </div>

          {/* Incoming call overlay */}
          {callState === "incoming" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/90 z-10">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white animate-pulse">
                {activePeerName?.[0]?.toUpperCase() ?? "?"}
              </div>
              <p className="text-lg font-semibold text-white">
                Incoming call from {activePeerName}
              </p>
              <div className="flex gap-6">
                <button
                  onClick={rejectCall}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 transition"
                  title="Decline"
                >
                  <PhoneOff className="h-6 w-6" />
                </button>
                <button
                  onClick={acceptCall}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 transition"
                  title="Accept"
                >
                  <Phone className="h-6 w-6" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 border-t border-slate-800 bg-slate-900 px-5 py-4">
          {/* Mute */}
          <button
            onClick={toggleMute}
            title={isMuted ? "Unmute microphone" : "Mute microphone"}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
              isMuted
                ? "bg-red-600 text-white"
                : "bg-slate-800 text-slate-200 hover:bg-slate-700"
            }`}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          {/* Video toggle */}
          <button
            onClick={toggleVideo}
            title={isVideoOff ? "Turn camera on" : "Turn camera off"}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
              isVideoOff
                ? "bg-red-600 text-white"
                : "bg-slate-800 text-slate-200 hover:bg-slate-700"
            }`}
          >
            {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </button>

          {/* Start Call */}
          {callState === "idle" && (
            <button
              onClick={startCall}
              disabled={!isReady && !errorMessage}
              title="Start call"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 transition disabled:opacity-40"
            >
              <Phone className="h-5 w-5" />
            </button>
          )}

          {/* Hang up */}
          {(callState === "calling" || callState === "in-call") && (
            <button
              onClick={hangUp}
              title="Hang up"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 transition"
            >
              <PhoneOff className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoChat;
