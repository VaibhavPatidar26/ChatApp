const express = require("express");
const { registerUser, loginUser, getContacts } = require("../controllers/Auth");
const isLoggedIn = require("../middlewares/isLoggedIn")
const userRouter = express.Router();

// Public routes
userRouter.post("/login", loginUser);
userRouter.post("/register", registerUser);

// Protected route: get contacts
userRouter.get("/contacts", isLoggedIn, getContacts);

module.exports = userRouter;
