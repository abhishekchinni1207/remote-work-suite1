import React, { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { io } from "socket.io-client";

export default function VideoCallUI({ roomId, userName }) {
  const [peers, setPeers] = useState([]);
  const [stream, setStream] = useState(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [pinnedPeer, setPinnedPeer] = useState(null);

  const userVideo = useRef();
  const peersRef = useRef([]);
  const socketRef = useRef();

  // Auto-prompt for camera & mic permissions
  useEffect(() => {
    async function initMedia() {
      try {
        const currentStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        setStream(currentStream);
        if (userVideo.current) userVideo.current.srcObject = currentStream;

        setupSocket(currentStream);
      } catch (err) {
        alert("Camera/Microphone access required to join the call.");
        console.error(err);
      }
    }

    initMedia();

    return () => {
      leaveCall();
    };
  }, [roomId]);

  const setupSocket = (currentStream) => {
    socketRef.current = io("http://localhost:5000");

    socketRef.current.emit("join-room", roomId);

    socketRef.current.on("user-joined", ({ userId }) => {
      const peer = createPeer(userId, socketRef.current.id, currentStream);
      peersRef.current.push({ peerID: userId, peer });
      setPeers([...peersRef.current.map((p) => p.peer)]);
    });

    socketRef.current.on("receive-return-signal", ({ userId, signal }) => {
      const item = peersRef.current.find((p) => p.peerID === userId);
      if (item) item.peer.signal(signal);
    });

    socketRef.current.on("user-left", (userId) => {
      const item = peersRef.current.find((p) => p.peerID === userId);
      if (item) {
        item.peer.destroy();
        peersRef.current = peersRef.current.filter((p) => p.peerID !== userId);
        setPeers(peersRef.current.map((p) => p.peer));
      }
    });
  };

  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({ initiator: true, trickle: false, stream });

    peer.on("signal", (signal) => {
      socketRef.current.emit("return-signal", { userId: userToSignal, signal });
    });

    return peer;
  }

  // Toggle audio
  function toggleMute() {
    if (!stream) return;
    stream.getAudioTracks().forEach((track) => (track.enabled = muted));
    setMuted(!muted);
  }

  // Toggle video
  function toggleVideo() {
    if (!stream) return;
    stream.getVideoTracks().forEach((track) => (track.enabled = videoOff));
    setVideoOff(!videoOff);
  }

  // Leave call
  function leaveCall() {
    peersRef.current.forEach((p) => p.peer.destroy());
    socketRef.current?.disconnect();
    stream && stream.getTracks().forEach((track) => track.stop());
  }

  // Pin/Unpin video (spotlight)
  function handlePin(peer) {
    if (pinnedPeer?.id === peer.id) setPinnedPeer(null);
    else setPinnedPeer(peer);
  }

  return (
    <div className="relative bg-gray-900 min-h-screen flex flex-col items-center justify-center">
      <div
        className={`flex flex-wrap justify-center gap-2 p-2 ${
          pinnedPeer ? "h-[calc(100vh-120px)]" : "h-[calc(100vh-80px)]"
        }`}
      >
        {/* Spotlight / Pinned */}
        {pinnedPeer && (
          <PinnedVideo peer={pinnedPeer} userName={userName} />
        )}

        {/* Local Video */}
        {!pinnedPeer && (
          <div className="relative">
            <video
              ref={userVideo}
              autoPlay
              muted
              className="rounded shadow-lg w-64 h-48 object-cover"
            />
            {userName && (
              <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 px-2 py-1 text-white text-sm rounded">
                {userName} (You)
              </div>
            )}
          </div>
        )}

        {/* Remote Videos */}
        {!pinnedPeer &&
          peers.map((peer, idx) => (
            <RemoteVideo
              key={idx}
              peer={peer}
              onPin={() => handlePin(peer)}
            />
          ))}
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 flex gap-4 bg-gray-800 p-2 rounded">
        <button
          onClick={toggleMute}
          className={`px-4 py-2 rounded ${muted ? "bg-red-600" : "bg-green-600"} text-white`}
        >
          {muted ? "Unmute" : "Mute"}
        </button>

        <button
          onClick={toggleVideo}
          className={`px-4 py-2 rounded ${videoOff ? "bg-red-600" : "bg-green-600"} text-white`}
        >
          {videoOff ? "Start Video" : "Stop Video"}
        </button>

        <button
          onClick={leaveCall}
          className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700"
        >
          Leave Call
        </button>
      </div>
    </div>
  );
}

// Remote video component with pin button
const RemoteVideo = ({ peer, onPin }) => {
  const ref = useRef();

  useEffect(() => {
    peer.on("stream", (stream) => {
      if (ref.current) ref.current.srcObject = stream;
    });
  }, [peer]);

  return (
    <div className="relative">
      <video ref={ref} autoPlay className="rounded shadow-lg w-64 h-48 object-cover" />
      <button
        onClick={onPin}
        className="absolute top-1 right-1 px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded hover:bg-opacity-80"
      >
        Pin
      </button>
    </div>
  );
};

// Spotlight / pinned video
const PinnedVideo = ({ peer, userName }) => {
  const ref = useRef();

  useEffect(() => {
    peer.on("stream", (stream) => {
      if (ref.current) ref.current.srcObject = stream;
    });
  }, [peer]);

  return (
    <div className="relative w-full h-full">
      <video ref={ref} autoPlay className="w-full h-full object-cover" />
      {userName && (
        <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 px-2 py-1 text-white text-sm rounded">
          {userName}
        </div>
      )}
    </div>
  );
};
