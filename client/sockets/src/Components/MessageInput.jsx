import React, { useRef, useContext, useState } from "react";
import { Send, Paperclip, Loader2 } from "lucide-react";
import { AppContext } from "../Context/AppContext";
import { uploadFile } from "../Hooks/UploadFiles";

const MessageInput = ({ socketRef }) => {
  const {
    backendUrl,
    token,
    receiverId,
    userId,
    messageInput,
    setMessageInput,
  } = useContext(AppContext);

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // ✅ Initialize upload hook with receiverId
  const { upload_file } = uploadFile(backendUrl, token, receiverId);

  // ------------------ Send Text Message ------------------
  const sendMessage = async (text) => {
    if (!text?.trim()) return;

    // Check WebSocket connection
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      alert("Not connected to server. Please refresh the page.");
      return;
    }

    const payload = {
      type: "new-message",
      message: {
        sender: userId,
        receiver: receiverId,
        text: text.trim(),
        fileType: "text",
      },
    };

    try {
      socketRef.current.send(JSON.stringify(payload));
      setMessageInput("");
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("Failed to send message. Please try again.");
    }
  };

  // ------------------ Handle File Upload ------------------
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // ✅ Upload file via HTTP - backend handles everything
      const result = await upload_file(file);

      if (!result) {
        alert("Upload failed");
        return;
      }

      // ✅ File is already saved to DB and WebSocket notification sent by backend
      // No need to send WebSocket message here - backend does it!
      console.log("✅ File uploaded successfully:", result.fileUrl);

      // The message will appear automatically via WebSocket 'received-message' event
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed");
    } finally {
      setIsUploading(false);
      e.target.value = null; // Reset file input
    }
  };

  return (
    <div className="p-3 border-t bg-white flex items-center gap-2">
      <input
        type="text"
        value={messageInput}
        onChange={(e) => setMessageInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(messageInput);
          }
        }}
        placeholder="Type a message..."
        className="flex-1 px-4 py-2 bg-gray-100 rounded-full outline-none text-sm"
        disabled={isUploading}
      />

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
      />

      {/* File upload button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        disabled={isUploading}
        title="Attach file"
      >
        {isUploading ? (
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
        ) : (
          <Paperclip className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {/* Send button */}
      <button
        className="bg-blue-500 p-2 rounded-full text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
        onClick={() => sendMessage(messageInput)}
        disabled={isUploading || !messageInput.trim()}
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  );
};

export default MessageInput;