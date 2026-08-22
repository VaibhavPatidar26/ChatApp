const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
  iceCandidatePoolSize: 10,
};

class WebRTCManager {
  constructor(socketRef) {
    this.socketRef = socketRef;
    this.peer = null;
    this.localStream = null;
    this.remoteStream = null;
    this.remoteUserId = null;
    this.callType = "video";
    this.pendingCandidates = [];

    this.onLocalStream = null;
    this.onRemoteStream = null;
    this.onConnectionStateChange = null;
  }

  setSocketRef(socketRef) {
    this.socketRef = socketRef;
  }

  get socket() {
    return this.socketRef?.current || this.socketRef;
  }

  sendSignal(payload) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not connected");
    }

    this.socket.send(JSON.stringify(payload));
  }

  async getLocalStream(callType = this.callType) {
    this.callType = callType;

    if (this.localStream) {
      const hasVideo = this.localStream.getVideoTracks().length > 0;
      if (callType === "video" && !hasVideo) {
        this.localStream.getTracks().forEach((t) => t.stop());
        this.localStream = null;
      } else {
        this.onLocalStream?.(this.localStream);
        return this.localStream;
      }
    }

    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === "video" ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
    });

    this.onLocalStream?.(this.localStream);
    return this.localStream;
  }

  createPeerConnection() {
    if (this.peer) {
      return this.peer;
    }

    this.peer = new RTCPeerConnection(RTC_CONFIG);

    this.peer.onicecandidate = (event) => {
      if (!event.candidate || !this.remoteUserId) return;

      try {
        this.sendSignal({
          type: "ice-candidate",
          to: this.remoteUserId,
          candidate: event.candidate,
        });
      } catch (err) {
        console.warn("Failed to send ICE candidate signal:", err);
      }
    };

    this.peer.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
      } else {
        if (!this.remoteStream) {
          this.remoteStream = new MediaStream();
        }
        if (!this.remoteStream.getTracks().some((t) => t.id === event.track.id)) {
          this.remoteStream.addTrack(event.track);
        }
      }

      // Always pass a new MediaStream reference with current tracks so React state hooks trigger
      const updatedStream = new MediaStream(this.remoteStream.getTracks());
      this.onRemoteStream?.(updatedStream);

      event.track.onended = () => {
        if (this.remoteStream) {
          this.onRemoteStream?.(new MediaStream(this.remoteStream.getTracks()));
        }
      };
      event.track.onmute = () => {
        if (this.remoteStream) {
          this.onRemoteStream?.(new MediaStream(this.remoteStream.getTracks()));
        }
      };
      event.track.onunmute = () => {
        if (this.remoteStream) {
          this.onRemoteStream?.(new MediaStream(this.remoteStream.getTracks()));
        }
      };
    };

    const peer = this.peer;

    peer.onconnectionstatechange = () => {
      this.onConnectionStateChange?.(peer.connectionState);
    };

    peer.oniceconnectionstatechange = () => {
      this.onConnectionStateChange?.(peer.iceConnectionState);
    };

    return this.peer;
  }

  addLocalTracks() {
    if (!this.peer || !this.localStream) return;

    const existingTrackIds = new Set(
      this.peer
        .getSenders()
        .map((sender) => sender.track?.id)
        .filter(Boolean)
    );

    this.localStream.getTracks().forEach((track) => {
      if (!existingTrackIds.has(track.id)) {
        try {
          this.peer.addTrack(track, this.localStream);
        } catch (err) {
          console.warn("Error adding local track to peer:", err);
        }
      }
    });
  }

  async startCall(remoteUserId, callType = "video") {
    this.remoteUserId = remoteUserId;
    this.callType = callType;

    await this.getLocalStream(callType);
    this.createPeerConnection();
    this.addLocalTracks();

    this.sendSignal({
      type: "call-user",
      to: remoteUserId,
      callType,
    });
  }

  async acceptCall(remoteUserId, callType = "video") {
    this.remoteUserId = remoteUserId;
    this.callType = callType;

    await this.getLocalStream(callType);
    this.createPeerConnection();
    this.addLocalTracks();

    this.sendSignal({
      type: "call-accepted",
      to: remoteUserId,
      callType,
    });
  }

  rejectCall(remoteUserId, reason = "rejected") {
    try {
      this.sendSignal({
        type: "call-rejected",
        to: remoteUserId,
        reason,
      });
    } catch (err) {
      console.warn("Could not send call-rejected signal:", err);
    }
  }

  async createAndSendOffer(remoteUserId = this.remoteUserId, callType = this.callType) {
    this.remoteUserId = remoteUserId || this.remoteUserId;
    this.callType = callType || this.callType;

    if (!this.remoteUserId) {
      throw new Error("Remote user is not set");
    }

    this.createPeerConnection();
    this.addLocalTracks();

    const offer = await this.peer.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: this.callType === "video",
    });
    await this.peer.setLocalDescription(offer);

    this.sendSignal({
      type: "offer",
      to: this.remoteUserId,
      offer,
      callType: this.callType,
    });
  }

  async handleOffer(remoteUserId, offer, callType = this.callType) {
    this.remoteUserId = remoteUserId;
    this.callType = callType || this.callType;

    await this.getLocalStream(this.callType);
    this.createPeerConnection();
    this.addLocalTracks();

    await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
    await this.flushPendingCandidates();

    const answer = await this.peer.createAnswer();
    await this.peer.setLocalDescription(answer);

    this.sendSignal({
      type: "answer",
      to: remoteUserId,
      answer,
      callType: this.callType,
    });
  }

  async handleAnswer(answer) {
    if (!this.peer) return;

    await this.peer.setRemoteDescription(new RTCSessionDescription(answer));
    await this.flushPendingCandidates();
  }

  async handleIceCandidate(candidate) {
    if (!candidate) return;

    try {
      if (!this.peer || !this.peer.remoteDescription || !this.peer.remoteDescription.type) {
        this.pendingCandidates.push(candidate);
        return;
      }

      const iceCandidate = new RTCIceCandidate(candidate);
      await this.peer.addIceCandidate(iceCandidate);
    } catch (err) {
      console.warn("Error adding ICE candidate:", err);
    }
  }

  async flushPendingCandidates() {
    if (!this.peer || !this.peer.remoteDescription || !this.peer.remoteDescription.type) return;

    const candidates = [...this.pendingCandidates];
    this.pendingCandidates = [];

    for (const candidate of candidates) {
      try {
        const iceCandidate = new RTCIceCandidate(candidate);
        await this.peer.addIceCandidate(iceCandidate);
      } catch (err) {
        console.warn("Error flushing ICE candidate:", err);
      }
    }
  }

  setAudioEnabled(enabled) {
    if (!this.localStream) return;
    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  setVideoEnabled(enabled) {
    if (!this.localStream) return;
    this.localStream.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  hangup(notify = true) {
    if (notify && this.remoteUserId) {
      try {
        this.sendSignal({
          type: "hangup",
          to: this.remoteUserId,
        });
      } catch (err) {
        console.warn("Could not send hangup signal:", err);
      }
    }

    this.cleanup();
  }

  cleanup() {
    try {
      this.peer?.getSenders().forEach((sender) => {
        try {
          this.peer.removeTrack(sender);
        } catch {
          // Already detached
        }
      });
    } catch {
      // Ignore
    }

    try {
      this.peer?.close();
    } catch {
      // Ignore
    }
    this.peer = null;

    try {
      this.localStream?.getTracks().forEach((track) => track.stop());
    } catch {
      // Ignore
    }
    this.localStream = null;
    this.remoteStream = null;
    this.remoteUserId = null;
    this.pendingCandidates = [];

    this.onLocalStream?.(null);
    this.onRemoteStream?.(null);
  }
}

export default WebRTCManager;
