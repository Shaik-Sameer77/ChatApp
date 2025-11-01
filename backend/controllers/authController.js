const User = require("../models/User-model.js");
const sendOtpToEmail = require("../services/emailService.js");
const otpGenerate = require("../utils/otpGenerator.js");
const response = require("../utils/responseHandler.js");
const twilioService = require("../services/twilioService.js");
const generateToken = require("../utils/generateToken.js");
const { uploadFileToCloudinary } = require("../config/cloudinaryConfig.js");
const Conversation = require("../models/Conversation-model.js");

// Step-1 Send Otp
const sendOtp = async (req, res) => {
  const { phoneNumber, phoneSuffix, email } = req.body;
  const otp = otpGenerate();
  const expiry = new Date(Date.now() + 5 * 60 * 1000);
  let user;

  try {
    if (email) {
      user = await User.findOne({ email });
      if (!user) {
        user = new User({ email });
      }
      user.emailOtp = otp;
      user.emailOtpExpiry = expiry;
      await user.save();
      await sendOtpToEmail(email, otp);
      return response(res, 200, "Otp sent to your email", { email });
    }

    if (!phoneNumber || !phoneSuffix) {
      return response(res, 400, "Phone number and phone suffix are required");
    }

    const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`;

    user = await User.findOne({ phoneNumber, phoneSuffix });
    if (!user) {
      user = new User({ phoneNumber, phoneSuffix });
    }

    await twilioService.sendOtpToPhoneNumber(fullPhoneNumber);
    await user.save();

    return response(res, 200, "Otp sent successfully", user);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal Server error");
  }
};

// step-2 verify otp

const verifyOtp = async (req, res) => {
  const { phoneNumber, phoneSuffix, email, otp } = req.body;
  let user;
  try {
    if (email) {
      user = await User.findOne({ email });
      if (!user) {
        return response(res, 404, "User not found");
      }
      const now = new Date();
      if (
        !user.emailOtp ||
        String(user.emailOtp) !== String(otp) ||
        now > new Date(user.emailOtpExpiry)
      ) {
        return response(res, 400, "Invalid or Expiried Otp");
      }
      user.isVerified = true;
      user.emailOtp = null;
      user.emailOtpExpiry = null;
      await user.save();
    } else {
      if (!phoneNumber || !phoneSuffix) {
        return response(res, 400, "Phone number and phone suffix are required");
      }
      const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`;
      user = await User.findOne({ phoneNumber, phoneSuffix });
      if (!user) {
        return response(res, 404, "User not found");
      }
      const result = await twilioService.verifyPhoneNumberOtp(
        fullPhoneNumber,
        otp
      );
      if (result.status !== "approved") {
        return response(res, 400, "Invalid Otp");
      }
      user.isVerified = true;
      await user.save();
    }
    const token = generateToken(user?._id);
    res.cookie("auth_token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    return response(res, 200, "Otp Verified sucessfully", { token, user });
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal Server error");
  }
};

// updateProfile

const updateProfile = async (req, res) => {
  const { username, agreed, about } = req.body;
  const userId = req.user.userId;
  try {
    const user = await User.findById(userId);
    const file = req.file;
    if (file) {
      const uploadResult = await uploadFileToCloudinary(file);
      // console.log(uploadResult);
      user.profilePicture = uploadResult?.secure_url;
    } else if (req.body.profilePicture) {
      user.profilePicture = req.body.profilePicture;
    }

    if (username) user.username = username;
    if (agreed) user.agreed = agreed;
    if (about) user.about = about;
    await user.save();

    return response(res, 200, "user profile updated succesfully", user);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal Server error");
  }
};

// checkAuthenticated
const checkAuthenticated = async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!userId) {
      return response(
        res,
        404,
        "unauthorization ! please login before access our app"
      );
    }
    const user = await User.findById(userId);
    if (!user) {
      return response(res, 404, "User not found");
    }
    return response(res, 200, "user retrived and allow to use whatsapp", user);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal Server error");
  }
};

// logout

const logOut = (req, res) => {
  try {
    res.cookie("auth_token", "", { expires: new Date(0) });
    return response(res, 200, "user logged out successfully");
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal Server error");
  }
};

// getAllUsers

const getAllUsers = async (req, res) => {
  const loggedInUser = req.user.userId;
  try {
    const users = await User.find({ _id: { $ne: loggedInUser } })
      .select(
        "username profilePicture lastSeen isOnline about phoneNumber phoneSuffix"
      )
      .lean();

    const usersWithConversation = await Promise.all(
      users.map(async (user) => {
        const conversation = await Conversation.findOne({
          participants: { $all: [loggedInUser, user?._id] },
        })
          .populate({
            path: "lastMessage",
            select: "content createdAt sender receiver",
          })
          .lean();

        return {
          ...user,
          conversation: conversation || null,
        };
      })
    );

    return response(
      res,
      200,
      "users retrived successfully",
      usersWithConversation
    );
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal Server error");
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  updateProfile,
  logOut,
  checkAuthenticated,
  getAllUsers,
};
