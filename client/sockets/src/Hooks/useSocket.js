import { useEffect, useRef } from "react";

export const useSocket = ({ token, backendUrl, userId, receiverId, onMessage }) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!receiverId) return;

    const ws = new WebSocket(`${backendUrl.replace("http", "ws")}`);
    socketRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "auth", token }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "received-message" || data.type === "new-message") {
          onMessage && onMessage(data.message);
        }
      } catch (err) {
        console.error("WS parse error:", err);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => ws.close();
  }, [backendUrl, token, receiverId, userId, onMessage]);

  const sendMessage = (messagePayload) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(messagePayload));
    }
  };

  return { sendMessage };
};
