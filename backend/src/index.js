import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";



dotenv.config();

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/messages", messageRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // allow frontend URL in production
    methods: ["GET", "POST"]
  }
});

// Socket.io real-time chat
io.on("connection", (socket) => {
  console.log("New user connected:", socket.id);

  // Join workspace room
  socket.on("join_room", (workspaceId) => {
    socket.join(workspaceId);
    console.log(`User joined workspace: ${workspaceId}`);
  });

  // Send message
  socket.on("send_message", (data) => {
    const { workspaceId, message } = data;
    // Broadcast message to the room
    io.to(workspaceId).emit("receive_message", message);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(process.env.PORT || 4000, () => {
  console.log(`Server running on http://localhost:${process.env.PORT || 4000}`);
});
