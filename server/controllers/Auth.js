const express = require("express")
const mongoose = require("mongoose")
const userModel = require("../models/userModel")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")


//register Auth
async function registerUser(req,res){
let {email,name,password} = req.body

if(!email||!name||!password){
    return res.json({
        messsage:"invalid fields",
        success:false
    })
}

let user = await userModel.findOne({email:email})

if(user){

  return res.json({
        message:"user already exists",
        success:false
    })
}

if(!user){
    let salt = await bcrypt.genSalt(10)
    let hashedPassword =  await bcrypt.hash(password,salt)
    
   

   let newUser = await userModel.create({
        Name:name,
        email:email,
        password:hashedPassword
    })

     let payload = {
        userId:newUser._id,
        name:name,
        email:email
    }

    let token = jwt.sign(payload,process.env.SECRET_KEY,{expiresIn:"7h"})


    return res.json({
        message:"user created successfully",
        success:true,
        token:token,
        userId:newUser._id,
        name:name
    })

}


}

//login Auth
async function loginUser(req, res) {
    try {
        let { email, password } = req.body;

        // Check required fields
        if (!email || !password) {
            return res.status(400).json({
                message: "Invalid fields",
                success: false
            });
        }

        // Check if user exists
        let user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({
                message: "User not found, please register",
                success: false
            });
        }

        // Validate password
        let isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid credentials",
                success: false
            });
        }

        // Generate JWT token
        let payload = {
            userId: user._id,
            email: user.email,
            name:user.Name
        };

        let token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: "4h" });

        return res.status(200).json({
            message: "Logged in successfully",
            success: true,
            token: token,
            userId:user._id,
            name:user.Name
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
}





// --- GET CONTACTS ---
async function getContacts(req, res) {
  try {
    const currentUserId = req.userId; 

    if (!currentUserId) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    // Fetch all users except the current user
    const users = await userModel.find(
      { _id: { $ne: currentUserId } },
      "_id Name email" // only select these fields
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

module.exports = { loginUser, registerUser, getContacts };

