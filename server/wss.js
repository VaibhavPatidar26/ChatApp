const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const messageModel = require("./models/messageModel");

function wssServer(server) {

  // userId -> socket
  const clients = new Map();

  const wss = new WebSocket.Server({ server });

  wss.on("connection", (socket) => {
    console.log("🔌 New WebSocket connection");

    let userId = null;

    socket.on("message", async (rawMessage) => {
      let data;

      // -------- Safe JSON parsing --------
      try {
        data = JSON.parse(rawMessage);
      } catch (err) {
        socket.send(JSON.stringify({ error: "Invalid JSON" }));
        return;
      }

      // -------- AUTH --------
      if (data.type === "auth") {
        try {
          const decoded = jwt.verify(data.token, process.env.SECRET_KEY);
          userId = decoded.userId;

          // Remove old connection if exists
          if (clients.has(userId)) {
            clients.get(userId).close();
          }

          clients.set(userId, socket);

          console.log(`✅ User authenticated: ${userId}`);

          socket.send(JSON.stringify({
            type: "authSuccess",
            userId
          }));
        } catch (err) {
          socket.send(JSON.stringify({ error: "Unauthorized" }));
          socket.close();
        }
        return;
      }

      // -------- BLOCK unauthenticated users --------
      if (!userId) {
        socket.send(JSON.stringify({ error: "Not authenticated" }));
        return;
      }

      // -------- SEND MESSAGE --------
      if (data.type === "SendMessage") {
        const { text, to } = data;

        if (!text || !to) {
          socket.send(JSON.stringify({ error: "Invalid message data" }));
          return;
        }

        // Save message
        const msg = await messageModel.create({
          from: userId,
          to,
          type: "text",
          message: text,
          isRead: false
        });

        // Send to receiver if online
        const receiverSocket = clients.get(to);
        if (receiverSocket) {
          receiverSocket.send(JSON.stringify({
            type: "receivedMessage",
            message: text,
            from: userId,
            messageId: msg._id
          }));
        }
      }
    });

    // -------- DISCONNECT --------
    socket.on("close", () => {
      if (userId && clients.get(userId) === socket) {
        clients.delete(userId);
      }
      console.log(`❌ User disconnected: ${userId}`);
    });
  });
}

module.exports = wssServer;
