require("dotenv").config()
const express = require("express")
const mongoose = require("mongoose")
const wssServer = require("./wss")
const cors = require("cors")
const http = require("http")
const userRouter = require("./Routes/userRouter")
const { dbConnect } = require("./config/mongodb")
const messageRouter = require("./Routes/messageRouter")

const PORT = process.env.SERVER_PORT || 3000
const FRONTEND_URI = process.env.FRONTEND_URL
const path = require("path")
const app = express()

dbConnect()
// Middlewares
app.use(express.json())
app.use(cors({
    origin: true,
    credentials: true
}))


app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Routes

app.use("/api/users", userRouter)
app.use("/api/messages",messageRouter)

const server = http.createServer(app)
wssServer(server)

// Start Server
server.listen(PORT,"0.0.0.0", () => {
    console.log(`🚀 Server + WSS running on port ${PORT}`)
})
app.get("/",(req,res)=>{
    res.send("server running")
})