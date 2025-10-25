// routes/tasks.js
import express from "express";
import { supabase } from "../supabaseClient.js";

const router = express.Router();

// Get all lists & tasks for a workspace
router.get("/:workspaceId", async (req, res) => {
  const { workspaceId } = req.params;
  const { data: lists, error } = await supabase
    .from("lists")
    .select("*, tasks(*)")
    .eq("workspace_id", workspaceId)
    .order("position", { ascending: true });
  if (error) return res.status(400).json({ error });
  res.json(lists);
});

// Create list
router.post("/list", async (req, res) => {
  const { title, workspace_id, position } = req.body;
  const { data, error } = await supabase
    .from("lists")
    .insert([{ title, workspace_id, position }])
    .select("*");
  if (error) return res.status(400).json({ error });
  res.json(data[0]);
});

// Create task
router.post("/task", async (req, res) => {
  const { title, list_id, position, description } = req.body;
  const { data, error } = await supabase
    .from("tasks")
    .insert([{ title, list_id, position, description }])
    .select("*");
  if (error) return res.status(400).json({ error });
  res.json(data[0]);
});

// Update task/list (for drag/drop or edits)
router.put("/:table/:id", async (req, res) => {
  const { table, id } = req.params;
  const updates = req.body;
  const { data, error } = await supabase.from(table).update(updates).eq("id", id).select("*");
  if (error) return res.status(400).json({ error });
  res.json(data[0]);
});

// Delete task/list
router.delete("/:table/:id", async (req, res) => {
  const { table, id } = req.params;
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return res.status(400).json({ error });
  res.json({ success: true });
});

export default router;
