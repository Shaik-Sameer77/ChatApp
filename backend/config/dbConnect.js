const mongoose = require("mongoose")

const ConnectDB= async()=>{
    try {
        await mongoose.connect(process.env.MONGO_URL)
        console.log("Mongoose Connected")
    } catch (error) {
        console.error("error connecting database",error.message)
        process.exit(1)
    }
}

module.exports=ConnectDB