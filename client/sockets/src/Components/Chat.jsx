import React, { useContext, useEffect } from "react";
import Sidebar from "./Sidebar";   // ✅ import your Sidebar component, not lucide-react
import MessageBody from "./MessageBody";
import { apiGetUsers } from "../api/users";
import { AppContext } from "../Context/AppContext";
import { useState } from "react";
const Chat = () => {
const [contacts , setContacts] = useState([])
const [userName,setuserName] = useState("")

let {token,backendUrl} = useContext(AppContext)
useEffect(()=>{
  async function fetchUsers(){
    let response = await apiGetUsers(token,backendUrl)
    setContacts(response.data.contacts)
  }
  fetchUsers()
},[])



console.log(contacts)
  return (
    <div className="h-screen w-screen flex">
      {/* Sidebar (left) */}
      <div className="w-80 border-r">
        <Sidebar contacts={contacts} />
      </div>

      {/* Message Body (right) */}
      <div className="flex-1">
        <MessageBody />
      </div>
    </div>
  );
};

export default Chat;
