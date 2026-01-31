const express = require("express");
const isLoggedIn = require("../middlewares/isLoggedIn");
const getUserMessages = require("../controllers/userMessage");
const deleteMessages = require("../controllers/deleteMessages");
const upload = require("../config/multer");
const sendFile = require("../controllers/sendMessage");
const { forceDownload } = require("../controllers/download");

const messageRouter = express.Router();

// ✅ Get chat messages
messageRouter.get("/userchats/:receiverId", isLoggedIn, getUserMessages);

// ✅ Delete messages
messageRouter.patch("/deletechats/:messageId", isLoggedIn, deleteMessages);

// ✅ Upload file and send message (HTTP upload → URL)
messageRouter.post("/send-file", isLoggedIn, upload.single("file"), sendFile);
messageRouter.get("/download",forceDownload)

module.exports = messageRouter;