// src/components/InviteUser.jsx
import { useState } from "react";

export default function InviteUser({ workspaceId }) {
  const [email, setEmail] = useState("");

  const sendInvite = async () => {
    await fetch("/functions/send-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, email }),
    });
    setEmail("");
    alert("Invite sent!");
  };

  return (
    <div className="flex gap-2 items-center p-2">
      <input
        type="email"
        placeholder="Enter email to invite"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border rounded p-2"
      />
      <button
        onClick={sendInvite}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Send Invite
      </button>
    </div>
  );
}
