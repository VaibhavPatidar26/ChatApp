import React, {
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Mic,
  MicOff,
  Phone,
  PhoneCall,
  PhoneOff,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import { AppContext } from "../../Context/AppContext";
import WebRTCManager from "../../Services/WebRtc";

const idleState = {
  status: "idle",
  remoteUserId: null,
  remoteName: "",
  callType: "video",
  message: "",
};

const Call = forwardRef(
  ({ callEvent, contacts, socketReady, socketRef, showButtons = false }, ref) => {
    const { receiverId, receiverName } = useContext(AppContext);
    const managerRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const remoteAudioRef = useRef(null);

    const [callState, setCallState] = useState(idleState);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [micEnabled, setMicEnabled] = useState(true);
    const [cameraEnabled, setCameraEnabled] = useState(true);

    const callStateRef = useRef(callState);
    useEffect(() => {
      callStateRef.current = callState;
    }, [callState]);

    const activeRemoteId = callState.remoteUserId || receiverId;
    const activeRemoteName = useMemo(() => {
      if (callState.remoteName) return callState.remoteName;
      const contact = contacts.find(
        (item) => String(item._id) === String(activeRemoteId)
      );
      return contact?.Name || receiverName || "Contact";
    }, [activeRemoteId, callState.remoteName, contacts, receiverName]);

    // Initialize WebRTC Manager
    useEffect(() => {
      if (!managerRef.current) {
        managerRef.current = new WebRTCManager(socketRef);
      }

      managerRef.current.setSocketRef(socketRef);
      managerRef.current.onLocalStream = (stream) => {
        setLocalStream(stream);
      };
      managerRef.current.onRemoteStream = (stream) => {
        setRemoteStream(stream);
      };
      managerRef.current.onConnectionStateChange = (state) => {
        if (["connected", "completed"].includes(state)) {
          setCallState((prev) =>
            prev.status === "idle" ? prev : { ...prev, status: "in-call", message: "" }
          );
        }

        if (["failed", "disconnected", "closed"].includes(state)) {
          managerRef.current?.cleanup();
          setLocalStream(null);
          setRemoteStream(null);
          setCallState((prev) =>
            prev.status === "idle"
              ? prev
              : { ...idleState, message: "Call connection ended" }
          );
        }
      };

      return () => {
        managerRef.current?.cleanup();
      };
    }, [socketRef]);

    // Attach local stream to local video element
    useEffect(() => {
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.play().catch((err) => {
          console.warn("Local video play notice:", err);
        });
      }
    }, [localStream, callState.status]);

    // Attach remote stream to remote video and audio elements
    useEffect(() => {
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch((err) => {
          console.warn("Remote video play notice:", err);
        });
      }
      if (remoteAudioRef.current && remoteStream) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch((err) => {
          console.warn("Remote audio play notice:", err);
        });
      }
    }, [remoteStream, callState.status, callState.callType]);

    // Process incoming signaling events from WebSocket
    useEffect(() => {
      if (!callEvent || !managerRef.current) return;

      const run = async () => {
        try {
          if (callEvent.type === "incoming-call") {
            // If already on another call, reject with busy notice
            if (callStateRef.current.status !== "idle") {
              managerRef.current.rejectCall(callEvent.from, "busy");
              return;
            }

            const contact = contacts.find(
              (item) => String(item._id) === String(callEvent.from)
            );
            setCallState({
              status: "ringing",
              remoteUserId: callEvent.from,
              remoteName: contact?.Name || "Incoming call",
              callType: callEvent.callType || "video",
              message: "",
            });
            return;
          }

          if (
            callStateRef.current.remoteUserId &&
            callEvent.from &&
            String(callEvent.from) !== String(callStateRef.current.remoteUserId)
          ) {
            return;
          }

          if (callEvent.type === "call-accepted") {
            setCallState((prev) => ({ ...prev, status: "connecting", message: "" }));
            await managerRef.current.createAndSendOffer(
              callEvent.from || callStateRef.current.remoteUserId,
              callStateRef.current.callType
            );
            return;
          }

          if (callEvent.type === "call-rejected") {
            managerRef.current.cleanup();
            setLocalStream(null);
            setRemoteStream(null);
            const msg =
              callEvent.reason === "busy"
                ? "User is busy on another call"
                : "Call declined";
            setCallState({ ...idleState, message: msg });
            return;
          }

          if (callEvent.type === "offer") {
            const currentCallType =
              callEvent.callType || callStateRef.current.callType || "video";
            setCallState((prev) => ({
              ...prev,
              status: "connecting",
              remoteUserId: callEvent.from,
              callType: currentCallType,
              message: "",
            }));
            await managerRef.current.handleOffer(
              callEvent.from,
              callEvent.offer,
              currentCallType
            );
            return;
          }

          if (callEvent.type === "answer") {
            await managerRef.current.handleAnswer(callEvent.answer);
            setCallState((prev) => ({ ...prev, status: "in-call", message: "" }));
            return;
          }

          if (callEvent.type === "ice-candidate") {
            await managerRef.current.handleIceCandidate(callEvent.candidate);
            return;
          }

          if (callEvent.type === "hangup") {
            managerRef.current.cleanup();
            setLocalStream(null);
            setRemoteStream(null);
            setCallState({ ...idleState, message: "Call ended" });
            return;
          }

          if (callEvent.type === "call-error") {
            managerRef.current.cleanup();
            setLocalStream(null);
            setRemoteStream(null);
            setCallState({
              ...idleState,
              message: callEvent.message || "Call failed",
            });
          }
        } catch (err) {
          console.error("Call signal handling failed:", err);
          managerRef.current.cleanup();
          setLocalStream(null);
          setRemoteStream(null);
          setCallState({ ...idleState, message: err.message || "Call failed" });
        }
      };

      run();
    }, [callEvent, contacts]);

    const startCall = async (
      targetUserId = receiverId,
      targetUserName = receiverName,
      callType = "video"
    ) => {
      if (!targetUserId || !socketReady) return;

      try {
        setMicEnabled(true);
        setCameraEnabled(callType === "video");
        setCallState({
          status: "calling",
          remoteUserId: targetUserId,
          remoteName: targetUserName,
          callType,
          message: "",
        });

        await managerRef.current.startCall(targetUserId, callType);
      } catch (err) {
        console.error("Could not start call:", err);
        managerRef.current?.cleanup();
        setLocalStream(null);
        setRemoteStream(null);
        setCallState({ ...idleState, message: err.message || "Could not start call" });
      }
    };

    const acceptCall = async () => {
      try {
        setMicEnabled(true);
        setCameraEnabled(callState.callType === "video");
        setCallState((prev) => ({ ...prev, status: "connecting", message: "" }));
        await managerRef.current.acceptCall(
          callState.remoteUserId,
          callState.callType
        );
      } catch (err) {
        console.error("Could not accept call:", err);
        managerRef.current?.cleanup();
        setLocalStream(null);
        setRemoteStream(null);
        setCallState({ ...idleState, message: err.message || "Could not accept call" });
      }
    };

    const rejectCall = () => {
      try {
        if (callState.remoteUserId) {
          managerRef.current?.rejectCall(callState.remoteUserId);
        }
      } catch (err) {
        console.warn("Could not reject call:", err);
      } finally {
        managerRef.current?.cleanup();
        setLocalStream(null);
        setRemoteStream(null);
        setCallState(idleState);
      }
    };

    const endCall = () => {
      try {
        managerRef.current?.hangup(true);
      } catch (err) {
        console.warn("Error during hangup:", err);
      } finally {
        setLocalStream(null);
        setRemoteStream(null);
        setCallState(idleState);
      }
    };

    const toggleMic = () => {
      const nextValue = !micEnabled;
      managerRef.current?.setAudioEnabled(nextValue);
      setMicEnabled(nextValue);
    };

    const toggleCamera = () => {
      const nextValue = !cameraEnabled;
      managerRef.current?.setVideoEnabled(nextValue);
      setCameraEnabled(nextValue);
    };

    const clearMessage = () => {
      setCallState((prev) => ({ ...prev, message: "" }));
    };

    // Expose control methods to parent component
    useImperativeHandle(
      ref,
      () => ({
        startCall,
        endCall,
        isCallActive: callState.status !== "idle",
        status: callState.status,
      }),
      [callState.status, receiverId, receiverName, socketReady]
    );

    const showCallWindow = ["calling", "connecting", "in-call"].includes(
      callState.status
    );
    const showIncoming = callState.status === "ringing";

    return (
      <>
        {showButtons && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => startCall(receiverId, receiverName, "audio")}
              disabled={!receiverId || !socketReady || callState.status !== "idle"}
              title="Audio call"
              className="p-2 rounded-full text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Phone className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => startCall(receiverId, receiverName, "video")}
              disabled={!receiverId || !socketReady || callState.status !== "idle"}
              title="Video call"
              className="p-2 rounded-full text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Video className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Incoming Call Prompt Modal */}
        {showIncoming && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                    {callState.callType === "video" ? "Incoming Video Call" : "Incoming Audio Call"}
                  </span>
                  <h3 className="mt-2 text-xl font-bold text-gray-900">{activeRemoteName}</h3>
                </div>
                <button
                  type="button"
                  onClick={rejectCall}
                  title="Close"
                  className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-8 flex justify-center items-center gap-6">
                <button
                  type="button"
                  onClick={rejectCall}
                  title="Decline"
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600 hover:scale-105 active:scale-95"
                >
                  <PhoneOff className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={acceptCall}
                  title="Accept"
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition hover:bg-green-600 hover:scale-105 active:scale-95"
                >
                  <PhoneCall className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Call Window */}
        {showCallWindow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md px-4">
            <div className="relative flex h-[min(720px,94vh)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-slate-900 shadow-2xl border border-slate-800">
              {/* Call Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-slate-900/90 backdrop-blur border-b border-slate-800 text-white">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                    {callState.status === "calling"
                      ? "Calling..."
                      : callState.status === "connecting"
                      ? "Connecting..."
                      : "Connected"}
                  </span>
                  <h3 className="text-lg font-bold">{activeRemoteName}</h3>
                </div>
                <button
                  type="button"
                  onClick={endCall}
                  title="End call"
                  className="rounded-full bg-red-500 p-3 text-white transition hover:bg-red-600 hover:scale-105 active:scale-95"
                >
                  <PhoneOff className="h-5 w-5" />
                </button>
              </div>

              {/* Main Media Stage */}
              <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">
                {/* Remote Video */}
                {callState.callType === "video" && (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    muted={false}
                    className={`h-full w-full object-cover transition-opacity duration-300 ${
                      remoteStream ? "opacity-100" : "opacity-0 absolute inset-0"
                    }`}
                  />
                )}

                {/* Avatar Display when remote video is not loaded or for audio calls */}
                {(!remoteStream || callState.callType === "audio") && (
                  <div className="flex flex-col items-center justify-center text-white p-6">
                    <div className="flex h-28 w-28 items-center justify-center rounded-full bg-blue-600 text-4xl font-bold shadow-2xl ring-4 ring-blue-500/20">
                      {activeRemoteName[0]?.toUpperCase() || "?"}
                    </div>
                    <p className="mt-5 text-2xl font-semibold">{activeRemoteName}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {callState.status === "calling"
                        ? "Ringing..."
                        : callState.status === "connecting"
                        ? "Connecting audio..."
                        : "Call in progress"}
                    </p>
                  </div>
                )}

                {/* Local Video Thumbnail for Video Calls */}
                {callState.callType === "video" && localStream && (
                  <div className="absolute bottom-4 right-4 h-36 w-28 overflow-hidden rounded-xl border-2 border-white/20 bg-black shadow-2xl sm:h-44 sm:w-36">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className={`h-full w-full object-cover ${cameraEnabled ? "block" : "hidden"}`}
                    />
                    {!cameraEnabled && (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-slate-900 text-slate-400 text-xs">
                        <VideoOff className="h-6 w-6 mb-1 text-slate-500" />
                        <span>Camera off</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Hidden Audio Element for Audio-only calls or background audio stream */}
                <audio
                  ref={remoteAudioRef}
                  autoPlay
                  playsInline
                  className="hidden"
                />
              </div>

              {/* Call Controls Footer */}
              <div className="flex items-center justify-center gap-4 bg-slate-900 px-6 py-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={toggleMic}
                  title={micEnabled ? "Mute Microphone" : "Unmute Microphone"}
                  className={`rounded-full p-3.5 transition ${
                    micEnabled
                      ? "bg-slate-800 text-white hover:bg-slate-700"
                      : "bg-red-500/20 text-red-400 ring-1 ring-red-500 hover:bg-red-500/30"
                  }`}
                >
                  {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>

                {callState.callType === "video" && (
                  <button
                    type="button"
                    onClick={toggleCamera}
                    title={cameraEnabled ? "Turn Off Camera" : "Turn On Camera"}
                    className={`rounded-full p-3.5 transition ${
                      cameraEnabled
                        ? "bg-slate-800 text-white hover:bg-slate-700"
                        : "bg-red-500/20 text-red-400 ring-1 ring-red-500 hover:bg-red-500/30"
                    }`}
                  >
                    {cameraEnabled ? (
                      <Video className="h-5 w-5" />
                    ) : (
                      <VideoOff className="h-5 w-5" />
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={endCall}
                  title="Hang up"
                  className="rounded-full bg-red-500 p-4 text-white shadow-lg transition hover:bg-red-600 hover:scale-105 active:scale-95"
                >
                  <PhoneOff className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status / Error Toast */}
        {callState.message && (
          <div className="fixed right-5 top-5 z-50 flex items-center gap-3 rounded-xl bg-slate-900/95 px-4 py-3 text-sm text-white shadow-2xl border border-slate-700 backdrop-blur">
            <span>{callState.message}</span>
            <button
              type="button"
              onClick={clearMessage}
              title="Close"
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </>
    );
  }
);

export default Call;
