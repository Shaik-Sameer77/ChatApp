import React, { useEffect, useMemo, useRef } from "react";
import useVideoCallStore from "../../store/videoCallStore.js";
import useUserStore from "../../store/useUserStore.js";
import useThemeStore from "../../store/themeStore.js";

const VideoCallModal = ({ socket }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const {
    currentCall,
    incomingCall,
    callType,
    isCallActive,
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    peerConnection,
    iceCandidateQueue,
    isCallModalOpen,
    callStatus,

    setIncomingCall,
    setCurrentCall,
    setCallType,
    setCallModalOpen,
    endCall,
    setCallStatus,
    setCallActive,
    setLocalStream,
    setRemoteStream,
    setPeerConnection,
    addIceCandidate,
    processQueueIceCandidates,
    toggleVideo,
    toggleAudio,
    clearIncomingCall,
  } = useVideoCallStore();

  const { user } = useUserStore();
  const { theme } = useThemeStore();

  const rtcConfiguration = {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
      {
        urls: "stun:stun1.l.google.com:19302",
      },
      {
        urls: "stun:stun2.l.google.com:19302",
      },
    ],
  };

  //Memorize display the user info and it is prevent the unnecessary re render

  const displayInfo = useMemo(() => {
    if (incomingCall && !isCallActive) {
      return {
        name: incomingCall.callerName,
        avatar: incomingCall.callerAvatar,
      };
    } else if (currentCall) {
      return {
        name: currentCall.participantName,
        avatar: currentCall.participantAvatar,
      };
    }
    return null;
  }, [incomingCall, currentCall, isCallActive]);

  // Connection detection
  useEffect(() => {
    if (peerConnection && remoteStream) {
      console.log("both peer connection and remote stream is available");
      setCallStatus("connected");
      setCallActive(true);
    }
  }, [peerConnection, remoteStream, setCallActive, setCallStatus]);

  // set up local video stream when localstream change
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // set up remote video stream when remote stream  changes
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Initialize media stream
  const initializeMedia = async (video = true) => {
    try {
      const stream = await navigator.meidaDevices.getUserMedia({
        video: video ? { width: 640, height: 480 } : false,
        audio: true,
      });
      console.log("local media stream", stream.getTracks());
      setLocalStream(stream);
    } catch (error) {
      console.error("Media error", error);
      throw error;
    }
  };

  // create peer connecction
  const createPeerConnection = (stream, role) => {
    const pc = new RTCPeerConnection(rtcConfiguration);

    // add local tracks immediately
    if (stream) {
      stream.getTracks().forEach((track) => {
        console.log(
          `${role} adding ${track.kind} track:`,
          track.id.slice(0, 8)
        );
        pc.addTrack(track, stream);
      });
    }

    // handle ice candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        const participantId =
          currentCall?.participantId || incomingCall?.callerId;
        const callId = currentCall?.callId || incomingCall?.callId;

        if (participantId && callId) {
          socket.emit("webrtc_ice_candidate", {
            candidate: event.candidate,
            receiverId: participantId,
            callId: callId,
            callId: callId,
          });
        }
      }
    };

    // handle remote stream

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else {
        const stream = new MediaStream([event.track]);
        setRemoteStream(stream);
      }
    };

    // failed connections

    pc.onconnectionstatechange = () => {
      console.log(`role:${role} ; connection state `, pc.connectionState);
      if (pc.connectionState === "failed") {
        setCallStatus("failed");
        setTimeout(handleEndCall, 2000);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`role:${role} ; ICE state `, pc.iceConnectionState);
    };

    pc.onsignalingstatechange = () => {
      console.log(`role: ${role} ; signaling state`, pc.signalingState);
    };

    setPeerConnection(pc);
    return pc;
  };

  // caller initialize call after acceptance
  const initializeCallercall = async () => {
    try {
      setCallStatus("connecting");
      // get media
      const stream = await initializeMedia(callType === "video");

      // create peer connection with offer
      const pc = createPeerConnection(stream, "CALLER");

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === "video",
      });

      await pc.setLocalDescription(offer);

      socket.emit("webrtc_offer", {
        offer,
        receiverId: currentCall?.participantId,
        callId: currentCall?.callId,
      });
    } catch (error) {
      console.error("caller error", error);
      setCallStatus("failed");
      setTimeout(handleEndCall, 2000);
    }
  };

  const handleEndCall = () => {
    const participantId = currentCall?.participantId || incomingCall?.callerId;
    const callId = currentCall?.callId || incomingCall?.callId;

    if (participantId && callId) {
      socket.emit("end_call", {
        callId: callId,
        participantId: participantId,
      });
    }

    endCall();
  };

  // Receiver : Answer call

  const handleAnswerCall = async () => {
    try {
      setCallStatus("connecting");
      // get media
      const stream = await initializeMedia(callType === "video");

      // create peer connection with offer
      createPeerConnection(stream, "RECEIVER");

      socket.emit("accept_call",{
        callerId:incomingCall?.callerId,
        callId:incomingCall?.callId,
        receiverInfo:{
          username:user?.username,
          profilePicture:user?.profilePicture
        }
      })

      setCurrentCall({
        callId:incomingCall?.callId,
        participantId:incomingCall?.callerid,
        participantName:incomingCall?.callerName,
        participantAvatar:incomingCall?.callerAvatar
      });

      clearIncomingCall();

    } catch (error) {
      console.error("receiver error:",error)
      handleEndCall()
    }
  };

  handleRejectCall=()=>{
    
  }

  return <div>VideoCallModal</div>;
};

export default VideoCallModal;
