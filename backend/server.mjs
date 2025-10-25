// backend/server.mjs

import http from "http";
import express from "express";
import { Server } from "socket.io";
import { WebSocketServer } from "ws";
import * as Y from "yjs";
import dotenv from "dotenv";

import { loadDocument, saveDocument } from "./supabase-yjs-persistence.cjs";
import yServerLogic from "./y-server-logic.cjs";

dotenv.config();

const { setupWSConnection } = yServerLogic(Y);

// -------------------- Express + HTTP --------------------
const app = express();
const server = http.createServer(app);

// -------------------- WebSocket (Y.js) --------------------
const wss = new WebSocketServer({ server });
const docs = new Map();
const SAVE_INTERVAL = 3000;
const saveTimeouts = new Map();

async function getOrLoadDoc(docName) {
  if (docs.has(docName)) return docs.get(docName);

  let ydoc;
  try {
    ydoc = await loadDocument(docName);
    if (!ydoc || !(ydoc instanceof Y.Doc)) {
      console.log(`🆕 Creating new Y.Doc: ${docName}`);
      ydoc = new Y.Doc();
    } else {
      console.log(`📥 Loaded existing doc: ${docName}`);
    }
  } catch (err) {
    console.error(`❌ Error loading doc ${docName}:`, err.message);
    ydoc = new Y.Doc();
  }

  docs.set(docName, ydoc);

  ydoc.on("update", () => {
    clearTimeout(saveTimeouts.get(docName));
    const timeout = setTimeout(async () => {
      try {
        await saveDocument(docName, ydoc);
        console.log(`💾 Saved doc: ${docName}`);
      } catch (e) {
        console.error(`❌ Error saving doc ${docName}:`, e);
      }
    }, SAVE_INTERVAL);
    saveTimeouts.set(docName, timeout);
  });

  return ydoc;
}

wss.on("connection", async (conn, req) => {
  const docName = req.url?.slice(1);
  if (!docName) {
    conn.close(4001, "Document name required");
    return;
  }

  try {
    const ydoc = await getOrLoadDoc(docName);
    setupWSConnection(conn, req, { doc: ydoc });
    console.log(`✅ Connected to doc: ${docName}`);
  } catch (err) {
    console.error(`❌ Error connecting to doc ${docName}:`, err);
    conn.close(1011, "Server error");
  }
});

// -------------------- Socket.io (Video + Presence) --------------------
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] },
});

const workspaceUsers = new Map();

io.on("connection", (socket) => {
  console.log(`🟢 Socket connected: ${socket.id}`);

  socket.on("join-workspace", ({ workspaceId, userId }) => {
    socket.userId = userId;
    socket.join(workspaceId);

    if (!workspaceUsers.has(workspaceId)) workspaceUsers.set(workspaceId, new Set());
    workspaceUsers.get(workspaceId).add(userId);

    io.to(workspaceId).emit("workspace-users", Array.from(workspaceUsers.get(workspaceId)));
    console.log(`👥 ${userId} joined workspace ${workspaceId}`);
  });

  socket.on("leave-workspace", ({ workspaceId, userId }) => {
    if (workspaceUsers.has(workspaceId)) {
      workspaceUsers.get(workspaceId).delete(userId);
      io.to(workspaceId).emit("workspace-users", Array.from(workspaceUsers.get(workspaceId)));
      console.log(`👋 ${userId} left workspace ${workspaceId}`);
    }
  });

  socket.on("disconnect", () => {
    workspaceUsers.forEach((users, workspaceId) => {
      if (users.has(socket.userId)) {
        users.delete(socket.userId);
        io.to(workspaceId).emit("workspace-users", Array.from(users));
      }
    });
    console.log(`🔴 Disconnected: ${socket.id}`);
  });
});

// -------------------- Health Check --------------------
app.get("/", (req, res) => {
  res.send("✅ Backend running: Yjs + Socket.io active!");
});

// -------------------- Start Server --------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Y-WebSocket active on ws://localhost:${PORT}`);
});
