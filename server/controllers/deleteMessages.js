const messageModel = require("../models/messageModel")
const mongoose = require("mongoose")

async function deleteMessages(req, res) {
  const userId = req.userId
  const { messageId } = req.params

  try {
    if (!userId) {
      return res.status(401).json({
        message: "user not logged in",
        success: false
      })
    }

    // Validate messageId
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        message: "invalid message id",
        success: false
      })
    }

    // Only sender or receiver can delete
    const result = await messageModel.updateOne(
      {
        _id: messageId,
        $or: [{ from: userId }, { to: userId }]
      },
      {
        $addToSet: { deletedfor: userId }
      }
    )

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        message: "message do not exist or already deleted",
        success: false
      })
    }

    return res.status(200).json({
      message: "message deleted successfully",
      success: true
    })

  } catch (err) {
    console.log(err)
    return res.status(500).json({
      message: "something went wrong",
      success: false
    })
  }
}

module.exports = deleteMessages
