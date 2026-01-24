const express = require("express")
const isLoggedIn = require("../middlewares/isLoggedIn")
const getUserMessages = require("../controllers/userMessage")
const deleteMessages = require("../controllers/deleteMessages")
const upload = require("../config/multer")

const messageRouter = express.Router()


messageRouter.get("/userchats/:receiverId",isLoggedIn,getUserMessages)
messageRouter.patch("/deletechats/:messageId",isLoggedIn,deleteMessages)
messageRouter.post("/send",isLoggedIn,upload.single("file"),)
module.exports = messageRouter