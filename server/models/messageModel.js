const mongoose = require("mongoose")
const messageModel = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",   // sender
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",   // receiver
      required: true,
    },
    message: {
      type: String,
      required: true,
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
    deletedfor : [{
      type:mongoose.Schema.Types.ObjectId,
      ref:"ChatUser"
    }]
  },
  { timestamps: {type:Date,
    default:Date.now()
  } }
);

// This ensures when you call .toJSON() or res.json(msg) 
// it removes __v and formats _id properly
messageModel.set("toJSON", {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

module.exports = mongoose.model("Message",messageModel)