import React from "react";
import { Search, MoreVertical, MessageSquare } from "lucide-react";
import { useContext } from "react";
import { AppContext } from "../Context/AppContext";

const Sidebar = ({contacts}) => {

const {setreceiverName,recieverId,setreceiverId} = useContext(AppContext)

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
            placeholder="Search users"
            className="ml-2 bg-transparent outline-none w-full text-sm"
          />
        </div>
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto">
        {contacts.map((user) => (
          <div
            key={user._id}
            onClick={()=>{
              setreceiverName(user.Name)
              setreceiverId(user._id)
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
              {/* <p className="text-xs text-gray-500 truncate">{user.lastMessage}</p> */}
            </div>

            {/* Time */}
            {/* <span className="text-xs text-gray-400">{user.time}</span> */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
