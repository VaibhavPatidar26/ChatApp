const express = require("express");
const mongoose = require("mongoose");
const userModel = require("../models/userModel");

async function searchUser(req, res) {
  try {
    const userId = req.userId; 
    const { email } = req.query; 

    if (!userId) {
      return res.json({
        message: "User not logged in",
        success: false,
      });
    }

    if (!email) {
      return res.json({
        message: "Email is required",
        success: false,
      });
    }

    
    const searchedUser = await userModel
      .findOne({ email, _id: { $ne: userId } })
      .select("Name email");

    if (!searchedUser) {
      return res.json({
        message: "User does not exist",
        success: false,
      });
    }

    return res.json({
      message: "User found",
      success: true,
      searchedUser,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      success: false,
      error: error.message,
    });
  }
}

module.exports = searchUser