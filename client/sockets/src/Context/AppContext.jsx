import React, { createContext, useState } from "react";

export const AppContext = createContext();

const AppProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    return localStorage.getItem("token");
  });
  const [receiverName,setreceiverName] = useState("")
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [receiverId,setreceiverId] = useState(null)
  
    const [messageInput, setMessageInput] = useState("");
    const [conversation, setConversation] = useState([]);
    const [userEmail,setuserEmail] = useState("")
    const [userName,setUserName] = useState(()=>{
      return localStorage.getItem("userName")
    })
  const [userId,setuserId] = useState(()=>{
    return localStorage.getItem("userId")
  })
  return (
    <AppContext.Provider value={{ 
      token,
       setToken,
        backendUrl,
        receiverName,
        setreceiverName,
        receiverId,
        setreceiverId,
        userId,
        setuserId,
       messageInput,
        setMessageInput,
        conversation,
        setConversation,
        userEmail,
        setuserEmail,
        userName,
        setUserName
         }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
