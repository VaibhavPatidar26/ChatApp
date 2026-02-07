import React, { useState } from "react";
import { X, Search, User } from "lucide-react";

export default function ContactSelectModal({ isOpen, onClose, contacts, onSelect }) {
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const filteredContacts = contacts.filter((contact) =>
    contact.Name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (name) => {
    const colors = [
      "bg-blue-500", "bg-purple-500", "bg-pink-500", "bg-green-500",
      "bg-yellow-500", "bg-red-500", "bg-indigo-500", "bg-teal-500"
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-xl font-semibold">Select Contact</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
              <User size={48} className="mb-2 opacity-50" />
              <p className="text-sm">No contacts found</p>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div
                key={contact._id}
                onClick={() => onSelect(contact)}
                className="flex items-center gap-3 p-3 mb-1 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(contact.Name)}`}>
                  {getInitials(contact.Name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-800 truncate">{contact.Name}</h3>
                  {contact.email && (
                    <p className="text-xs text-gray-500 truncate">{contact.email}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}