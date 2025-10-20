import { create } from "zustand";
import { getSocket } from "../services/chat.service.js";
import axiosInstance from "../services/url.service.js";

const useStatusStore = create((set, get) => ({
  // state
  statuses: [],
  loading: false,
  error: null,

  // Active
  setStatuses: (statuses) => set({ statuses }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  //   Initialize the socket listeners
  initializeSocket: () => {
    const socket = getSocket();
    if (!socket) return;

    // Real-time satus events
    socket.on("new_status", (newStatus) => {
      set((state) => ({
        statuses: state.statuses.some((s) => s._id === newStatus._id)
          ? state.statuses
          : [newStatus, ...state.statuses],
      }));
    });

    // Real-time status deletion
    socket.on("status_deleted", (statusId) => {
      set((state) => ({
        statuses: state.statuses.filter((s) => s._id !== statusId),
      }));
    });

    // Real-time satus view
    socket.on("status_viewed", (statusId, viewers) => {
      set((state) => ({
        statuses: state.statuses.map((status) =>
          status._id === statusId ? { ...status, viewers } : status
        ),
      }));
    });
  },

  cleanupSocket: () => {
    const socket = getSocket();
    if (socket) {
      socket.off("new_status");
      socket.off("status_deleted");
      socket.off("status_viewed");
    }
  },

  //   fetch status
  fetchStatuses: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosInstance.get("/status");
      set({ statuses: data.data || [], loading: false });
    } catch (error) {
      console.error("Error Fetching status Data", error);
      set({ error: error.message, loading: false });
    }
  },

  //   create status
  createStatus: async (statusData) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();

      if (statusData.file) {
        formData.append("media", statusData.file);
      }

      if (statusData.content?.trim()) {
        formData.append("content", statusData.content);
      }

      const { data } = await axiosInstance.post("/status", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // add to status in local state

      if (data.data) {
        set((state) => ({
          statuses: state.statuses.some((s) => s._id === data.data._id)
            ? state.statuses
            : [data.data, ...state.statuses],
        }));
      }

      return data.data;
    } catch (error) {
      console.error("Error creating status", error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  //   view status
  viewStatus: async (statusId) => {
    try {
      await axiosInstance.put(`/status/${statusId}/view`);
      set((state) => ({
        statuses: state.statuses.map((status) =>
          status._id === statusId ? { ...status } : status
        ),
      }));
    } catch (error) {
      console.error("Error viewing status", error);
      set({ error: error.message });
    }
  },

  //   delete status

  deleteStatus: async (statusId) => {
    try {
      set({ loading: true, error: null });
      await axiosInstance.delete(`/status/${statusId}`);
      set((state) => ({
        statuses: state.statuses.filter((s) => s._id !== statusId),
      }));
    } catch (error) {
      console.error("Error deleting status", error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getStatusViewers: async (statusId) => {
    try {
      set({ loading: true, error: null });
      const { data } = await axiosInstance.get(`/status/${statusId}/viewers`);
      return data.data;
    } catch (error) {
      console.error("Error getting status viewers", error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // helper function for grouped status

  getGroupedStatus: () => {
    const { statuses } = get();
    return statuses.reduce((acc, status) => {
      const statusUserId = status.user?._id;
      if (!acc[statusUserId]) {
        acc[statusUserId] = {
          id: statusUserId,
          name: status?.user?.username,
          avatar: status?.user?.profilePicture,
          status: [],
        };
      }

      acc[statusUserId].statuses.push({
        id: status._id,
        media: status.content,
        contentType: status.contentType,
        timeStamp: status.createdAt,
        viewers: status.viewers,
      });
      return acc;
    },{});
  },

  getUserStatuses:(userId)=>{
    const groupedStatus=get().getGroupedStatus();
    return userId ? groupedStatus[userId] :null;

  },

  getOtherStatuses:(userId)=>{
    const groupedStatus=get().getGroupedStatus();
    return Object.values(groupedStatus).filter(
        (contact)=>contact._id !==userId
    )

  },

//   clear error
clearError
}));
