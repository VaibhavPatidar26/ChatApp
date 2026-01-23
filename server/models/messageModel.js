const mongoose = require("mongoose")

const messageModel = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["text", "image", "video", "file"],
      default: "text",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    deletedfor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ]
  },
  {
    timestamps: true
  }
)

// Clean JSON output
messageModel.set("toJSON", {
  transform: function (doc, ret) {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
  },
})

module.exports = mongoose.model("Message", messageModel)
