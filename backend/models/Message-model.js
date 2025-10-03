const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      require: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    content: { type: String },
    imageOrVideoUrl: { type: String },
    contentType: { type: String, enum: ["image", "video", "text"] },
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        emoji: String,
      },
    ],
    messageStatus: { type: String, default: "send" },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
