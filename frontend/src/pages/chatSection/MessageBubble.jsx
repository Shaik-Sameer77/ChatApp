import { format } from "date-fns";
import React, { useRef, useState } from "react";
import {
  FaCheck,
  FaCheckDouble,
  FaPlus,
  FaRegCopy,
  FaSmile,
  FaTrash,
} from "react-icons/fa";
import { HiDotsVertical } from "react-icons/hi";
import useOutsideClick from "../../hooks/useOutsideclick.js";
import EmojiPicker from "emoji-picker-react";
import { RxCross2 } from "react-icons/rx";

const MessageBubble = ({
  message,
  theme,
  currentUser,
  onReact,
  deleteMessage,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [openEmojiPickerUpward, setOpenEmojiPickerUpward] = useState(false);

  const messageRef = useRef(null);
  const optionRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const reactionsMenuRef = useRef(null);

  const isUserMessage =
    message.sender?._id?.toString() === currentUser?._id?.toString();

  const bubbleClass = isUserMessage ? "chat-end" : "chat-start";

  const bubbleContentClass = isUserMessage
    ? `chat-bubble md:max-w-[50%] min-w-[130px] ${
        theme === "dark" ? "bg-[#144d38] text-white" : "bg-[#d9fdd3] text-black"
      }`
    : `chat-bubble md:max-w-[50%] min-w-[130px] ${
        theme === "dark" ? "bg-[#144d38] text-white" : "bg-white text-black"
      }`;

  const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  const handleReact = (emoji) => {
    onReact(message._id, emoji);
    setShowEmojiPicker(false);
    setShowReactions(false);
  };

  useOutsideClick(emojiPickerRef, () => {
    if (showEmojiPicker) setShowEmojiPicker(false);
  });

  useOutsideClick(reactionsMenuRef, () => {
    if (showReactions) setShowReactions(false);
  });

  useOutsideClick(optionRef, () => {
    if (showOptions) setShowOptions(false);
  });

  if (!message) return null;

  const timestamp = message?.createdAt
    ? format(new Date(message.createdAt), "HH:mm")
    : "";

  // Handle ⋮ options popup direction
  const handleToggleOptions = () => {
    setShowOptions((prev) => {
      const newValue = !prev;
      if (!prev && messageRef.current) {
        const rect = messageRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const estimatedMenuHeight = 120;
        setOpenUpward(spaceBelow < estimatedMenuHeight);
      }
      return newValue;
    });
  };

  // ✅ CORRECTED: Handle Emoji Picker positioning (up/down)
  const handleToggleEmojiPicker = () => {
    if (!showEmojiPicker && messageRef.current) {
      const rect = messageRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const estimatedHeight = 350; // height of emoji picker

      // Open upwards ONLY if there's not enough space below AND there IS enough space above.
      // Otherwise, default to opening downwards.
      const shouldOpenUp = spaceBelow < estimatedHeight && spaceAbove > estimatedHeight;
      setOpenEmojiPickerUpward(shouldOpenUp);
    }
    setShowEmojiPicker((prev) => !prev);
  };

  return (
    <div className={`chat ${bubbleClass}`}>
      <div
        className={`${bubbleContentClass} relative group ${
          message.reactions?.length > 0 ? "mb-6" : ""
        }`}
        ref={messageRef}
      >
        {/* Message Content */}
        <div className="flex justify-center gap-2">
          {message.contentType === "text" && (
            <p className="mr-2">{message.content}</p>
          )}
          {message.contentType === "image" && (
            <div className="flex flex-col items-center">
              <img
                src={message.imageOrVideoUrl}
                alt="image-video"
                className="max-w-xs rounded-lg"
              />
              {message.content && <p className="mt-2">{message.content}</p>}
            </div>
          )}
          {message.contentType === "video" && (
            <div className="flex flex-col items-center">
              <video
                src={message.imageOrVideoUrl}
                alt="image-video"
                controls
                className="max-w-xs rounded-lg"
              />
              {message.content && <p className="mt-2">{message.content}</p>}
            </div>
          )}
        </div>

        {/* Timestamp + Status */}
        <div className="self-end flex items-center justify-end gap-1 text-xs opacity-60 mt-2 ml-2">
          <span>{timestamp}</span>
          {isUserMessage && (
            <>
              {message.messageStatus === "sent" && <FaCheck size={12} />}
              {message.messageStatus === "delivered" && (
                <FaCheckDouble size={12} />
              )}
              {message.messageStatus === "read" && (
                <FaCheckDouble size={12} className="text-blue-900" />
              )}
            </>
          )}
        </div>

        {/* ⋮ Options Button */}
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button
            onClick={handleToggleOptions}
            className={`p-1 rounded-full ${
              theme === "dark" ? "text-white" : "text-gray-800"
            }`}
          >
            <HiDotsVertical size={18} />
          </button>
        </div>

        {/* 😊 Emoji Reaction Button */}
        <div
          className={`absolute ${
            isUserMessage ? "-left-10" : "-right-10"
          } top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2`}
        >
          <button
            onClick={() => {
              setShowReactions(!showReactions);
              setShowEmojiPicker(false);
            }}
            className={`p-2 rounded-full ${
              theme === "dark"
                ? "bg-[#202c33] hover:bg-[#202c33]/80"
                : "bg-white hover:bg-gray-100"
            } shadow-lg`}
          >
            <FaSmile
              className={`${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            />
          </button>
        </div>

        {/* 😍 Reactions Popup */}
        {showReactions && (
          <div
            ref={reactionsMenuRef}
            className={`absolute ${
              isUserMessage ? "right-14" : "left-14"
            } top-1/2 transform -translate-y-1/2 flex items-center bg-[#202c33]/90 rounded-full px-2 py-1.5 gap-1 shadow-lg z-50`}
          >
            {quickReactions.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleReact(emoji)}
                className="hover:scale-125 transition-transform p-1"
              >
                {emoji}
              </button>
            ))}
            <div className="w-[1px] h-5 bg-gray-600 mx-1" />
            <button
              className="hover:bg-[#ffffff1a] rounded-full p-1"
              onClick={() => {
                setShowReactions(false);
                handleToggleEmojiPicker();
              }}
            >
              <FaPlus className="h-4 w-4 text-gray-300 " />
            </button>
          </div>
        )}

        {/* 🎉 Emoji Picker Popup */}
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className={`absolute z-50 ${
              isUserMessage ? "right-0" : "left-0"
            } ${
              // ✅ CORRECTED: Swapped classes to correctly position the picker
              openEmojiPickerUpward ? "bottom-full mb-3" : "top-full mt-3"
            }`}
          >
            <div
              className={`relative rounded-xl overflow-hidden shadow-xl ${
                theme === "dark" ? "bg-[#202c33]" : "bg-white"
              }`}
            >
              <EmojiPicker
                onEmojiClick={(emojiObject) => handleReact(emojiObject.emoji)}
                theme={theme === "dark" ? "dark" : "light"}
                width={280}
                height={350}
              />
              <button
                onClick={() => setShowEmojiPicker(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              >
                <RxCross2 />
              </button>
            </div>
          </div>
        )}

        {/* ❤️ Existing Reactions Display */}
        {message.reactions && message.reactions.length > 0 && (
          <div
            className={`absolute -bottom-5 ${
              isUserMessage ? "right-2" : "left-2"
            } ${
              theme === "dark" ? "bg-[#2a3942]" : "bg-gray-200"
            } rounded-full px-2 shadow-lg`}
          >
            {message.reactions.map((reaction, index) => (
              <span key={index} className="mr-1">
                {reaction.emoji}
              </span>
            ))}
          </div>
        )}

        {/* 📋 Options Menu */}
        {showOptions && (
          <div
            ref={optionRef}
            className={`absolute ${
              openUpward ? "bottom-8" : "top-8"
            } right-1 z-50 w-36 rounded-xl shadow-lg py-2 text-sm transition-all duration-150 ${
              theme === "dark"
                ? "bg-[#1d1f1f] text-white"
                : "bg-gray-100 text-black"
            }`}
          >
            <button
              onClick={() => {
                if (message.contentType === "text") {
                  navigator.clipboard.writeText(message.content);
                }
                setShowOptions(false);
              }}
              className="flex items-center w-full px-4 py-2 gap-3 rounded-lg hover:bg-gray-200/20"
            >
              <FaRegCopy size={14} />
              <span>Copy</span>
            </button>

            {isUserMessage && (
              <button
                onClick={() => {
                  deleteMessage(message._id);
                  setShowOptions(false);
                }}
                className="flex items-center w-full px-4 py-2 gap-3 rounded-lg text-red-600 hover:bg-red-600/10"
              >
                <FaTrash className="text-red-600" size={14} />
                <span>Delete</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;