// src/pages/Welcome.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Welcome() {
  const [user, setUser] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate("/");
        return;
      }

      setUser(user);

      // ✅ Ensure user exists in "users" table
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!existingUser) {
        await supabase.from("users").insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email,
        });
      }

      // ✅ Check or create workspace
      const { data: existingWorkspace } = await supabase
        .from("workspaces")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      if (existingWorkspace) {
        setWorkspace(existingWorkspace);
      } else {
        const { data: newWorkspace, error } = await supabase
          .from("workspaces")
          .insert({
            owner_id: user.id,
            name: `${user.user_metadata?.full_name || user.email}'s Workspace`,
          })
          .select()
          .single();

        if (error) {
          console.error("Workspace create error:", error);
        } else {
          setWorkspace(newWorkspace);
        }
      }
    };

    loadUser();
  }, [navigate]);

  if (!user) return <div className="text-white">Loading...</div>;

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-4">Welcome, {user.user_metadata?.full_name || user.email}!</h1>
      <p>Your workspace: <strong>{workspace?.name}</strong></p>
      <button
        onClick={async () => {
          await supabase.auth.signOut();
          navigate("/");
        }}
        className="mt-6 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
      >
        Logout
      </button>
    </div>
  );
}
