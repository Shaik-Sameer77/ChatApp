// const multer = require("multer");
// const cloudinary = require("cloudinary").v2;
// const dotenv = require("dotenv");
// const fs = require("fs");

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// const uploadFileToCloudinary = (file) => {
//   const options = {
//     resource_type: file.mimetype.startsWith("video") ? "video" : "image",
//   };

//   return new Promise((resolve, reject) => {
//     const uploader = file.mimetype.startsWith("video")
//       ? cloudinary.uploader.upload_large
//       : cloudinary.uploader.upload;

//       uploader(file.path,options,(error,result)=>{
//         fs.unlink(file.path,()=>{})
//         if(error){
//             return reject(error)
//         }
//         resolve(result)
//       })
//     });
// };


// const multerMiddleware=multer({dest:"uploads/"}).single('media');

// module.exports={
//     uploadFileToCloudinary,
//     multerMiddleware
// }

const multer = require("multer");
const cloudinary = require("cloudinary").v2;

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Use memoryStorage to avoid writing files on Vercel
const storage = multer.memoryStorage();
const multerMiddleware = multer({ storage }).single("media");

// ✅ Upload directly from buffer
const uploadFileToCloudinary = async (file) => {
  if (!file) throw new Error("No file uploaded");

  const options = {
    folder: "whatsapp-clone",
    resource_type: file.mimetype.startsWith("video") ? "video" : "image",
  };

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    // Pass buffer data to Cloudinary
    uploadStream.end(file.buffer);
  });
};

module.exports = {
  uploadFileToCloudinary,
  multerMiddleware,
};
