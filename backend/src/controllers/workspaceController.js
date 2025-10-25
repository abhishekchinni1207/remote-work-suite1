import { supabase } from "../supabaseClient.js";

// Workspaces
export const createWorkspace = async (req, res) => {
  const { name } = req.body;
  const owner_id = req.headers.userid; // Pass logged-in user's ID in headers for testing

  const { data, error } = await supabase
    .from("workspaces")
    .insert([{ name, owner_id }])
    .select();

  if (error) return res.status(400).json({ error });
  res.status(201).json({ workspace: data[0] });
};

export const getWorkspaces = async (req, res) => {
  const user_id = req.headers.userid;
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("owner_id", user_id);

  if (error) return res.status(400).json({ error });
  res.json({ workspaces: data });
};

// Messages
export const createMessage = async (req, res) => {
  const { content } = req.body;
  const { workspaceId } = req.params;
  const user_id = req.headers.userid;

  const { data, error } = await supabase
    .from("messages")
    .insert([{ workspace_id: workspaceId, user_id, content }])
    .select();

  if (error) return res.status(400).json({ error });
  res.status(201).json({ message: data[0] });
};

export const getMessages = async (req, res) => {
  const { workspaceId } = req.params;
  const user_id = req.headers.userid;

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user_id);

  if (error) return res.status(400).json({ error });
  res.json({ messages: data });
};
