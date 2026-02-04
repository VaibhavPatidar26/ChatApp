import { Trash, X } from "lucide-react";
import { useState } from "react";
import { downloadFromCloudinary } from "../Hooks/downloadCloud";

export default function MessageItem({
  msg,
  isMine,
  handleDeleteMessage,
  formatFileSize,
}) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isHover, setIsHover] = useState(false);

  const isImage = msg.fileType === "image";
  const isText = msg.fileType === "text";
  const isVideo = msg.fileType === "video";

  const isPdfOrDoc =
    msg.attachment?.mimetype?.includes("pdf") ||
    msg.attachment?.mimetype?.includes("word") ||
    msg.attachment?.mimetype?.includes("excel") ||
    msg.attachment?.mimetype?.includes("powerpoint");

  return (
    <>
      {/* ================= VIDEO MODAL ================= */}
      {showVideoModal ? (
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
              className="absolute top-2 right-2 text-white cursor-pointer"
              onClick={() => setShowVideoModal(false)}
            />
          </div>
        </div>
      ) : null}

      {/* ================= PDF MODAL ================= */}
      {showPdfModal ? (
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
              className="absolute top-2 right-2 cursor-pointer"
              onClick={() => setShowPdfModal(false)}
            />
          </div>
        </div>
      ) : null}

      {/* ================= IMAGE MODAL ================= */}
      {showImageModal ? (
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
      ) : null}

      {/* ================= MESSAGE ROW ================= */}
      <div
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        className={`flex items-start gap-2 ${
          isMine ? "justify-end" : "justify-start"
        }`}
      >
        {/* ===== SIDE ACTION RAIL ===== */}
        {isHover ? (
          <div
            className={`flex flex-col items-center gap-2 text-xs opacity-70
              ${isMine ? "order-1" : "order-2"}`}
          >
            <span className="cursor-pointer text-sm hover:opacity-100">
              ⋮
            </span>

            <Trash
              onClick={() => handleDeleteMessage(msg.id)}
              className="w-3 h-3 cursor-pointer text-red-400 hover:text-red-600"
            />
          </div>
        ) : null}

        {/* ================= MESSAGE BUBBLE ================= */}
        <div
          className={`max-w-xs px-4 py-2 rounded-2xl text-sm shadow
            ${isMine
              ? "bg-blue-500 text-white rounded-br-none order-2"
              : "bg-gray-200 text-gray-800 rounded-bl-none order-1"
            }`}
        >
          {/* ===== IMAGE ===== */}
          {isImage ? (
            <img
              src={msg.message}
              alt="img"
              className="rounded-lg max-w-[250px] cursor-pointer"
              onClick={() => setShowImageModal(true)}
            />
          ) : null}

          {/* ===== VIDEO INFO ===== */}
          {isVideo ? (
            <div className="text-xs opacity-80">
              {msg.attachment?.size
                ? formatFileSize(msg.attachment.size)
                : null}
            </div>
          ) : null}

          {/* ===== FILE / PDF / DOC ===== */}
          {!isImage && !isText ? (
            <div className="flex flex-col gap-1 mt-1">
              <span className="font-medium">
                {msg.attachment?.filename}
              </span>
              {msg.attachment?.size ? (
                <span className="text-xs opacity-70">
                  {formatFileSize(msg.attachment.size)}
                </span>
              ) : null}
            </div>
          ) : null}

          {/* ===== TEXT ===== */}
          {isText ? (
            <p className="whitespace-pre-wrap">{msg.message}</p>
          ) : null}

          {/* ===== ACTIONS (UNCHANGED) ===== */}
          {!isText ? (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  if (isImage) setShowImageModal(true);
                  else if (isPdfOrDoc) setShowPdfModal(true);
                  else if (isVideo) setShowVideoModal(true);
                }}
                className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
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
                className="px-2 py-1 bg-green-600 text-white rounded text-xs"
              >
                Download
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
