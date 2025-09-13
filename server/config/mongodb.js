const mongoose=require("mongoose")


module.exports.dbConnect = async()=>{

    try{
        await mongoose.connect(process.env.MONGOOSE_URI)
        console.log("database connected")
    }
   catch(error){
    console.log(error)
   }
}