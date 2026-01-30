import React, { useState, useEffect, useContext, useRef } from "react";
import { MoreVertical, Trash } from "lucide-react";
import { AppContext } from "../Context/AppContext";
import { deleteMessage, getUserChats } from "../api/messages";
import MessageInput from "./MessageInput";

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
            <div
              key={msg.id || i}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl text-sm shadow ${
                  isMine
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-800 rounded-bl-none"
                }`}
              >
                {/* ✅ UPDATED: Better file type handling */}
                {msg.fileType === "image" ? (
                  <img
                    src={msg.message}
                    alt={msg.attachment?.filename || "Image"}
                    className="rounded-lg max-w-[250px] cursor-pointer hover:opacity-90"
                    onClick={() => window.open(msg.message, "_blank")}
                  />
                ) : msg.fileType === "video" ? (
                  <video
                    controls
                    src={msg.message}
                    className="rounded-lg max-w-[250px]"
                  />
                ) : msg.fileType === "file" || msg.fileType === "document" ? (
                  <div className="flex flex-col gap-2">
                    <a
                      href={msg.message}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 ${
                        isMine
                          ? "text-white hover:underline"
                          : "text-blue-600 hover:underline"
                      }`}
                    >
                      📄 {msg.attachment?.filename || "Download File"}
                    </a>
                    {msg.attachment?.size && (
                      <span
                        className={`text-xs ${
                          isMine ? "text-blue-100" : "text-gray-500"
                        }`}
                      >
                        {formatFileSize(msg.attachment.size)}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap break-words">
                    {msg.message}
                  </p>
                )}

                {/* Delete button for own messages */}
                {isMine && (
                  <div className="flex justify-end mt-1">
                    <Trash
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="w-3 h-3 text-red-400 cursor-pointer hover:text-red-600"
                      title="Delete message"
                    />
                  </div>
                )}
              </div>
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