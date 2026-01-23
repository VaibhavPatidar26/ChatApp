const express = require("express");
const mongoose = require("mongoose");
const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// ---------------- REGISTER ----------------
async function registerUser(req, res) {
  try {
    let { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({
        message: "Invalid fields",
        success: false,
      });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
        success: false,
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await userModel.create({
      Name: name,
      email,
      password: hashedPassword,
    });

    // JWT payload
    const payload = {
      userId: newUser._id,
      name: newUser.Name,
      email: newUser.email,
    };

    const token = jwt.sign(payload, process.env.SECRET_KEY, {
      expiresIn: "7h",
    });

    return res.status(201).json({
      message: "User created successfully",
      success: true,
      token,
      userId: newUser._id,
      name: newUser.Name,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
}

// ---------------- LOGIN ----------------
async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Invalid fields",
        success: false,
      });
    }

    // Find user explicitly selecting password
    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      return res.status(404).json({
        message: "User not found, please register",
        success: false,
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
        success: false,
      });
    }

    const payload = {
      userId: user._id,
      name: user.Name,
      email: user.email,
    };

    const token = jwt.sign(payload, process.env.SECRET_KEY, {
      expiresIn: "4h",
    });

    return res.status(200).json({
      message: "Logged in successfully",
      success: true,
      token,
      userId: user._id,
      name: user.Name,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
}

// ---------------- GET CONTACTS ----------------
async function getContacts(req, res) {
  try {
    const currentUserId = req.userId;

    if (!currentUserId) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    const users = await userModel.find(
      { _id: { $ne: currentUserId } },
      "_id Name email"
    );

    return res.status(200).json({
      message: "Contacts fetched successfully",
      success: true,
      contacts: users,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
}

module.exports = { registerUser, loginUser, getContacts };
