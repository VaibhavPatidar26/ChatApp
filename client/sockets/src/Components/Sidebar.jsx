import React, { useContext, useState } from "react";
import { LogOut, MessageCircle, MoreVertical, Search } from "lucide-react";
import { AppContext } from "../Context/AppContext";
import { searchUsers } from "../api/users"; // refactored API
import { useNavigate } from "react-router-dom";

const Sidebar = ({ contacts, error, loading: contactsLoading }) => {
  const {
    setReceiverName,
    setReceiverId,
    receiverId,
    setToken,
    userName,
  } = useContext(AppContext);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // ---------------- LOGOUT ----------------
  const logoutHandler = () => {
    localStorage.removeItem("token");
    setToken(null);
    navigate("/");
  };

  // ---------------- SEARCH USER ----------------
  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const data = await searchUsers(query); // token handled in axios instance
      setSearchResults(data.success && data.searchedUser ? [data.searchedUser] : []);
    } catch {
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- DISPLAY LIST ----------------
  const userList = searchResults.length > 0 ? searchResults : contacts;

  return (
    <div className="flex h-screen w-80 flex-col bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Chats</h2>
                <p className="text-xs text-slate-500">Hi {userName || "there"}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <button
              type="button"
              onClick={logoutHandler}
              title="Log out"
              className="rounded-full p-2 hover:bg-slate-100 hover:text-blue-600"
            >
              <LogOut className="h-5 w-5" />
            </button>
            <button
              type="button"
              title="More"
              className="rounded-full p-2 hover:bg-slate-100 hover:text-blue-600"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="border-b border-slate-100 p-3">
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search users"
            className="ml-2 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto p-2">
        {contactsLoading && (
          <div className="space-y-2 p-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex animate-pulse items-center gap-3 rounded-xl p-2">
                <div className="h-11 w-11 rounded-full bg-slate-200" />
                <div className="flex-1">
                  <div className="h-3 w-28 rounded bg-slate-200" />
                  <div className="mt-2 h-2 w-20 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && !contactsLoading && (
          <div className="m-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {userList.map((user) => (
          <div
            key={user._id}
            onClick={() => {
              setReceiverName(user.Name);
              setReceiverId(user._id);
            }}
            className={`mb-1 flex cursor-pointer items-center rounded-xl p-3 transition ${
              String(receiverId) === String(user._id)
                ? "bg-blue-50 text-blue-700"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            {/* Avatar */}
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-full font-semibold ${
                String(receiverId) === String(user._id)
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {user.Name[0].toUpperCase()}
            </div>

            {/* Info */}
            <div className="ml-3 min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold">{user.Name}</h3>
              <p className="mt-0.5 truncate text-xs text-slate-400">Tap to open conversation</p>
            </div>
          </div>
        ))}

        {loading && <p className="mt-3 text-center text-sm text-slate-500">Searching...</p>}
        {!loading && !contactsLoading && userList.length === 0 && (
          <div className="px-4 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Search className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700">No users found</p>
            <p className="mt-1 text-xs text-slate-400">Try another name or email.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
