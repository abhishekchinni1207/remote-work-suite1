import React from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Logout error:", error);
    else navigate("/login"); // redirect to login page
  };

  return (
    <header className="w-full bg-blue-600 text-white p-4 flex justify-between items-center shadow">
      <h1 className="text-lg font-bold">Remote Work Suite</h1>
      <button
        onClick={handleLogout}
        className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
      >
        Logout
      </button>
    </header>
  );
}
