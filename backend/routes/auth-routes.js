const express=require("express")
const { sendOtp, verifyOtp, updateProfile, logOut, checkAuthenticated, getAllUsers } = require("../controllers/authController.js");
const { multerMiddleware } = require("../config/cloudinaryConfig.js");
const authMiddleware = require("../middleware/authMiddleware.js");

const router=express.Router();

router.post("/send-otp",sendOtp)
router.post("/verify-otp",verifyOtp)
router.get("/logout",logOut)


//protected routes
router.put("/update-profile",authMiddleware,multerMiddleware,updateProfile)
router.get("/check-auth",authMiddleware,checkAuthenticated)
router.get("/users",authMiddleware,getAllUsers)
module.exports=router