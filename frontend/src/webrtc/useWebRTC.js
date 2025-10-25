// src/webrtc/useWebRTC.js
import { useEffect, useRef, useState, useCallback } from "react";
import SimplePeer from "simple-peer";
import { socket } from "./socketClient";
import { EditorConsumer } from "@tiptap/react";

/**
 * Hook returns:
 *  - localStream
 *  - peers: { socketId -> { peer, stream } }
 *  - startCall({ room, targets }) // start a call sending offers to targets OR broadcast
 *  - joinCall({ room }) // join and receive offers
 *  - leaveCall()
 */
export default function useWebRTC({ onPeerStream } = {}) {
  const localStreamRef = useRef(null);
  const peersRef = useRef({}); // { socketId: { peer, stream } }
  const [localStream, setLocalStream] = useState(null);

  // Acquire local media
  const initLocalStream = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = s;
      setLocalStream(s);
      return s;
    } catch (err) {
      console.error("Could not get user media", err);
      throw err;
    }
  }, []);

  // Handle incoming signal messages
  useEffect(() => {
    socket.on("signal", async ({ from, data }) => {
      // if we already have a peer for `from`, forward signal
      if (peersRef.current[from]) {
        peersRef.current[from].peer.signal(data);
        return;
      }

      // otherwise create peer in "answer" mode
      const peer = new SimplePeer({
        initiator: false,
        trickle: false,
        stream: localStreamRef.current || undefined,
      });

      peer.on("signal", (signalData) => {
        // send answer back
        socket.emit("signal", { to: from, from: socket.id, data: signalData });
      });

      peer.on("stream", (remoteStream) => {
        peersRef.current[from] = { peer, stream: remoteStream };
        onPeerStream && onPeerStream(from, remoteStream);
      });

      peer.on("close", () => {
        if (peersRef.current[from]) delete peersRef.current[from];
      });

      peer.on("error", (e) => console.warn("Peer error", e));

      // feed remote offer into peer
      peer.signal(data);
    });

    // cleanup
    return () => {
      socket.off("signal");
    };
  }, [onPeerStream]);

  // Create peer and send offer to `targetId`
  const createOffer = useCallback((targetId) => {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream: localStreamRef.current || undefined,
    });

    peer.on("signal", (signalData) => {
      socket.emit("signal", { to: targetId, from: socket.id, data: signalData });
    });

    peer.on("stream", (remoteStream) => {
      peersRef.current[targetId] = { peer, stream: remoteStream };
      onPeerStream && onPeerStream(targetId, remoteStream);
    });

    peer.on("close", () => {
      delete peersRef.current[targetId];
    });

    peer.on("error", (e) => console.warn("Peer error", e));
    peersRef.current[targetId] = { peer, stream: null };
    return peer;
  }, [onPeerStream]);

  // Start a call: fetch peers in room then offer to each
  async function startCall(room) {
    await initLocalStream();
    // request peer ids
    socket.emit("get-peers-in-room", { room }, ({ peers }) => {
      // peers is an array of socket IDs excluding self
      peers.forEach((peerId) => {
        createOffer(peerId);
      });
    });
    // join the room to receive new joiners later
    socket.emit("join-room", { room });
  }

  // Join a call (just join the room and wait for signals)
  async function joinCall(room) {
    await initLocalStream();
    socket.emit("join-room", { room });
    // Ask for peers (optional) to create symmetric mesh
    socket.emit("get-peers-in-room", { room }, ({ peers }) => {
      peers.forEach((peerId) => {
        // create offer to each existing peer so both sides have connections
        createOffer(peerId);
      });
    });
  }

  function leaveCall(room) {
    // destroy all peers
    Object.values(peersRef.current).forEach(({ peer }) => {
      try { peer.destroy(); } catch { /* empty */ }
    });
    peersRef.current = {};
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    if (room) socket.emit("leave-room", { room });
  }

  // handle when new user joins the room: create offer to them
  useEffect(() => {
    socket.on("user-joined", ({ socketId }) => {
      // new user joined: create an offer to them
      createOffer(socketId);
    });

    socket.on("user-left", ({ socketId }) => {
      if (peersRef.current[socketId]) {
        try { peersRef.current[socketId].peer.destroy(); } catch{ /* empty */ }
        delete peersRef.current[socketId];
      }
    });

    return () => {
      socket.off("user-joined");
      socket.off("user-left");
    };
  }, [createOffer]);

  return {
    localStream,
    peersRef,
    startCall,
    joinCall,
    leaveCall,
    initLocalStream,
  };
}
