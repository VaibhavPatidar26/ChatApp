const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const url = require("url");
const messageModel = require("./models/messageModel");


async function wssServer(server) {
  let clients = []; // store connected users

  const wss = new WebSocket.Server({ server });   

  wss.on("connection", (socket, req) => {
    console.log("some connection  found")
    let userId = null
    try {
      socket.on("message",async (message)=>{
        let data = JSON.parse(message)

        if(data.type==="auth"){
          let token = data.token
          let decoded = jwt.verify(token,process.env.SECRET_KEY)
          userId = decoded.userId
          let name = decoded.name
          clients.push({userId,socket})
          console.log(`user authenticated with name ${name} and id ${userId}`)
          
        }
        if(data.type==="SendMessage"){
          let message = data.text
          let receiverId = data.to
          await messageModel.create({
            from:userId, to:receiverId, type:"text", message:message, isRead:false,
          })
          let reciever = clients.find((c)=>(c.userId===receiverId))
          if(reciever){
            reciever.socket.send(JSON.stringify({
              message:data.text,
              from:userId,
              type:"recievedMessage"
            }))
            return
          }

        }
        
      })
     

     
       

      // Handle client disconnect
      socket.on("close", () => {
        console.log(`❌ User ${userId} disconnected`);
        clients = clients.filter((c) => c.userId !== userId);
      });

    } catch (err) {
      console.error("❌ Auth failed:", err.message);
      socket.send(JSON.stringify({ error: "Unauthorized" }));
      socket.close();
    }
  });
}

module.exports = wssServer;
