import React, { use, useEffect, useRef, useState } from "react";
import useThemeStore from "../../store/themeStore.js";
import useUserStore from "../../store/useUserStore.js";
import { isToday, isYesterday, isValid, format } from "date-fns";
import { useChatStore } from "../../store/chatStore.js";
import whatsapp_image from "../../images/whatsapp_image.png";
import {
  FaArrowLeft,
  FaEllipsisV,
  FaFile,
  FaImage,
  FaLock,
  FaPaperclip,
  FaPaperPlane,
  FaSmile,
  FaTimes,
  FaVideo,
} from "react-icons/fa";
import VideoCallManager from "../videoCall/VideoCallManager.jsx";
import MessageBubble from "./MessageBubble.jsx";
import EmojiPicker, { Emoji } from "emoji-picker-react";
import { getSocket } from "../../services/chat.service.js";
import useVideoCallStore from "../../store/videoCallStore.js";

const isValidate = (date) => {
  return date instanceof Date && !isNaN(date);
};

const ChatWindow = ({ selectedContact, setSelectedContact, isMobile }) => {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const typingTimeoutRef = useRef(null);
  const messageEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const { theme } = useThemeStore();
  const { user } = useUserStore();

  const {
    messages,
    sendMessage,
    fetchMessages,
    fetchConversations,
    conversations,
    isUserTyping,
    startTyping,
    stopTyping,
    getUserLastSeen,
    isUserOnline,
    deleteMessage,
    addReaction,
    markMessagesAsRead,
    currentConversation,
  } = useChatStore();

  const socket = getSocket()
  // get online status and lastseen
  const online = isUserOnline(selectedContact?._id);
  const lastSeen = getUserLastSeen(selectedContact?._id);
  const isTyping = isUserTyping(selectedContact?._id);

  // console.log("lastseen:", lastSeen)
  // console.log("this is my contact",selectedContact)

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    // If a contact is selected and has a conversation ID, fetch messages.
    if (selectedContact?.conversation?._id) {
      fetchMessages(selectedContact.conversation._id);
    } else {
      // If there's no conversation ID, it means it's a new chat.
      // We clear previous messages and set the currentConversation to null.
      useChatStore.setState({ messages: [], currentConversation: null });
    }
  }, [selectedContact, fetchMessages]);

  // ✅ NEW/UPDATED: Mark messages as read after they are fetched and the component is mounted
  useEffect(() => {
    // Check if we have messages for the *currently selected* conversation
    const hasMessages = messages.some(
      (msg) => msg.conversation === currentConversation
    );

    // Only mark as read if the conversation is valid and has loaded messages
    if (currentConversation && hasMessages) {
      markMessagesAsRead();
    }

    // This effect should only re-run when messages or the conversation changes
  }, [messages, currentConversation, markMessagesAsRead]);
  // ✅ Scroll to bottom safely whenever new messages arrive
  const scrollToBottom = () => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Scroll on messages change
  useEffect(() => {
    if (messages && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    if (message && selectedContact) {
      startTyping(selectedContact._id);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(selectedContact?._id);
    }, 3000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, selectedContact, startTyping, stopTyping]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setShowFileMenu(false);
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setFilePreview(URL.createObjectURL(file));
      } else {
        // Handle document file preview (show file name)
        setFilePreview(file.name);
      }
    }
  }; // 🚀 CORRECTED: Clears file state immediately for instant UI feedback

  const handleSendMessage = async () => {
    if (!selectedContact || (!message.trim() && !selectedFile)) return; // 1. Capture current values before clearing state

    const currentMessage = message.trim();
    const currentFile = selectedFile; // 2. Clear state immediately for optimistic UI update (instant preview disappearance)

    setMessage("");
    setSelectedFile(null);
    setFilePreview(null);
    setShowFileMenu(false);

    try {
      const formData = new FormData();
      formData.append("senderId", user._id);
      formData.append("receiverId", selectedContact._id);

      const status = online ? "delivered" : "sent";
      formData.append("messageStatus", status); // Use the captured values for the API call

      if (currentMessage) formData.append("content", currentMessage);
      if (currentFile) formData.append("media", currentFile, currentFile.name); // 3. Await the network call and state updates in the store

      const response = await sendMessage(formData); // If this was the first message (no prior conversation), // update the selectedContact in the layout store to include the new conversation ID.

      if (!selectedContact.conversation && response?.conversation) {
        const updatedContact = {
          ...selectedContact,
          conversation: { _id: response.conversation },
        };

        setSelectedContact(updatedContact); // Update layout store state
      }
      // The old state clearing logic is now handled at the start of the function.
    } catch (error) {
      console.error("failed to send message", error);
      // Optional: Re-set the message/file on failure
    }
  };

  const renderDateSeparator = (date) => {
    if (!isValidate(date)) {
      return null;
    }

    let dateString;
    if (isToday(date)) {
      dateString = "Today";
    } else if (isYesterday(date)) {
      dateString = "Yesterday";
    } else {
      dateString = format(date, "EEEE, MMMM d");
    }
    return (
      <div className="flex justify-center my-4">
        <span
          className={`px-4 py-2 rounded-full text-sm ${
            theme === "dark"
              ? "bg-gray-700 text-gray-300"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {dateString}
        </span>
      </div>
    );
  };

  const groupedMessages = Array.isArray(messages)
    ? messages.reduce((acc, message) => {
        // check if createdAt exists
        if (!message.createdAt) return acc;

        // convert to date
        const date = new Date(message.createdAt);

        // validate the date
        if (isValid(date)) {
          const dateString = format(date, "yyyy-MM-dd");

          // initialize array for that date if not present
          if (!acc[dateString]) acc[dateString] = [];

          // push this message into that date bucket
          acc[dateString].push(message);
        } else {
          console.error("Invalid date in message:", message);
        }

        return acc;
      }, {})
    : {};

  const handleReaction = (messageId, emoji) => {
    addReaction(messageId, emoji);
  };

  const handleVideoCall=()=>{
    if(selectedContact && online){
      const {initiateCall}=useVideoCallStore.getState();

      const avatar = selectedContact?.profilePicture;

      initiateCall(selectedContact._id,selectedContact?.username,avatar,"video")
    }else{
      alert("User is offline . Cannot initiate the call")
    }
  }

  if (!selectedContact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center mx-auto h-screen text-center">
        <div className="max-w-md">
          <img src={whatsapp_image} alt="WhatsApp" className="w-full h-auto" />
          <h2
            className={`text-3xl font-semibold mb-4 ${
              theme === "dark" ? "text-white" : "text-black"
            }`}
          >
            Select a conversation to start chatting
          </h2>
          <p
            className={`${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            } mb-6`}
          >
            Choose a contact from the list on the left side to begin messaging
          </p>
          <p
            className={`${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            } text-sm mt-8 flex items-center justify-center gap-2`}
          >
            <FaLock className="h-4 w-4" />
            your personal messages are end-to-end encrypted
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 h-screen w-full flex flex-col">
        <div
          className={`p-4 ${
            theme === "dark"
              ? "bg-[#303430] text-white"
              : "bg-[rgb(239,242,245)] text-gray-600"
          } flex items-center`}
        >
          <button
            className="mr-2 focus:outline-none"
            onClick={() => setSelectedContact(null)}
          >
            <FaArrowLeft className="h-6 w-6" />
          </button>
          <img
            src={selectedContact?.profilePicture}
            alt={selectedContact?.username}
            className="h-10 w-10 rounded-full"
          />

          <div className="ml-3 flex-grow">
            <h2 className="font-semibold text-start">
              {selectedContact?.username}
            </h2>
            {isTyping ? (
              <div>Typing...</div>
            ) : (
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {online
                  ? "Online"
                  : lastSeen
                  ? `Last seen at ${format(new Date(lastSeen), "hh:mm a")}`
                  : "Offline"}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <button className="focus:outline-none" onClick={handleVideoCall} title={online ? "Start Video Call":"User is offline" }>
              <FaVideo className="h-5 w-5 text-green-500 hover:text-green-600" />
            </button>
            <button className="focus:outline-none">
              <FaEllipsisV className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div
          className={`flex-1 p-4 overflow-y-auto ${
            theme === "dark" ? "bg-[#191a1a]" : "bg-[rgb(241,236,229)]"
          }`}
        >
          {/* ✅ FIX: The filter now uses the reliable currentConversation ID from the store */}
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <React.Fragment key={date}>
              {renderDateSeparator(new Date(date))}
              {msgs
                .filter((msg) => msg.conversation === currentConversation)
                .map((msg) => (
                  <MessageBubble
                    key={msg._id || msg.tempId}
                    message={msg}
                    theme={theme}
                    currentUser={user}
                    onReact={handleReaction}
                    deleteMessage={deleteMessage}
                  />
                ))}
            </React.Fragment>
          ))}
          <div ref={messageEndRef} />
        </div>
        {filePreview && (
          <div className="p-2 relative">
            {selectedFile?.type.startsWith("video/") ? (
              <video
                src={filePreview}
                controls
                className="w-80 object-cover rounded shadow-lg mx-auto"
              />
            ) : (
              <img
                src={filePreview}
                alt="file-preview"
                className="w-80 object-cover rounded shadow-lg mx-auto"
              />
            )}

            <button
              onClick={() => {
                setFilePreview(null);
                setSelectedFile(null);
              }}
              className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 "
            >
              <FaTimes className="h-4 w-4" />
            </button>
          </div>
        )}
        <div
          className={`p-4 ${
            theme === "dark" ? "bg-[#303430]" : "bg-white"
          } flex items-center space-x-2 relative`}
        >
          <button
            className="focus:outline-none"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <FaSmile
              className={`h-6 w-6 ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            />
          </button>
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute left-0 bottom-16 z-50"
            >
              <EmojiPicker
                onEmojiClick={(emojiObject) => {
                  setMessage((prev) => prev + emojiObject.emoji);
                  setShowEmojiPicker(false);
                }}
                theme={theme}
              />
            </div>
          )}
          <div>
            <div className="relative">
              <button
                className="focus:outline-none"
                onClick={() => setShowFileMenu(!showFileMenu)}
              >
                <FaPaperclip
                  className={`h-6 w-6 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  } mt-2`}
                />
              </button>
              {showFileMenu && (
                <div
                  className={`absolute bottom-full left-0 mb-2 ${
                    theme === "dark" ? "bg-gray-700" : "bg-white"
                  } rounded-lg shadow-lg`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,video/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className={`flex items-center px-4 py-2 w-full transition-colors ${
                      theme === "dark"
                        ? "hover:bg-gray-500"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <FaImage className="mr-2" />
                    Image/Video
                  </button>
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className={`flex items-center px-4 py-2 w-full transition-colors ${
                      theme === "dark"
                        ? "hover:bg-gray-500"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <FaFile className="mr-2" />
                    Documents
                  </button>
                </div>
              )}
            </div>
          </div>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSendMessage();
              }
            }}
            placeholder="Type a message"
            className={`flex-grow px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 ${
              theme === "dark"
                ? "bg-gray-700 text-white border-gray-600 "
                : "bg-gray-100 text-gray-800 border-gray-300 "
            }`}
          />
          <button onClick={handleSendMessage} className="focus:outline-none">
            <FaPaperPlane className="h-6 w-6 text-green-500" />
          </button>
        </div>
      </div>

      <VideoCallManager socket={socket}/>
    </>
  );
};

export default ChatWindow;
