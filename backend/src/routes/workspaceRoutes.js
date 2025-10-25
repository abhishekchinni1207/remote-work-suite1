import express from "express";
import { createMessage, getMessages, createWorkspace, getWorkspaces } from "../controllers/workspaceController.js";

const router = express.Router();

// Workspaces
router.post("/", createWorkspace);
router.get("/", getWorkspaces);

// Messages
router.post("/:workspaceId/messages", createMessage);
router.get("/:workspaceId/messages", getMessages);

export default router;
