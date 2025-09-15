const express = require("express");
const { registerUser, loginUser, getContacts } = require("../controllers/Auth");
const isLoggedIn = require("../middlewares/isLoggedIn");
const searchUser = require("../controllers/searchUser");
const userRouter = express.Router();

// Public routes
userRouter.post("/login", loginUser);
userRouter.post("/register", registerUser);

// Protected route: get contacts
userRouter.get("/contacts", isLoggedIn, getContacts);
userRouter.get("/searchusers",isLoggedIn,searchUser)

module.exports = userRouter;
