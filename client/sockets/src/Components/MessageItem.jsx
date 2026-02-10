import { Trash, X, MoreVertical, Forward, Reply, Copy } from "lucide-react";
import { useContext, useState, useRef, useEffect } from "react";
import { downloadFromCloudinary } from "../Hooks/downloadCloud";
import { AppContext } from "../Context/AppContext";
import ContactSelectModal from "./ContactsRender";
import axios from "axios";

export default function MessageItem({
  contacts,
  msg,
  isMine,
  handleDeleteMessage,
  formatFileSize,
}) {
  const {backendUrl, token} = useContext(AppContext);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showcontactModal, setShowContactModal] = useState(false);
  const menuRef = useRef(null);

  const isImage = msg.fileType === "image";
  const isText = msg.fileType === "text";
  const isVideo = msg.fileType === "video";

  const isPdfOrDoc =
    msg.attachment?.mimetype?.includes("pdf") ||
    msg.attachment?.mimetype?.includes("word") ||
    msg.attachment?.mimetype?.includes("excel") ||
    msg.attachment?.mimetype?.includes("powerpoint");

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function sendToOther(messageId, receiverId) {
    try {
      console.log("📤 Forwarding message:");
      console.log("Message ID:", messageId);
      console.log("Receiver ID:", receiverId);
      console.log("Full URL:", `${backendUrl}/SendToOther/${messageId}`);

      const response = await axios.post(
        `${backendUrl}/api/messages/SendToOther/${messageId}`,
        { receiverId: receiverId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("✅ Success:", response.data);
      alert("Message forwarded successfully!");
      
    } catch (err) {
      console.error("❌ Error:", err);
      console.error("Response:", err.response?.data);
      alert(`Failed: ${err.response?.data?.message || err.message}`);
    }
  }

  const handleReply = () => {
    console.log("Reply to message", msg.id);
    setShowMenu(false);
  };

  const handleCopy = () => {
    if (isText) {
      navigator.clipboard.writeText(msg.message);
    }
    setShowMenu(false);
  };

  const handleDelete = () => {
    handleDeleteMessage(msg.id || msg._id);
    setShowMenu(false);
  };

  return (
    <>
      {/* ================= VIDEO MODAL ================= */}
      {showVideoModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setShowVideoModal(false)}
        >
          <div
            className="relative bg-black rounded-lg w-[80vw] h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              src={msg.message}
              controls
              autoPlay
              className="w-full h-full rounded-lg"
            />
            <X
              className="absolute top-2 right-2 text-white cursor-pointer hover:bg-white/20 rounded-full p-1"
              size={28}
              onClick={() => setShowVideoModal(false)}
            />
          </div>
        </div>
      )}

      {/* ================= PDF MODAL ================= */}
      {showPdfModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setShowPdfModal(false)}
        >
          <div
            className="relative bg-white rounded-lg w-[90vw] h-[95vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={msg.message}
              className="w-full h-full rounded-lg"
              title={msg.attachment?.filename}
            />
            <X
              className="absolute top-2 right-2 cursor-pointer hover:bg-gray-200 rounded-full p-1"
              size={28}
              onClick={() => setShowPdfModal(false)}
            />
          </div>
        </div>
      )}

      {/* ================= IMAGE MODAL ================= */}
      {showImageModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setShowImageModal(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <img
              src={msg.message}
              className="max-h-[90vh] rounded-lg"
              alt="preview"
            />
          </div>
        </div>
      )}

      {/* ================= MESSAGE ROW ================= */}
      <div
        className={`flex items-start gap-2 ${
          isMine ? "justify-end" : "justify-start"
        }`}
      >
        {/* ================= MESSAGE BUBBLE WITH HOVER AREA ================= */}
        <div 
          className={`relative flex items-start gap-1 ${isMine ? "flex-row-reverse" : "flex-row"}`}
          onMouseEnter={() => setIsHover(true)}
          onMouseLeave={() => setIsHover(false)}
        >
          {/* Menu Button - appears on hover */}
          {isHover && (
            <div className="flex items-center h-full pt-1">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-full hover:bg-gray-200 transition-colors"
              >
                <MoreVertical size={16} className="text-gray-600" />
              </button>
            </div>
          )}

          {/* Dropdown Menu */}
          {showMenu && (
            <div
              ref={menuRef}
              className={`absolute top-0 ${
                isMine ? "right-full mr-2" : "left-full ml-2"
              } bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-36 z-10`}
            >
              {isText && (
                <button
                  onClick={handleCopy}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <Copy size={14} />
                  Copy
                </button>
              )}
              <button
                onClick={handleReply}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <Reply size={14} />
                Reply
              </button>
              <button
                onClick={() => {
                  setShowContactModal(true);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <Forward size={14} />
                Forward
              </button>
              <hr className="my-1" />
              <button
                onClick={handleDelete}
                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
              >
                <Trash size={14} />
                Delete
              </button>
            </div>
          )}

          {/* Message Content */}
          <div
            className={`max-w-xs px-4 py-2 rounded-2xl text-sm shadow
              ${
                isMine
                  ? "bg-blue-500 text-white rounded-br-none"
                  : "bg-gray-200 text-gray-800 rounded-bl-none"
              }`}
          >
            {/* ===== IMAGE ===== */}
            {isImage && (
              <img
                src={msg.message}
                alt="img"
                className="rounded-lg max-w-[250px] cursor-pointer"
                onClick={() => setShowImageModal(true)}
              />
            )}

            {/* ===== VIDEO INFO ===== */}
            {isVideo && (
              <div className="text-xs opacity-80">
                {msg.attachment?.size && formatFileSize(msg.attachment.size)}
              </div>
            )}

            {/* ===== FILE / PDF / DOC ===== */}
            {!isImage && !isText && (
              <div className="flex flex-col gap-1 mt-1">
                <span className="font-medium">{msg.attachment?.filename}</span>
                {msg.attachment?.size && (
                  <span className="text-xs opacity-70">
                    {formatFileSize(msg.attachment.size)}
                  </span>
                )}
              </div>
            )}

            {/* ===== TEXT ===== */}
            {isText && <p className="whitespace-pre-wrap">{msg.message}</p>}

            {/* ===== ACTIONS ===== */}
            {!isText && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => {
                    if (isImage) setShowImageModal(true);
                    else if (isPdfOrDoc) setShowPdfModal(true);
                    else if (isVideo) setShowVideoModal(true);
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isMine
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-700 hover:bg-gray-800 text-white"
                  }`}
                >
                  Open
                </button>

                <button
                  onClick={() =>
                    downloadFromCloudinary(
                      msg.message,
                      msg.attachment?.filename
                    )
                  }
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isMine
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-700 hover:bg-gray-800 text-white"
                  }`}
                >
                  Download
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= CONTACT SELECT MODAL ================= */}
      {showcontactModal && (
        <ContactSelectModal
          isOpen={showcontactModal}
          onClose={() => setShowContactModal(false)}
          contacts={contacts}
          onSelect={(contact) => {
            console.log("📋 Selected contact:", contact);
            
            const messageId = msg.id || msg._id;
            const contactId = contact.id || contact._id;
            
            if (!messageId || !contactId) {
              alert("Invalid message or contact ID");
              return;
            }
            
            sendToOther(messageId, contactId);
            setShowContactModal(false);
          }}
        />
      )}
    </>
  );
}