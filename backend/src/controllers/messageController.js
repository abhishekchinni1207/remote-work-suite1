import { supabase } from "../supabaseClient.js";

export const getMessages = async (req, res) => {
  const { workspace_id } = req.params;

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("workspace_id", workspace_id)
    .order("created_at", { ascending: true });

  if (error) return res.status(400).json(error);
  res.json(data);
};

export const sendMessage = async (req, res) => {
  const { workspace_id, sender_id, message } = req.body;

  const { data, error } = await supabase
    .from("messages")
    .insert([{ workspace_id, sender_id, message }])
    .select();

  if (error) return res.status(400).json(error);
  res.json(data);
};
