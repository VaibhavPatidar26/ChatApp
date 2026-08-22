import { useRef, useContext, useState } from "react";
import { Loader2, Paperclip, Send } from "lucide-react";
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
    <div className="border-t border-slate-200 bg-white px-4 py-3">
      <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-blue-500 focus-within:bg-white">
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
          placeholder={isUploading ? "Uploading file..." : "Message"}
          className="min-h-10 flex-1 bg-transparent px-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
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
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isUploading}
          title="Attach file"
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          ) : (
            <Paperclip className="h-5 w-5" />
          )}
        </button>

        {/* Send button */}
        <button
          type="button"
          className="rounded-full bg-blue-600 p-2.5 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          onClick={() => sendMessage(messageInput)}
          disabled={isUploading || !messageInput.trim()}
          title="Send"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
