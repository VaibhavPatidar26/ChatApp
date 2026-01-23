const userModel = require("../models/userModel");

async function searchUser(req, res) {
  try {
    const userId = req.userId;
    const { email } = req.query;

    if (!userId) {
      return res.status(401).json({
        message: "User not logged in",
        success: false
      });
    }

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
        success: false
      });
    }

    // normalize email to match schema
    const searchedUser = await userModel
      .findOne({
        email: email.toLowerCase(),
        _id: { $ne: userId }
      })
      .select("Name email");

    if (!searchedUser) {
      return res.status(404).json({
        message: "User does not exist",
        success: false
      });
    }

    return res.status(200).json({
      message: "User found",
      success: true,
      searchedUser
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
      success: false
    });
  }
}

module.exports = searchUser;
