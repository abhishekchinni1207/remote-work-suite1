// src/components/CollaborativeEditor.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { WebsocketProvider } from "y-websocket";
import { Collaboration } from "@tiptap/extension-collaboration";
import { CollaborationCursor } from "@tiptap/extension-collaboration-cursor";
import Paragraph from "@tiptap/extension-paragraph";
import "../styles/CollaborativeEditor.css";

// Random color for user cursors
function randomColor() {
  const colors = ["#F94144", "#F3722C", "#F8961E", "#43AA8B", "#577590"];
  return colors[Math.floor(Math.random() * colors.length)];
}

const CollaborativeEditor = ({ documentId }) => {
  const [provider, setProvider] = useState(null);
  const doc = useMemo(() => new Y.Doc(), [documentId]);
  const providerRef = useRef(null);

  // Setup Y-WebSocket provider
  useEffect(() => {
    if (!providerRef.current) {
      console.log(`[Yjs] Connecting to ws://localhost:1234/${documentId}`);

      const newProvider = new WebsocketProvider(
        "ws://localhost:1234",
        documentId,
        doc
      );

      newProvider.on("status", (event) => {
        console.log(`[WS STATUS] ${event.status}`);
      });

      providerRef.current = newProvider;
      setProvider(newProvider);
    }

    return () => {
      if (providerRef.current) {
        console.log(`[Yjs] Disconnecting from ${documentId}`);
        providerRef.current.destroy();
        providerRef.current = null;
        setProvider(null);
      }
    };
  }, [documentId, doc]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      Paragraph,
      ...(provider
        ? [
            Collaboration.configure({ document: doc }),
            CollaborationCursor.configure({
              provider,
              user: {
                name: "User-" + Math.floor(Math.random() * 1000),
                color: randomColor(),
              },
            }),
          ]
        : []),
    ],
    content: "",
  });

  if (!editor || !provider) {
    return (
      <div className="text-gray-500 text-center mt-10">
        Connecting to collaborative editor...
      </div>
    );
  }

  return (
    <div className="editor-wrapper bg-white shadow-md rounded-2xl p-6 border">
      <EditorContent editor={editor} />
    </div>
  );
};

export default CollaborativeEditor;
