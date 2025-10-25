import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();

    try {
      let user = null;

      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        user = data.user;
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        user = data.user;
      }

      if (!user) throw new Error("No user returned from Supabase");

      // ✅ use owner_id instead of user_id
      const { data: existingWorkspaces, error: fetchError } = await supabase
        .from("workspaces")
        .select("*")
        .eq("owner_id", user.id)
        .limit(1);

      if (fetchError) throw fetchError;

      let workspace;

      if (existingWorkspaces && existingWorkspaces.length > 0) {
        workspace = existingWorkspaces[0];
      } else {
        const { data: newWorkspace, error: createError } = await supabase
          .from("workspaces")
          .insert([{ name: "My Workspace", owner_id: user.id }])
          .select()
          .single();

        if (createError) throw createError;
        workspace = newWorkspace;
      }

     
      navigate(`/workspace/${workspace.id}`);
    } catch (error) {
      console.error("Auth error:", error.message);
      alert("Authentication failed: " + error.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleAuth}
        className="bg-white p-6 rounded shadow-md w-96 space-y-4"
      >
        <h2 className="text-2xl font-bold text-center">
          {isSignup ? "Sign Up" : "Login"}
        </h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {isSignup ? "Create Account" : "Login"}
        </button>

        <p className="text-center text-sm">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => setIsSignup(!isSignup)}
            className="text-blue-600 hover:underline"
          >
            {isSignup ? "Login" : "Sign Up"}
          </button>
        </p>
      </form>
    </div>
  );
}
