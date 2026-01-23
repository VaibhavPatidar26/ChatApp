import React, { useContext, useState } from "react";
import { Search, MoreVertical, LogOut } from "lucide-react";
import { AppContext } from "../Context/AppContext";
import { searchUsers } from "../api/users"; // refactored API
import { useNavigate } from "react-router-dom";

const Sidebar = ({ contacts }) => {
  const {
    setReceiverName,
    setReceiverId,
    token,
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
    } catch (err) {
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- DISPLAY LIST ----------------
  const userList = searchResults.length > 0 ? searchResults : contacts;

  return (
    <div className="flex flex-col w-80 h-screen border-r bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-blue-50">
        <h2 className="font-bold text-lg text-blue-600">Chats</h2>
        <span className="text-sm text-gray-700">Hi {userName}</span>
        <div className="flex space-x-3 text-gray-600">
          <LogOut
            onClick={logoutHandler}
            className="w-5 h-5 cursor-pointer hover:text-blue-600"
          />
          <MoreVertical className="w-5 h-5 cursor-pointer hover:text-blue-600" />
        </div>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
          <Search className="w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search users"
            className="ml-2 bg-transparent outline-none w-full text-sm"
          />
        </div>
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto">
        {userList.map((user) => (
          <div
            key={user._id}
            onClick={() => {
              setReceiverName(user.Name);
              setReceiverId(user._id);
            }}
            className="flex items-center p-3 hover:bg-gray-100 cursor-pointer border-b"
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-600">
              {user.Name[0].toUpperCase()}
            </div>

            {/* Info */}
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-semibold">{user.Name}</h3>
            </div>
          </div>
        ))}

        {loading && <p className="text-center text-sm text-gray-500 mt-2">Searching...</p>}
        {!loading && userList.length === 0 && (
          <p className="text-center text-sm text-gray-500 mt-2">No users found</p>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
