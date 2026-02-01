const multer = require("multer")

const storage = multer.diskStorage({
    destination : "uploads/",
    filename : function(req,file,cb){
        cb(null,Date.now()+"_"+file.originalname)
    }
})
const fileFilter = (req, file, cb) => {
    cb(null,true)
}

const upload = multer({storage,fileFilter,limits:{fileSize:100*1024*1024}})

module.exports = upload