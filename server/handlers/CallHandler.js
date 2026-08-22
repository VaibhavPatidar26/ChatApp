const WebSocket = require("ws");
const { getClient } = require("../wsStore");

function sendToUser(userId, payload) {
  const socket = getClient(userId);

  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
    return true;
  }

  return false;
}

function handleCall(data, userId) {
  if (!data.to) {
    sendToUser(userId, {
      type: "call-error",
      message: "Receiver is missing",
    });
    return;
  }

  switch (data.type) {
    case "call-user": {
      const sent = sendToUser(data.to, {
        type: "incoming-call",
        from: userId,
        callType: data.callType,
      });

      if (!sent) {
        sendToUser(userId, {
          type: "call-error",
          message: "User is offline",
        });
      }

      break;
    }

    case "call-accepted": {
      sendToUser(data.to, {
        type: "call-accepted",
        from: userId,
        callType: data.callType,
      });

      break;
    }

    case "call-rejected": {
      sendToUser(data.to, {
        type: "call-rejected",
        from: userId,
        reason: data.reason,
      });

      break;
    }

    case "offer": {
      sendToUser(data.to, {
        type: "offer",
        from: userId,
        offer: data.offer,
        callType: data.callType,
      });

      break;
    }

    case "answer": {
      sendToUser(data.to, {
        type: "answer",
        from: userId,
        answer: data.answer,
        callType: data.callType,
      });

      break;
    }

    case "ice-candidate": {
      sendToUser(data.to, {
        type: "ice-candidate",
        from: userId,
        candidate: data.candidate,
      });

      break;
    }

    case "hangup": {
      sendToUser(data.to, {
        type: "hangup",
        from: userId,
      });

      break;
    }
  }
}

module.exports = handleCall;
