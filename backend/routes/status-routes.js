const express=require("express")
const { multerMiddleware } = require("../config/cloudinaryConfig.js");
const authMiddleware = require("../middleware/authMiddleware.js");
const { createStatus, getStatuses, viewStatus, deleteStatus, getStatusViewers } = require("../controllers/statusController.js");


const router=express.Router();

router.post("/",authMiddleware,multerMiddleware,createStatus)
router.get("/",authMiddleware,getStatuses)

router.get("/:statusId/viewers", authMiddleware, getStatusViewers);
router.put('/:statusId/view',authMiddleware,viewStatus)
router.delete("/:statusId",authMiddleware,deleteStatus)
module.exports=router