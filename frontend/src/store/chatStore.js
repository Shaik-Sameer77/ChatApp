import { create } from "zustand";
import axiosInstance from "../services/url.service.js";
import { getSocket } from "../services/chat.service.js";

export const useChatStore = create((set, get) => ({
  conversations: [], //list of all conversations
  currentConversation: null,
  messages: [],
  loading: false,
  error: null,
  onlineUsers: new Map(),
  typingUsers: new Map(),

  //socket event listeners setup
  initsocketListeners: () => {
    const socket = getSocket();
    if (!socket) return;

    // remove exiting listeners to prevent duplicate handlers
    socket.off("receive_message");
    socket.off("user_typing");
    socket.off("user_status");
    socket.off("message_send");
    socket.off("message_error");
    socket.off("message_deleted");

    //listen for incoming messages
    // in initsocketListeners function
    socket.on("receive_message", (message) => {
      // Add the message only if the user is viewing the relevant conversation
      if (message.conversation === get().currentConversation) {
        set((state) => ({ messages: [...state.messages, message] }));
      }

      // Refresh the conversations list to update the last message in the sidebar
      get().fetchConversations();
    });

    // confirm message delivery
    socket.on("message_send", (message) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === message._id ? { ...msg } : msg
        ),
      }));
    });

    //update message status
    socket.on("message_status_update", ({ messageId, messageStatus }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, messageStatus } : msg
        ),
      }));
    });

    //handle reaction on message

    socket.on("reaction_update", ({ messageId, reactions }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, reactions } : msg
        ),
      }));
    });

    // handle remove message from loacl state
    socket.on("message_deleted", ({ deletedMessageId }) => {
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== deletedMessageId),
      }));
    });

    // handle any message sending error
    socket.on("message_error", (error) => {
      console.error("message_error", error);
    });

    // listener for typing users
    socket.on("user_typing", ({ userId, conversationId, isTyping }) => {
      set((state) => {
        const newTypingUsers = new Map(state.typingUsers);
        if (!newTypingUsers.has(conversationId)) {
          newTypingUsers.set(conversationId, new Set());
        }
        const typingSet = newTypingUsers.get(conversationId);
        if (isTyping) {
          typingSet.add(userId);
        } else {
          typingSet.delete(userId);
        }

        return { typingUsers: newTypingUsers };
      });
    });

    // track users online/offline status

    socket.on("user_status", ({ userId, isOnline, lastSeen }) => {
      set((state) => {
        const newOnlineUsers = new Map(state.onlineUsers);
        newOnlineUsers.set(userId, { isOnline, lastSeen });
        return { onlineUsers: newOnlineUsers };
      });
    });

    // emit status check for all users in conversation list
    const { conversations } = get();
    if (conversations?.data?.length > 0) {
      conversations.data?.forEach((conv) => {
        const otherUser = conv.participants.find(
          (p) => p._id !== get().currentUser._id
        );
        if (otherUser._id) {
          socket.emit("get_user_status", otherUser._id, (status) => {
            set((state) => {
              const newOnlineUsers = new Map(state.onlineUsers);
              newOnlineUsers.set(status.userId, {
                isOnline: status.isOnline,
                lastSeen: status.lastSeen,
              });
              return { onlineUsers: newOnlineUsers };
            });
          });
        }
      });
    }
  },

  setCurrentUser: (user) => set({ currentUser: user }),

  fetchConversations: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosInstance.get("/chats/conversations");
      set({ conversations: data, loading: false });
      get().initsocketListeners();
      return data;
    } catch (error) {
      set({
        error: error?.response?.data?.message || error?.message,
        loading: false,
      });
      return null;
    }
  },

  //   fetch message for a conversation
  fetchMessages: async (conversationId) => {
    if (!conversationId) return;
    set({ loading: true, error: null });
    try {
      const { data } = await axiosInstance.get(
        `/chats/conversations/${conversationId}/messages`
      );
      const messageArray = data.data || data || [];
      set({
        messages: messageArray,
        currentConversation: conversationId,
        loading: false,
      });

      // mark unread message as read
      const { markMessagesAsRead } = get();
      markMessagesAsRead();

      return messageArray;
    } catch (error) {
      set({
        error: error?.response?.data?.message || error?.message,
        loading: false,
      });
      return [];
    }
  },

  //   send message in realtime

  sendMessage: async (formData) => {
    const senderId = formData.get("senderId");
    const receiverId = formData.get("receiverId");
    const media = formData.get("media");
    const content = formData.get("content");
    const messageStatus = formData.get("messageStatus");

    const socket = getSocket();

    const { conversations } = get();
    let conversationId = null;
    if (conversations?.data?.length > 0) {
      const conversation = conversations.data.find(
        (conv) =>
          conv.participants.some((p) => p._id === senderId) &&
          conv.participants.some((p) => p._id === receiverId)
      );
      if (conversation) {
        conversationId = conversation._id;
        set({ currentConversation: conversationId });
      }
    }

    // temp message before actual response
    const tempId = `temp-${Date.now()}`;
    const optimistMessage = {
      _id: tempId,
      sender: { _id: senderId },
      receiver: { _id: receiverId },
      conversation: conversationId,
      imageOrVideoUrl:
        media && typeof media !== "string" ? URL.createObjectURL(media) : null,
      content: content,
      contentType: media
        ? media.type.startsWith("image")
          ? "image"
          : "video"
        : "text",
      createdAt: new Date().toISOString(),
      messageStatus,
    };

    set((state) => ({
      messages: [...state.messages, optimistMessage],
    }));

    try {
      const { data } = await axiosInstance.post(
        "/chats/send-message",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      const messageData = data.data || data;

      // replace optimistic message with actual message from server
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempId ? messageData : msg
        ),
      }));

      // 1. If a new conversation was created, update the store's currentConversation
      if (messageData.conversation) {
        set({ currentConversation: messageData.conversation });
      }

      // 2. Refresh the conversation list in the sidebar
      get().fetchConversations();

      return messageData;
    } catch (error) {
      console.error("send message error", error);
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempId ? { ...msg, messageStatus: "failed" } : msg
        ),
        error: error?.response?.data?.message || error?.message,
      }));
      throw error;
    }
  },

  // receive message in realtime
  receiveMessage: (message) => {
    if (!message) return;

    const { currentConversation, currentUser, messages } = get();

    const messageExists = messages.some((msg) => msg._id === message._id);
    if (messageExists) return;

    if (message.conversation === currentConversation) {
      set((state) => ({
        messages: [...state.messages, message],
      }));

      //   automatically mark as read
      if (message.receiver?._id === currentUser?._id) {
        get().markMessagesAsRead();
      }
    }

    // update conversation preview and lastMessage
    set((state) => {
      const updatedConversations = state.conversations?.data?.map((conv) => {
        if (conv._id === messageData.conversation) {
          return {
            ...conv,
            lastMessage: messageData,
            unreadCount: conv.unreadCount || 0, // keep same count for sender
          };
        }
        return conv;
      });

      return {
        conversations: {
          ...state.conversations,
          data: updatedConversations,
        },
      };
    });
  },

  //   mark as read
  markMessagesAsRead: async () => {
    const { messages, currentUser, currentConversation } = get();

    if (!messages.length || !currentUser || !currentConversation) return;
    const unreadIds = messages
      .filter(
        (msg) =>
          msg.messageStatus !== "read" && msg.receiver?._id === currentUser?._id
      )
      .map((msg) => msg._id)
      .filter(Boolean);

    if (!unreadIds.length) return;

    try {
      const { data } = await axiosInstance.put(`/chats/messages/read`, {
        messageIds: unreadIds,
      });

      console.log("messages mark as read", data);
      set((state) => ({
        messages: state.messages.map((msg) =>
          unreadIds.includes(msg._id) ? { ...msg, messageStatus: "read" } : msg
        ),
        conversations: {
            ...state.conversations,
            data: state.conversations?.data?.map((conv) => {
                if (conv._id === currentConversation) {
                    // Reset unread count for the currently viewed conversation
                    return { ...conv, unreadCount: 0 }; 
                }
                return conv;
            }),
        }
      }));

      const socket = getSocket();

      if (socket) {
        socket.emit("message_read", {
          messageIds: unreadIds,
          senderId: messages[0]?.sender?._id,
        });
      }
    } catch (error) {
      console.error("failed to mark message as read", error);
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/chats/messages/${messageId}`);
      set((state) => ({
        messages: state.messages?.filter((msg) => msg?._id !== messageId),
      }));
      return true;
    } catch (error) {
      console.log("error deleting message", error);
      set({ error: error.response?.data?.message || error.message });
      return false;
    }
  },

  //   add/change reactions
  addReaction: async (messageId, emoji) => {
    const socket = getSocket();
    const { currentUser } = get();
    if (socket && currentUser) {
      socket.emit("add_reaction", {
        messageId,
        emoji,
        userId: currentUser?._id,
      });
    }
  },

  startTyping: (receiverId) => {
    const { currentConversation } = get();
    const socket = getSocket();
    if (socket && currentConversation && receiverId) {
      socket.emit("typing_start", {
        conversationId: currentConversation,
        receiverId,
      });
    }
  },

  stopTyping: (receiverId) => {
    const { currentConversation } = get();
    const socket = getSocket();
    if (socket && currentConversation && receiverId) {
      socket.emit("typing_stop", {
        conversationId: currentConversation,
        receiverId,
      });
    }
  },

  isUserTyping: (userId) => {
    const { typingUsers, currentConversation } = get();
    if (
      !currentConversation ||
      !typingUsers.has(currentConversation) ||
      !userId
    ) {
      return false;
    }
    return typingUsers.get(currentConversation).has(userId);
  },

  isUserOnline: (userId) => {
    if (!userId) return null;
    const { onlineUsers } = get();
    return onlineUsers.get(userId)?.isOnline || false;
  },

  getUserLastSeen: (userId) => {
    if (!userId) return null;
    const { onlineUsers } = get();
    return onlineUsers.get(userId)?.lastSeen || false;
  },

  cleanup: () => {
    set({
      conversations: [],
      currentConversation: null,
      messages: [],
      onlineUsers: new Map(),
      typingUsers: new Map(),
    });
  },
}));
