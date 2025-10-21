import React, { useEffect, useState } from "react";
import useThemeStore from "../../store/themeStore.js";
import useUserStore from "../../store/useUserStore.js";
import useStatusStore from "../../store/useStatusStore.js";
import Layout from "../../components/Layout.jsx";
import StatusPreview from "./StatusPreview.jsx";
import { motion } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import { FaCamera, FaEllipsisH, FaPlus } from "react-icons/fa";
import formatTimestamp from "../../utils/formatTime.js";
import StatusList from "./StatusList.jsx";

const Status = () => {
  const [previewContact, setPreviewContact] = useState(null);
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  const [showOption, setShowOption] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [filePreview, setFilePreview] = useState(null);

  const { theme } = useThemeStore();
  const { user } = useUserStore();

  // status store
  const {
    statuses,
    loading,
    error,
    setStatuses,
    setLoading,
    setError,
    initializeSocket,
    cleanupSocket,
    fetchStatuses,
    createStatus,
    viewStatus,
    deleteStatus,
    getStatusViewers,
    getGroupedStatus,
    getUserStatuses,
    getOtherStatuses,
    clearError,
    reset,
  } = useStatusStore();

  const userStatuses = getUserStatuses(user?._id);
  const otherStatuses = getOtherStatuses(user?._id);
  useEffect(() => {
    fetchStatuses();
    initializeSocket();
    return () => {
      cleanupSocket();
    };
  }, [user?._id]);

  // Clear the error when page is mounts
  useEffect(() => {
    return () => clearError();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setFilePreview(URL.createObjectURL(file));
      } else {
        // Handle document file preview (show file name)
        setFilePreview(file.name);
      }
    }
  };

  const handleCreateStatus = async () => {
    if (!newStatus.trim() && !selectedFile) return;
    try {
      await createStatus({ content: newStatus, file: selectedFile });

      setNewStatus("");
      setSelectedFile(null);
      setFilePreview(null);
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error creating status", error);
    }
  };

  const handleViewStatus = async (statusId) => {
    try {
      await viewStatus(statusId);
    } catch (error) {
      console.error("Error to view status", error);
    }
  };

  const handleDeleteStatus = async (statusId) => {
    try {
      await deleteStatus(statusId);
      setShowOption(false);
      handlePreviewClose();
    } catch (error) {
      console.error("Error to deleting status", error);
    }
  };

  const handlePreviewClose = () => {
    setPreviewContact(null);
    setCurrentStatusIndex(0);
  };

  const handlePreviewNext = () => {
    if (currentStatusIndex < previewContact.statuses.length - 1) {
      setCurrentStatusIndex((prev) => prev + 1);
    } else {
      handlePreviewClose();
    }
  };

  const handlePreviewPrev = () => {
    setCurrentStatusIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleStatusPreview = (contact, statusIndex = 0) => {
    setPreviewContact(contact);
    setCurrentStatusIndex(statusIndex);

    if (contact.statuses[statusIndex]) {
      handleViewStatus(contact.statuses[statusIndex].id);
    }
  };

  return (
    <Layout
      isStatusPreviewOpen={!!previewContact}
      statusPreviewContent={
        previewContact && (
          <StatusPreview
            contact={previewContact}
            currentIndex={currentStatusIndex}
            onClose={handlePreviewClose}
            onNext={handlePreviewNext}
            onPrev={handlePreviewPrev}
            onDelete={handleDeleteStatus}
            theme={theme}
            currentUser={user}
            loading={loading}
          />
        )
      }
    >
      <motion.div
        className={`flex-1 h-screen border-r border-gray-200 ${
          theme === "dark"
            ? "bg-[rgb(12,19,24)] text-white border-gray-600"
            : "bg-gray-100 text-black"
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div
          className={`flex justify-between items-center shadow-md ${
            theme === "dark" ? "bg-[rgb(17,27,33)] " : "bg-white"
          } p-4`}
        >
          <h2 className="text-2xl font-bold">Status</h2>
        </div>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-4 mt-2 ">
            <span className="block sm:inline">
              {error}
              <button
                onClick={clearError}
                className="float-right text-red-500 hover:text-red-700"
              >
                <RxCross2 className="h-5 w-5" />
              </button>
            </span>
          </div>
        )}

        <div className="overflow-y-auto h-[calc(100vh-64px)]">
          <div
            className={`flex p-3 space-x-4 shadow-md ${
              theme === "dark" ? "bg-[rgb(17,27,33)] " : "bg-white"
            }`}
          >
            <div
              className="relative cursor-pointer group"
              onClick={() =>
                userStatuses
                  ? handleStatusPreview(userStatuses)
                  : setShowCreateModal(true)
              }
            >
              <div className="relative w-14 h-14 flex items-center justify-center">
                {/* WhatsApp-style ring if user has statuses */}
                {userStatuses && (
                  <svg
                    className="absolute inset-0 w-full h-full rotate-[-90deg]"
                    viewBox="0 0 100 100"
                  >
                    {userStatuses.statuses.map((_, index) => {
                      const radius = 48;
                      const circumference = 2 * Math.PI * radius;
                      const segmentLength =
                        circumference / userStatuses.statuses.length;
                      const offset = index * segmentLength;
                      return (
                        <circle
                          key={index}
                          cx="50"
                          cy="50"
                          r={radius}
                          fill="none"
                          stroke="#25D366"
                          strokeWidth="4"
                          strokeDasharray={`${segmentLength - 6} 6`}
                          strokeDashoffset={-offset}
                        />
                      );
                    })}
                  </svg>
                )}

                {/* Profile picture */}
                <img
                  src={user?.profilePicture}
                  alt={user?.username}
                  className={`w-12 h-12 rounded-full object-cover z-10 border-2 
        ${theme === "dark" ? "border-gray-700" : "border-white"}
      `}
                />
              </div>

              {/* Add (+) button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCreateModal(true);
                }}
                className={`absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center 
      bg-green-500 text-white shadow-md transition-transform duration-200 hover:scale-110
      ${theme === "dark" ? "shadow-green-900" : "shadow-green-300"}
    `}
              >
                <FaPlus className="h-2.5 w-2.5" />
              </button>
            </div>

            <div className="flex flex-col items-start flex-1">
              <p className="font-semibold">My Status</p>
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {userStatuses
                  ? `${userStatuses.statuses.length} status ${
                      userStatuses?.statuses.length > 1 ? "." : ""
                    } ${formatTimestamp(
                      userStatuses.statuses[userStatuses.statuses.length - 1]
                        .timeStamp
                    )} `
                  : "Tap to add status update"}
              </p>
            </div>

            {userStatuses && (
              <button
                className="ml-auto"
                onClick={() => setShowOption(!showOption)}
              >
                <FaEllipsisH
                  className={`h-5 w-5 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                />
              </button>
            )}
          </div>

          {/* options menu */}

          {showOption && userStatuses && (
            <div
              className={` shadow-md p-2 ${
                theme === "dark" ? "bg-[rgb(17,27,33)] " : "bg-white"
              }`}
            >
              <button
                onClick={() => {
                  setShowCreateModal(true);
                  setShowOption(false);
                }}
                className="w-full text-left text-green-500 py-2 hover:bg-gray-100 px-2 rounded flex items-center"
              >
                <FaCamera className="inline-block mr-2" />
              </button>

              <button
                onClick={() => {
                  handleStatusPreview(userStatuses);
                  setShowOption(false);
                }}
                className="w-full text-left text-blue-500 py-2 hover:bg-gray-100 px-2 rounded"
              >
                View Status
              </button>
            </div>
          )}

          {loading && (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          )}

          {/* Recent update from other users */}
          {!loading && otherStatuses.length > 0 && (
            <div
              className={` p-4 space-y-4 shadow-md mt-4${
                theme === "dark" ? "bg-[rgb(17,27,33)] " : "bg-white"
              }`}
            >
              <h3
                className={`font-semibold ${
                  theme === "dark" ? "text-gray-400 " : "text-gray-500"
                }`}
              >
                Recent Update
              </h3>
              {otherStatuses.map((contact, index) => (
                <React.Fragment key={contact?.id}>
                  <StatusList
                    contact={contact}
                    onPreview={() => handleStatusPreview(contact)}
                    theme={theme}
                  />
                  {index < otherStatuses.length - 1 && (
                    <hr
                      className={`${
                        theme === "dark" ? "border-gray-700" : "border-gray-200"
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && statuses.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center  ">
              <div
                className={`text-6xl mb-4 ${
                  theme === "dark" ? "text-gray-600" : "text-gray-300"
                }`}
              >
                📱
              </div>
              <h3
                className={`text-lg mb-2 font-semibold ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                No Status updated yet
              </h3>

              <p
                className={`text-sm ${
                  theme === "dark" ? "text-gray-500" : "text-gray-600"
                }`}
              >
                Be the first to share a status update
              </p>
            </div>
          )}
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 ">
            <div
              className={`p-6 rounded-lg max-w-md w-full mx-4 ${
                theme === "dark" ? "bg-gray-800" : "bg-white"
              }`}
            >
              <h3
                className={`text-lg font-semibold mb-4 ${
                  theme === "dark" ? "text-white" : "text-black"
                }`}
              >
                Create Status
              </h3>

              {filePreview && (
                <div className="mb-4">
                  {selectedFile?.type.startsWith("video/") ? (
                    <video
                      src={filePreview}
                      controls
                      className="w-full h-32 object-cover rounded"
                    />
                  ) : (
                    <img
                      src={filePreview}
                      alt="file-preview"
                      className="w-full h-32 object-cover rounded"
                    />
                  )}
                </div>
              )}

              <textarea
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                placeholder="What's on your mind"
                className={`w-full p-3 border rounded-lg mb-4 ${
                  theme === "dark"
                    ? "bg-gray-700 text-white border-gray-600"
                    : "bg-white text-black border-gray-300  "
                }`}
                rows={3}
              />

              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="mb-4"
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewStatus("");
                    setSelectedFile(null);
                    setFilePreview(null);
                  }}
                  disabled={loading}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700 "
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateStatus}
                  disabled={loading || (!newStatus.trim() && !selectedFile)}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </Layout>
  );
};

export default Status;
