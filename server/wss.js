const WebSocket = require("ws");
const jwt = require("jsonwebtoken");

function wssServer(server) {
  const clients = new Map();
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (socket) => {
    console.log("🔌 New WebSocket connection");

    let userId = null;

    // ---------- Handle incoming messages ----------
    socket.on("message", async (rawMessage) => {
      let data;
      try {
        data = JSON.parse(rawMessage);
      } catch (err) {
        console.error("Invalid JSON:", err);
        return socket.send(JSON.stringify({ error: "Invalid JSON" }));
      }

      try {
        // ---------- AUTH ----------
        if (data.type === "auth") {
          const decoded = jwt.verify(data.token, process.env.SECRET_KEY);
          userId = decoded.userId;

          // Kick old session
          if (clients.has(userId)) {
            try { clients.get(userId).close(); } catch {}
          }

          clients.set(userId, socket);
          socket.send(JSON.stringify({ type: "authSuccess", userId }));
          console.log(`✅ User authenticated: ${userId}`);
          return;
        }

        // ---------- BLOCK UNAUTH ----------
        if (!userId) return socket.send(JSON.stringify({ error: "Not authenticated" }));

        // ---------- NEW MESSAGE ----------
        if (data.type === "new-message") {
          const { message } = data;
          if (!message || !message.receiver) {
            return socket.send(JSON.stringify({ error: "Invalid message payload" }));
          }

          const receiverSocket = clients.get(message.receiver);
          if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
            try {
              receiverSocket.send(JSON.stringify({ type: "received-message", message }));
            } catch (err) {
              console.error("Failed to send message to receiver:", err);
            }
          }
        }

        // ---------- READ RECEIPT ----------
        if (data.type === "message-read") {
          const receiverSocket = clients.get(data.to);
          if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
            try {
              receiverSocket.send(JSON.stringify(data));
            } catch (err) {
              console.error("Failed to send read receipt:", err);
            }
          }
        }
      } catch (err) {
        console.error("WebSocket message handler error:", err);
      }
    });

    // ---------- Handle socket close ----------
    socket.on("close", () => {
      if (userId && clients.get(userId) === socket) {
        clients.delete(userId);
      }
      console.log(`❌ User disconnected: ${userId}`);
    });

    // ---------- Handle socket errors ----------
    socket.on("error", (err) => {
      console.error("WebSocket socket error:", err);
    });
  });
}

module.exports = wssServer;
