import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

const useVideoCallStore = create(
  subscribeWithSelector((set, get) => ({
    // call state
    currentCall: null,
    incomingCall: null,
    isCallActive: false,
    callType: null, //video and audio

    // media state
    localStream: null,
    remoteStream: null,
    isVideoEnabled: true,
    isAudioEnabled: true,

    // WebRTC
    peerConnection: null,
    iceCandidateQueue: [], //Queue for ICE candidates

    isCallModalOpen: false,
    callStatus: "idle", //idle,calling, ringing,connecting,connected,ended

    // Actions
    setCurrentCall: (call) => {
      set({ currentCall: call });
    },
    setIncomingCall: (call) => {
      set({ incomingCall: call });
    },
    setCallActive: (active) => {
      set({ isCallActive: active });
    },
    setCallType: (type) => {
      set({ callType: type });
    },
    setLocalStream: (stream) => {
      set({ localStream: stream });
    },
    setRemoteStream: (stream) => {
      set({ remoteStream: stream });
    },
    setPeerConnection: (pc) => {
      set({ peerConnection: pc });
    },

    setCallModalOpen: (open) => {
      set({ isCallModalOpen: open });
    },

    setCallStatus: (status) => {
      set({ callStatus: status });
    },

    addIceCandidate: (candidate) => {
      const { iceCandidateQueue } = get();
      set({ iceCandidateQueue: [...iceCandidateQueue, candidate] });
    },

    processQueueIceCandidates: async () => {
      const { peerConnection, iceCandidateQueue } = get();

      if (
        peerConnection &&
        peerConnection.remoteDescription &&
        iceCandidateQueue.length > 0
      ) {
        for (const candidate of iceCandidateQueue) {
          try {
            await peerConnection.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          } catch (error) {
            console.error("ICE candidate error", error);
          }
        }
        set({ iceCandidateQueue: [] });
      }
    },
    toggleVideo: () => {
      const { localStream, isVideoEnabled } = get();
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = !isVideoEnabled;
          set({ isVideoEnabled: !isVideoEnabled });
        }
      }
    },
    toggleAudio: () => {
      const { localStream, isAudioEnabled } = get();
      if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = !isAudioEnabled;
          set({ isAudioEnabled: !isAudioEnabled });
        }
      }
    },

    endCall: () => {
      const { localStream, peerConnection } = get();

      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (peerConnection) {
        peerConnection.close();
      }
      set({
        currentCall: null,
        incomingCall: null,
        isCallActive: false,
        callType: null,

        localStream: null,
        remoteStream: null,
        isVideoEnabled: true,
        isAudioEnabled: true,

        peerConnection: null,
        iceCandidateQueue: [],
        isCallModalOpen: false,
        callStatus: "idle",
      });
    },
    clearIncomingCall: () => {
      set({ incomingCall: null });
    },
  }))
);

export default useVideoCallStore;
