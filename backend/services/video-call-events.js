const handleVideocallEvent = (socket, io, onlineUsers) => {
  // initiate video call
  socket.on(
    "initiate_call",
    ({ callerId, receiverId, callType, callerInfo }) => {
      const receiverSocketId = onlineUsers.get(receiverId);

      if (receiverSocketId) {
        const callId = `${callerId}-${receiverId}-${Date.now()}`;

        io.to(receiverSocketId).emit("incoming_call", {
          callId,
          callerName: callerInfo.username,
          callerAvatar: callerInfo.profilePicture,
          callerId,
          callType,
        });
      } else {
        console.log(`server:Receiver ${receiverId} is offline`);
        socket.emit("call_failed", { reason: "user is offline" });
      }
    }
  );

  // Accept call
  socket.on("accept_call", ({ callerId, callId, receiverInfo }) => {
    const callerSocketId = onlineUsers.get(callerId);

    if (callerSocketId) {
      io.to(callerSocketId).emit("call_accepted", {
        callerName: receiverInfo.username,
        callerAvatar: receiverInfo.profilePicture,
        callId,
      });
    } else {
      console.log(`server:caller ${callerId} not found`);
    }
  });

  // Reject Call
  socket.on("reject_call", ({ callerId, callId }) => {
    const callerSocketId = onlineUsers.get(callerId);

    if (callerSocketId) {
      io.to(callerSocketId).emit("call_rejected", {
        callId,
      });
    }
  });

  //  end call

  socket.on("end_call", ({ callId, participantId }) => {
    const participantSocketId = onlineUsers.get(participantId);

    if (participantSocketId) {
      io.to(participantSocketId).emit("call_ended", {
        callId,
      });
    }
  });

//   webRTC signaling event with proper userId

socket.on("webrtc_offer",({offer,receiverId,callId})=>{
    const receiverSocketId=onlineUsers.get(receiverId)

    if(receiverSocketId){
        io.to(receiverSocketId).emit("webrtc_offer",{
            offer,
            senderId:socket.userId,
            callId
        })
        console.log(`server offer forwarded to ${receiverId}`)
    }else{
        console.log(`server :Receiver ${receiverId} not found the offer`)
    }
})

// 
socket.on("webrtc_answer",({answer,receiverId,callId})=>{
    const receiverSocketId=onlineUsers.get(receiverId)

    if(receiverSocketId){
        io.to(receiverSocketId).emit("webrtc_answer",{
            answer,
            senderId:socket.userId,
            callId
        })
               console.log(`server answer forwarded to ${receiverId}`)
    }else{
        console.log(`server :Receiver ${receiverId} not found the answer`)
    }
})

// 
socket.on("webrtc_ice_candidate",({candidate,receiverId,callId})=>{
    const receiverSocketId=onlineUsers.get(receiverId)

    if(receiverSocketId){
        io.to(receiverSocketId).emit("webrtc_ice_candidate",{
            candidate,
            senderId:socket.userId,
            callId
        })
        
    }else{
        console.log(`server :Receiver ${receiverId} not found for the ICE candidate`)
    }
})

}


module.exports=handleVideocallEvent