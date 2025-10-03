const express=require("express")
const { multerMiddleware } = require("../config/cloudinaryConfig.js");
const authMiddleware = require("../middleware/authMiddleware.js");
const { sendMessage, getConversation, getmessages, markAsRead, deleteMessage } = require("../controllers/chatController.js");

const router=express.Router();

router.post("/send-message",authMiddleware,multerMiddleware,sendMessage)
router.get("/conversations",authMiddleware,getConversation)
router.get("/conversations/:conversationId/messages",authMiddleware,getmessages)

router.put('/messages/read',authMiddleware,markAsRead)
router.delete("/messages/:messageId",authMiddleware,deleteMessage)
module.exports=router