import React, { useState, useEffect, useContext, useRef } from "react";
import { MoreVertical, Send, Trash } from "lucide-react";
import { AppContext } from "../Context/AppContext";
import { deleteMessage, getUserChats } from "../api/messages";
import MessageDropdown from "./UI/dropdown";
import { uploadFile } from "../Hooks/UploadFIles";
import instance from "../api/axios";

const MessageBody = () => {
  const {
    token,
    backendUrl,
    receiverName,
    receiverId,
    userId,
    messageInput,
    setMessageInput,
    conversation,
    setConversation,
  } = useContext(AppContext);

  const { upload_file } = uploadFile(backendUrl, token);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // ------------------ Fetch Chat History ------------------
  useEffect(() => {
  const fetchMessageHistory = async () => {
    if (!receiverId) return;

    try {
      const res = await getUserChats(receiverId);

      if (!res?.success) {
        console.error("Failed response:", res);
        return;
      }

      const chatHistory = (res.fetchMessages || []).map((msg) => ({
        ...msg,
        from: String(msg.from),
        to: String(msg.to),
      }));

      setConversation(chatHistory);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  fetchMessageHistory();
}, [receiverId]);


  // ------------------ WebSocket ------------------
  useEffect(() => {
    if (!receiverId) return;
    const ws = new WebSocket(`${backendUrl.replace("http", "ws")}`);
    socketRef.current = ws;

    ws.onopen = () => ws.send(JSON.stringify({ type: "auth", token }));

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "receivedMessage") {
          setConversation((prev) => [
            ...prev,
            {
              from: String(data.from),
              to: String(userId),
              message: data.message || data.fileUrl,
              fileType: data.fileType || "text",
              createdAt: Date.now(),
            },
          ]);
        }
      } catch (err) {
        console.error("WS parse error:", err);
      }
    };

    return () => ws.close();
  }, [receiverId, token, backendUrl, userId, setConversation]);

  // ------------------ Auto-scroll ------------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  // ------------------ Send Message ------------------
  const sendMessage = (text, fileType = "text", fileUrl = null) => {
    if (!text && !fileUrl) return;
    const payload = {
      type: "SendMessage",
      text: text || fileUrl,
      to: receiverId,
    };
    if (fileUrl) payload.fileType = fileType;

    socketRef.current.send(JSON.stringify(payload));

    setConversation((prev) => [
      ...prev,
      {
        from: String(userId),
        to: String(receiverId),
        message: text || fileUrl,
        fileType,
        createdAt: Date.now(),
      },
    ]);
    setMessageInput("");
  };

  // ------------------ File Upload ------------------
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return alert("No file selected");

    const url = await upload_file(file);
    if (!url) return alert("Upload failed");

    const type = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("video/")
      ? "video"
      : "document";

    sendMessage(null, type, url);
  };

  // ------------------ Delete Message ------------------
  const deleteMessage = async (id) => {
    try {
      const res = await deleteMessage(token, backendUrl, id);
      if (res.data.success) setConversation((prev) => prev.filter((msg) => msg.id !== id));
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  // ------------------ UI ------------------
  if (!receiverName)
    return <h1 className="text-3xl font-bold p-6">👋 Select a chat to start messaging</h1>;

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
            <div key={msg.id || i} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl text-sm shadow ${
                  isMine
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-800 rounded-bl-none"
                }`}
              >
                {msg.fileType === "image" ? (
                  <img src={msg.message} alt="sent" className="rounded-lg max-w-[200px] mb-1" />
                ) : msg.fileType === "video" ? (
                  <video controls src={msg.message} className="rounded-lg max-w-[200px] mb-1" />
                ) : msg.fileType === "document" ? (
                  <a href={msg.message} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">
                    📄 Open Document
                  </a>
                ) : (
                  <p>{msg.message}</p>
                )}

                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] opacity-70">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <Trash
                    onClick={() => deleteMessage(msg.id)}
                    className="w-3 h-3 text-red-400 cursor-pointer hover:text-red-600"
                  />
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t bg-white flex items-center">
        <input
          type="text"
          value={messageInput}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(messageInput)}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 bg-gray-100 rounded-full outline-none text-sm"
        />

        <input type="file" id="fileInput" className="hidden" onChange={handleFileChange} />
        <label htmlFor="fileInput" className="cursor-pointer">
          <MessageDropdown />
        </label>

        <button className="ml-3 bg-blue-500 p-2 rounded-full text-white hover:bg-blue-600" onClick={() => sendMessage(messageInput)}>
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MessageBody;
