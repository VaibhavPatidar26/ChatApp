const { getClient } = require("../wsStore");
const WebSocket = require("ws");
const mongoose = require("mongoose");
const messageModel = require("../models/messageModel");

async function SendToOther(req, res) {
  try {
    const { messageId } = req.params;
    const { receiverId } = req.body;
    const userId = req.userId;

    // ✅ Validate inputs
    if (!messageId || !receiverId) {
      return res.status(400).json({
        message: "Message ID and Receiver ID are required",
        success: false,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        message: "Invalid message ID",
        success: false,
      });
    }

    // ✅ Find the original message
    const originalMessage = await messageModel.findById(messageId);

    if (!originalMessage) {
      return res.status(404).json({
        message: "Message not found",
        success: false,
      });
    }

    // ✅ Check permission
    const hasAccess =
      String(originalMessage.from) === String(userId) ||
      String(originalMessage.to) === String(userId);

    if (!hasAccess) {
      return res.status(403).json({
        message: "You don't have permission to forward this message",
        success: false,
      });
    }

    // ✅ Create a complete copy in database
    const forwardedMessage = new messageModel({
      from: userId,
      to: receiverId,
      message: originalMessage.message,
      type: originalMessage.type,
      attachment: originalMessage.attachment,
      isRead: false,
    });

    const savedMessage = await forwardedMessage.save();

    // ✅ Prepare WebSocket payload
    const payload = {
      type: "received-message",
      message: {
        id: savedMessage._id,
        sender: userId,
        receiver: receiverId,
        text: savedMessage.type === "text" ? savedMessage.message : "",
        fileUrl: savedMessage.type !== "text" ? savedMessage.message : undefined,
        fileType: savedMessage.type,
        attachment: savedMessage.attachment,
        createdAt: savedMessage.createdAt,
      },
    };

    // ✅ Get sockets
    const senderSocket = getClient(userId);
    const receiverSocket = getClient(receiverId);

    // ✅ Send to receiver (if online)
    if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
      receiverSocket.send(JSON.stringify(payload));
      console.log(`✅ Message forwarded to receiver: ${receiverId}`);
    }

    // ✅ Send to sender (for multi-device sync)
    if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {
      senderSocket.send(JSON.stringify(payload));
      console.log(`✅ Message sent to sender: ${userId}`);
    }

    // ✅ Return success
    return res.status(200).json({
      message: "Message forwarded successfully",
      success: true,
      data: {
        id: savedMessage._id,
        receiver: receiverId,
        fileType: savedMessage.type,
        createdAt: savedMessage.createdAt,
      },
    });
  } catch (error) {
    console.error("SendToOther error:", error);
    return res.status(500).json({
      message: "Failed to forward message",
      success: false,
      error: error.message,
    });
  }
}

module.exports = SendToOther;