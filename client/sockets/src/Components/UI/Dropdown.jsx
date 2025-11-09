import React, { useState, useRef, useEffect } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";

const MessageDropdown = () => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex items-center" ref={menuRef}>
      {/* Three Dots Button */}
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-full hover:bg-gray-200 transition"
      >
        <BsThreeDotsVertical className="text-gray-700 text-xl" />
      </button>

      {/* Dropdown (opens upward) */}
      {open && (
        <div
          className="absolute bottom-full mb-2 right-0 w-40 bg-white shadow-lg rounded-lg ring-1 ring-black ring-opacity-5 z-20 animate-slide-up-fade"
        >
          <ul className="py-2 text-sm text-gray-700">
            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
              📸 Photos
            </li>
            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
              🎥 Videos
            </li>
            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
              📄 Documents
            </li>
          </ul>
        </div>
      )}

      {/* Tailwind animation keyframes */}
      <style jsx>{`
        @keyframes slideUpFade {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up-fade {
          animation: slideUpFade 0.25s ease-out;
        }
      `}</style>
    </div>
  );
};

export default MessageDropdown;