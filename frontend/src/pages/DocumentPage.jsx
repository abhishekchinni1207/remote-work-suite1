// src/pages/DocumentPage.jsx
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

const supabase = createClient(
  "https://zsmszewrcxlktgkpjmqu.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzbXN6ZXdyY3hsa3Rna3BqbXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MTU5MzAsImV4cCI6MjA3NTQ5MTkzMH0.A0N2Yyzdhp96EuiebraD2vbsbNSDGFwD5jEpHrCDiIQ"
);

export default function DocumentPage({ workspaceId, setSelectedDocument }) {
  const [documents, setDocuments] = useState([]);
  const [newDocName, setNewDocName] = useState("");

  // Fetch documents for this workspace
  const fetchDocuments = async () => {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setDocuments(data);
  };

  useEffect(() => {
    fetchDocuments();
  });

  // Create a new document with a name
  const createNewDocument = async () => {
    if (!newDocName.trim()) return alert("Please enter a document name");

    const newDocId = uuidv4();
    const { error } = await supabase.from("documents").insert([
      {
        id: newDocId,
        title: newDocName,
        workspace_id: workspaceId,
      },
    ]);

    if (error) {
      console.error("Error creating document:", error);
      return;
    }

    setSelectedDocument({ id: newDocId, title: newDocName });
  };

  // Update document name
  const updateDocumentName = async (docId, newTitle) => {
    const { error } = await supabase
      .from("documents")
      .update({ title: newTitle })
      .eq("id", docId);

    if (error) console.error("Error updating document:", error);
    else fetchDocuments();
  };

  return (
    <div>
      {/* New document input */}
      <div className="mb-4 flex">
        <input
          type="text"
          placeholder="Enter document name..."
          value={newDocName}
          onChange={(e) => setNewDocName(e.target.value)}
          className="border p-2 rounded flex-1 mr-2"
        />
        <button
          onClick={createNewDocument}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          New Document
        </button>
      </div>

      {/* List of documents */}
      <ul>
        {documents.map((doc) => (
          <li key={doc.id} className="flex items-center justify-between mb-2">
            <span
              className="cursor-pointer hover:underline"
              onClick={() => setSelectedDocument(doc)}
            >
              {doc.title}
            </span>

            <button
              onClick={() => {
                const newTitle = prompt(
                  "Enter new document name",
                  doc.title
                );
                if (newTitle) updateDocumentName(doc.id, newTitle);
              }}
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              Edit
            </button>
          </li>
        ))}
        {documents.length === 0 && <li>No documents found</li>}
      </ul>
    </div>
  );
}
