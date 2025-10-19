// src/components/HomePage.jsx

import React, { useEffect, useState, useMemo } from "react";
import Layout from "./Layout.jsx";
import { motion } from "framer-motion";
import ChatList from "../pages/chatSection/ChatList.jsx";
import { useChatStore } from "../store/chatStore.js";
import useUserStore from "../store/useUserStore.js";
import { getAllUsers } from "../services/user.service.js";
import { initializeSocket } from "../services/chat.service.js";

const HomePage = () => {
  const [allUsers, setAllUsers] = useState([]);
  const { conversations, fetchConversations, setCurrentUser } = useChatStore();
  const { user: currentUser } = useUserStore();

  useEffect(() => {
    if (currentUser) {
      initializeSocket();
      setCurrentUser(currentUser);
    }

    const fetchAllData = async () => {
      try {
        // 1. Fetch all users first
        const usersResult = await getAllUsers();
        if (usersResult.status === "success") {
          setAllUsers(usersResult.data);
        }
        // 2. Then, fetch existing conversations
        await fetchConversations();
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    fetchAllData();
  }, [fetchConversations, currentUser, setCurrentUser]);

  // ✅ FIX: useMemo hook to efficiently merge users and conversations
  const combinedContacts = useMemo(() => {
    if (!allUsers.length || !currentUser) {
      return [];
    }

    // Create a map of all users (excluding the current user) for easy lookup
    const usersMap = new Map(
      allUsers
        .filter((u) => u._id !== currentUser._id)
        .map((user) => [user._id, { ...user, conversation: null }]) // Initialize with no conversation
    );

    // If conversations exist, "hydrate" the user entries with conversation data
    if (conversations?.data) {
      conversations.data.forEach((conv) => {
        const otherParticipant = conv.participants.find(
          (p) => p._id !== currentUser._id
        );
        if (otherParticipant && usersMap.has(otherParticipant._id)) {
          const existingUser = usersMap.get(otherParticipant._id);
          usersMap.set(otherParticipant._id, {
            ...existingUser,
            conversation: conv, // Attach the full conversation object
          });
        }
      });
    }

    // Convert the map back to an array
    const mergedList = Array.from(usersMap.values());

    // Sort the list: users with conversations on top, sorted by latest message
    mergedList.sort((a, b) => {
      const aTime = a.conversation?.lastMessage?.createdAt;
      const bTime = b.conversation?.lastMessage?.createdAt;

      if (aTime && bTime) {
        return new Date(bTime) - new Date(aTime); // Most recent first
      }
      if (aTime) return -1; // a has a conversation, b doesn't -> a comes first
      if (bTime) return 1; // b has a conversation, a doesn't -> b comes first
      return (a.username || "").localeCompare(b.username || ""); // Fallback: sort by username
    });

    return mergedList;
  }, [allUsers, conversations, currentUser]);

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-full"
      >
        {/* Pass the newly created combined list to ChatList */}
        <ChatList contacts={combinedContacts} />
      </motion.div>
    </Layout>
  );
};

export default HomePage;