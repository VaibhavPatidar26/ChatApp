const messageModel = require("../models/messageModel");

async function getUserMessages(req, res) {
  try {
    let userId = req.userId;
    let { receiverId } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "user not found",
        success: false
      });
    }

    if (!receiverId) {
      return res.status(400).json({
        message: "receiverId is required",
        success: false
      });
    }

    let fetchMessages = await messageModel
      .find({
        $or: [
          { from: userId, to: receiverId },
          { from: receiverId, to: userId }
        ],
        deletedfor: { $ne: userId }
      })
      .sort({ createdAt: 1 }); // 👈 VERY IMPORTANT for chat UI

    return res.status(200).json({
      message: "chat history found",
      success: true,
      fetchMessages
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "something went wrong",
      success: false
    });
  }
}

module.exports = getUserMessages;
