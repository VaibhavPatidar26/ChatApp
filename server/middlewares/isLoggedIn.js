const jwt = require("jsonwebtoken")

async function isLoggedIn(req,res,next){
const token = req.headers.authorization

try{
if(!token||!token.startsWith("Bearer ")){
    return res.status(403).json({
        message:"token not found",
        success:false
    })
}
const decoded = jwt.verify(token.split(" ")[1],process.env.SECRET_KEY)

let userId=decoded.userId
if(!req.body){
    req.body={}
}
if(userId){
    req.userId = userId
    req.body.userId=userId
   return next()
}
return res.status(403).json({
    message:"token not present",
    success:false
})
}
catch(err){
    console.log(err)
    res.status(403).json({
        message:"internal server error",
        success:false
    })
}
}
module.exports = isLoggedIn