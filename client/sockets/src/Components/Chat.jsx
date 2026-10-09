import React, { useContext, useEffect, useRef, useState } from "react";
import Sidebar from "./Sidebar";
import MessageBody from "./MessageBody";
import VideoChat from "./Call";
import ErrorBoundary from "./ErrorBoundary";
import { AppContext } from "../Context/AppContext";
import { getUsers } from "../api/users";

const Chat = () => {
  const {
    backendUrl,
    token,
    userId,
    receiverId,
    setConversation,
  } = useContext(AppContext);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [socketReady, setSocketReady] = useState(false);
  // ─── call state lives here so it survives before VideoChat mounts ───
  const [showCall, setShowCall] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null); // { offer, from }
  const socketRef = useRef(null);
  const latestReceiverIdRef = useRef(receiverId);
  const latestUserIdRef = useRef(userId);

  useEffect(() => {
    latestReceiverIdRef.current = receiverId;
  }, [receiverId]);

  useEffect(() => {
    latestUserIdRef.current = userId;
  }, [userId]);

  // ---------------- FETCH CONTACTS ----------------
  useEffect(() => {
    if (!token) return;

    const fetchContacts = async () => {
      try {
        setLoading(true);
        const data = await getUsers(); // token handled in axios instance
        setContacts(data.contacts || []);
      } catch (err) {
        setError(err.message || "Failed to load contacts");
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [token]);

  // ---------------- WEBSOCKET ----------------
  useEffect(() => {
    if (!token || !backendUrl) return;

    const wsUrl = backendUrl.startsWith("https")
      ? backendUrl.replace("https", "wss")
      : backendUrl.replace("http", "ws");

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "auth", token }));
      console.log("✅ WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "received-message") {
          const msg = data.message;
          const currentUserId = latestUserIdRef.current;
          const currentReceiverId = latestReceiverIdRef.current;

          const belongsToThisChat =
            (String(msg.sender) === String(currentUserId) &&
              String(msg.receiver) === String(currentReceiverId)) ||
            (String(msg.sender) === String(currentReceiverId) &&
              String(msg.receiver) === String(currentUserId));

          if (!belongsToThisChat) return;

          setConversation((prev) => {
            const exists = prev.some((m) => String(m.id) === String(msg.id));
            if (exists) return prev;

            return [
              ...prev,
              {
                id: msg.id,
                from: String(msg.sender),
                to: String(msg.receiver),
                message: msg.text || msg.fileUrl,
                fileType: msg.fileType || "text",
                attachment: msg.attachment,
                createdAt: msg.createdAt,
              },
            ];
          });
          return;
        }

        if (data.type === "auth-success") {
          setSocketReady(true);
          console.log("✅ WebSocket authenticated");
        }

        // ✅ Incoming call — open modal immediately on receiver side
        if (data.type === "offer") {
          setIncomingCallData({ offer: data.offer, from: data.from });
          setShowCall(true);
        }

        if (data.type === "error") {
          console.error("WebSocket error:", data.message);
        }
      } catch (err) {
        console.error("WS parse error:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    ws.onclose = () => {
      setSocketReady(false);
      console.log("❌ WebSocket disconnected");
    };

    return () => {
      setSocketReady(false);
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      if (socketRef.current === ws) {
        socketRef.current = null;
      }
    };
  }, [backendUrl, setConversation, token]);

  return (
    <div className="flex h-screen w-screen bg-slate-100 text-slate-900 overflow-hidden">
      {/* Sidebar (left) */}
      <div className="w-80 shrink-0 border-r border-slate-200 bg-white">
        <Sidebar contacts={contacts} loading={loading} error={error} />
      </div>

      {/* Message Body (right) */}
      <div className="min-w-0 flex-1">
        <MessageBody
          contacts={contacts}
          socketReady={socketReady}
          socketRef={socketRef}
          onStartCall={() => setShowCall(true)}
        />
      </div>

      {/* VideoChat Modal wrapped in ErrorBoundary */}
      {showCall && (
        <ErrorBoundary onReset={() => setShowCall(false)}>
          <VideoChat
            socketRef={socketRef}
            contacts={contacts}
            incomingCallData={incomingCallData}
            setIncomingCallData={setIncomingCallData}
            onClose={() => {
              setShowCall(false);
              setIncomingCallData(null);
            }}
          />
        </ErrorBoundary>
      )}
    </div>
  );
};

export default Chat;
