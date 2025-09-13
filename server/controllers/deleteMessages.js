const express = require("express")
const mongoose = require("mongoose")
const messageModel = require("../models/messageModel")

async function deleteMessages(req,res){


let userId = req.userId
let {messageId} = req.params

try{
if(!userId){

    return res.json({
        message:"user not logged in",
        success:false
    })
}
 console.log(typeof(userId))
const result = await messageModel.updateOne(
      { _id: messageId },
      { $addToSet: { deletedfor: userId } } // safe: won't duplicate
    );


    if(result.modifiedCount === 0){
        return res.json({
            message:"message do not exist or deleted",
            success:false
        })
    }

    

return res.json({
    message:"message deleted successfully",
    success:true
})
}
catch(err){
    console.log(err)
    return res.json({
        message:"something went wrong",
        success:false
    })
}

}

module.exports= deleteMessages