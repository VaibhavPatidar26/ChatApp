const messageModel = require("../models/messageModel")
async function getUserMessages(req,res){

let userId = req.userId
let {receiverId} = req.params

try{
if(!userId){
    return res.json({
        message:"user not found",
        success:false
    })
}

if(userId){

    let fetchMessages = await messageModel.find({$or:[{from:userId,to:receiverId},{from:receiverId,to:userId}],deletedfor:{$ne:userId}})

    console.log(fetchMessages)

    return res.json({
        message:"chat history found",
        success:true,
        fetchMessages
    })
    
}

}
catch(err){
    console.log(err)
    return res.json({
        message:"something went wrong",
        success:false
    })
}


}
module.exports = getUserMessages