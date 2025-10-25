// src/webrtc/socketClient.js
import { io } from "socket.io-client";

const SIGNALING_URL = import.meta.env.VITE_SIGNALING_URL || "http://localhost:5000";
export const socket = io(SIGNALING_URL, { autoConnect: false });

export function connectSocket() {
  if (!socket.connected) socket.connect();
}
