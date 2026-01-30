const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const {
  addClient,
  removeClient,
  getClient,
} = require("./wsStore");
const saveMessage = require("./controllers/saveMessage.controller");

function wssServer(server) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (socket) => {
    console.log("🔌 New WebSocket connection");

    let userId = null;

    socket.on("message", (rawMessage) => {
      let data;

      // ---------- PARSE ----------
      try {
        data = JSON.parse(rawMessage.toString());
      } catch {
        socket.send(
          JSON.stringify({ type: "error", message: "Invalid JSON" })
        );
        return;
      }

      try {
        // ---------- AUTH ----------
        if (data.type === "auth") {
          const decoded = jwt.verify(
            data.token,
            process.env.SECRET_KEY
          );

          userId = decoded.userId;

          // Close existing connection if user reconnects
          const existingSocket = getClient(userId);
          if (existingSocket && existingSocket !== socket) {
            existingSocket.close();
            removeClient(userId);
          }

          addClient(userId, socket);

          socket.send(
            JSON.stringify({
              type: "auth-success",
              userId,
            })
          );

          console.log(`✅ User authenticated: ${userId}`);
          return;
        }

        if (!userId) {
          socket.send(
            JSON.stringify({
              type: "error",
              message: "Not authenticated",
            })
          );
          return;
        }

        // ---------- NEW MESSAGE ----------
        if (data.type === "new-message") {
          // ✅ Save message to database first
          saveMessage(data.message)
            .then((savedMessage) => {
              const payload = JSON.stringify({
                type: "received-message",
                message: savedMessage,
              });

              // send to receiver
              const receiverSocket = getClient(data.message.receiver);
              if (receiverSocket?.readyState === WebSocket.OPEN) {
                receiverSocket.send(payload);
              }

              // send back to sender (IMPORTANT)
              const senderSocket = getClient(userId);
              if (senderSocket?.readyState === WebSocket.OPEN) {
                senderSocket.send(payload);
              }

              console.log(`💾 Message saved and sent: ${savedMessage.id}`);
            })
            .catch((err) => {
              console.error("Failed to save message:", err);
              
              // Send error back to sender
              const senderSocket = getClient(userId);
              if (senderSocket?.readyState === WebSocket.OPEN) {
                senderSocket.send(
                  JSON.stringify({
                    type: "error",
                    message: "Failed to save message",
                  })
                );
              }
            });
        }

        // ---------- READ RECEIPT ----------
        if (data.type === "message-read") {
          const receiverSocket = getClient(data.to);
          if (receiverSocket?.readyState === WebSocket.OPEN) {
            receiverSocket.send(JSON.stringify(data));
          }
        }
      } catch (err) {
        console.error("WebSocket handler error:", err);
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(
            JSON.stringify({
              type: "error",
              message: "Internal server error",
            })
          );
        }
      }
    });

    socket.on("close", () => {
      if (userId) {
        removeClient(userId, socket);
        console.log(`❌ User disconnected: ${userId}`);
      }
    });

    socket.on("error", (err) => {
      console.error("WebSocket error:", err);
    });
  });
}

module.exports = wssServer;