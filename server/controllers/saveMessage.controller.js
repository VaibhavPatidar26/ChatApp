const Message = require("../models/messageModel");

async function saveMessage(messageData) {
  try {
    const { sender, receiver, text, fileUrl, fileType, attachment } = messageData;

    // ✅ Determine message content and type
    const messageContent = fileUrl || text || "";
    const messageType = fileType || "text";

    // ✅ Create new message
    const newMessage = new Message({
      from: sender,
      to: receiver,
      message: messageContent,
      type: messageType,
      attachment: attachment || undefined, // Only include if provided
      isRead: false,
    });

    const savedMessage = await newMessage.save();
    
    // ✅ Return in format frontend expects
    return {
      id: savedMessage._id,
      sender: savedMessage.from,
      receiver: savedMessage.to,
      text: messageType === "text" ? savedMessage.message : "", // Only return text for text messages
      fileUrl: messageType !== "text" ? savedMessage.message : undefined, // Return fileUrl for file messages
      fileType: savedMessage.type,
      attachment: savedMessage.attachment,
      isRead: savedMessage.isRead,
      createdAt: savedMessage.createdAt,
    };
  } catch (err) {
    console.error("Failed to save message to DB:", err);
    throw err;
  }
}

module.exports = saveMessage;