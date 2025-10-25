import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useParams } from "react-router-dom";

export default function ChatPage() {
  const { workspaceId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let channel; // ✅ define here for cleanup

    const loadMessages = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true });

      if (error) console.error(error);
      else setMessages(data || []);
      setLoading(false);
    };

    loadMessages();

    // ✅ Create real-time subscription
    channel = supabase
      .channel("messages_channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          if (payload.new.workspace_id === workspaceId) {
            setMessages((prev) => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    // ✅ Proper cleanup
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  const sendMessage = async () => {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser?.user) return alert("User not logged in");

    const { error } = await supabase.from("messages").insert([
      {
        workspace_id: workspaceId,
        sender_id: currentUser.user.id,
        content: newMessage,
      },
    ]);

    if (error) console.error("Error sending message:", error);
    else setNewMessage("");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4 shadow">
        <h1 className="text-lg font-bold">Workspace Chat</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading && <div className="text-gray-500">Loading messages...</div>}
        {error && <div className="text-red-500">Error: {error}</div>}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className="bg-white p-3 rounded-lg shadow-sm max-w-xs break-words"
          >
            <div className="text-gray-600 text-sm font-medium mb-1">
              {msg.sender_id}
            </div>
            <div className="text-gray-800">{msg.content}</div>
          </div>
        ))}
      </main>

      <footer className="p-4 bg-white shadow flex gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Send
        </button>
      </footer>
    </div>
  );
}
