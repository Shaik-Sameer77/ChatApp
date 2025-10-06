import React, { useEffect, useState } from "react";
import Layout from "./Layout.jsx";
import { motion } from "framer-motion";
import ChatList from "../pages/chatSection/ChatList.jsx";
import useLayoutStore from "../store/layOutStore.js";
import { getAllUsers } from "../services/user.service.js";

const HomePage = () => {
  const setSelectedContact = useLayoutStore(
    (state) => state.setSelectedContact
  );
  const [allUsers, setAllUsers] = useState([]);
  const getAllUser = async () => {
    try {
      const result = await getAllUsers();
      if (result.status === "success") {
        setAllUsers(result.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getAllUser();
  }, []);

  console.log(allUsers)
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-full"
      >
        <ChatList contacts={allUsers}/>
      </motion.div>
    </Layout>
  );
};

export default HomePage;
