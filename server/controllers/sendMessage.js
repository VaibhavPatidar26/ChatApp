const Message = require("../models/messageModel");
const cloudinary = require("../config/cloudinary"); // You'll need to configure this

async function sendFile(req, res) {
  try {
    const file = req.file;
    const userId = req.userId;
    const { receiverId } = req.body; // ✅ Get receiver from request body

    if (!file) {
      return res.status(400).json({ 
        success: false, 
        message: "File missing" 
      });
    }

    if (!receiverId) {
      return res.status(400).json({ 
        success: false, 
        message: "Receiver ID missing" 
      });
    }

    // ✅ Upload to Cloudinary/S3
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: "chat-files",
      resource_type: "auto", // Handles images, videos, raw files
    });

    // ✅ Determine file type based on mimetype
    let fileType = "file";
    if (file.mimetype.startsWith("image/")) {
      fileType = "image";
    } else if (file.mimetype.startsWith("video/")) {
      fileType = "video";
    }

    // ✅ Save message to database with file URL
    const newMessage = new Message({
      from: userId,
      to: receiverId,
      message: uploadResult.secure_url, // Store the Cloudinary URL
      type: fileType,
      attachment: {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
      isRead: false,
    });

    const savedMessage = await newMessage.save();

    // ✅ Send WebSocket notification (if receiver is online)
    const { getClient } = require("../wsStore");
    const WebSocket = require("ws");
    
    const receiverSocket = getClient(receiverId);
    const senderSocket = getClient(userId);

    const messagePayload = {
      type: "received-message",
      message: {
        id: savedMessage._id,
        sender: savedMessage.from,
        receiver: savedMessage.to,
        text: savedMessage.message,
        fileUrl: savedMessage.message,
        fileType: savedMessage.type,
        attachment: savedMessage.attachment,
        createdAt: savedMessage.createdAt,
      },
    };

    // Notify receiver
    if (receiverSocket?.readyState === WebSocket.OPEN) {
      receiverSocket.send(JSON.stringify(messagePayload));
    }

    // Notify sender (for multi-device sync)
    if (senderSocket?.readyState === WebSocket.OPEN) {
      senderSocket.send(JSON.stringify(messagePayload));
    }

    // ✅ Return success with file URL
    res.json({
      success: true,
      message: "File uploaded successfully",
      data: {
        id: savedMessage._id,
        fileUrl: uploadResult.secure_url,
        fileType,
        createdAt: savedMessage.createdAt,
      },
    });

  } catch (error) {
    console.error("File upload error:", error);
    res.status(500).json({
      success: false,
      message: "File upload failed",
      error: error.message,
    });
  }
}

module.exports = sendFile;