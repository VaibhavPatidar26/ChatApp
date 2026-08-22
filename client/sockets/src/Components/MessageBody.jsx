import React, { useEffect, useContext, useRef } from "react";
import { MessageCircle, MoreVertical, Phone, Video } from "lucide-react";
import { AppContext } from "../Context/AppContext";
import { deleteMessage, getUserChats } from "../api/messages";
import MessageInput from "./MessageInput";
import MessageItem from "./MessageItem";

const MessageBody = ({
  contacts,
  socketReady,
  socketRef,
  onStartCall,
  isCallActive,
}) => {
  const {
    receiverName,
    receiverId,
    userId,
    conversation,
    setConversation,
  } = useContext(AppContext);
  const messagesEndRef = useRef(null);
  const prevConversationLengthRef = useRef(0);

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
        // Update ref after setting initial conversation
        prevConversationLengthRef.current = chatHistory.length;
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    fetchMessageHistory();
  }, [receiverId, setConversation]);

  // ------------------ Smart Auto-scroll ------------------
  // Only scroll when NEW messages are added, not when messages are deleted
  useEffect(() => {
    const currentLength = conversation.length;
    const previousLength = prevConversationLengthRef.current;

    // Only scroll if conversation got LONGER (new message added)
    // Don't scroll if it got SHORTER (message deleted) or stayed same
    if (currentLength > previousLength) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    // Update the ref for next comparison
    prevConversationLengthRef.current = currentLength;
  }, [conversation]);

  // ------------------ Delete Message ------------------
  const handleDeleteMessage = async (id) => {
    console.log("🗑️ Attempting to delete message with id:", id);
    
    try {
      // deleteMessage returns res.data directly, so response is at top level
      const response = await deleteMessage(id);
      
      console.log("📡 Delete API response:", response);

      // Check if success flag is true
      if (response?.success) {
        console.log("✅ Delete successful, removing from UI");
        
        // Remove message from UI immediately
        setConversation((prev) => {
          const filtered = prev.filter((msg) => msg.id !== id);
          console.log("📊 Before filter:", prev.length, "After filter:", filtered.length);
          return filtered;
        });
      } else {
        console.error("❌ Delete failed - API returned:", response);
        alert("Failed to delete message: " + (response?.message || "Unknown error"));
      }
    } catch (err) {
      console.error("❌ Failed to delete message - Error:", err);
      alert("Failed to delete message. Please try again.");
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
      <div className="flex h-full items-center justify-center bg-slate-50 px-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
            <MessageCircle className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold text-slate-900">Select a conversation</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Choose someone from the sidebar to message, share files, or start a call.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-1 flex-col bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
            {receiverName[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-slate-950">{receiverName}</h2>
            <p className="text-xs text-slate-500">Messages and calls are live when connected</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onStartCall && onStartCall("audio")}
            disabled={!receiverId || !socketReady || isCallActive}
            title="Audio call"
            className="p-2 rounded-full text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => onStartCall && onStartCall("video")}
            disabled={!receiverId || !socketReady || isCallActive}
            title="Video call"
            className="p-2 rounded-full text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Video className="w-5 h-5" />
          </button>
          <button
            type="button"
            title="More"
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {conversation.map((msg) => {
          const isMine = msg.from === String(userId);

          return (
              
             <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <MessageItem
        contacts={contacts}
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
