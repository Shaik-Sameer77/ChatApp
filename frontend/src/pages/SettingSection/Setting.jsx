import React, { useState } from "react";
import useThemeStore from "../../store/themeStore.js";
import { logoutUser } from "../../services/user.service.js";
import useUserStore from "../../store/useUserStore.js";
import { toast } from "react-toastify";
import Layout from "../../components/Layout.jsx";
import {
  FaComment,
  FaMoon,
  FaQuestion,
  FaQuestionCircle,
  FaSearch,
  FaSignInAlt,
  FaSun,
  FaUser,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import useLayoutStore from "../../store/layOutStore.js";
import { useChatStore } from "../../store/chatStore.js";

const Setting = () => {
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);
const {cleanup}=useChatStore()
  const { user, clearUser } = useUserStore();
  const { theme } = useThemeStore();

  const toggleThemeDialog = () => {
    setIsThemeDialogOpen(!isThemeDialogOpen);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      localStorage.removeItem("auth_token");
      clearUser();
      cleanup();
      useLayoutStore.getState().setSelectedContact(null);
      useLayoutStore.getState().setActiveTab("chats");
      toast.success("user logged out successfully");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <Layout
      isThemeDialogOpen={isThemeDialogOpen}
      toggleThemeDialog={toggleThemeDialog}
    >
      <div
        className={`flex h-screen ${
          theme === "dark"
            ? "bg-[rgb(17,27,33)] text-white"
            : "bg-white text-black"
        }`}
      >
        <div
          className={`w-full border-r flex flex-col justify-between ${
            theme === "dark" ? "border-gray-600" : "border-gray-200"
          }`}
        >
          {/* Header + Search */}
          <div className="p-4">
            <h1 className="text-xl font-semibold mb-4">Settings</h1>
            <div className="relative mb-4">
              <FaSearch className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search settings"
                className={`w-full ${
                  theme === "dark"
                    ? "bg-[#202c33] text-white"
                    : "bg-gray-100 text-black"
                } border-none pl-10 placeholder-gray-400 rounded p-2`}
              />
            </div>

            {/* Profile section */}
            <div
              className={`flex items-center gap-4 p-3 ${
                theme === "dark" ? "hover:bg-[#202c33]" : "hover:bg-gray-100"
              } rounded-lg cursor-pointer mb-4`}
            >
              <img
                src={user.profilePicture}
                alt="profile"
                className="w-14 h-14 rounded-full"
              />
              <div>
                <h2 className="font-semibold">{user?.username}</h2>
                <p className="text-sm text-gray-400">{user?.about}</p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="flex-1 overflow-y-auto px-4">
            <div className="space-y-1">
              {[
                { icon: FaUser, label: "Account", href: "/user-profile" },
                { icon: FaComment, label: "Chats", href: "/" },
                { icon: FaQuestionCircle, label: "Help", href: "/help" },
              ].map((item) => (
                <Link
                  to={item.href}
                  key={item.label}
                  className={`w-full flex items-center gap-3 p-2 rounded ${
                    theme === "dark"
                      ? "text-white hover:bg-[#202c33]"
                      : "text-black hover:bg-gray-100"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <div
                    className={`border-b ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    } w-full p-2`}
                  >
                    {item.label}
                  </div>
                </Link>
              ))}

              {/* Theme button */}
              <button
                onClick={toggleThemeDialog}
                className={`w-full flex items-center gap-3 p-2 rounded ${
                  theme === "dark"
                    ? "text-white hover:bg-[#202c33]"
                    : "text-black hover:bg-gray-100"
                }`}
              >
                {theme === "dark" ? (
                  <FaMoon className="h-5 w-5" />
                ) : (
                  <FaSun className="h-5 w-5" />
                )}
                <div
                  className={`flex flex-col text-start border-b ${
                    theme === "dark" ? "border-gray-700" : "border-gray-200"
                  } w-full p-2`}
                >
                  Theme
                  <span className="ml-auto text-sm text-gray-400">
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Logout button (sticky bottom) */}
          <div
            className={`sticky bottom-0 p-4 border-t ${
              theme === "dark" ? "border-gray-700" : "border-gray-200"
            } bg-inherit`}
          >
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 justify-center py-2 rounded font-medium transition ${
                theme === "dark"
                  ? "text-red-400 hover:bg-[#202c33]"
                  : "text-red-500 hover:bg-gray-100"
              }`}
            >
              <FaSignInAlt className="h-5 w-5" /> Log out
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Setting;
