import React, { useState, useEffect, useContext, useRef } from "react";
import { MoreVertical, Trash } from "lucide-react";
import { AppContext } from "../Context/AppContext";
import { deleteMessage, getUserChats } from "../api/messages";
import MessageInput from "./MessageInput";
import { fetchFileForPreview } from "../Hooks/fetchFile";
import MessageItem from "./MessageItem";  
const MessageBody = () => {
  const {
    receiverName,
    receiverId,
    userId,
    conversation,
    setConversation,
    backendUrl,
    token,
  } = useContext(AppContext);
  const [fileUrl,setFileUrl] = useState(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // ------------------ Fetch Chat History ------------------
  useEffect(() => {
    if (!receiverId) return;

    const fetchMessageHistory = async () => {
      try {
        const res = await getUserChats(receiverId);
        if (!res?.success) return;

        // Map your DB schema to frontend format
        const chatHistory = (res.fetchMessages || []).map((msg) => ({
          id: msg._id || msg.id,
          from: String(msg.from),
          to: String(msg.to),
          message: msg.message,
          fileType: msg.type || "text",
          attachment: msg.attachment,
          createdAt: msg.createdAt,
        }));

        setConversation(chatHistory);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    fetchMessageHistory();
  }, [receiverId, setConversation]);

  // ------------------ WebSocket ------------------
  useEffect(() => {
    if (!receiverId || !token) return;

    const wsUrl = backendUrl.startsWith("https")
      ? backendUrl.replace("https", "wss")
      : backendUrl.replace("http", "ws");

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "auth",
          token: token,
        })
      );
      console.log("✅ WebSocket connected");
    };

    ws.onmessage = (event) => {
      // ✅ REMOVED: Binary blob handling - we only handle JSON now
      try {
        const data = JSON.parse(event.data);

        if (data.type === "received-message") {
          const msg = data.message; 

          // ✅ Only add message if it belongs to THIS conversation
          const belongsToThisChat =
            (String(msg.sender) === String(userId) &&
              String(msg.receiver) === String(receiverId)) ||
            (String(msg.sender) === String(receiverId) &&
              String(msg.receiver) === String(userId));

          if (!belongsToThisChat) {
            console.log("⏭️ Message not for this chat, ignoring");
            return;
          }

          // Prevent duplicate messages
          setConversation((prev) => {
            const exists = prev.some((m) => m.id === msg.id);
            if (exists) {
              console.log("⏭️ Duplicate message, ignoring");
              return prev;
            }

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
        }

        if (data.type === "auth-success") {
          console.log("✅ WebSocket authenticated");
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
      console.log("❌ WebSocket disconnected");
    };

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      socketRef.current = null;
    };
  }, [receiverId, userId, backendUrl, token, setConversation]);

  // ------------------ Auto-scroll ------------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  // ------------------ Delete Message ------------------
  const handleDeleteMessage = async (id) => {
    try {
      const res = await deleteMessage(token, backendUrl, id);

      if (res?.data?.success) {
        setConversation((prev) => prev.filter((msg) => msg.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  // ------------------ Format File Size ------------------
  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
  };

  // ------------------ UI ------------------
  if (!receiverName) {
    return (
      <div className="flex items-center justify-center h-full">
        <h1 className="text-3xl font-bold text-gray-400">
          👋 Select a chat to start messaging
        </h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-blue-50 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-600">
            {receiverName[0].toUpperCase()}
          </div>
          <h2 className="font-semibold">{receiverName}</h2>
        </div>
        <MoreVertical className="w-5 h-5 text-gray-600 cursor-pointer" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {conversation.map((msg, i) => {
          const isMine = msg.from === String(userId);

          return (
              
             <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <MessageItem
        msg={msg}
        isMine={isMine}
        handleDeleteMessage={handleDeleteMessage}
        formatFileSize={formatFileSize}
      />
    </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput socketRef={socketRef} />
    </div>
  );
};

export default MessageBody;