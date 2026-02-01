const messageModel = require("../models/messageModel");
const mongoose = require("mongoose");

async function deleteMessages(req, res) {
  const userId = req.userId;
  const { messageId } = req.params;

  try {
    if (!userId) {
      return res.status(401).json({
        message: "user not logged in",
        success: false,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        message: "invalid message id",
        success: false,
      });
    }

    // 1️⃣ Fetch message first (SQL: SELECT *)
    const message = await messageModel.findById(messageId);

    if (!message) {
      return res.status(404).json({
        message: "message not found",
        success: false,
      });
    }

    // 2️⃣ Authorization check (SQL WHERE from OR to)
    if (
      message.from.toString() !== userId &&
      message.to.toString() !== userId
    ) {
      return res.status(403).json({
        message: "not allowed to delete this message",
        success: false,
      });
    }

    // 3️⃣ Already deleted?
    if (message.deletedfor?.includes(userId)) {
      return res.status(200).json({
        message: "message already deleted",
        success: true,
      });
    }

    // 4️⃣ Perform delete (soft delete)
    await messageModel.updateOne(
      { _id: messageId },
      { $addToSet: { deletedfor: userId } }
    );

    return res.status(200).json({
      message: "message deleted successfully",
      success: true,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "something went wrong",
      success: false,
    });
  }
}

module.exports = deleteMessages;
