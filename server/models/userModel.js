const mongoose = require("mongoose")
const schema = mongoose.Schema()

let userModel = new mongoose.Schema({

    Name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    }
})

module.exports = mongoose.model("ChatUser",userModel)