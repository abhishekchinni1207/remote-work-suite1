// functions/send-invite.js
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function sendInvite(req, res) {
  const { workspaceId, email } = req.body;

  const { error } = await supabase.from("workspace_invites").insert([
    { workspace_id: workspaceId, email, status: "pending" },
  ]);

  if (error) return res.status(500).json({ error });

  const transporter = nodemailer.createTransport({
    host: "smtp.example.com",
    port: 587,
    auth: { user: "you@example.com", pass: "password" },
  });

  await transporter.sendMail({
    from: "no-reply@workspace.com",
    to: email,
    subject: "You are invited to join a workspace",
    text: `Click here to join: https://yourapp.com/join/${workspaceId}`,
  });

  res.json({ success: true });
}
