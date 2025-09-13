import React, { useState, useEffect, useContext, useRef } from "react";
import { MoreVertical, Send } from "lucide-react";
import { AppContext } from "../Context/AppContext";
import { apiDeleteMessages, apiGetUserChats } from "../api/messages";
import { Trash } from 'lucide-react';


const MessageBody = () => {
  const { token, backendUrl, receiverName, receiverId, userId,messageInput,setMessageInput,conversation,setConversation} =
    useContext(AppContext);

 

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Fetch chat history
  useEffect(() => {
    async function fetchMessageHistory() {
      try {
        let response = await apiGetUserChats(token, backendUrl, receiverId);
        if (response && Array.isArray(response.data.fetchMessages)) {
          // normalize id types
          const chatHistory = response.data.fetchMessages.map((msg) => ({
            ...msg,
            from: String(msg.from),
            to: String(msg.to),
          }));
          setConversation(chatHistory);
        }
      } catch (err) {
        console.error("Failed to load history:", err);
      }
    }
    if (receiverId) fetchMessageHistory();
  }, [receiverId, token, backendUrl]);

  // WebSocket setup
  useEffect(() => {
    const socket = new WebSocket(`${backendUrl.replace("http", "ws")}`);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: "auth",
          token,
        })
      );
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "recievedMessage") {
          setConversation((prev) => [
            ...prev,
            {
              from: String(data.from),
              to: String(userId),
              message: data.message,
              createdAt: Date.now(),
            },
          ]);
        }
      } catch (err) {
        console.error("Error parsing WS message:", err);
      }
    };

    return () => socket.close();
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  // Send message
  async function sendMessage() {
    if (!messageInput.trim()) return;

    socketRef.current.send(
      JSON.stringify({
        type: "SendMessage",
        text: messageInput,
        to: receiverId,
      })
    );

    setConversation((prev) => [
      ...prev,
      {
        from: String(userId),
        to: String(receiverId),
        message: messageInput,
        createdAt: Date.now(),
      },
    ]);

    setMessageInput("");
  }


 async function deleteMessage(messageId){
  
    let response = await apiDeleteMessages(token,backendUrl,messageId)
    let data = response.data
    if(data.success){
      setConversation((prev)=>(prev.filter((msg)=>(msg.id!==messageId))))
    }
  
 }

  return !receiverName ? (
    <h1 className="text-3xl font-bold p-6">👋 Select a chat to start messaging</h1>
  ) : (
    <div className="flex flex-col flex-1 h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-blue-50 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-600">
            {receiverName ? receiverName[0].toUpperCase() : null}
          </div>
          <h2 className="font-semibold">{receiverName}</h2>
        </div>
        <MoreVertical className="w-5 h-5 text-gray-600 cursor-pointer" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {conversation.map((msg, index) => {
          const isMine = String(msg.from) === String(userId);
          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl text-sm shadow ${
                  isMine
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-800 rounded-bl-none"
                }`}
              >
                <p>{msg.message}</p>
                <div className="flex justify-between items-center mt-1">
  <span className="text-[10px] opacity-70">
    {new Date(msg.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}
  </span >
  <Trash onClick={()=>{
    deleteMessage(msg.id)
  }} className="w-3 h-3 text-red-500 cursor-pointer" />
</div>

                
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t bg-white flex items-center">
        <input
          type="text"
          value={messageInput}
          onKeyDown={(e)=>{
            if(e.key=="Enter"){
              e.preventDefault()
              sendMessage()
            }
          }}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 bg-gray-100 rounded-full outline-none text-sm"
        />
        <button 
          className="ml-3 bg-blue-500 p-2 rounded-full text-white hover:bg-blue-600"
         
          onClick={sendMessage}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MessageBody;
