const messageModel = require("../models/messageModel")

const Message = require(messageModel)


async function sendMessage(req,res){
          try {
    const senderId = req.user.id
    const { receiverId, text } = req.body

    let media = null
    let mimeType = null

    if (req.file) {
      media = req.file.path
      mimeType = req.file.mimetype
    }

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      text,
      media,
      mimeType
    })

    res.status(201).json({
      success: true,
      message
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }



}

module.exports = sendMessage;