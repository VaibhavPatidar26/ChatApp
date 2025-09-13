const express = require("express")
const isLoggedIn = require("../middlewares/isLoggedIn")
const getUserMessages = require("../controllers/userMessage")
const deleteMessages = require("../controllers/deleteMessages")

const messageRouter = express.Router()


messageRouter.get("/userchats/:receiverId",isLoggedIn,getUserMessages)
messageRouter.patch("/deletechats/:messageId",isLoggedIn,deleteMessages)
module.exports = messageRouter