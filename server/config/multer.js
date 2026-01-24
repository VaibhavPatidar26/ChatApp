const multer = require("multer")

const storage = multer.diskStorage({
    destination : "uploads/",
    filename : function(req,file,cb){
        cb(null,Date.now()+"_"+file.originalname)
    }
})
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/pdf"
    ]

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error("Invalid file type"), false)
    }
}

const upload = multer({storage,fileFilter,limits:{fileSize:10*1024*1024}})

module.exports = upload