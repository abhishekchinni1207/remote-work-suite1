// src/pages/WorkspacePage.jsx
import React, { useState } from "react";
import { useParams } from "react-router-dom";

// Components

import TaskBoard from "../components/TaskBoard";
import DocumentPage from "./DocumentPage";
import CollaborativeEditor from "../components/CollaborativeEditor";
import Whiteboard from "../components/Whiteboard";
import ChatPage from "../components/ChatPage";
import VideoCallUI from "../components/VideoCallUI";
import FileUpload from "../components/FileUpload";
import ProfileUpload from "../components/ProfileUpload";
import WorkspaceSidebar from "../components/WorkspaceSidebar";
import InviteUser from "../components/InviteUser";


export default function WorkspacePage() {
  const { workspaceId } = useParams();
  const [activeTab, setActiveTab] = useState("tasks"); // tasks | documents | whiteboard | chat | video | files
  const [selectedDocument, setSelectedDocument] = useState(null);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-64 bg-white shadow flex flex-col">
    <WorkspaceSidebar workspaceId={workspaceId} />
    <InviteUser workspaceId={workspaceId} />
  </div>
      
      <div className="flex flex-1">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow p-4 flex flex-col">
        <h2 className="text-xl font-bold mb-6">Workspace</h2>

        {/* Tabs */}
        <button
          className={`mb-2 p-2 rounded ${activeTab === "tasks" ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`}
          onClick={() => setActiveTab("tasks")}
        >
          TaskBoard
        </button>

        <button
          className={`mb-2 p-2 rounded ${activeTab === "documents" ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`}
          onClick={() => setActiveTab("documents")}
        >
          Documents
        </button>

        <button
          className={`mb-2 p-2 rounded ${activeTab === "whiteboard" ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`}
          onClick={() => setActiveTab("whiteboard")}
        >
          Whiteboard
        </button>

        <button
          className={`mb-2 p-2 rounded ${activeTab === "chat" ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`}
          onClick={() => setActiveTab("chat")}
        >
          Chat
        </button>

        <button
          className={`mb-2 p-2 rounded ${activeTab === "video" ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`}
          onClick={() => setActiveTab("video")}
        >
          Video Call
        </button>

        <button
          className={`mb-2 p-2 rounded ${activeTab === "files" ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`}
          onClick={() => setActiveTab("files")}
        >
          Files
        </button>

        {/* Profile */}
        <div className="mt-auto">
          <ProfileUpload />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {activeTab === "tasks" && <TaskBoard workspaceId={workspaceId} />}

        {activeTab === "documents" && !selectedDocument && (
          <DocumentPage workspaceId={workspaceId} setSelectedDocument={setSelectedDocument} />
        )}

        {activeTab === "documents" && selectedDocument && (
          <div>
            <button
              onClick={() => setSelectedDocument(null)}
              className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              ← Back to Documents
            </button>
            <CollaborativeEditor documentId={selectedDocument.id} />
          </div>
        )}

        {activeTab === "whiteboard" && <Whiteboard workspaceId={workspaceId} />}

        {activeTab === "chat" && <ChatPage />}

        {activeTab === "video" && <VideoCallUI workspaceId={workspaceId} />}

        {activeTab === "files" && <FileUpload workspaceId={workspaceId} />}
      </div>
    </div>
    </div>
  );
}
