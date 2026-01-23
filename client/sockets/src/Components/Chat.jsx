import React, { useContext, useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import MessageBody from "./MessageBody";
import { AppContext } from "../Context/AppContext";
import { getUsers } from "../api/users";

const Chat = () => {
  const { token } = useContext(AppContext);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---------------- FETCH CONTACTS ----------------
  useEffect(() => {
    if (!token) return;

    const fetchContacts = async () => {
      try {
        setLoading(true);
        const data = await getUsers(); // token handled in axios instance
        setContacts(data.contacts || []);
      } catch (err) {
        setError(err.message || "Failed to load contacts");
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [token]);

  return (
    <div className="h-screen w-screen flex">
      {/* Sidebar (left) */}
      <div className="w-80 border-r">
        <Sidebar contacts={contacts} loading={loading} error={error} />
      </div>

      {/* Message Body (right) */}
      <div className="flex-1">
        <MessageBody />
      </div>
    </div>
  );
};

export default Chat;
