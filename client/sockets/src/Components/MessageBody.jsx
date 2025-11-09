import React, { useState, useEffect, useContext, useRef } from "react";
import { MoreVertical, Send, Trash } from "lucide-react";
import { AppContext } from "../Context/AppContext";
import { apiDeleteMessages, apiGetUserChats } from "../api/messages";
import MessageDropdown from "./UI/dropdown";
import { uploadFile } from "../Hooks/UploadFIles";

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

  // ------------------ File Upload & Send ------------------
  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) {
      alert("No file selected");
      return;
    }

    const url = await upload_file(file); // ✅ add await here!
    if (!url) {
      alert("Upload failed");
      return;
    }

    // Detect file type
    const fileType = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("video/")
      ? "video"
      : "document";

    // Send uploaded file URL as a message
    socketRef.current.send(
      JSON.stringify({
        type: "SendMessage",
        fileType,
        fileUrl: url,
        to: receiverId,
      })
    );

    // Update UI instantly
    setConversation((prev) => [
      ...prev,
      {
        from: String(userId),
        to: String(receiverId),
        message: url,
        fileType,
        createdAt: Date.now(),
      },
    ]);
  }

  // ------------------ Fetch Chat History ------------------
  useEffect(() => {
    async function fetchMessageHistory() {
      try {
        const response = await apiGetUserChats(token, backendUrl, receiverId);
        if (response && Array.isArray(response.data.fetchMessages)) {
          const chatHistory = response.data.fetchMessages.map((msg) => ({
            ...msg,
            from: String(msg.from),
            to: String(msg.to),
          }));
          setConversation(chatHistory);
        }
      } catch (err) {
        console.error("Failed to load history:", err);
      }
    }

    if (receiverId) fetchMessageHistory();
  }, [receiverId, token, backendUrl]);

  // ------------------ WebSocket Setup ------------------
  useEffect(() => {
    const socket = new WebSocket(`${backendUrl.replace("http", "ws")}`);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: "auth",
          token,
        })
      );
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "recievedMessage") {
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
        console.error("Error parsing WS message:", err);
      }
    };

    return () => socket.close();
  }, []);

  // ------------------ Auto-scroll ------------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  // ------------------ Send Text Message ------------------
  async function sendMessage() {
    if (!messageInput.trim()) return;

    socketRef.current.send(
      JSON.stringify({
        type: "SendMessage",
        text: messageInput,
        to: receiverId,
      })
    );

    setConversation((prev) => [
      ...prev,
      {
        from: String(userId),
        to: String(receiverId),
        message: messageInput,
        fileType: "text",
        createdAt: Date.now(),
      },
    ]);

    setMessageInput("");
  }

  // ------------------ Delete Message ------------------
  async function deleteMessage(messageId) {
    let response = await apiDeleteMessages(token, backendUrl, messageId);
    let data = response.data;
    if (data.success) {
      setConversation((prev) => prev.filter((msg) => msg.id !== messageId));
    }
  }

  // ------------------ UI ------------------
  return !receiverName ? (
    <h1 className="text-3xl font-bold p-6">
      👋 Select a chat to start messaging
    </h1>
  ) : (
    <div className="flex flex-col flex-1 h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-blue-50 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-600">
            {receiverName ? receiverName[0].toUpperCase() : null}
          </div>
          <h2 className="font-semibold">{receiverName}</h2>
        </div>
        <MoreVertical className="w-5 h-5 text-gray-600 cursor-pointer" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {conversation.map((msg, index) => {
          const isMine = String(msg.from) === String(userId);
          return (
            <div
              key={msg.id || index}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl text-sm shadow ${
                  isMine
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-800 rounded-bl-none"
                }`}
              >
                {/* Render content based on file type */}
                {msg.fileType === "image" ? (
                  <img
                    src={msg.message}
                    alt="sent"
                    className="rounded-lg max-w-[200px] mb-1"
                  />
                ) : msg.fileType === "video" ? (
                  <video
                    controls
                    src={msg.message}
                    className="rounded-lg max-w-[200px] mb-1"
                  />
                ) : msg.fileType === "document" ? (
                  <a
                    href={msg.message}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-200"
                  >
                    📄 Open Document
                  </a>
                ) : (
                  <p>{msg.message}</p>
                )}

                {/* Timestamp + Delete */}
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] opacity-70">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              sendMessage();
            }
          }}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 bg-gray-100 rounded-full outline-none text-sm"
        />

        {/* Hidden file input */}
        <input
          type="file"
          id="fileInput"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Dropdown for upload */}
        <label htmlFor="fileInput" className="cursor-pointer">
          <MessageDropdown />
        </label>

        <button
          className="ml-3 bg-blue-500 p-2 rounded-full text-white hover:bg-blue-600"
          onClick={sendMessage}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MessageBody;
