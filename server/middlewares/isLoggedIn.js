const jwt = require("jsonwebtoken")

function isLoggedIn(req, res, next) {
    const token = req.headers.authorization

    try {
        if (!token || !token.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "token not found",
                success: false
            })
        }

        const decoded = jwt.verify(
            token.split(" ")[1],
            process.env.SECRET_KEY
        )

        const userId = decoded.userId

        if (!userId) {
            return res.status(403).json({
                message: "token not present",
                success: false
            })
        }

        // ✅ SAFE place to store auth data
        req.userId = userId

        return next()
    } catch (err) {
        console.log("JWT ERROR:", err.message)
        return res.status(403).json({
            message: "invalid or expired token",
            success: false
        })
    }
}

module.exports = isLoggedIn
