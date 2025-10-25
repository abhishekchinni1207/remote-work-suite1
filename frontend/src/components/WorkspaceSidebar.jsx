// src/components/WorkspaceSidebar.jsx
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { supabase } from "../supabaseClient";

export default function WorkspaceSidebar({ workspaceId }) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socket = io("http://localhost:5000");

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      socket.emit("join-workspace", { workspaceId, userId: user.id });
    };
    fetchCurrentUser();

    socket.on("workspace-users", (users) => {
      setOnlineUsers(users);
    });

    return () => socket.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  return (
    <div className="p-4 border-b">
      <h3 className="font-bold mb-2">Online Users</h3>
      <ul>
        {onlineUsers.map((uid) => (
          <li key={uid} className="text-sm">{uid}</li>
        ))}
      </ul>
    </div>
  );
}
