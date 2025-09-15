import React, { useContext, useState } from "react";
import { Search, MoreVertical, MessageSquare } from "lucide-react";
import { AppContext } from "../Context/AppContext";
import { apiSearchUsers } from "../api/users";

const Sidebar = ({ contacts }) => {
  const {
    setreceiverName,
    recieverId,
    setreceiverId,
    userEmail,
    setuserEmail,
    token,
    backendUrl,
  } = useContext(AppContext);

  const [SearchUserData, setSearchUserData] = useState([]);

  // 🔎 Search user
  async function searchUser(Useremail) {
    if (!Useremail.trim()) {
      setSearchUserData([]); // clear search if empty
      return;
    }

    try {
      let response = await apiSearchUsers(token, backendUrl, Useremail);
      let data = response.data || response;

      if (data.success) {
        // backend returns single user, wrap in array for mapping
        setSearchUserData(data.searchedUser ? [data.searchedUser] : []);
      } else {
        setSearchUserData([]);
      }
    } catch (error) {
      console.error("Error searching user:", error);
      setSearchUserData([]);
    }
  }

  return (
    <div className="flex flex-col w-80 h-screen border-r bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-blue-50">
        <h2 className="font-bold text-lg text-blue-600">Chats</h2>
        <div className="flex space-x-3 text-gray-600">
          <MessageSquare className="w-5 h-5 cursor-pointer hover:text-blue-600" />
          <MoreVertical className="w-5 h-5 cursor-pointer hover:text-blue-600" />
        </div>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
          <Search className="w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={userEmail}
            onChange={(e) => {
              const value = e.target.value;
              setuserEmail(value);
              searchUser(value); // ✅ use fresh value
            }}
            placeholder="Search users"
            className="ml-2 bg-transparent outline-none w-full text-sm"
          />
        </div>
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto">
        {(SearchUserData.length > 0 ? SearchUserData : contacts).map((user) => (
          <div
            key={user._id}
            onClick={() => {
              setreceiverName(user.Name);
              setreceiverId(user._id);
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
      </div>
    </div>
  );
};

export default Sidebar;
         