import { useState } from "react";
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Forward message</h2>
            <p className="mt-1 text-sm text-slate-500">Choose a contact to receive this message.</p>
          </div>
          <button onClick={onClose} title="Close" className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-slate-100 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search contacts"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white"
              autoFocus
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredContacts.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-slate-400">
              <User size={48} className="mb-2 opacity-50" />
              <p className="text-sm">No contacts found</p>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div
                key={contact._id}
                onClick={() => onSelect(contact)}
                className="mb-1 flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white ${getAvatarColor(contact.Name)}`}>
                  {getInitials(contact.Name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="truncate font-medium text-slate-800">{contact.Name}</h3>
                  {contact.email && (
                    <p className="truncate text-xs text-slate-500">{contact.email}</p>
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
