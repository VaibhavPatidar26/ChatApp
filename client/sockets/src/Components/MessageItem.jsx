import { Trash, X } from "lucide-react";
import { useState } from "react";
import {
  downloadFromCloudinary,
  openPdfInGoogleViewer,
} from "../Hooks/downloadCloud";

export default function MessageItem({
  msg,
  isMine,
  handleDeleteMessage,
  formatFileSize,
}) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const isImage = msg.fileType === "image";
  const isText = msg.fileType === "text";
  const isVideo = msg.fileType ==="video";

  const isPdfOrDoc =
    msg.attachment?.mimetype?.includes("pdf") ||
    msg.attachment?.mimetype?.includes("word") ||
    msg.attachment?.mimetype?.includes("excel") ||
    msg.attachment?.mimetype?.includes("powerpoint");

  return (
    <>


{showVideoModal ? (
  <div
    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
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

{/*pdf modal*/}

{showPdfModal ? (
  <div
    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
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
        className="absolute top-2 right-2 cursor-pointer text-black"
        onClick={() => setShowPdfModal(false)}
      />
    </div>
  </div>
) : null}

      {/* IMAGE MODAL */}
      {showImageModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowImageModal(false)}
        >
          <div
            className="relative max-w-[90%] max-h-[90%]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={msg.message}
              alt="preview"
              className="max-h-[90vh] rounded-lg"
            />

            <X
              className="absolute top-2 right-2 text-white cursor-pointer"
              onClick={() => setShowImageModal(false)}
            />
          </div>
        </div>
      )}

      {/* MESSAGE BUBBLE */}
      <div
        className={`max-w-xs px-4 py-2 rounded-2xl text-sm shadow ${isMine
            ? "bg-blue-500 text-white rounded-br-none"
            : "bg-gray-200 text-gray-800 rounded-bl-none"
          }`}
      >
        {/* IMAGE */}
        {isImage && (
          <img
            src={msg.message}
            alt="img"
            className="rounded-lg max-w-[250px] cursor-pointer"
            onClick={() => setShowImageModal(true)}
          />
        )}
        {/*VIDEO FILE*/}
       {isVideo ? (
  <div className="flex flex-col gap-1">
    {/* <span className="font-medium">{msg.attachment?.filename}</span> */}

    {msg.attachment?.size ? (
      <span className="text-xs">
        {formatFileSize(msg.attachment.size)}
      </span>
    ) : null}
  </div>
) : null}
        {/* FILE / PDF / DOC */}
        {!isImage && !isText && (
          <div className="flex flex-col gap-1">
            <span className="font-medium">
              {msg.attachment?.filename}
            </span>
            {msg.attachment?.size && (
              <span className="text-xs">
                {formatFileSize(msg.attachment.size)}
              </span>
            )}
          </div>
        )}

        {/* TEXT */}
        {isText && (
          <p className="whitespace-pre-wrap">{msg.message}</p>
        )}

        {/* ACTIONS */}
        {!isText && (
          <div className="flex gap-2 mt-2">




            {/* OPEN */}
            <button
              onClick={() => {
                if (isImage) {
                  setShowImageModal(true);
                  return;
                }

                if (isPdfOrDoc) {
                  {console.log("clicked for pdf")}
                  setShowPdfModal(true);
                  return;
                  // openPdfInGoogleViewer(msg.message);
                }

                if(isVideo){
                  setShowVideoModal(true);
                  return;
                }
              }}
              className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
            >
              Open
            </button>

            {/* DOWNLOAD */}
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
        )}

        {/* DELETE - Now shows for ALL messages (removed isMine condition) */}
        <div className="flex justify-end mt-1">
          <Trash
            onClick={() => {
              console.log("🗑️ Delete clicked for message:", msg.id);
              handleDeleteMessage(msg.id);
            }}
            className={`w-3 h-3 cursor-pointer ${isMine ? "text-red-400" : "text-red-600"}`}
          />
        </div>
      </div>
    </>
  );
}