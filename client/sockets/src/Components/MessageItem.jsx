import React, { useState, useEffect } from "react";
import { Trash } from "lucide-react";
import { fetchFileForPreview } from "../Hooks/fetchFile";

export default function MessageItem({ msg, isMine, handleDeleteMessage, formatFileSize }) {
  const [fileUrl, setFileUrl] = useState(null); // blob for preview & download
  const [previewOpen, setPreviewOpen] = useState(false);

  const isImage = msg.fileType === "image";

  // Fetch blob only for video/document files
  useEffect(() => {
    let isMounted = true;
    if (!isImage && msg.fileType !== "text") {
      fetchFileForPreview(msg).then((url) => {
        if (isMounted) setFileUrl(url);
      }).catch(err => console.error("Fetch preview failed", err));
    }
    return () => { isMounted = false; };
  }, [msg]);

  return (
    <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm shadow ${isMine ? "bg-blue-500 text-white rounded-br-none" : "bg-gray-200 text-gray-800 rounded-bl-none"}`}>
      
      {/* Inline Image */}
      {isImage && (
        <img
          src={msg.message}
          alt={msg.attachment?.filename || "Image"}
          className="rounded-lg max-w-[250px]"
        />
      )}

      {/* Video / Document placeholder */}
      {!isImage && msg.fileType !== "text" && (
        <div className="flex flex-col gap-1">
          <span className="font-medium">{msg.attachment?.filename}</span>
          {msg.attachment?.size && <span className="text-xs">{formatFileSize(msg.attachment.size)}</span>}
        </div>
      )}

      {/* Text */}
      {msg.fileType === "text" && <p className="whitespace-pre-wrap break-words">{msg.message}</p>}

      {/* OPEN / DOWNLOAD buttons */}
      {msg.fileType !== "text" && (
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => setPreviewOpen(true)}
            className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
          >
            Open
          </button>
          <button
            onClick={async () => {
              try {
                const url = isImage ? msg.message : await fetchFileForPreview(msg);
                const a = document.createElement("a");
                a.href = url;
                a.download = msg.attachment?.filename || "file";
                a.click();
              } catch (err) {
                console.error("Download failed", err);
              }
            }}
            className="px-2 py-1 bg-green-500 text-white rounded text-xs"
          >
            Download
          </button>
        </div>
      )}

      {/* Preview modal */}
      {previewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="relative bg-white p-4 rounded max-w-[90vw] max-h-[90vh] overflow-auto">
            <button
              onClick={() => setPreviewOpen(false)}
              className="absolute top-2 right-2 text-red-500 font-bold"
            >
              Close
            </button>

            {isImage && <img src={msg.message} className="max-h-[80vh]" />}
            {msg.fileType === "video" && fileUrl && <video src={fileUrl} controls className="max-h-[80vh]" />}
            {["file","document"].includes(msg.fileType) && fileUrl && (
              <iframe src={fileUrl} className="w-[80vw] h-[80vh]" title={msg.attachment?.filename}></iframe>
            )}
          </div>
        </div>
      )}

      {/* Delete button */}
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
  );
}
