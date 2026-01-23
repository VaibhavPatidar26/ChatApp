const mongoose = require("mongoose")

const userModel = new mongoose.Schema(
  {
    Name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      select: false   
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model("ChatUser", userModel)
