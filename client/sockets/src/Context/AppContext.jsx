import React, { createContext, useState, useEffect } from "react";

export const AppContext = createContext();

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const AppProvider = ({ children }) => {
  // ---------------- AUTH STATES ----------------
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [userId, setUserId] = useState(() => localStorage.getItem("userId"));
  const [userName, setUserName] = useState(() => localStorage.getItem("userName"));
  const [userEmail, setUserEmail] = useState("");

  // ---------------- CHAT STATES ----------------
  const [receiverId, setReceiverId] = useState(null);
  const [receiverName, setReceiverName] = useState("");
  const [conversation, setConversation] = useState([]);
  const [messageInput, setMessageInput] = useState("");

  // ---------------- EFFECTS ----------------
  // keep localStorage in sync with state
  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");

    if (userId) localStorage.setItem("userId", userId);
    else localStorage.removeItem("userId");

    if (userName) localStorage.setItem("userName", userName);
    else localStorage.removeItem("userName");
  }, [token, userId, userName]);

  // ---------------- CONTEXT VALUE ----------------
  const contextValue = {
    backendUrl,       // constant, read-only
    token,
    setToken,
    userId,
    setUserId,
    userName,
    setUserName,
    userEmail,
    setUserEmail,
    receiverId,
    setReceiverId,
    receiverName,
    setReceiverName,
    conversation,
    setConversation,
    messageInput,
    setMessageInput,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
