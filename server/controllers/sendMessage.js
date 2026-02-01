const Message = require("../models/messageModel");
const cloudinary = require("../config/cloudinary");

async function sendFile(req, res) {
  try {
    const file = req.file;
    const userId = req.userId;
    const { receiverId } = req.body;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "File missing",
      });
    }

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "Receiver ID missing",
      });
    }

    /* ----------------------------------
       🔥 Decide resource_type PROPERLY
    -----------------------------------*/
    let resourceType = "raw"; // default for pdf, doc, etc

    if (file.mimetype.startsWith("image/")) {
      resourceType = "image";
    } else if (file.mimetype.startsWith("video/")) {
      resourceType = "video";
    }

    /* ----------------------------------
       ✅ Upload to Cloudinary
    -----------------------------------*/
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: "chat-files",
      resource_type: resourceType,
      use_filename: true,
      unique_filename: false,
      type: "upload",
    });

    const recievedUrl = uploadResult.secure_url;

    /* ----------------------------------
       ✅ Determine fileType for frontend
    -----------------------------------*/
    let fileType = "file";
    if (file.mimetype.startsWith("image/")) {
      fileType = "image";
    } else if (file.mimetype.startsWith("video/")) {
      fileType = "video";
    }

    /* ----------------------------------
       ✅ Save message
    -----------------------------------*/
    const newMessage = new Message({
      from: userId,
      to: receiverId,
      message: recievedUrl,
      type: fileType,
      attachment: {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
      isRead: false,
    });

    const savedMessage = await newMessage.save();

    /* ----------------------------------
       ✅ WebSocket notify
    -----------------------------------*/
    const { getClient } = require("../wsStore");
    const WebSocket = require("ws");

    const receiverSocket = getClient(receiverId);
    const senderSocket = getClient(userId);

    const payload = {
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

    if (receiverSocket?.readyState === WebSocket.OPEN) {
      receiverSocket.send(JSON.stringify(payload));
    }

    if (senderSocket?.readyState === WebSocket.OPEN) {
      senderSocket.send(JSON.stringify(payload));
    }

    /* ----------------------------------
       ✅ Response
    -----------------------------------*/
    res.json({
      success: true,
      message: "File uploaded successfully",
      data: {
        id: savedMessage._id,
        fileUrl: recievedUrl,
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
